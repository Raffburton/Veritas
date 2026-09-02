import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useLibrary } from './LibraryContext';
import { getImportantCatholicDates } from '../services/importantDatesService';

const PREFERENCES_KEY = '@veritas:notification-preferences';
const SCHEDULED_IDS_KEY = '@veritas:scheduled-notifications';
const CHANNEL_ID = 'veritas-reminders';
const notificationsSupported = !(
  Platform.OS === 'android' &&
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient
);

type NotificationsModule = typeof import('expo-notifications');
let notificationsModulePromise: Promise<NotificationsModule> | null = null;

function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (!notificationsSupported) return Promise.resolve(null);
  notificationsModulePromise ??= import('expo-notifications').then((module) => {
    module.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return module;
  });
  return notificationsModulePromise;
}

export type NotificationPreference = 'everyThreeDays' | 'sundayMass' | 'studyNotes' | 'importantDates';

type NotificationPreferences = Record<NotificationPreference, boolean>;

type NotificationContextValue = {
  preferences: NotificationPreferences;
  ready: boolean;
  supported: boolean;
  setPreference: (preference: NotificationPreference, enabled: boolean) => Promise<boolean>;
};

const initialPreferences: NotificationPreferences = {
  everyThreeDays: true,
  sundayMass: true,
  studyNotes: true,
  importantDates: true,
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

async function prepareNotifications(notifications: NotificationsModule) {
  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes do Veritas',
      description: 'Lembretes de leitura, missa e estudos salvos.',
      importance: notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 180, 250],
    });
  }

  const current = await notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

async function cancelPreviousSchedules(notifications: NotificationsModule) {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    const identifiers = stored ? JSON.parse(stored) as string[] : [];
    await Promise.all(identifiers.map((identifier) =>
      notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined),
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
    const notifications = await loadNotificationsModule();
    if (!notifications) return;

    await cancelPreviousSchedules(notifications);
    if (!Object.values(current).some(Boolean)) return;
    if (!await prepareNotifications(notifications)) return;

    const scheduled: string[] = [];
    const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

    if (current.everyThreeDays) {
      scheduled.push(await notifications.scheduleNotificationAsync({
        content: {
          title: 'Um momento com a Palavra',
          body: 'Reserve alguns minutos para a liturgia e a leitura da Bíblia no Veritas.',
          data: { destination: 'Liturgy' },
          sound: 'default',
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3 * 24 * 60 * 60,
          repeats: true,
          channelId,
        },
      }));
    }

    if (current.sundayMass) {
      scheduled.push(await notifications.scheduleNotificationAsync({
        content: {
          title: 'Domingo, Dia do Senhor',
          body: 'Hoje é dia de missa. Consulte a liturgia e prepare o coração.',
          data: { destination: 'Liturgy' },
          sound: 'default',
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: 8,
          minute: 0,
          channelId,
        },
      }));
    }

    if (current.studyNotes && notes.length) {
      const latestNote = notes[0];
      scheduled.push(await notifications.scheduleNotificationAsync({
        content: {
          title: `Retome seu estudo em ${latestNote.reference.location}`,
          body: 'Você tem uma anotação salva. Abra o Veritas para continuar sua reflexão.',
          data: { destination: 'Notes', noteId: latestNote.id },
          sound: 'default',
        },
        trigger: {
          type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3 * 24 * 60 * 60,
          repeats: true,
          channelId,
        },
      }));
    }

    if (current.importantDates) {
      const now = new Date();
      const years = [now.getFullYear(), now.getFullYear() + 1];
      const upcomingDates = years.flatMap((year) => getImportantCatholicDates(year))
        .map((celebration) => {
          const notificationDate = new Date(celebration.date);
          notificationDate.setHours(8, 0, 0, 0);
          return { celebration, notificationDate };
        })
        .filter(({ notificationDate }) => notificationDate.getTime() > now.getTime());

      for (const { celebration, notificationDate } of upcomingDates) {
        scheduled.push(await notifications.scheduleNotificationAsync({
          content: {
            title: celebration.title,
            body: `${celebration.description} Veja a liturgia e viva esta celebração com o Veritas.`,
            data: { destination: 'Settings', panel: 'dates', celebrationId: celebration.id },
            sound: 'default',
          },
          trigger: {
            type: notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
            channelId,
          },
        }));
      }
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduled));
  }, [notes]);

  useEffect(() => {
    if (!ready || !libraryReady) return undefined;
    const timeout = setTimeout(() => void synchronizeNotifications(preferences), 250);
    return () => clearTimeout(timeout);
  }, [libraryReady, preferences, ready, synchronizeNotifications]);

  const setPreference = useCallback(async (preference: NotificationPreference, enabled: boolean) => {
    const notifications = await loadNotificationsModule();
    if (!notifications || (enabled && !await prepareNotifications(notifications))) return false;
    const updated = { ...preferences, [preference]: enabled };
    setPreferences(updated);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return true;
  }, [preferences]);

  const value = useMemo(() => ({
    preferences,
    ready,
    supported: notificationsSupported,
    setPreference,
  }), [preferences, ready, setPreference]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications deve ser usado dentro de NotificationProvider.');
  return context;
}
