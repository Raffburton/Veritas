const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const { copyFileSync, mkdirSync } = require('fs');
const { resolve } = require('path');

const LARGE_ICON_RESOURCE = '@drawable/veritas_notification_large';
const LARGE_ICON_METADATA = 'expo.modules.notifications.large_notification_icon';
const LARGE_ICON_SOURCE = 'assets/veritas-icon.png';
const ANDROID_RES_PATH = 'android/app/src/main/res';

function withNotificationLargeIcon(config) {
  config = withDangerousMod(config, [
    'android',
    (config) => {
      const drawablePath = resolve(config.modRequest.projectRoot, ANDROID_RES_PATH, 'drawable');
      mkdirSync(drawablePath, { recursive: true });
      copyFileSync(
        resolve(config.modRequest.projectRoot, LARGE_ICON_SOURCE),
        resolve(drawablePath, 'veritas_notification_large.png'),
      );
      return config;
    },
  ]);

  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    AndroidConfig.Manifest.addMetaDataItemToMainApplication(
      application,
      LARGE_ICON_METADATA,
      LARGE_ICON_RESOURCE,
      'resource',
    );
    return config;
  });
}

module.exports = withNotificationLargeIcon;