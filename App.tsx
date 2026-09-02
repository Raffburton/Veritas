import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { ThemeProvider } from './src/context/ThemeContext';
import { LibraryProvider } from './src/context/LibraryContext';
import { DailyLiturgyProvider } from './src/context/DailyLiturgyContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { checkForUpdates, downloadLatestApk, getGitHubReleasesUrl, installDownloadedApk } from './src/services/updateChecker';

const REMIND_LATER_KEY = 'veritas:update:remindLater';
const REMINDER_TTL_MS = 24 * 60 * 60 * 1000;
const REMINDER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUTO_RETRY_DELAY_MS = 30000;

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

export default function App() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadMessage, setDownloadMessage] = useState('');

  useEffect(() => {
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
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <LibraryProvider>
          <NotificationProvider>
            <DailyLiturgyProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <AppNavigator />
              </NavigationContainer>
            </DailyLiturgyProvider>
          </NotificationProvider>
        </LibraryProvider>
      </ThemeProvider>

      <Modal transparent visible={isDownloading} animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.modalBackdrop}>
          <View style={styles.downloadCard}>
            <ActivityIndicator size="large" color="#315E8A" />
            <Text style={styles.downloadTitle}>Atualizando o aplicativo</Text>
            <Text style={styles.downloadMessage}>{downloadMessage || 'Preparando download...'}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(Math.max(downloadProgress, 0), 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressValue}>{Math.round(downloadProgress)}%</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  downloadTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#18212B',
  },
  downloadMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#596573',
    textAlign: 'center',
  },
  progressTrack: {
    marginTop: 18,
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E4EBF4',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#315E8A',
  },
  progressValue: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#315E8A',
  },
});
