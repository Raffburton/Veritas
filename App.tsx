import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { DailyLiturgyProvider } from './src/context/DailyLiturgyContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import {
  checkForUpdates,
  downloadLatestApk,
  hasAndroidInstallPermission,
  installDownloadedApk,
  requestAndroidInstallPermission,
} from './src/services/updateChecker';

const WELCOME_COMPLETED_KEY = '@veritas:welcome-completed';
const REMIND_LATER_KEY = 'veritas:update:remindLater';
const REMINDER_TTL_MS = 24 * 60 * 60 * 1000;
const REMINDER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_RETRY_DELAY_MS = 30000;

function ThemedStatusBar() {
  const { theme } = useTheme();
  const isDarkTheme = theme.startsWith('dark');

  return (
    <StatusBar
      animated
      style={isDarkTheme ? 'light' : 'dark'}
    />
  );
}

function AppLoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.appLoading, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

type DownloadModalProps = {
  visible: boolean;
  progress: number;
  message: string;
};

function DownloadModal({ visible, progress, message }: DownloadModalProps) {
  const { colors } = useTheme();
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.downloadCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.downloadTitle, { color: colors.text }]}>Atualizando o aplicativo</Text>
          <Text style={[styles.downloadMessage, { color: colors.mutedText }]}>
            {message || 'Preparando download...'}
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${safeProgress}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressValue, { color: colors.primary }]}>{Math.round(safeProgress)}%</Text>
        </View>
      </View>
    </Modal>
  );
}

function hasValidReminder(reminder: { version?: string; remindedAt?: number } | null, latestVersion: string): boolean {
  if (!reminder?.version || typeof reminder.remindedAt !== 'number') {
    return false;
  }

  const age = Date.now() - reminder.remindedAt;
  if (age > REMINDER_MAX_AGE_MS) {
    return false;
  }

  return reminder.version === latestVersion && age < REMINDER_TTL_MS;
}

function askForInstallPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Permitir atualização do Veritas',
      'Para instalar novas versões baixadas pelo Veritas, autorize este app a instalar aplicativos. Na próxima tela, ative “Permitir desta fonte” e volte ao Veritas.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Abrir configurações',
          onPress: () => {
            void requestAndroidInstallPermission()
              .then((granted) => {
                if (!granted) {
                  Alert.alert(
                    'Permissão não concedida',
                    'A atualização não poderá ser instalada até que “Permitir desta fonte” seja ativado para o Veritas.',
                  );
                }
                resolve(granted);
              })
              .catch(() => {
                Alert.alert('Não foi possível abrir as configurações', 'Tente novamente mais tarde.');
                resolve(false);
              });
          },
        },
      ],
      { cancelable: false },
    );
  });
}

