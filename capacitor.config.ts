import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'com.camareroporfavor.app',
  appName: 'CPF',
  webDir: 'out',
  // La app carga el sitio real en lugar de un paquete estático.
  //
  // Con `webDir` a secas, el APK empaquetaba la salida de `output: 'export'`,
  // y esta aplicación no puede funcionar así: tiene 45 rutas API, server
  // actions, páginas `force-dynamic` y middleware, y un export estático no
  // incluye nada de eso. El resultado era un cascarón donde fallaban las
  // subidas de fotos, los pagos, las valoraciones y las inscripciones a
  // ofertas — la pantalla en blanco del APK venía de ahí, no de Capacitor.
  //
  // OJO al migrar de servidor: hay que cambiar esta URL al dominio definitivo
  // o la app móvil seguirá apuntando al entorno de desarrollo.
  server: {
    url: 'https://cpf.fullstark.es',
    cleartext: false,
  },
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
      resize: KeyboardResize.Body,
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
  android: {
    allowMixedContent: false,
    // Ponerlo temporalmente en true permite inspeccionar el WebView desde
    // chrome://inspect, que es como se encontró la causa real de la pantalla
    // en blanco (el WebView rechazaba el certificado del servidor) tras una
    // tanda previa de hipótesis a ciegas que costó horas. Se deja en false
    // porque en una compilación de publicación expondría la app a inspección.
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
