import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hermes Mobile',
  slug: 'hermes-mobile',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'hermesmobile',
  platforms: ['android'],
  userInterfaceStyle: 'automatic',
  android: {
    package: 'com.evgenver.hermesmobile',
    minSdkVersion: 31,
    compileSdkVersion: 36,
    targetSdkVersion: 36,
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
});
