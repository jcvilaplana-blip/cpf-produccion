// Mapbox token - cached after first API fetch
let cachedToken: string | null = null

// ALWAYS load token from API at runtime for production compatibility
export async function getMapboxToken(): Promise<string> {
  // Return cached token if we have it
  if (cachedToken) return cachedToken
  
  // Try env var first (available in SSR)
  const envToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN
  if (envToken) {
    cachedToken = envToken
    return envToken
  }
  
  // Client-side: fetch from API with retry
  if (typeof window !== "undefined") {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const baseUrl = window.location.origin
        const res = await fetch(`${baseUrl}/api/mapbox/token`, { 
          cache: "no-store",
          headers: { "Accept": "application/json" }
        })
        if (res.ok) {
          const data = await res.json()
          if (data.token) {
            cachedToken = data.token
            return data.token
          }
        }
      } catch {
        // Retry on error
        if (attempt < 2) await new Promise(r => setTimeout(r, 500))
      }
    }
  }
  
  return ""
}

// Export for backwards compatibility - will be empty, use getMapboxToken() instead
export const MAPBOX_TOKEN = ""
