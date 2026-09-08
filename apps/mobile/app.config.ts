import type { ConfigContext, ExpoConfig } from 'expo/config';

type MobileAndroidConfig = NonNullable<ExpoConfig['android']> & {
  minSdkVersion: number;
  compileSdkVersion: number;
  targetSdkVersion: number;
};

const androidBuildProperties = {
  minSdkVersion: 31,
  compileSdkVersion: 36,
  targetSdkVersion: 36,
  buildToolsVersion: '36.0.0',
} as const;

const android: MobileAndroidConfig = {
  package: 'com.evgenver.hermesmobile',
  minSdkVersion: androidBuildProperties.minSdkVersion,
  compileSdkVersion: androidBuildProperties.compileSdkVersion,
  targetSdkVersion: androidBuildProperties.targetSdkVersion,
  blockedPermissions: ['android.permission.RECORD_AUDIO', 'android.permission.SYSTEM_ALERT_WINDOW'],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hermes Mobile',
  slug: 'hermes-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'hermesmobile',
  platforms: ['android'],
  userInterfaceStyle: 'automatic',
  android,
  plugins: [
    [
      'expo-build-properties',
      {
        android: androidBuildProperties,
      },
    ],
    [
      'expo-image-picker',
      {
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    'expo-notifications',
    'expo-secure-store',
    'expo-router',
  ],
  experiments: {
    typedRoutes: true,
  },
});
