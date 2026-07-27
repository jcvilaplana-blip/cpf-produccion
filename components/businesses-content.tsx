"use client"

import { useState, useEffect, useRef } from "react" 
import { Building2, MapPin, Star, Users, SlidersHorizontal, Map, ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getMapboxToken } from "@/lib/mapbox"

const categories = ["Todos", "Restaurantes", "Hoteles", "Cafeterias", "Bares", "Catering", "Fast Food", "Tecnologia", "Sanidad", "Construccion", "Educacion"]

interface BusinessesContentProps {
  businesses: any[]
  currentUser: any
}

export function BusinessesContent({ businesses: initialBusinesses, currentUser }: BusinessesContentProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapboxToken, setMapboxToken] = useState<string>("")
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const mapInitialized = useRef(false)

  const businesses = initialBusinesses
  
  // ALWAYS load Mapbox token from API
  useEffect(() => {
    getMapboxToken().then(token => {
      if (token) setMapboxToken(token)
    })
  }, [])

  const filteredBusinesses = businesses.filter((business: any) => {
    const matchesCategory = selectedCategory === "Todos" || business.category === selectedCategory
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (business.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Initialize map when showMap is true
  useEffect(() => {
    if (!showMap || !mapContainer.current || !mapboxToken || mapInitialized.current) return
    mapInitialized.current = true

    const initMap = async () => {
      const mapboxgl = (await import("mapbox-gl")).default

      ;(mapboxgl as any).accessToken = mapboxToken

      const map = new mapboxgl.Map({
        container: mapContainer.current!,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-3.7038, 40.4168],
        zoom: 5.8,
        attributionControl: false,
      })

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right")

      map.on("load", () => {
        mapRef.current = map
        setMapLoaded(true)

        // Add business markers (blue)
        for (const biz of filteredBusinesses) {
          if (!biz.lat || !biz.lng) continue
          const el = document.createElement("div")
          el.innerHTML = `<div style="width:32px;height:32px;background:#01A89E;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>`

          const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
            .setHTML(`
              <div style="padding:8px;min-width:160px;">
                <p style="font-weight:700;font-size:13px;margin:0 0 4px;">${biz.name}</p>
                <p style="color:#666;font-size:11px;margin:0 0 4px;">${biz.location || ""}</p>
                <p style="color:#01A89E;font-size:11px;margin:0;">${biz.total_jobs || 0} ofertas activas</p>
              </div>
            `)

          new mapboxgl.Marker({ element: el })
            .setLngLat([biz.lng, biz.lat])
            .setPopup(popup)
            .addTo(map)
        }
      })
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        mapInitialized.current = false
        setMapLoaded(false)
      }
    }
  }, [showMap, mapboxToken])

  // Map fullscreen view
  if (showMap) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b px-4 py-3 flex items-center gap-3 safe-area-top">
          <button onClick={() => { setShowMap(false); mapInitialized.current = false }} className="p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Empresas en el Mapa</h1>
          <Badge className="bg-[#01A89E] text-white text-[10px]">{filteredBusinesses.length} empresas</Badge>
        </div>
        <div ref={mapContainer} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#01A89E] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Cargando mapa...</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-6 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-[11px] flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#01A89E]" />
          <span className="text-gray-600 font-medium">Empresas que ofrecen empleo</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Empresas</h1>

          {/* Search */}
          <Input
            type="search"
            placeholder="Buscar empresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 ${showFilters ? "bg-[#01A89E] hover:bg-[#018F86]" : ""}`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              Mostrar Filtros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(true)}
              className="flex-1 border-[#01A89E] text-[#01A89E] hover:bg-[#01A89E] hover:text-white"
            >
              <Map className="w-4 h-4 mr-1.5" />
              Ver en Mapa
            </Button>
          </div>

          {/* Category Filter - shown when filters open */}
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 text-xs ${selectedCategory === category ? "bg-[#01A89E] hover:bg-[#018F86]" : ""}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Businesses Grid - 2 columns */}
      <div className="container mx-auto px-3 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredBusinesses.map((business: any) => (
            <Link
              key={business.id}
              href={`/business/${business.id}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Business Image */}
              <div className="relative h-28 sm:h-36 bg-gray-200">
                <img
                  src={business.image || business.logo || "/placeholder.svg"}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                {business.total_jobs > 0 && (
                  <Badge className="absolute top-1.5 right-1.5 bg-[#01A89E] text-white text-[9px] px-1.5 py-0">
                    {business.total_jobs} ofertas
                  </Badge>
                )}
              </div>

              {/* Business Info */}
              <div className="p-2.5">
                <h3 className="font-semibold text-sm text-gray-900 truncate">{business.name}</h3>

                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{business.location}</span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{business.rating}</span>
                  </div>
                  <span className="text-gray-400">({business.total_ratings})</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No se encontraron empresas</p>
          </div>
        )}
      </div>
    </div>
  )
}
