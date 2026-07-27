"use client"

import { useEffect } from "react"

export function CapacitorProvider() {
  useEffect(() => {
    import("@/lib/capacitor/plugins")
      .then((mod) => mod.initCapacitorPlugins())
      .catch(() => {})
  }, [])

  return null
}
