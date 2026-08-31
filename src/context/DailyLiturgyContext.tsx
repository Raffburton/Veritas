import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import type { CalendarReading, LiturgicalCalendarDay } from '../services/liturgicalCalendarService';
import { toLocalIsoDate } from '../services/liturgicalCalendarService';

const API_URL = 'https://liturgia.up.railway.app/v2/';
const CACHE_KEY = '@veritas:daily-liturgy-cache-v2';

type ApiReading = {
  referencia?: string;
  titulo?: string;
  refrao?: string;
  texto?: string;
};

type ApiLiturgy = {
  data: string;
  liturgia: string;
  cor: string;
  leituras: {
    primeiraLeitura?: ApiReading[];
    salmo?: ApiReading[];
    segundaLeitura?: ApiReading[];
    evangelho?: ApiReading[];
    extras?: ApiReading[];
  };
  oracoes?: {
    coleta?: string;
    oferendas?: string;
    comunhao?: string;
    extras?: Array<{ titulo?: string; texto?: string }>;
  };
  antifonas?: {
    entrada?: string;
    comunhao?: string;
  };
};

type CacheState = {
  days: Record<string, LiturgicalCalendarDay>;
  lastUpdated: string | null;
};

type DailyLiturgyContextValue = CacheState & {
  syncing: boolean;
  getSyncedDay: (date: string) => LiturgicalCalendarDay | null;
  syncCurrentWeek: () => Promise<void>;
};

const DailyLiturgyContext = createContext<DailyLiturgyContextValue | undefined>(undefined);

function normalizeReadings(readings?: ApiReading[]): CalendarReading[] {
  if (!Array.isArray(readings)) return [];
  return readings.map((reading) => ({
    reference: reading.referencia ?? '',
    ...(reading.titulo ? { title: reading.titulo } : {}),
    ...(reading.refrao ? { response: reading.refrao } : {}),
    ...(reading.texto ? { text: reading.texto } : {}),
  }));
}

function normalizeResponse(payload: ApiLiturgy, expectedDate: string): LiturgicalCalendarDay {
  const [year, month, day] = expectedDate.split('-');
  const apiDate = `${day}/${month}/${year}`;
  if (payload.data !== apiDate || !payload.liturgia || !payload.cor || !payload.leituras) {
    throw new Error('Resposta litúrgica inválida.');
  }
  return {
    date: expectedDate,
    celebration: payload.liturgia,
    color: payload.cor,
    readings: {
      firstReading: normalizeReadings(payload.leituras.primeiraLeitura),
      psalm: normalizeReadings(payload.leituras.salmo),
      secondReading: normalizeReadings(payload.leituras.segundaLeitura),
      gospel: normalizeReadings(payload.leituras.evangelho),
      extras: normalizeReadings(payload.leituras.extras),
    },
    prayers: {
      ...(payload.oracoes?.coleta ? { collect: payload.oracoes.coleta } : {}),
      ...(payload.oracoes?.oferendas ? { offerings: payload.oracoes.oferendas } : {}),
      ...(payload.oracoes?.comunhao ? { communion: payload.oracoes.comunhao } : {}),
      extras: (payload.oracoes?.extras ?? [])
        .filter((prayer) => Boolean(prayer.texto))
        .map((prayer) => ({ title: prayer.titulo, text: prayer.texto ?? '' })),
    },
    antiphons: {
      ...(payload.antifonas?.entrada ? { entrance: payload.antifonas.entrada } : {}),
      ...(payload.antifonas?.comunhao ? { communion: payload.antifonas.comunhao } : {}),
    },
  };
}

async function fetchLiturgy(date: Date, signal: AbortSignal) {
  const isoDate = toLocalIsoDate(date);
  const query = `?dia=${date.getDate()}&mes=${date.getMonth() + 1}&ano=${date.getFullYear()}`;
  const response = await fetch(`${API_URL}${query}`, { signal });
  if (!response.ok) throw new Error(`API respondeu com status ${response.status}.`);
  return normalizeResponse((await response.json()) as ApiLiturgy, isoDate);
}

function datesForCurrentWeek() {
  const today = new Date();
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, index) =>
    new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + index),
  );
}

export function DailyLiturgyProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<CacheState>({ days: {}, lastUpdated: null });
  const [cacheLoaded, setCacheLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const initialized = useRef(false);

  const syncCurrentWeek = useCallback(async () => {
    setSyncing(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const results = await Promise.allSettled(
        datesForCurrentWeek().map((date) => fetchLiturgy(date, controller.signal)),
      );
      const receivedDays = results
        .filter((result): result is PromiseFulfilledResult<LiturgicalCalendarDay> => result.status === 'fulfilled')
        .map((result) => result.value);
      if (receivedDays.length > 0) {
        setCache((current) => ({
          days: {
            ...current.days,
            ...Object.fromEntries(receivedDays.map((day) => [day.date, day])),
          },
          lastUpdated: new Date().toISOString(),
        }));
      }
    } finally {
      clearTimeout(timeout);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    async function initialize() {
      try {
        const stored = await AsyncStorage.getItem(CACHE_KEY);
        if (stored) setCache(JSON.parse(stored) as CacheState);
      } catch {
        setCache({ days: {}, lastUpdated: null });
      } finally {
        setCacheLoaded(true);
        initialized.current = true;
        void syncCurrentWeek();
      }
    }
    void initialize();
  }, [syncCurrentWeek]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && initialized.current) void syncCurrentWeek();
    });
    return () => subscription.remove();
  }, [syncCurrentWeek]);

  useEffect(() => {
    if (!cacheLoaded) return;
    void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache)).catch(() => undefined);
  }, [cache, cacheLoaded]);

  const value = useMemo<DailyLiturgyContextValue>(() => ({
    ...cache,
    syncing,
    getSyncedDay: (date) => cache.days[date] ?? null,
    syncCurrentWeek,
  }), [cache, syncing, syncCurrentWeek]);

  return <DailyLiturgyContext.Provider value={value}>{children}</DailyLiturgyContext.Provider>;
}

export function useDailyLiturgy() {
  const context = useContext(DailyLiturgyContext);
  if (!context) throw new Error('useDailyLiturgy deve ser usado dentro de DailyLiturgyProvider.');
  return context;
}
