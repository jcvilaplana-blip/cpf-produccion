import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.camareroporfavor.app',
  appName: 'CPF',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      backgroundColor: '#01A89E',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#01A89E',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  // The native bundle in `out/` is a static export, and scripts/build-native.mjs
  // has to stub every server component in it (they cannot be exported), so the
  // bundled pages render empty. Pointing the webview at the live Next.js server
  // is what makes server components, API routes and dynamic routes work in the
  // app. Do not remove this block: without it the APK shows only the footer.
  server: {
    url: 'https://cpf.fullstark.es',
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'CamareroPorFavor-App',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'CamareroPorFavor',
  },
};

export default config;
