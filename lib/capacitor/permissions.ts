"use client"

import { Capacitor } from "@capacitor/core"

export interface PermissionStatus {
  location: "granted" | "denied" | "prompt"
  camera: "granted" | "denied" | "prompt"
  microphone: "granted" | "denied" | "prompt"
}

/**
 * Request all required permissions for the app (location, camera, microphone).
 * On native (Capacitor) it uses native permission dialogs.
 * On web it uses the standard Permissions API.
 */
export async function requestAllPermissions(): Promise<PermissionStatus> {
  const result: PermissionStatus = {
    location: "prompt",
    camera: "prompt",
    microphone: "prompt",
  }

  if (Capacitor.isNativePlatform()) {
    // --- NATIVE (Android/iOS) ---
    // Location
    try {
      if (Capacitor.isPluginAvailable("Geolocation")) {
        const { Geolocation } = await import("@capacitor/geolocation")
        const locPerm = await Geolocation.requestPermissions()
        result.location = locPerm.location === "granted" ? "granted" : "denied"
      }
    } catch {
      result.location = "denied"
    }

    // Camera
    try {
      if (Capacitor.isPluginAvailable("Camera")) {
        const { Camera } = await import("@capacitor/camera")
        const camPerm = await Camera.requestPermissions({ permissions: ["camera", "photos"] })
        result.camera = camPerm.camera === "granted" ? "granted" : "denied"
      }
    } catch {
      result.camera = "denied"
    }

    // Microphone (for video recording) -- no Capacitor plugin, use web API
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      result.microphone = "granted"
    } catch {
      result.microphone = "denied"
    }
  } else {
    // --- WEB ---
    // Location
    try {
      const locPerm = await navigator.permissions.query({ name: "geolocation" })
      if (locPerm.state === "prompt") {
        // Trigger the native prompt
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => { result.location = "granted"; resolve() },
            () => { result.location = "denied"; resolve() },
            { timeout: 10000 }
          )
        })
      } else {
        result.location = locPerm.state as "granted" | "denied"
      }
    } catch {
      result.location = "denied"
    }

    // Camera + Microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      stream.getTracks().forEach((t) => t.stop())
      result.camera = "granted"
      result.microphone = "granted"
    } catch {
      result.camera = "denied"
      result.microphone = "denied"
    }
  }

  return result
}

/**
 * Get current geolocation with proper native/web handling.
 * On Capacitor native, uses the Geolocation plugin (GPS hardware).
 * On web, uses navigator.geolocation.
 */
export async function getDeviceLocation(): Promise<{ lat: number; lng: number } | null> {
  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Geolocation")) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation")
      // First ensure permission
      const perm = await Geolocation.checkPermissions()
      if (perm.location !== "granted") {
        await Geolocation.requestPermissions()
      }
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      })
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch (err) {
      console.warn("Native geolocation failed:", err)
      return null
    }
  }

  // Web fallback
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}
