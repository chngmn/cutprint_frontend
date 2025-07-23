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
    package: 'com.madcampcs.cutprint',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    // usesCleartextTraffic 설정은 이제 plugins에서 처리합니다.
    // 여기에 직접 다시 추가하지 마세요.
  },
  web: {
    favicon: './assets/favicon.png',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  plugins: [
    'expo-web-browser',
    [
      "expo-build-properties",
      {
        "android": {
          "usesCleartextTraffic": true
        }
      }
    ]
  ],
  extra: {
    backendUrl: "http://3.37.74.201:3000",

    googleAuth: {
      iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      webClientId: process.env.GOOGLE_WEB_CLIENT_ID,
    },
    eas: {
      projectId: "80594ed6-ca35-40b0-b97a-dbe089ef29f6"
    },
  },
};

export default config;