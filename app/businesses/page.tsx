"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import {
  MapPin,
  Star,
  SlidersHorizontal,
  Loader2,
  CheckCircle,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Map,
  Briefcase,
  Building2,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { createClient } from "@/lib/supabase/client"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { BUSINESS_VENUE_TYPES } from "@/lib/business-venue-types"

// Normalize business data from Supabase
function normalizeBusiness(b: any) {
  return {
    id: b.id,
    company_name: b.company_name || "Empresa",
    business_type: b.business_type || "General",
    city: b.city || b.address || "Espana",
    company_description: b.company_description || b.service_description,
    company_logo_url: b.company_logo_url,
    verified: b.verified || false,
    rating: b.rating || 0,
    activeJobs: 0,
  }
}

const BUSINESS_TYPES = [
  { value: "all", label: "Todos los tipos" },
  ...BUSINESS_VENUE_TYPES.map((name) => ({ value: name, label: name })),
]

const VERIFICATION_OPTIONS = [
  { id: "verified", label: "Verificadas" },
  { id: "all_status", label: "Todas" },
]

const PAGE_SIZE = 8 // 4 rows x 2 columns

export default function BusinessesPage() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState("all")
  const [filterCity, setFilterCity] = useState("")
  const [filterVerification, setFilterVerification] = useState("all_status")
  const [page, setPage] = useState(1)
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set())

  // El carrusel de tipos de establecimiento enlaza aquí con `?type=`. Sin esto
  // el filtro se quedaba en "all" y el usuario aterrizaba en el listado
  // completo, sin ninguna señal de que su elección se hubiera perdido.
  //
  // Se lee de `window.location` y no con `useSearchParams` a propósito: ese
  // hook obliga a envolver la página en un Suspense para poder prerenderizarla,
  // y aquí sólo hace falta el valor inicial de un filtro.
  useEffect(() => {
    const tipo = new URLSearchParams(window.location.search).get("type")
    if (tipo) setFilterType(tipo)
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("business_profiles")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        const businesses = (data || [])
          .filter((b: any) => b.company_name)
          .map((b: any) => normalizeBusiness(b))

        setAllBusinesses(businesses)
      } catch (e) {
        console.error("Error loading businesses:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchBusinesses()
  }, [])

  const filtered = useMemo(() => {
    return allBusinesses.filter((b) => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !b.company_name.toLowerCase().includes(q) &&
          !b.business_type.toLowerCase().includes(q) &&
          !b.city.toLowerCase().includes(q) &&
          !(b.company_description || "").toLowerCase().includes(q)
        )
          return false
      }
      // Type filter
      if (filterType !== "all" && b.business_type !== filterType) return false
      // City filter
      if (filterCity && !b.city.toLowerCase().includes(filterCity.toLowerCase())) return false
      // Verification filter
      if (filterVerification === "verified" && !b.verified) return false
      return true
    })
  }, [allBusinesses, searchQuery, filterType, filterCity, filterVerification])

  const displayed = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = displayed.length < filtered.length

  const activeCount =
    (filterType !== "all" ? 1 : 0) +
    (filterCity ? 1 : 0) +
    (filterVerification !== "all_status" ? 1 : 0)

  const clearFilters = () => {
    setFilterType("all")
    setFilterCity("")
    setFilterVerification("all_status")
    setSearchQuery("")
    setPage(1)
  }

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      {/* Header sticky */}
      <div className="sticky top-0 z-40 bg-background">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-lg font-bold text-center text-gray-900 dark:text-gray-100">Empresas</h1>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, sector, ciudad..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-10 h-12 text-sm rounded-2xl bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-[#01A89E]/30"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setPage(1)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 active:bg-gray-300"
              >
                <X className="w-3 h-3 text-gray-600 dark:text-gray-300" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full mt-3 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">Filtrar</span>
              {activeCount > 0 && (
                <Badge className="bg-[#01A89E] text-white text-[12px] px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                  {activeCount}
                </Badge>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Filter panel - Full mobile-first */}
          {showFilters && (
            <div className="mt-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
              <div
                className="max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-5 space-y-5"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Tipo de local */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Tipo de local
                  </Label>
                  <Select
                    value={filterType}
                    onValueChange={(v) => {
                      setFilterType(v)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[40vh]">
                      {BUSINESS_TYPES.map((bt) => (
                        <SelectItem key={bt.value} value={bt.value} className="py-2.5 text-sm">
                          {bt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ciudad */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Ciudad
                  </Label>
                  <CityAutocomplete
                    value={filterCity}
                    onChange={(city) => {
                      setFilterCity(city)
                      setPage(1)
                    }}
                    placeholder="Todas las ciudades"
                    className="h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                </div>

                {/* Verificacion - Big touch chips */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Estado de verificacion
                  </Label>
                  <div className="flex flex-wrap gap-2.5">
                    {VERIFICATION_OPTIONS.map((opt) => {
                      const active = filterVerification === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setFilterVerification(opt.id)
                            setPage(1)
                          }}
                          className={`px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 select-none ${
                            active
                              ? "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/25"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Ver en Mapa */}
                <div>
                  <Link
                    href="/businesses/map"
                    className="flex items-center justify-center gap-2.5 w-full h-12 rounded-2xl bg-[#F48221] hover:bg-[#D9721D] text-white text-sm font-bold transition-all active:scale-[0.98] shadow-md shadow-[#F48221]/20"
                  >
                    <Map className="w-4.5 h-4.5" />
                    Ver en Mapa
                  </Link>
                </div>
              </div>

              {/* Bottom actions bar */}
              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 flex gap-3">
                {activeCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50 h-11 rounded-2xl text-sm font-semibold"
                    onClick={clearFilters}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" /> Limpiar
                  </Button>
                )}
                <Button
                  size="sm"
                  className="flex-1 bg-[#01A89E] hover:bg-[#1d7ab0] text-white h-11 rounded-2xl text-sm font-semibold shadow-md shadow-[#01A89E]/20"
                  onClick={() => setShowFilters(false)}
                >
                  Aplicar filtros
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[13px] text-[#01A89E] font-semibold">
          {loading ? "Cargando..." : `${filtered.length} empresas encontradas`}
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron empresas con estos filtros</p>
            <Button onClick={clearFilters} variant="outline" size="sm" className="mt-3 rounded-xl">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {displayed.map((business: any) => (
                <Link key={business.id} href={`/business/${business.id}`}>
                  <Card className="hover:shadow-lg transition-all active:scale-[0.97] border shadow-sm h-full overflow-hidden">
                    {/* Image */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-gradient-to-br from-teal-100 to-teal-50">
                      {imgErrors.has(business.id) || !business.company_logo_url ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                          <div className="w-12 h-12 rounded-2xl bg-[#01A89E]/15 flex items-center justify-center">
                            <span className="text-xl font-bold text-[#01A89E]">
                              {(business.company_name || "E")[0]}
                            </span>
                          </div>
                          <span className="text-[12px] text-muted-foreground font-medium px-2 text-center line-clamp-1">
                            {business.business_type}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={business.company_logo_url}
                          alt={business.company_name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={() => setImgErrors((prev) => new Set(prev).add(business.id))}
                        />
                      )}
                      {business.verified && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-[#01A89E] text-white text-[12px] gap-0.5 px-1.5 py-0.5 shadow-sm">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Verificada
                          </Badge>
                        </div>
                      )}
                      {business.activeJobs > 0 && (
                        <div className="absolute bottom-2 right-2">
                          <Badge className="bg-[#E73A36] text-white text-[12px] px-1.5 py-0.5 shadow-sm">
                            {business.activeJobs} ofertas
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <CardContent className="p-2.5">
                      <h3 className="font-bold text-[13px] line-clamp-1 mb-0.5">{business.company_name}</h3>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mb-1.5">
                        {business.business_type}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <MapPin className="w-3 h-3 text-[#01A89E] flex-shrink-0" />
                          <span className="truncate max-w-[70px]">{business.city}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[12px] font-bold">{business.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => setPage((p) => p + 1)}
                  size="lg"
                  className="bg-[#01A89E] hover:bg-[#1d7ab0] text-white min-w-[200px] h-12 rounded-2xl font-semibold shadow-md shadow-[#01A89E]/20"
                >
                  Ver mas
                </Button>
                <p className="text-[13px] text-gray-400 mt-2">
                  Mostrando {displayed.length} de {filtered.length}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