export default function App() {
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState<boolean | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    void AsyncStorage.getItem(WELCOME_COMPLETED_KEY)
      .then((value) => {
        if (mounted) setHasCompletedWelcome(value === 'true');
      })
      .catch(() => {
        if (mounted) setHasCompletedWelcome(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const completeWelcome = () => {
    setHasCompletedWelcome(true);
    void AsyncStorage.setItem(WELCOME_COMPLETED_KEY, 'true').catch(() => undefined);
  };

  useEffect(() => {
    if (hasCompletedWelcome !== true) return undefined;

    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function checkAppUpdate() {
      try {
        const updateStatus = await checkForUpdates();

        if (!mounted) {
          return;
        }

        if (!updateStatus.latestVersion) {
          if (retryTimer) {
            clearTimeout(retryTimer);
          }
          retryTimer = setTimeout(() => {
            if (mounted) {
              void checkAppUpdate();
            }
          }, AUTO_RETRY_DELAY_MS);
          return;
        }

        if (!updateStatus.hasUpdate) {
          return;
        }

        if (Platform.OS !== 'android') {
          return;
        }

        const alreadyAllowedToInstall = await hasAndroidInstallPermission();
        if (!alreadyAllowedToInstall) {
          const permissionGranted = await askForInstallPermission();
          if (!permissionGranted || !mounted) {
            return;
          }
        }

        const storedReminder = await AsyncStorage.getItem(REMIND_LATER_KEY);
        if (storedReminder) {
          try {
            const parsedReminder = JSON.parse(storedReminder) as { version?: string; remindedAt?: number };

            if (hasValidReminder(parsedReminder, updateStatus.latestVersion)) {
              return;
            }

            if (parsedReminder.remindedAt && Date.now() - parsedReminder.remindedAt > REMINDER_MAX_AGE_MS) {
              await AsyncStorage.removeItem(REMIND_LATER_KEY);
            }
          } catch (error) {
            console.warn('Invalid reminder payload:', error);
          }
        }

        const latestVersionLabel = updateStatus.latestVersion.startsWith('v')
          ? updateStatus.latestVersion
          : `v${updateStatus.latestVersion}`;

        Alert.alert(
          'Nova atualização disponível',
          `Nova atualização disponível (${latestVersionLabel})! Deseja baixar e instalar agora?`,
          [
            {
              text: 'Lembrar Mais Tarde',
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem(
                  REMIND_LATER_KEY,
                  JSON.stringify({ version: updateStatus.latestVersion, remindedAt: Date.now() }),
                );
              },
            },
            {
              text: 'Atualizar Agora',
              onPress: async () => {
                try {
                  await AsyncStorage.removeItem(REMIND_LATER_KEY);
                  setDownloadProgress(0);
                  setIsDownloading(true);
                  setDownloadMessage('Baixando atualização...');

                  const apkPath = await downloadLatestApk((progress, totalBytes) => {
                    const safeProgress = Math.min(Math.max(progress, 0), 100);
                    const downloadedBytes = (safeProgress / 100) * totalBytes;
                    const totalMegabytes = totalBytes > 0 ? totalBytes / (1024 * 1024) : 0;
                    const downloadedMegabytes = downloadedBytes / (1024 * 1024);

                    setDownloadProgress(safeProgress);

                    if (totalMegabytes > 0) {
                      setDownloadMessage(
                        `Baixando atualização... ${downloadedMegabytes.toFixed(1)} MB de ${totalMegabytes.toFixed(1)} MB (${Math.round(safeProgress)}%)`,
                      );
                    } else {
                      setDownloadMessage(`Baixando atualização... ${Math.round(safeProgress)}%`);
                    }
                  });

                  setDownloadMessage('Instalando atualização...');
                  await installDownloadedApk(apkPath);
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Não foi possível completar a atualização.';
                  console.warn('Update installation failed:', message);

                  if (message.includes('Permissão') || message.includes('Não foi possível iniciar') || message.includes('baixar')) {
                    Alert.alert(
                      'Não foi possível atualizar',
                      'A atualização falhou. Verifique a conexão com a internet, as permissões do Android e tente novamente.',
                    );
                  }
                } finally {
                  setIsDownloading(false);
                  setDownloadProgress(0);
                  setDownloadMessage('');
                }
              },
            },
          ],
        );
      } catch (error) {
        console.warn('Auto-update check failed:', error);
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        retryTimer = setTimeout(() => {
          if (mounted) {
            void checkAppUpdate();
          }
        }, AUTO_RETRY_DELAY_MS);
      }
    }

    void checkAppUpdate();

    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [hasCompletedWelcome]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <ThemedStatusBar />
        {hasCompletedWelcome === null ? (
          <AppLoadingScreen />
        ) : hasCompletedWelcome ? (
          <LibraryProvider>
            <NotificationProvider>
              <DailyLiturgyProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </DailyLiturgyProvider>
            </NotificationProvider>
          </LibraryProvider>
        ) : (
          <WelcomeScreen onContinue={completeWelcome} />
        )}
        <DownloadModal visible={isDownloading} progress={downloadProgress} message={downloadMessage} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  downloadCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  downloadTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
  },
  downloadMessage: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: 18,
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressValue: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
  },
});
