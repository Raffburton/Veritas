import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useLibrary } from './LibraryContext';

const PREFERENCES_KEY = '@veritas:notification-preferences';
const SCHEDULED_IDS_KEY = '@veritas:scheduled-notifications';
const CHANNEL_ID = 'veritas-reminders';

export type NotificationPreference = 'everyThreeDays' | 'sundayMass' | 'studyNotes';

type NotificationPreferences = Record<NotificationPreference, boolean>;

type NotificationContextValue = {
  preferences: NotificationPreferences;
  ready: boolean;
  setPreference: (preference: NotificationPreference, enabled: boolean) => Promise<boolean>;
};

const initialPreferences: NotificationPreferences = {
  everyThreeDays: false,
  sundayMass: false,
  studyNotes: false,
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function prepareNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes do Veritas',
      description: 'Lembretes de leitura, missa e estudos salvos.',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 180, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function cancelPreviousSchedules() {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const identifiers = stored ? JSON.parse(stored) as string[] : [];
    await Promise.all(identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
    ));
  } finally {
    await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notes, ready: libraryReady } = useLibrary();
  const [preferences, setPreferences] = useState(initialPreferences);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (stored) setPreferences({ ...initialPreferences, ...JSON.parse(stored) as NotificationPreferences });
      } finally {
        setReady(true);
      }
    }
    void loadPreferences();
  }, []);

  const synchronizeNotifications = useCallback(async (current: NotificationPreferences) => {
    await cancelPreviousSchedules();
    if (!Object.values(current).some(Boolean)) return;

    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes do Veritas',
        description: 'Lembretes de leitura, missa e estudos salvos.',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 180, 250],
      });
    }

    const scheduled: string[] = [];
    const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

    if (current.everyThreeDays) {
      scheduled.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Um momento com a Palavra',
          body: 'Reserve alguns minutos para a liturgia e a leitura da Bíblia no Veritas.',
          data: { destination: 'Liturgy' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3 * 24 * 60 * 60,
          repeats: true,
          channelId,
        },
      }));
    }

    if (current.sundayMass) {
      scheduled.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Domingo, Dia do Senhor',
          body: 'Hoje é dia de missa. Consulte a liturgia e prepare o coração.',
          data: { destination: 'Liturgy' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: 8,
          minute: 0,
          channelId,
        },
      }));
    }

    if (current.studyNotes && notes.length) {
      const latestNote = notes[0];
      scheduled.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: `Retome seu estudo em ${latestNote.reference.location}`,
          body: 'Você tem uma anotação salva. Abra o Veritas para continuar sua reflexão.',
          data: { destination: 'Notes', noteId: latestNote.id },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3 * 24 * 60 * 60,
          repeats: true,
          channelId,
        },
      }));
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduled));
  }, [notes]);

  useEffect(() => {
    if (!ready || !libraryReady) return undefined;
    const timeout = setTimeout(() => void synchronizeNotifications(preferences), 250);
    return () => clearTimeout(timeout);
  }, [libraryReady, preferences, ready, synchronizeNotifications]);

  const setPreference = useCallback(async (preference: NotificationPreference, enabled: boolean) => {
    if (enabled && !await prepareNotifications()) return false;
    const updated = { ...preferences, [preference]: enabled };
    setPreferences(updated);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return true;
  }, [preferences]);

  const value = useMemo(() => ({ preferences, ready, setPreference }), [preferences, ready, setPreference]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications deve ser usado dentro de NotificationProvider.');
  return context;
}
