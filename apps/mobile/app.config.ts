import type { ConfigContext, ExpoConfig } from 'expo/config';

type MobileAndroidConfig = NonNullable<ExpoConfig['android']> & {
  minSdkVersion: number;
  compileSdkVersion: number;
  targetSdkVersion: number;
};

const android: MobileAndroidConfig = {
  package: 'com.evgenver.hermesmobile',
  minSdkVersion: 31,
  compileSdkVersion: 36,
  targetSdkVersion: 36,
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
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
});
