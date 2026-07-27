"use client"

import { Capacitor } from '@capacitor/core'

/**
 * Check if the app is running in a native Capacitor container
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Get the current platform: 'ios', 'android', or 'web'
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web'
}

/**
 * Check if a specific plugin is available on the current platform
 */
export function isPluginAvailable(name: string): boolean {
  return Capacitor.isPluginAvailable(name)
}
