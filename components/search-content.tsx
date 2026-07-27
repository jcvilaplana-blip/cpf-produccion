"use client"

import { useEffect, useRef, useState, useMemo } from "react" 
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Users,
  Building2,
  Briefcase,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Navigation,
  X,
  Star,
  MapPin,
  ArrowLeft,
  Route,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMapboxToken } from "@/lib/mapbox"
import { getDeviceLocation, requestAllPermissions } from "@/lib/capacitor/permissions"
import type { Profile } from "@/lib/types"

// Bounding box (mainland Spain + Balearics, with a bit of Portugal/France/Morocco
// visible for context) used to fit-to-view instead of a fixed zoom - a fixed zoom
// number shows a very different amount of area depending on the viewport's aspect
// ratio, so on narrow mobile screens it was cropping out most of the country.
const SPAIN_BOUNDS: [[number, number], [number, number]] = [
  [-9.5, 35.0], // SW
  [3.5, 43.9], // NE
]
const USER_ZOOM = 12

interface MapMarker {
  id: string
  type: "candidate" | "business" | "job" | "flash"
  name: string
  category?: string
  rating?: number
  lat: number
  lng: number
  avatar?: string
  city?: string
  jobType?: string
  contractType?: string
  workMode?: string
  isFlash?: boolean
  hasVideo?: boolean
}

interface SearchContentProps {
  profile: Profile | null
}



// Patch Headers to prevent mapbox-gl crash in sandboxed environments
function patchHeaders() {
  if (typeof window === "undefined") return
  const origAppend = Headers.prototype.append
  Headers.prototype.append = function (name: string, value: string) {
    try {
      return origAppend.call(this, name, value)
    } catch {
      // silently ignore
    }
  }
}

