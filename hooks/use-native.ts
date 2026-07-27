"use client"

import { useState, useEffect } from "react"
import { Capacitor } from "@capacitor/core"

/**
 * Hook to detect if the app is running in a native Capacitor container.
 * Returns platform info and native status.
 */
export function useNative() {
  const [state, setState] = useState({
    isNative: false,
    platform: "web" as "ios" | "android" | "web",
    isIOS: false,
    isAndroid: false,
  })

  useEffect(() => {
    const platform = Capacitor.getPlatform() as "ios" | "android" | "web"
    setState({
      isNative: Capacitor.isNativePlatform(),
      platform,
      isIOS: platform === "ios",
      isAndroid: platform === "android",
    })
  }, [])

  return state
}
