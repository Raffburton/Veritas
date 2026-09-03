import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { PermissionsAndroid, Platform } from 'react-native';

import { compareVersions } from '../utils/versionCheck';

type GitHubReleaseAsset = {
  name?: string;
  browser_download_url?: string;
};

type GitHubRelease = {
  tag_name?: string;
  assets?: GitHubReleaseAsset[];
};

const RELEASES_API_URL = 'https://api.github.com/repos/Raffburton/Veritas/releases';
const RELEASES_PAGE_URL = 'https://github.com/Raffburton/Veritas/releases';

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'Veritas-App',
};

export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const latestResponse = await fetch(`${RELEASES_API_URL}/latest`, { headers: GITHUB_HEADERS });
    if (latestResponse.ok) {
      const latestRelease = (await latestResponse.json()) as GitHubRelease;
      if (latestRelease.tag_name) {
        return latestRelease;
      }
    }

    const releasesResponse = await fetch(RELEASES_API_URL, { headers: GITHUB_HEADERS });
    if (!releasesResponse.ok) {
      return null;
    }

    const releases = (await releasesResponse.json()) as GitHubRelease[];
    return releases.find((release) => release.tag_name) ?? null;
  } catch (error) {
    console.warn('GitHub release check failed:', error);
    return null;
  }
}

export async function fetchLatestReleaseTag(): Promise<string | null> {
  const release = await fetchLatestRelease();
  return release?.tag_name ?? null;
}

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; latestVersion: string | null; apkDownloadUrl: string | null }> {
  const currentVersion = Constants.expoConfig?.version ?? '0.0.0';
  const latestRelease = await fetchLatestRelease();
  const latestTag = latestRelease?.tag_name ?? null;

  if (!latestTag) {
    return { hasUpdate: false, latestVersion: null, apkDownloadUrl: null };
  }

  const release = latestRelease ?? null;
  const apkAsset = release?.assets?.find((asset) => asset.name?.toLowerCase().endsWith('.apk')) ?? null;

  return {
    hasUpdate: compareVersions(currentVersion, latestTag),
    latestVersion: latestTag,
    apkDownloadUrl: apkAsset?.browser_download_url ?? null,
  };
}

async function ensureStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Number(Platform.Version ?? 0);
    if (apiLevel >= 29) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (hasPermission) {
      return true;
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      title: 'Permitir salvar atualização',
      message: 'Para baixar a atualização do aplicativo, precisamos salvar o arquivo APK no armazenamento do dispositivo.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Cancelar',
    });

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function ensureAndroidInstallPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Number(Platform.Version ?? 0);
    if (apiLevel < 26) {
      return true;
    }

    const applicationId = Application.applicationId;
    if (!applicationId) {
      throw new Error('Não foi possível identificar o aplicativo instalado.');
    }

    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, {
      data: `package:${applicationId}`,
    });

    return true;
  } catch (error) {
    console.warn('Unknown sources settings could not be opened:', error);
    throw new Error('Não foi possível abrir a permissão para instalar apps desconhecidos.');
  }
}

export async function downloadLatestApk(
  onProgress?: (progress: number, totalBytes: number) => void,
): Promise<string> {
  try {
    const latestRelease = await fetchLatestRelease();
    const apkAsset = latestRelease?.assets?.find((asset) => asset.name?.toLowerCase().endsWith('.apk')) ?? null;

    if (!apkAsset?.browser_download_url) {
      throw new Error('Nenhum APK encontrado na release mais recente.');
    }

    const hasStoragePermission = await ensureStoragePermission();
    if (!hasStoragePermission) {
      throw new Error('Permissão para salvar arquivos negada.');
    }

    const fileName = apkAsset.name ?? `veritas-${Date.now()}.apk`;
    const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
    const normalizedBaseDirectory = baseDirectory.endsWith('/') ? baseDirectory : `${baseDirectory}/`;
    const destinationUri = `${normalizedBaseDirectory}${fileName}`;

    const downloadTask = FileSystem.createDownloadResumable(
      apkAsset.browser_download_url,
      destinationUri,
      {
        headers: GITHUB_HEADERS,
      },
      ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        if (onProgress && totalBytesExpectedToWrite > 0) {
          onProgress((totalBytesWritten / totalBytesExpectedToWrite) * 100, totalBytesExpectedToWrite);
        }
      },
    );

    const result = await downloadTask.downloadAsync();

    if (!result || !result.uri) {
      throw new Error('Falha ao baixar o APK da atualização.');
    }

    return result.uri;
  } catch {
    throw new Error('Não foi possível baixar a atualização no momento.');
  }
}

export async function installDownloadedApk(apkUri: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('A instalação do APK só é suportada no Android.');
  }

  try {
    const hasInstallPermission = await ensureAndroidInstallPermission();
    if (!hasInstallPermission) {
      throw new Error('Permissão para instalar apps desconhecidos negada.');
    }

    const fileUri = apkUri.startsWith('file://') ? apkUri : `file://${apkUri}`;
    const installUri = await FileSystem.getContentUriAsync(fileUri);

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: installUri,
      type: 'application/vnd.android.package-archive',
      flags: 1,
    });
  } catch (error) {
    console.warn('APK installer could not be opened:', error);
    throw new Error('Não foi possível iniciar a instalação. Confirme a permissão para instalar apps desconhecidos e tente novamente.');
  }
}

export function getGitHubReleasesUrl(): string {
  return RELEASES_PAGE_URL;
}
