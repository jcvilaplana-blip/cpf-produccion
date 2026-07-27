"use client"

/**
 * Initialize Capacitor plugins when running on native.
 * Call this once in the root layout or app component.
 */
export async function initCapacitorPlugins() {
  // Dynamic import to avoid breaking in non-native environments (e.g. v0 preview)
  let Capacitor: typeof import('@capacitor/core').Capacitor
  try {
    const mod = await import('@capacitor/core')
    Capacitor = mod.Capacitor
  } catch {
    // @capacitor/core not available (web preview), skip all native init
    return
  }

  if (!Capacitor.isNativePlatform()) return

  // Mark as native for CSS safe area styling
  document.documentElement.classList.add('native-app')
  if (Capacitor.getPlatform() === 'android') {
    document.documentElement.classList.add('plt-android')
  } else if (Capacitor.getPlatform() === 'ios') {
    document.documentElement.classList.add('plt-ios')
  }

  // Status Bar - set teal color and ensure it persists after page loads
  if (Capacitor.isPluginAvailable('StatusBar')) {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    const applyStatusBar = async () => {
      await StatusBar.setStyle({ style: Style.Light })
      await StatusBar.setOverlaysWebView({ overlay: false })
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: '#01A89E' })
      }
    }
    // Apply immediately
    await applyStatusBar()
    // Re-apply after page fully loads (in case the web page overrides it)
    window.addEventListener('load', () => { applyStatusBar() })
    // Also update the theme-color meta tag
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', '#01A89E')
  }

  // Keyboard - handle resize on mobile
  if (Capacitor.isPluginAvailable('Keyboard')) {
    const { Keyboard } = await import('@capacitor/keyboard')
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
    })
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
  }

  // Splash Screen - hide after init
  if (Capacitor.isPluginAvailable('SplashScreen')) {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  }

  // App - handle back button on Android
  if (Capacitor.isPluginAvailable('App')) {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        App.exitApp()
      }
    })
  }

  // Capgo Live Updater - check for OTA updates
  try {
    const { CapacitorUpdater } = await import('@capgo/capacitor-updater')
    CapacitorUpdater.notifyAppReady()
  } catch {
    // Capgo updater not available, skip
  }
}
