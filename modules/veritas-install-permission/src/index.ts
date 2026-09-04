import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

type InstallPermissionNativeModule = {
  canRequestPackageInstalls(): Promise<boolean>;
};

export async function canRequestPackageInstalls(): Promise<boolean> {
  if (Platform.OS !== 'android' || Number(Platform.Version ?? 0) < 26) {
    return true;
  }

  const nativeModule = requireNativeModule<InstallPermissionNativeModule>('VeritasInstallPermission');
  return nativeModule.canRequestPackageInstalls();
}
