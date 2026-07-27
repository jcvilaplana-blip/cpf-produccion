"use client"

import { Capacitor } from '@capacitor/core'

/**
 * Share content using native share dialog (or fallback to clipboard on web)
 */
export async function shareContent(opts: { title: string; text: string; url?: string }) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Share')) {
    const { Share } = await import('@capacitor/share')
    await Share.share({
      title: opts.title,
      text: opts.text,
      url: opts.url,
      dialogTitle: 'Compartir',
    })
  } else if (navigator.share) {
    await navigator.share(opts)
  } else if (opts.url) {
    await navigator.clipboard.writeText(opts.url)
  }
}

/**
 * Trigger haptic feedback on native
 */
export async function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Haptics')) return

  const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
  const style = type === 'heavy' ? ImpactStyle.Heavy : type === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light
  await Haptics.impact({ style })
}

/**
 * Take a photo using native camera (or fallback to file input on web)
 */
export async function takePhoto(): Promise<string | null> {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Camera')) {
    return null // Fallback: use <input type="file" accept="image/*"> in the component
  }

  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
  const result = await Camera.getPhoto({
    quality: 80,
    resultType: CameraResultType.Uri,
    source: CameraSource.Prompt,
    width: 1024,
    height: 1024,
  })

  return result.webPath || null
}

/**
 * Get current geolocation
 */
export async function getCurrentPosition() {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Geolocation')) {
    const { Geolocation } = await import('@capacitor/geolocation')
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  }

  // Web fallback
  return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not available'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true },
    )
  })
}

/**
 * Store data persistently (native Preferences or localStorage fallback)
 */
export async function setPreference(key: string, value: string) {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Preferences')) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key, value })
  } else {
    localStorage.setItem(key, value)
  }
}

export async function getPreference(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Preferences')) {
    const { Preferences } = await import('@capacitor/preferences')
    const result = await Preferences.get({ key })
    return result.value
  }
  return localStorage.getItem(key)
}
