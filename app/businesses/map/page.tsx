"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Building2,
  X,
  ChevronLeft,
  Search,
  Star,
  Navigation,
  Loader2,
  CheckCircle,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getMapboxToken } from "@/lib/mapbox"
import { getDeviceLocation, requestAllPermissions } from "@/lib/capacitor/permissions"
import { getCoordsForCity } from "@/lib/city-coords"

// Spain center fallback
const SPAIN_CENTER: [number, number] = [-3.7038, 40.0]
const SPAIN_ZOOM = 5.5
const USER_ZOOM = 12

interface BusinessMarker {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  logo?: string
  city?: string
  verified?: boolean
  rating?: number
  activeJobs?: number
  source: "supabase" | "mock"
}

// Patch Headers for mapbox-gl sandbox compatibility
function patchHeaders() {
  if (typeof window === "undefined") return
  const origAppend = Headers.prototype.append
  Headers.prototype.append = function (name: string, value: string) {
    try {
      return origAppend.call(this, name, value)
    } catch {
      // Silently ignore
    }
  }
}

export default function BusinessesMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [geolocating, setGeolocating] = useState(false)
  const [markers, setMarkers] = useState<BusinessMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<BusinessMarker | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // ALWAYS load Mapbox token from API
  useEffect(() => {
    getMapboxToken().then(token => {
      if (token) setMapboxToken(token)
    })
  }, [])

  // Geolocation -- Capacitor native GPS on APK, web fallback on browser
  useEffect(() => {
    const initLocation = async () => {
      setGeolocating(true)
      await requestAllPermissions()
      const loc = await getDeviceLocation()
      if (loc) {
        setUserLocation([loc.lng, loc.lat])
      }
      setGeolocating(false)
    }
    initLocation()
  }, [])

  // Load business data from database
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const supabase = createClient()
      const allMarkers: BusinessMarker[] = []

      // Load from Supabase
      const { data: businesses } = await supabase
        .from("business_profiles")
        .select("id, company_name, company_logo_url, city, business_type, verified, rating")

      if (businesses) {
        for (const b of businesses) {
          if (!b.company_name) continue
          const coords = getCoordsForCity(b.city)
          if (coords) {
            allMarkers.push({
              id: b.id,
              name: b.company_name,
              type: b.business_type || "General",
              lat: coords[1],
              lng: coords[0],
              logo: b.company_logo_url || undefined,
              city: b.city || undefined,
              verified: b.verified || false,
              rating: b.rating || 0,
              activeJobs: 0,
              source: "supabase",
            })
          }
        }
      }

      setMarkers(allMarkers)
      setLoading(false)
    }
    loadData()
  }, [])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapRef.current) return

    patchHeaders()

    let map: any
    const initMap = async () => {
      const mapboxCssLink = document.querySelector('link[href*="mapbox-gl"]') as HTMLLinkElement
      if (mapboxCssLink && !mapboxCssLink.sheet) {
        await new Promise<void>((resolve) => {
          mapboxCssLink.addEventListener("load", () => resolve(), { once: true })
          setTimeout(resolve, 2000)
        })
      }

      const mapboxgl = (await import("mapbox-gl")).default

      ;(mapboxgl as any).accessToken = mapboxToken

      let center = SPAIN_CENTER
      let zoom = SPAIN_ZOOM

      if (userLocation) {
        center = userLocation
        zoom = USER_ZOOM
      }

      map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center,
        zoom,
      })

      map.addControl(new mapboxgl.NavigationControl(), "top-right")
      map.on("load", () => {
        mapRef.current = map
        setMapLoaded(true)
      })
    }

    initMap()
    return () => {
      if (map) {
        mapRef.current = null
        map.remove()
      }
    }
  }, [mapboxToken, userLocation])

  // Fly to user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return
    mapRef.current.flyTo({ center: userLocation, zoom: USER_ZOOM, duration: 1200 })
  }, [userLocation])

  // Geocoder search
  const handleGeoSearch = useCallback(
    async (query: string) => {
      if (!query || query.length < 2 || !mapboxToken) {
        setSearchResults([])
        return
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=es&types=place,locality,address&language=es&limit=5`
        )
        const data = await res.json()
        setSearchResults(data.features || [])
      } catch {
        // silently ignore
      }
    },
    [mapboxToken]
  )

  useEffect(() => {
    const timer = setTimeout(() => handleGeoSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleGeoSearch])

  const handleSelectPlace = (place: any) => {
    const [lng, lat] = place.center
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 1500 })
    setSearchQuery(place.place_name)
    setSearchResults([])
  }

  const handleRecenter = () => {
    if (userLocation) {
      mapRef.current?.flyTo({ center: userLocation, zoom: USER_ZOOM, duration: 1200 })
    } else {
      mapRef.current?.flyTo({ center: SPAIN_CENTER, zoom: SPAIN_ZOOM, duration: 1200 })
    }
  }

  // Render markers on map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const renderMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      markers.forEach((marker) => {
        const el = document.createElement("div")
        el.className = "map-custom-marker"

        // All business markers are blue
        el.innerHTML = `
          <div style="
            width: 36px; height: 36px;
            background: #01A89E;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
        `

        const mapMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .addTo(mapRef.current!)

        el.addEventListener("click", () => {
          setSelectedMarker(marker)
          mapRef.current?.flyTo({ center: [marker.lng, marker.lat], zoom: 14, duration: 800 })
        })

        markersRef.current.push(mapMarker)
      })
    }

    renderMarkers()
  }, [markers, mapLoaded])

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-50 shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/businesses">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Mapa de Empresas</h1>
              <p className="text-xs text-muted-foreground">
                {loading ? "Cargando..." : `${markers.length} empresas`}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={handleRecenter} className="shrink-0">
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="bg-background border-b px-4 py-3 relative z-40 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ciudad, direccion o lugar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-11 rounded-2xl bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("")
                setSearchResults([])
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="absolute left-4 right-4 top-full mt-1 bg-card border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {searchResults.map((result: any) => (
              <button
                key={result.id}
                onClick={() => handleSelectPlace(result)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-[#01A89E] shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{result.text}</p>
                  <p className="text-xs text-muted-foreground truncate">{result.place_name}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Geolocating indicator */}
      {geolocating && (
        <div className="bg-teal-50 border-b border-teal-200 px-4 py-2 text-center z-20 shrink-0">
          <p className="text-xs text-[#018F86] flex items-center justify-center gap-2">
            <Navigation className="h-3 w-3 animate-pulse" />
            Obteniendo tu ubicacion...
          </p>
        </div>
      )}

      {/* Map container */}
      <div className="relative flex-1">
        <div ref={mapContainer} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-xl shadow-lg p-3 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#01A89E]" />
            <span className="text-xs font-medium">Empresas</span>
          </div>
        </div>

        {/* Selected marker card */}
        {selectedMarker && (
          <div className="absolute bottom-4 right-4 left-20 md:left-auto md:w-80 z-10">
            <Card className="shadow-xl border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {selectedMarker.logo ? (
                      <img
                        src={selectedMarker.logo}
                        alt={selectedMarker.name}
                        className="w-11 h-11 rounded-xl object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-[#01A89E] flex items-center justify-center text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{selectedMarker.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedMarker.type}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMarker(null)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs">
                  {selectedMarker.city && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {selectedMarker.city}
                    </span>
                  )}
                  {selectedMarker.verified && (
                    <Badge className="bg-green-100 text-green-700 text-[10px] gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Verificada
                    </Badge>
                  )}
                  {selectedMarker.rating && (
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedMarker.rating}
                    </span>
                  )}
                </div>

                <Link href={`/business/${selectedMarker.id}`}>
                  <Button className="w-full bg-[#01A89E] hover:bg-[#018F86] text-white rounded-xl" size="sm">
                    Ver empresa
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
