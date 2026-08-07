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
    // El WebView sólo navega dentro del dominio de arriba: cualquier otro se
    // abría en el navegador del sistema, y el usuario salía de la aplicación
    // justo al ir a pagar.
    //
    // El pago ya no sale de la app: se cobra con el Payment Element incrustado
    // (components/stripe-payment-dialog.tsx) contra un PaymentIntent, en lugar
    // de redirigir a checkout.stripe.com. Los dominios de Stripe se mantienen
    // aquí como red de seguridad para el desafío 3-D Secure, que el banco
    // puede resolver con una navegación en vez de en el iframe de Stripe.
    //
    // Se listan sólo los de Stripe a propósito: abrir la navegación a todo
    // convertiría cualquier enlace externo en una pantalla más de la
    // aplicación, sin barra de direcciones ni forma de ver a dónde se ha ido.
    allowNavigation: [
      '*.stripe.com',
      'stripe.com',
    ],
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
