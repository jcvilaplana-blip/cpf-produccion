"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button" 
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MapPin, Users, Building2, X, ChevronLeft, Search, Filter, Star, Briefcase, Navigation } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { getMapboxToken } from "@/lib/mapbox"
import { getDeviceLocation, requestAllPermissions } from "@/lib/capacitor/permissions"
import type { Profile, BusinessProfile, Job, JobCategory } from "@/lib/types"
import { getCoordsForCity, categoryLabels, categoryColors } from "@/lib/city-coords"

// Spain center fallback
const SPAIN_CENTER: [number, number] = [-3.7038, 40.0]
const SPAIN_ZOOM = 5.5
const USER_ZOOM = 12

interface MapMarker {
  id: string
  type: "candidate" | "business" | "flash"
  name: string
  category?: string
  rating?: number
  lat: number
  lng: number
  avatar?: string
  city?: string
  jobCount?: number
}

export type MapUserRole = "candidate" | "business" | "admin"

export type MapZoomLevel = "planet" | "country" | "city" | "flash"

interface MapViewProps {
  userRole?: MapUserRole
  fullscreen?: boolean
  onClose?: () => void
  showHeader?: boolean
  zoomLevel?: MapZoomLevel
}

// Patch Headers.prototype.append to prevent mapbox-gl internal crash
// mapbox-gl v3 tries to set headers with invalid names in sandboxed environments
function patchHeaders() {
  if (typeof window === "undefined") return
  const origAppend = Headers.prototype.append
  Headers.prototype.append = function (name: string, value: string) {
    try {
      return origAppend.call(this, name, value)
    } catch {
      // Silently ignore - mapbox-gl uses this for telemetry, not core functionality
    }
  }
}

