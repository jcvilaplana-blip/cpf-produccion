import { CapacitorConfig } from '@capacitor/cli';

// A qué servidor apunta la app móvil. Se puede sobreescribir sin tocar código:
//   CAPACITOR_SERVER_URL=https://camareroporfavor.com npm run cap:sync
// Al migrar al servidor definitivo hay que cambiar este valor (o exportar la
// variable): si no, la app instalada seguirá cargando el de desarrollo.
const SERVER_URL = process.env.CAPACITOR_SERVER_URL || 'https://cpf.fullstark.es';

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
    // Capgo sirve los assets web desde un bundle local que él gestiona, y
    // `server.url` le dice al webview que cargue desde un servidor remoto: los
    // dos compiten por lo mismo y el resultado es una pantalla en blanco.
    // Aquí sobra además: al cargar del servidor, cada despliegue web llega
    // solo, sin necesidad de actualizaciones OTA.
    CapacitorUpdater: {
      autoUpdate: false,
      autoDeleteFailed: false,
      resetWhenUpdate: false,
    },
  },
  // The native bundle in `out/` is a static export, and scripts/build-native.mjs
  // has to stub every server component in it (they cannot be exported), so the
  // bundled pages render empty. Pointing the webview at the live Next.js server
  // is what makes server components, API routes and dynamic routes work in the
  // app. Do not remove this block: without it the APK shows only the footer.
  server: {
    url: SERVER_URL,
    cleartext: false,
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    // Permite inspeccionar el webview desde chrome://inspect. Sin esto, un
    // fallo de carga dentro de la app es una pantalla en blanco sin ninguna
    // pista. Estamos en desarrollo; PONER A false antes de publicar en Play.
    webContentsDebuggingEnabled: true,
    appendUserAgent: 'CamareroPorFavor-App',
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'CamareroPorFavor',
  },
};

export default config;