export function SearchContent({ profile }: SearchContentProps) {
  const router = useRouter()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const mapInitialized = useRef(false)
  const routeLoadedRef = useRef(false)
  const focusedBusinessRef = useRef<string | null>(null)

  const [mapboxToken, setMapboxToken] = useState<string>("")
  const [allMarkers, setMarkers] = useState<MapMarker[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)

  // Read ?business=<id> from the URL once on mount (avoids useSearchParams,
  // which would need a Suspense boundary in the parent page).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const businessId = params.get("business")
    if (businessId) focusedBusinessRef.current = businessId
  }, [])

  // Scroll to top immediately on mount to prevent footer flash
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])
  
  // ALWAYS load Mapbox token from API
  useEffect(() => {
    getMapboxToken().then(token => {
      if (token) setMapboxToken(token)
    })
  }, [])
  const [showCandidates, setShowCandidates] = useState(true)
  // "Empresas" is kept internally-only now (never shown as a pill) so the
  // ?business=<id> deep link from a business profile's "Ver Mapa" button can
  // still focus that one business's marker - see the effect below.
  const [showBusinesses, setShowBusinesses] = useState(false)
  const [showJobs, setShowJobs] = useState(true)
  const [showFlash, setShowFlash] = useState(true)
  // A candidate must never be able to see other candidates, and a business
  // must never be able to see other businesses' job/flash offers - the pills
  // for the forbidden category simply don't render for that role at all.
  // Anyone not logged in as a business (including anonymous visitors) is
  // treated as a candidate by default - only Ofertas/Flash, no role prompt.
  const [role, setRole] = useState<"candidate" | "business" | null>(null)

  useEffect(() => {
    const isBusiness = profile?.user_type === "business"
    setRole(isBusiness ? "business" : "candidate")
    setShowCandidates(isBusiness)
    setShowJobs(!isBusiness)
    setShowFlash(!isBusiness)
  }, [profile])
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [searchCategories, setSearchCategories] = useState<{ name: string; role_type: string }[]>([])
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setSearchCategories((json.data || []).map((c: any) => ({ name: c.name, role_type: c.role_type || "candidate" }))))
      .catch(() => {})
  }, [])
  const [filterJobType, setFilterJobType] = useState<string[]>([])
  const [filterContractType, setFilterContractType] = useState<string[]>([])
  const [filterWorkMode, setFilterWorkMode] = useState<string[]>([])
  const [filterCity, setFilterCity] = useState<string>("")
  const [filterDistance, setFilterDistance] = useState<string>("all")
  const [filterPostalCode, setFilterPostalCode] = useState<string>("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [geolocating, setGeolocating] = useState(false)

  // 2. Request permissions and geolocation using Capacitor (native GPS) or web fallback
  useEffect(() => {
    const initLocation = async () => {
      // Request permissions first (shows native dialogs on APK)
      await requestAllPermissions()
      // Get device location via Capacitor plugin (GPS) or navigator.geolocation
      const loc = await getDeviceLocation()
      if (loc) {
        setUserLocation([loc.lng, loc.lat])
      }
    }
    initLocation()
  }, [])

  // 3. Load real data from Supabase in background (non-blocking)
  useEffect(() => {
    const loadData = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()
        const { getCoordsForCity } = await import("@/lib/city-coords")
        const loaded: MapMarker[] = []

        // Candidates - get workers with location
        const { data: candidates } = await supabase
          .from("profiles")
          .select("id, display_name, job_category, rating, avatar_url, location, is_active, profile_completed, mux_playback_id")
          .eq("user_type", "worker")
          .not("location", "is", null)

        if (candidates) {
          for (const c of candidates) {
            // Filter active and completed profiles in code to avoid RLS issues
            if (!c.is_active || !c.profile_completed) continue
            const coords = getCoordsForCity(c.location)
            if (coords) {
              loaded.push({
                id: c.id, type: "candidate",
                name: c.display_name || "Candidato",
                category: c.job_category || undefined,
                rating: c.rating ? Number(c.rating) : undefined,
                lat: coords[1], lng: coords[0],
                avatar: c.avatar_url || undefined,
                city: c.location || undefined,
                hasVideo: !!c.mux_playback_id,
              })
            }
          }
        }

        // Businesses
        const { data: businesses } = await supabase
          .from("business_profiles")
          .select("id, company_name, company_logo_url, city, address, business_type, latitude, longitude")

        if (businesses) {
          for (const b of businesses) {
            let lat = b.latitude ? Number(b.latitude) : null
            let lng = b.longitude ? Number(b.longitude) : null
            if (!lat || !lng) {
              const coords = getCoordsForCity(b.city)
              if (coords) { lng = coords[0]; lat = coords[1] }
            }
            if (lat && lng) {
              loaded.push({
                id: b.id, type: "business",
                name: b.company_name || "Empresa",
                lat, lng,
                avatar: b.company_logo_url || undefined,
                city: b.address || b.city || undefined,
              })
            }
          }
        }

        // Jobs
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id, title, category, latitude, longitude, location, city, is_active, is_flash, job_type, contract_type, image_url")
          .eq("is_active", true)

        // Both flash and regular job offers get their own marker.
        if (jobs) {
          for (const j of jobs) {
            let lat = j.latitude ? Number(j.latitude) : null
            let lng = j.longitude ? Number(j.longitude) : null
            if (!lat || !lng) {
              const coords = getCoordsForCity(j.city || j.location)
              if (coords) { lng = coords[0]; lat = coords[1] }
            }
            if (lat && lng) {
              loaded.push({
                id: j.id,
                type: j.is_flash ? "flash" : "job",
                name: j.title || (j.is_flash ? "Oferta Flash" : "Oferta de Empleo"),
                category: j.category || undefined,
                lat, lng,
                city: j.city || j.location || undefined,
                isFlash: !!j.is_flash,
                jobType: j.job_type || undefined,
                contractType: j.contract_type || undefined,
                avatar: j.image_url || undefined,
              })
            }
          }
        }

        if (loaded.length > 0) setMarkers(loaded)
      } catch {
        // DB load failed silently - mock data will show
      }
    }
    loadData()
  }, [])

  // 4. Initialize map immediately when token is ready (don't wait for geo)
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || mapInitialized.current) return
    mapInitialized.current = true

    patchHeaders()

    const initMap = async () => {
      // Esperar a que el CSS de Mapbox este completamente cargado antes de inicializar
      const mapboxCssLink = document.querySelector('link[href*="mapbox-gl"]') as HTMLLinkElement
      if (mapboxCssLink && !mapboxCssLink.sheet) {
        await new Promise<void>((resolve) => {
          mapboxCssLink.addEventListener("load", () => resolve(), { once: true })
          setTimeout(resolve, 2000) // Fallback por si ya cargo
        })
      }

      const mapboxgl = (await import("mapbox-gl")).default

      ;(mapboxgl as any).accessToken = mapboxToken

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        bounds: SPAIN_BOUNDS,
        fitBoundsOptions: { padding: 16 },
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right")

      map.on("load", () => {
        mapRef.current = map
        setMapLoaded(true)
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        mapInitialized.current = false
      }
    }
  }, [mapboxToken])

  // Note: we deliberately do NOT auto-fly to the user's location when it
  // resolves - the map should always open showing all of Spain. Re-centering
  // on the user only happens on explicit request (see handleRecenter below).

  // Filtered markers
  const filteredMarkers = useMemo(() => {
    return allMarkers.filter((m) => {
      if (m.type === "candidate" && !showCandidates) return false
      if (m.type === "business" && !showBusinesses) return false
      if (m.type === "job" && !showJobs) return false
      if (m.type === "flash" && !showFlash) return false

      if (filterCategory && filterCategory !== "all" && m.category && m.category !== filterCategory) return false
      if (filterJobType.length > 0 && m.jobType && !filterJobType.includes(m.jobType)) return false
      if (filterContractType.length > 0 && m.contractType && !filterContractType.includes(m.contractType)) return false
      if (filterWorkMode.length > 0 && m.workMode && !filterWorkMode.includes(m.workMode)) return false
      if (filterCity && m.city && !m.city.toLowerCase().includes(filterCity.toLowerCase())) return false

      return true
    })
  }, [allMarkers, showCandidates, showBusinesses, showJobs, showFlash, filterCategory, filterJobType, filterContractType, filterWorkMode, filterCity])

  // Render markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const renderMarkers = async () => {
      const mapboxgl = (await import("mapbox-gl")).default

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      for (const marker of filteredMarkers) {
        const el = document.createElement("div")

        // Candidatos = ROJO, Ofertas = TEAL, Ofertas Flash = NARANJA
        const color = marker.type === "candidate" ? "#EF4444" : marker.type === "flash" ? "#F97316" : "#01A89E"
        const icon = marker.type === "candidate"
          ? '<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>'
          : marker.type === "flash"
          ? '<path d="M13 2L3 14h9l-1 10 10-12h-9l1-10z"/>'
          : '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>'

        el.innerHTML = `<div style="width:30px;height:30px;background:${color};border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div>`

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setSelectedMarker(marker)
          mapRef.current?.flyTo({
            center: [marker.lng, marker.lat],
            zoom: Math.max(mapRef.current.getZoom(), 13),
            duration: 800,
          })
        })

        const m = new mapboxgl.Marker({ element: el })
          .setLngLat([marker.lng, marker.lat])
          .addTo(mapRef.current!)

        markersRef.current.push(m)
      }
    }

    renderMarkers()
  }, [filteredMarkers, mapLoaded])

  // Focus on a specific business marker when arriving via ?business=<id>
  // (e.g. from a business profile's "Ubicación" link) - overrides the
  // role defaults so the business marker is guaranteed to be visible.
  useEffect(() => {
    if (!mapLoaded || !focusedBusinessRef.current) return
    const marker = allMarkers.find((m) => m.type === "business" && m.id === focusedBusinessRef.current)
    if (!marker) return
    setShowBusinesses(true)
    setSelectedMarker(marker)
    mapRef.current?.flyTo({ center: [marker.lng, marker.lat], zoom: 14, duration: 1200 })
    focusedBusinessRef.current = null
  }, [allMarkers, mapLoaded])

  const clearRoute = () => {
    const map = mapRef.current
    if (map && routeLoadedRef.current) {
      if (map.getLayer("route-line")) map.removeLayer("route-line")
      if (map.getSource("route-source")) map.removeSource("route-source")
      routeLoadedRef.current = false
    }
    setRouteInfo(null)
  }

  const handleShowRoute = async () => {
    if (!selectedMarker || !mapRef.current) return
    setRouteLoading(true)
    try {
      let origin = userLocation
      if (!origin) {
        const loc = await getDeviceLocation()
        if (loc) {
          origin = [loc.lng, loc.lat]
          setUserLocation(origin)
        }
      }
      if (!origin) return

      const token = mapboxToken || (await getMapboxToken())
      const dest: [number, number] = [selectedMarker.lng, selectedMarker.lat]
      const res = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${dest[0]},${dest[1]}?geometries=geojson&access_token=${token}`
      )
      const data = await res.json()
      const route = data.routes?.[0]
      if (!route) return

      const mapboxgl = (await import("mapbox-gl")).default
      const map = mapRef.current

      clearRoute()
      map.addSource("route-source", { type: "geojson", data: { type: "Feature", properties: {}, geometry: route.geometry } })
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route-source",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#01A89E", "line-width": 5, "line-opacity": 0.85 },
      })
      routeLoadedRef.current = true

      setRouteInfo({ distanceKm: Math.round(route.distance / 100) / 10, durationMin: Math.round(route.duration / 60) })

      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend(origin)
      bounds.extend(dest)
      map.fitBounds(bounds, { padding: 80, duration: 1000 })
    } finally {
      setRouteLoading(false)
    }
  }

  // Helpers
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
        mapRef.current?.fitBounds(SPAIN_BOUNDS, { padding: 16, duration: 1200 })
      }
    }
  }

  // Geocode city using Mapbox and fly to it
  const geocodeCity = async (city: string) => {
    if (!city.trim() || !mapboxToken || !mapRef.current) return
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(city.trim())}.json?access_token=${mapboxToken}&country=es&types=place,locality&limit=1&language=es`
      )
      const data = await res.json()
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center
        mapRef.current.flyTo({ center: [lng, lat], zoom: 12, duration: 1500 })
      }
    } catch {
      // Geocoding failed silently
    }
  }

  const handleJobTypeChange = (value: string, checked: boolean) => {
    setFilterJobType(checked ? [...filterJobType, value] : filterJobType.filter((t) => t !== value))
  }
  const handleContractTypeChange = (value: string, checked: boolean) => {
    setFilterContractType(checked ? [...filterContractType, value] : filterContractType.filter((c) => c !== value))
  }
  const handleWorkModeChange = (value: string, checked: boolean) => {
    setFilterWorkMode(checked ? [...filterWorkMode, value] : filterWorkMode.filter((w) => w !== value))
  }

  const getMarkerLink = (m: MapMarker) => {
    if (m.type === "candidate") return m.hasVideo ? `/reels?worker=${m.id}` : `/profile/${m.id}`
    if (m.type === "flash" || m.isFlash) return `/flash-offers/${m.id}`
    if (m.type === "business") return `/business/${m.id}`
    return `/jobs/${m.id}`
  }

  const activeFiltersCount =
    (filterCategory !== "all" ? 1 : 0) +
    filterJobType.length +
    filterContractType.length +
    filterWorkMode.length +
    (filterCity ? 1 : 0) +
    (filterDistance !== "all" ? 1 : 0) +
    (filterPostalCode ? 1 : 0)

  const candidateCount = filteredMarkers.filter((m) => m.type === "candidate").length
  const jobCount = filteredMarkers.filter((m) => m.type === "job").length
  const flashCount = filteredMarkers.filter((m) => m.type === "flash").length

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Title */}
      <div className="relative bg-white border-b px-4 py-3 text-center flex-shrink-0 safe-area-top">
        <button
          onClick={() => router.back()}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-transform"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Buscador</h1>
      </div>

      {/* Map + controls */}
      <div className="relative flex-1 min-h-0">
        {/* Map container */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Loading state */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              {mapboxToken ? (
                <>
                  <div className="w-8 h-8 border-3 border-[#01A89E] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Cargando mapa...</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 border-3 border-[#01A89E] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Conectando...</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Overlay controls */}
        <div className="absolute top-0 left-0 right-0 z-10 px-3 pt-3 pointer-events-none">
          {/* Role-scoped toggle buttons - a candidate only ever sees Ofertas/Flash
              pills (never Candidatos), a business only ever sees the Candidatos
              pill (never Ofertas/Flash) - that whole category is off-limits to
              them, not just defaulted off. */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {role === "business" && (
              <button
                onClick={() => setShowCandidates(!showCandidates)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold shadow-md ${
                  showCandidates
                    ? "bg-[#00bf29] text-white shadow-green-200"
                    : "bg-white/95 text-gray-500 backdrop-blur-sm"
                }`}
              >
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">Candidatos</span>
                <Badge className={`text-[9px] px-1 py-0 leading-tight ${showCandidates ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {candidateCount}
                </Badge>
              </button>
            )}
            {role === "candidate" && (
              <>
                <button
                  onClick={() => setShowJobs(!showJobs)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold shadow-md ${
                    showJobs
                      ? "bg-[#01A89E] text-white shadow-teal-200"
                      : "bg-white/95 text-gray-500 backdrop-blur-sm"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Ofertas</span>
                  <Badge className={`text-[9px] px-1 py-0 leading-tight ${showJobs ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {jobCount}
                  </Badge>
                </button>
                <button
                  onClick={() => setShowFlash(!showFlash)}
                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-bold shadow-md ${
                    showFlash
                      ? "bg-[#EF4444] text-white shadow-red-200"
                      : "bg-white/95 text-gray-500 backdrop-blur-sm"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Flash</span>
                  <Badge className={`text-[9px] px-1 py-0 leading-tight ${showFlash ? "bg-white/25 text-white" : "bg-gray-100 text-gray-500"}`}>
                    {flashCount}
                  </Badge>
                </button>
              </>
            )}
          </div>

          {/* Filter toggle button */}
          <div className="mt-2.5 pointer-events-auto">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
                filtersOpen || activeFiltersCount > 0
                  ? "bg-[#01A89E] text-white shadow-teal-200"
                  : "bg-white/95 text-gray-600 backdrop-blur-sm"
              }`}
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
              Filtrar
              {activeFiltersCount > 0 && (
                <span className="bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              {filtersOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>
          </div>

          {/* Collapsible filter panel - Mobile-first friendly */}
          {filtersOpen && (
            <div className="mt-2.5 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/80 pointer-events-auto max-h-[60vh] overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-foreground">Filtros</span>
                  <span className="text-sm text-muted-foreground">{filteredMarkers.length} resultados</span>
                </div>

                {/* Categoria */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-12 text-base rounded-xl bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[50vh]">
                      <SelectItem value="all" className="text-base py-3">Todas las categorias</SelectItem>
                      {searchCategories.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name} className="text-base py-3">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo de Jornada - Chip buttons for easy tap */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Tipo de Jornada</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: "completa", label: "Completa" },
                      { id: "media", label: "Media" },
                      { id: "flash", label: "Flash" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleJobTypeChange(item.id, !filterJobType.includes(item.id))}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                          filterJobType.includes(item.id)
                            ? "bg-[#01A89E] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Contrato - Chip buttons */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Tipo de Contrato</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: "indefinido", label: "Indefinido" },
                      { id: "temporal", label: "Temporal" },
                      { id: "practicas", label: "Practicas" },
                      { id: "eventual", label: "Eventual" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleContractTypeChange(item.id, !filterContractType.includes(item.id))}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                          filterContractType.includes(item.id)
                            ? "bg-[#01A89E] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modalidad - Chip buttons */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Modalidad</Label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: "presencial", label: "Presencial" },
                      { id: "remoto", label: "En Remoto" },
                      { id: "teletrabajo", label: "Teletrabajo" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleWorkModeChange(item.id, !filterWorkMode.includes(item.id))}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                          filterWorkMode.includes(item.id)
                            ? "bg-[#01A89E] text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ciudad */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Ciudad</Label>
                  <Input
                    placeholder="Ej: Madrid, Barcelona..."
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="h-12 text-base rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                {/* Distancia Maxima */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Distancia Maxima</Label>
                  <Select value={filterDistance} onValueChange={setFilterDistance}>
                    <SelectTrigger className="h-12 text-base rounded-xl bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-base py-3">Sin limite</SelectItem>
                      <SelectItem value="5" className="text-base py-3">5 km</SelectItem>
                      <SelectItem value="10" className="text-base py-3">10 km</SelectItem>
                      <SelectItem value="25" className="text-base py-3">25 km</SelectItem>
                      <SelectItem value="50" className="text-base py-3">50 km</SelectItem>
                      <SelectItem value="100" className="text-base py-3">100 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Codigo Postal */}
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Codigo Postal</Label>
                  <Input
                    placeholder="Ej: 28001"
                    value={filterPostalCode}
                    onChange={(e) => setFilterPostalCode(e.target.value)}
                    className="h-12 text-base rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                {/* Clear + close actions */}
                <div className="flex gap-2.5 pt-2">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-red-500 border-red-200 hover:bg-red-50 text-sm h-12 rounded-xl"
                      onClick={() => {
                        setFilterCategory("all")
                        setFilterJobType([])
                        setFilterContractType([])
                        setFilterWorkMode([])
                        setFilterCity("")
                        setFilterDistance("all")
                        setFilterPostalCode("")
                      }}
                    >
                      <X className="w-4 h-4 mr-1.5" /> Limpiar filtros
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="flex-1 bg-[#01A89E] hover:bg-[#018F86] text-white text-sm h-12 rounded-xl font-bold"
                    onClick={() => {
                      setFiltersOpen(false)
                      if (filterCity.trim()) {
                        geocodeCity(filterCity)
                      }
                    }}
                  >
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend - matches the on-map marker colors, scoped to what this role can see */}
        <div className="absolute bottom-20 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 text-xs space-y-1">
          {role === "business" && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-gray-600 font-medium">Candidatos</span>
            </div>
          )}
          {role === "candidate" && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#01A89E]" />
                <span className="text-gray-600 font-medium">Ofertas</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-2.5 h-2.5 text-[#F97316]" />
                <span className="text-gray-600 font-medium">Flash</span>
              </div>
            </>
          )}
        </div>

        {/* Result count + recenter button */}
        <div className="absolute top-[110px] right-3 z-10 flex flex-col items-end gap-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md px-3 py-1.5 text-xs font-bold text-gray-600">
            {filteredMarkers.length} resultados
          </div>
          <button
            onClick={handleRecenter}
            className="bg-white shadow-lg rounded-full p-2.5 active:scale-90 transition-transform"
            aria-label="Centrar en mi ubicacion"
          >
            <Navigation className="w-5 h-5 text-[#01A89E]" />
          </button>
        </div>

        {/* Selected marker card */}
        {selectedMarker && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-1.5rem)] max-w-xs">
            <div className="bg-white rounded-xl shadow-2xl p-3.5 relative border border-gray-100">
              <button
                onClick={() => { setSelectedMarker(null); clearRoute() }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 active:scale-90"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>

              <div className="flex items-start gap-3">
                {selectedMarker.avatar ? (
                  <img
                    src={selectedMarker.avatar}
                    alt={selectedMarker.name}
                    className={`w-11 h-11 flex-shrink-0 object-cover ${
                      selectedMarker.type === "flash" || selectedMarker.type === "job" ? "rounded-lg" : "rounded-full"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedMarker.type === "candidate"
                        ? "bg-red-100 text-red-600"
                        : selectedMarker.type === "flash"
                        ? "bg-orange-100 text-orange-600"
                        : "bg-teal-100 text-[#01A89E]"
                    }`}
                  >
                    {selectedMarker.type === "candidate" ? (
                      <Users className="w-5 h-5" />
                    ) : selectedMarker.type === "flash" ? (
                      <Zap className="w-5 h-5" />
                    ) : selectedMarker.type === "business" ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <Briefcase className="w-5 h-5" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{selectedMarker.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {selectedMarker.city && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{selectedMarker.city}
                      </span>
                    )}
                    {selectedMarker.rating && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400" />{selectedMarker.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {selectedMarker.category && (
                    <Badge variant="secondary" className="text-xs mt-1.5 px-2 py-0.5">
                      {selectedMarker.category}
                    </Badge>
                  )}
                </div>
              </div>

              {(selectedMarker.type === "business" || selectedMarker.type === "job") && (
                <>
                  {routeInfo ? (
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#01A89E] bg-[#01A89E]/10 rounded-lg py-2">
                      <Route className="w-3.5 h-3.5" />
                      {routeInfo.distanceKm} km · {routeInfo.durationMin} min en coche
                    </div>
                  ) : (
                    <button
                      onClick={handleShowRoute}
                      disabled={routeLoading}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#01A89E] border border-[#01A89E]/40 hover:bg-[#01A89E]/5 rounded-xl py-2 transition-colors disabled:opacity-60"
                    >
                      <Route className="w-3.5 h-3.5" />
                      {routeLoading ? "Calculando ruta..." : "Ver Distancia"}
                    </button>
                  )}
                </>
              )}

              <Link
                href={getMarkerLink(selectedMarker)}
                className="block mt-2 text-center text-sm font-bold text-white bg-[#01A89E] hover:bg-[#018F86] active:scale-[0.98] rounded-xl py-2.5 transition-all"
              >
                {selectedMarker.type === "candidate" ? "Ver Video Reel" : selectedMarker.type === "flash" ? "Ver Oferta" : "Ver Empresa"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