export function MapView({ userRole = "admin", fullscreen = false, onClose, showHeader = true, zoomLevel }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [geolocating, setGeolocating] = useState(false)

  // ALWAYS load Mapbox token from API on mount
  useEffect(() => {
    getMapboxToken().then(token => {
      if (token) setMapboxToken(token)
    })
  }, [])

  const [viewMode, setViewMode] = useState<"all" | "candidates" | "businesses" | "flash">(
    userRole === "candidate" ? "businesses" : userRole === "business" ? "candidates" : "all"
  )
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Determine available view modes based on role
  // Candidatos = usuarios buscando empleo
  // Empresas = empresas con ofertas publicadas
  // Flash = ofertas de última hora
  const getAvailableViewModes = () => {
    if (userRole === "candidate") {
      return [
        { key: "businesses", label: "Empresas", icon: Building2 },
      ]
    }
    if (userRole === "business") {
      return [
        { key: "candidates", label: "Candidatos", icon: Users },
      ]
    }
    // Admin sees all
    return [
      { key: "all", label: "Todos", icon: MapPin },
      { key: "candidates", label: "Candidatos", icon: Users },
      { key: "businesses", label: "Empresas", icon: Building2 },
      { key: "flash", label: "Ofertas Flash", icon: Briefcase },
    ]
  }

  // Geolocation for candidate/business users only - admin always sees Spain overview
  useEffect(() => {
    // Skip geolocation for admin - always show Spain overview
    if (userRole === "admin") {
      setGeolocating(false)
      return
    }
    
    const initLocation = async () => {
      setGeolocating(true)
      try {
        await requestAllPermissions()
        const loc = await getDeviceLocation()
        if (loc) {
          setUserLocation([loc.lng, loc.lat])
        }
      } catch {
        // Geolocation denied or unavailable - will use Spain center as fallback
      }
      setGeolocating(false)
    }
    initLocation()
  }, [userRole])

  // Load REAL data from Supabase using actual column names
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const allMarkers: MapMarker[] = []
      
      // Load city coords from DB for fallback
      const { data: dbCities } = await supabase
        .from("cities")
        .select("name, latitude, longitude")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
      
      const dbCityCoords: Record<string, [number, number]> = {}
      if (dbCities) {
        for (const city of dbCities) {
          if (city.name && city.latitude && city.longitude) {
            dbCityCoords[city.name.toLowerCase().trim()] = [Number(city.longitude), Number(city.latitude)]
          }
        }
      }
      
      // Helper function to get coords with DB fallback
      const getCoords = (cityName?: string | null): [number, number] | null => {
        if (!cityName) return null
        // Try static lookup first
        const staticCoords = getCoordsForCity(cityName)
        if (staticCoords) return staticCoords
        // Then try DB lookup
        const normalized = cityName.toLowerCase().trim()
        if (dbCityCoords[normalized]) return dbCityCoords[normalized]
        // Try partial match
        for (const [key, coords] of Object.entries(dbCityCoords)) {
          if (normalized.includes(key) || key.includes(normalized)) return coords
        }
        return null
      }

      // Load candidates (profiles with user_type=worker) - geocode by location name
      // Admin sees ALL workers; candidates/businesses only see those with published video
      if (viewMode === "all" || viewMode === "candidates" || userRole === "business" || userRole === "admin") {
        let candidatesQuery = supabase
          .from("profiles")
          .select("id, display_name, job_category, rating, avatar_url, location, video_status, latitude, longitude")
          .eq("user_type", "worker")
        
        // Non-admin users only see candidates with published video
        if (userRole !== "admin") {
          candidatesQuery = candidatesQuery.eq("video_status", "ready")
        }
        
        const { data: candidates } = await candidatesQuery

        if (candidates) {
          for (const c of candidates) {
            // First try stored coordinates, then geocode by city name
            let lat = c.latitude ? Number(c.latitude) : null
            let lng = c.longitude ? Number(c.longitude) : null
            
            if (!lat || !lng) {
              const coords = getCoords(c.location)
              if (coords) {
                lng = coords[0]
                lat = coords[1]
              }
            }
            
            if (!lat || !lng) continue
            
            allMarkers.push({
              id: c.id,
              type: "candidate",
              name: c.display_name || "Candidato",
              category: c.job_category || undefined,
              rating: c.rating ? Number(c.rating) : undefined,
              lat,
              lng,
              avatar: c.avatar_url || undefined,
              city: c.location || undefined,
            })
          }
        }
      }

      // Load businesses - admin sees ALL, others only see those with active job offers
      if (viewMode === "all" || viewMode === "businesses" || userRole === "candidate" || userRole === "admin") {
        let businessesToShow: any[] = []
        
        if (userRole === "admin") {
          // Admin sees ALL businesses
          const { data: allBusinesses } = await supabase
            .from("business_profiles")
            .select("id, company_name, company_logo_url, city, business_type, latitude, longitude")
          
          businessesToShow = allBusinesses || []
        } else {
          // Non-admin: only businesses with active jobs
          const { data: activeJobs } = await supabase
            .from("jobs")
            .select("business_id")
            .eq("is_active", true)
            .eq("is_flash", false)
          
          const businessIdsWithJobs = [...new Set(activeJobs?.map(j => j.business_id).filter(Boolean) || [])]
          
          if (businessIdsWithJobs.length > 0) {
            const { data: businesses } = await supabase
              .from("business_profiles")
              .select("id, company_name, company_logo_url, city, business_type, latitude, longitude")
              .in("id", businessIdsWithJobs)
            
            businessesToShow = businesses || []
          }
        }

        for (const b of businessesToShow) {
          // First try stored coordinates, then geocode by city name
          let lat = b.latitude ? Number(b.latitude) : null
          let lng = b.longitude ? Number(b.longitude) : null
          
          if (!lat || !lng) {
            const coords = getCoords(b.city)
            if (coords) {
              lng = coords[0]
              lat = coords[1]
            }
          }
          
          if (!lat || !lng) continue
          
          allMarkers.push({
            id: b.id,
            type: "business",
            name: b.company_name || "Empresa",
            lat,
            lng,
            avatar: b.company_logo_url || undefined,
            city: b.city || undefined,
          })
        }
      }

      // Load flash offers only (businesses are shown via business_profiles)
      if (viewMode === "all" || viewMode === "flash" || userRole === "admin") {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, category, latitude, longitude, location, city, is_active, is_flash")
          .eq("is_active", true)
          .eq("is_flash", true)

        if (jobs) {
          for (const j of jobs) {
            let lat = j.latitude ? Number(j.latitude) : null
            let lng = j.longitude ? Number(j.longitude) : null

            // Fallback: use city name to get coords
            if (!lat || !lng) {
              const coords = getCoords(j.city || j.location)
              if (coords) {
                lng = coords[0]
                lat = coords[1]
              }
            }

            if (lat && lng) {
              allMarkers.push({
                id: j.id,
                type: "flash",
                name: j.title || "Oferta Flash",
                category: j.category || undefined,
                lat,
                lng,
                city: j.city || j.location || undefined,
              })
            }
          }
        }
      }

      setMarkers(allMarkers)
    }
    loadData()
  }, [userRole, viewMode])

  // Initialize Mapbox GL with Headers patch
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapRef.current) return
    patchHeaders()

    let map: any
    let mounted = true
    
    const initMap = async () => {
      try {
        
        // Ensure CSS is loaded
        if (!document.querySelector('link[href*="mapbox-gl"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css"
          document.head.appendChild(link)
          // Wait for CSS to load
          await new Promise(r => setTimeout(r, 300))
        }

        const mapboxgl = (await import("mapbox-gl")).default
        mapboxgl.accessToken = mapboxToken

        // Determine initial center and zoom
        let center = SPAIN_CENTER
        let zoom = SPAIN_ZOOM

        if (userLocation) {
          center = userLocation
          zoom = USER_ZOOM
        }

        // Wait for container to be ready
        await new Promise(r => setTimeout(r, 100))
        
        if (!mounted || !mapContainer.current) return
        
        map = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/light-v11",
          center,
          zoom,
        })

        map.addControl(new mapboxgl.NavigationControl(), "top-right")

        map.on("load", () => {
          if (mounted) {
            mapRef.current = map
            setMapLoaded(true)
          }
        })
      } catch {
        // Map init error - silently fail
      }
    }

    initMap()

    return () => {
      mounted = false
      if (map) {
        mapRef.current = null
        map.remove()
      }
    }
  }, [mapboxToken, userLocation, userRole])

  // Fly to user location when it arrives after map init
  useEffect(() => {
    if (!mapRef.current || !userLocation) return
    mapRef.current.flyTo({
      center: userLocation,
      zoom: USER_ZOOM,
      duration: 1200,
    })
  }, [userLocation])

  // Respond to external zoomLevel changes (admin panel buttons)
  useEffect(() => {
    if (!mapRef.current || !zoomLevel) return
    const zoomConfigs: Record<MapZoomLevel, { center: [number, number]; zoom: number; pitch: number }> = {
      planet: { center: [-3.7, 20], zoom: 1.5, pitch: 0 },
      country: { center: SPAIN_CENTER, zoom: SPAIN_ZOOM, pitch: 0 },
      city: { center: [-3.7038, 40.4168], zoom: 11, pitch: 45 },
      flash: { center: SPAIN_CENTER, zoom: 6.5, pitch: 0 },
    }
    const config = zoomConfigs[zoomLevel]
    mapRef.current.flyTo({
      center: config.center,
      zoom: config.zoom,
      pitch: config.pitch,
      duration: 1500,
      essential: true,
    })
    // Al entrar en zoom flash, mostrar solo ofertas flash. Antes ponía
    // "jobs", que no existe en la unión: ninguna rama del render coincidía
    // y el mapa se quedaba sin marcadores.
    if (zoomLevel === "flash") {
      setViewMode("flash")
    } else if (zoomLevel === "planet" || zoomLevel === "country") {
      setViewMode("all")
    }
  }, [zoomLevel])

  // Geocoder search using Mapbox Geocoding API (via fetch - no Headers issues)
  const handleGeoSearch = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !mapboxToken) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=es&types=place,locality,address&language=es&limit=5`
      )
      const data = await res.json()
      setSearchResults(data.features || [])
    } catch (e) {
      // Geocoding error - silently ignore
    }
    setIsSearching(false)
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGeoSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, handleGeoSearch])

  // Select geocoder result
  const handleSelectPlace = (place: any) => {
    const [lng, lat] = place.center
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 1500 })
    setSearchQuery(place.place_name)
    setSearchResults([])
  }

  // Recenter on user location using Capacitor GPS (native) or web fallback
  const handleRecenter = async () => {
    if (userLocation) {
      mapRef.current?.flyTo({ center: userLocation, zoom: USER_ZOOM, duration: 1200 })
    } else {
      const loc = await getDeviceLocation()
      if (loc) {
        const coords: [number, number] = [loc.lng, loc.lat]
        setUserLocation(coords)
        mapRef.current?.flyTo({ center: coords, zoom: USER_ZOOM, duration: 1200 })
      } else {
        mapRef.current?.flyTo({ center: SPAIN_CENTER, zoom: SPAIN_ZOOM, duration: 1200 })
      }
    }
  }

  // Filter markers
  const filteredMarkers = markers.filter((m) => {
    if (viewMode !== "all") {
      const typeMap: Record<string, string> = {
        candidates: "candidate",
        businesses: "business",
        flash: "flash",
      }
      if (typeMap[viewMode] && m.type !== typeMap[viewMode]) return false
    }
    if (selectedCategory !== "all" && m.category !== selectedCategory) return false
    return true
  })

  // Render markers on map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const renderMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default

      // Clear existing markers
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      filteredMarkers.forEach((marker) => {
        const el = document.createElement("div")
        el.className = "map-custom-marker"

        // Candidatos = ROJO, Empresas = TEAL, Ofertas Flash = NARANJA
        const color =
          marker.type === "candidate"
            ? "#EF4444"
            : marker.type === "business"
            ? "#01A89E"
            : "#F97316" // flash
        
        const size = marker.type === "flash" ? "28px" : "34px"
        const borderSize = marker.type === "flash" ? "2px" : "3px"

        const icon =
          marker.type === "candidate"
            ? "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            : marker.type === "business"
            ? "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            : "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"

        el.innerHTML = `
          <div style="
            width: ${size}; height: ${size}; 
            background: ${color}; 
            border-radius: 50%; 
            border: ${borderSize} solid white; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="${icon}"/>
            </svg>
          </div>
        `

        const mapMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .addTo(mapRef.current!)

        el.addEventListener("click", () => {
          setSelectedMarker(marker)
          mapRef.current?.flyTo({
            center: [marker.lng, marker.lat],
            zoom: 14,
            duration: 800,
          })
        })

        markersRef.current.push(mapMarker)
      })
    }

    renderMarkers()
  }, [filteredMarkers, mapLoaded])

  const containerClass = fullscreen
    ? "fixed inset-0 z-[100] bg-background flex flex-col"
    : !showHeader
    ? "h-full w-full"
    : "min-h-screen bg-background flex flex-col"

  const mapHeight = fullscreen
    ? "flex-1"
    : !showHeader
    ? "h-full min-h-[400px]"
    : "flex-1 min-h-[calc(100vh-180px)]"

  const roleDescription = userRole === "candidate"
    ? "Empresas y ofertas de empleo"
    : userRole === "business"
    ? "Candidatos disponibles"
    : "Candidatos, empresas y ofertas"

  return (
    <div className={containerClass}>
      {/* Header */}
      {showHeader && (
        <div className="bg-background border-b sticky top-0 z-50 shrink-0">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {onClose ? (
                <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              ) : (
                <Link href="/search">
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <div className="flex-1">
                <h1 className="text-lg font-bold">Mapa CamareroPorFavor</h1>
                <p className="text-xs text-muted-foreground">
                  {filteredMarkers.length} resultados - {roleDescription}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRecenter}
                className="shrink-0"
                title={userRole === "admin" ? "Ver toda Espana" : "Ir a mi ubicacion"}
              >
                <Navigation className="h-4 w-4" />
              </Button>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-[#01A89E] hover:bg-[#018F86] text-white" : ""}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar with geocoder */}
      {showHeader && <div className="bg-background border-b px-4 py-3 relative z-40 shrink-0">
        <div className="container mx-auto max-w-4xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ciudad, direccion o lugar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-[#01A89E]"
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

          {/* Search results dropdown */}
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
      </div>}

      {/* Filters panel */}
      {showHeader && showFilters && (
        <div className="bg-background border-b px-4 py-4 z-30 shrink-0">
          <div className="container mx-auto max-w-4xl space-y-4">
            {/* View mode */}
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Mostrar en mapa</p>
              <div className="flex flex-wrap gap-2">
                {getAvailableViewModes().map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={viewMode === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(key as any)}
                    className={viewMode === key ? "bg-[#01A89E] hover:bg-[#018F86] text-white" : ""}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Categoría profesional</p>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-muted/50 border-0">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColors[key] || "#999" }}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

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
      <div className={`relative ${mapHeight}`} style={{ minHeight: showHeader ? undefined : '500px' }}>
        <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur rounded-lg shadow-lg p-3 z-10">
          <p className="text-xs font-semibold mb-2">Leyenda</p>
          <div className="space-y-1.5">
            {(userRole === "business" || userRole === "admin") && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="text-xs">Candidatos</span>
              </div>
            )}
            {(userRole === "candidate" || userRole === "admin") && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#01A89E]" />
                <span className="text-xs">Empresas</span>
              </div>
            )}
            {userRole === "admin" && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F97316]" />
                <span className="text-xs">Ofertas Flash</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected marker card */}
        {selectedMarker && (
          <div className="absolute bottom-4 right-4 left-20 md:left-auto md:w-80 z-10">
            <Card className="shadow-xl border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {selectedMarker.avatar ? (
                      <img
                        src={selectedMarker.avatar}
                        alt={selectedMarker.name}
                        className="w-10 h-10 rounded-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                        selectedMarker.type === "candidate" ? "bg-red-500" :
                        selectedMarker.type === "business" ? "bg-[#01A89E]" : "bg-emerald-500"
                      }`}>
                        {selectedMarker.type === "candidate" ? (
                          <Users className="h-5 w-5" />
                        ) : selectedMarker.type === "business" ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{selectedMarker.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedMarker.type === "candidate"
                          ? "Candidato"
                          : selectedMarker.type === "business"
                          ? "Empresa"
                          : "Oferta de empleo"}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedMarker(null)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-1.5 mb-3">
                  {selectedMarker.city && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {selectedMarker.city}
                    </div>
                  )}
                  {selectedMarker.category && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${categoryColors[selectedMarker.category] || "#999"}20`,
                        color: categoryColors[selectedMarker.category] || "#999",
                      }}
                    >
                      {categoryLabels[selectedMarker.category] || selectedMarker.category}
                    </Badge>
                  )}
                  {selectedMarker.rating !== undefined && selectedMarker.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{selectedMarker.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <Link
                  href={
                    selectedMarker.type === "candidate"
                      ? `/profile/${selectedMarker.id}`
                      : selectedMarker.type === "business"
                      ? `/business/${selectedMarker.id}`
                      : `/flash-offers/${selectedMarker.id}`
                  }
                >
                  <Button className="w-full bg-[#01A89E] hover:bg-[#018F86] text-white" size="sm">
                    Ver perfil completo
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
