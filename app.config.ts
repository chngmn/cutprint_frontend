// app.config.ts
import type { ExpoConfig } from '@expo/config';

const config: ExpoConfig = {
  name: 'frontend',
  slug: 'frontend',
  scheme: 'cutprintapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.madcampcs.cutprint',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-web-browser',
  ],
  // 필요에 따라 'extra' 필드를 여기에 추가하여
  // Google 로그인 클라이언트 ID 등을 설정할 수 있습니다.
  // 예시:
  extra: {
    googleAuth: {
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    //   androidClientId: "YOUR_ANDROID_CLIENT_ID_HERE.apps.googleusercontent.com",
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    },
  },
};

export default config;