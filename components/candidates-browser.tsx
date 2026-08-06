"use client"

import { useState, useMemo, useEffect } from "react"
import { CONTRACT_TYPES, AVAILABILITY_OPTIONS } from "@/lib/profile-constants" 
import { getHighlightedProfileIds, sortHighlightedFirst } from "@/lib/highlighted-profiles"
import { WorkerVideoCard } from "@/components/worker-video-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X, MapPin, Loader2, ArrowLeft, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CityAutocomplete } from "@/components/city-autocomplete"

type Candidate = {
  id: string
  display_name: string
  avatar_url: string | null
  location: string | null
  category_name: string | null
  subcategory_name: string | null
  specialties: string[]
  experience_years: number | null
  contract_type_sought: string[] | null
  availability_status: string | null
  certificates: unknown[] | null
  rating: number | null
}

type Category = {
  id: string
  name: string
  slug: string
}

type Subcategory = {
  id: string
  name: string
  slug: string
  category_id: string
}

const PAGE_SIZE = 8 // 4 rows x 2 columns

export function CandidatesBrowser() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterSubcategory, setFilterSubcategory] = useState("all")
  const [filterCity, setFilterCity] = useState("")
  // Multiselección: un candidato encaja si busca ALGUNO de los contratos marcados.
  const [filterContracts, setFilterContracts] = useState<string[]>([])
  const [filterAvailability, setFilterAvailability] = useState("all")
  const [filterMinExperience, setFilterMinExperience] = useState("all")
  const [filterHasTraining, setFilterHasTraining] = useState(false)
  const [filterMinStars, setFilterMinStars] = useState("all")
  const [page, setPage] = useState(1)

  // Seed filters from the search wizard (/search) via URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const category = params.get("category")
    const city = params.get("city")
    if (category) setFilterCategory(category)
    if (city) setFilterCity(city)
  }, [])

  // Real data from database
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [loadError, setLoadError] = useState(false)

  // Load real candidates from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // Load candidates (workers with public profiles)
        const { data: candidatesData, error: candidatesError } = await supabase
          .from("profiles")
          .select(`
            id, display_name, avatar_url, location, specialties,
            experience_years, contract_type_sought, availability_status,
            certificates, rating,
            category:categories(name),
            subcategory:subcategories(name)
          `)
          .eq("user_type", "worker")
          .eq("is_active", true)
          .eq("profile_completed", true)
          .order("created_at", { ascending: false })
          .limit(100)

        if (candidatesError) throw candidatesError

        // Load categories for filter - candidate/position taxonomy only
        // (role_type='candidate'), not the business venue-type taxonomy
        // that shares this same table.
        const { data: catsData } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("role_type", "candidate")
          .order("sort_order")

        const { data: subsData } = await supabase
          .from("subcategories")
          .select("id, name, slug, category_id")
          .order("sort_order")

        const formattedCandidates = (candidatesData || []).map((c: any) => ({
          id: c.id,
          display_name: c.display_name,
          avatar_url: c.avatar_url,
          location: c.location,
          category_name: c.category?.name || null,
          subcategory_name: c.subcategory?.name || null,
          specialties: Array.isArray(c.specialties) ? c.specialties : [],
          experience_years: c.experience_years,
          contract_type_sought: Array.isArray(c.contract_type_sought) ? c.contract_type_sought : [],
          availability_status: c.availability_status ?? null,
          certificates: Array.isArray(c.certificates) ? c.certificates : [],
          rating: c.rating ?? null,
        }))

        // Destacados primero: es lo que el candidato paga con "Destacar mi
        // perfil" y hasta ahora no tenía ningún efecto en los listados.
        const highlighted = await getHighlightedProfileIds(supabase)
        setCandidates(sortHighlightedFirst(formattedCandidates, highlighted))
        setCategories(catsData || [])
        setSubcategories(subsData || [])
      } catch (e) {
        console.error("Error loading candidates:", e)
        setLoadError(true)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !(c.display_name || "").toLowerCase().includes(q) &&
          !(c.category_name || "").toLowerCase().includes(q) &&
          !(c.subcategory_name || "").toLowerCase().includes(q) &&
          !(c.location || "").toLowerCase().includes(q)
        )
          return false
      }
      if (filterCategory !== "all") {
        const selectedCat = categories.find(cat => cat.slug === filterCategory)
        if (filterSubcategory !== "all") {
          const selectedSub = subcategories.find(s => s.id === filterSubcategory)
          const specialtyLabel = `${selectedCat?.name} - ${selectedSub?.name}`
          if (!c.specialties.includes(specialtyLabel)) return false
        } else {
          const matchesSpecialty = c.specialties.some(
            (s) => s === selectedCat?.name || s.startsWith(`${selectedCat?.name} - `)
          )
          if (selectedCat && c.category_name !== selectedCat.name && !matchesSpecialty) return false
        }
      }
      if (filterCity && !(c.location || "").toLowerCase().includes(filterCity.toLowerCase())) return false

      // Tipo de contrato: basta con que busque alguno de los marcados.
      if (filterContracts.length > 0) {
        const sought = c.contract_type_sought || []
        if (!filterContracts.some((t) => sought.includes(t))) return false
      }
      if (filterAvailability !== "all" && c.availability_status !== filterAvailability) return false
      if (filterMinExperience !== "all" && (c.experience_years ?? 0) < Number(filterMinExperience)) return false
      // "Formación" son los títulos acreditados que guarda `certificates`.
      if (filterHasTraining && !(Array.isArray(c.certificates) && c.certificates.length > 0)) return false
      if (filterMinStars !== "all" && (c.rating ?? 0) < Number(filterMinStars)) return false
      return true
    })
  }, [candidates, categories, subcategories, searchQuery, filterCategory, filterSubcategory, filterCity,
      filterContracts, filterAvailability, filterMinExperience, filterHasTraining, filterMinStars])

  const displayed = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = displayed.length < filtered.length

  const activeCount =
    (filterCategory !== "all" ? 1 : 0) +
    (filterSubcategory !== "all" ? 1 : 0) +
    (filterCity ? 1 : 0) +
    (filterContracts.length > 0 ? 1 : 0) +
    (filterAvailability !== "all" ? 1 : 0) +
    (filterMinExperience !== "all" ? 1 : 0) +
    (filterHasTraining ? 1 : 0) +
    (filterMinStars !== "all" ? 1 : 0)

  const clearFilters = () => {
    setFilterCategory("all")
    setFilterSubcategory("all")
    setFilterCity("")
    setFilterContracts([])
    setFilterAvailability("all")
    setFilterMinExperience("all")
    setFilterHasTraining(false)
    setFilterMinStars("all")
    setSearchQuery("")
    setPage(1)
  }

  const selectedCategoryObj = categories.find((c) => c.slug === filterCategory)
  const subcategoriesForSelected = selectedCategoryObj
    ? subcategories.filter((s) => s.category_id === selectedCategoryObj.id)
    : []
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-gray-700 font-medium">No se pudieron cargar los candidatos</p>
        <p className="text-gray-500 text-sm">Comprueba tu conexión e inténtalo de nuevo</p>
        <Button onClick={() => window.location.reload()} className="bg-[#01A89E] hover:bg-[#018F86] mt-2">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      {/* Header sticky */}
      <div className="sticky top-0 z-40">
        <div className="relative px-4 pt-3 pb-2">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-3 p-1.5 rounded-full hover:bg-gray-100 active:scale-90 transition-transform"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-center text-gray-900">Candidatos</h1>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, categoría, ciudad..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="pl-10 pr-10 h-12 text-sm rounded-2xl bg-white border-gray-200 shadow-sm focus:ring-2 focus:ring-[#01A89E]/30"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setPage(1) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 active:bg-gray-300"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full mt-3 flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-200 shadow-sm text-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-gray-700">Filtrar</span>
              {activeCount > 0 && (
                <Badge className="bg-[#01A89E] text-white text-[12px] px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">{activeCount}</Badge>
              )}
            </div>
            {showFilters ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {/* Filter panel - Full mobile-first */}
          {showFilters && (
            <div
              className="mt-2 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
            >
              <div
                className="max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-5 space-y-5"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {/* Tipo de empleo (la taxonomía profesional de candidatos) */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Tipo de Empleo
                  </Label>
                  <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setFilterSubcategory("all"); setPage(1) }}>
                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 border-gray-200 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[40vh]">
                      <SelectItem value="all" className="py-2.5 text-sm">Todos los Empleos</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug} className="py-2.5 text-sm">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategoría - only shown when the chosen category has any */}
                {subcategoriesForSelected.length > 0 && (
                  <div>
                    <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                      Especialidad
                    </Label>
                    <Select value={filterSubcategory} onValueChange={(v) => { setFilterSubcategory(v); setPage(1) }}>
                      <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 border-gray-200 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="py-2.5 text-sm">Todas</SelectItem>
                        {subcategoriesForSelected.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="py-2.5 text-sm">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Ciudad */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Ciudad
                  </Label>
                  <CityAutocomplete
                    value={filterCity}
                    onChange={(city) => { setFilterCity(city); setPage(1) }}
                    placeholder="Todas las ciudades"
                    className="h-12 rounded-2xl bg-gray-50 border-gray-200"
                  />
                </div>

                {/* Tipo de contrato: se pueden marcar varios a la vez */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Tipo de Contrato
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {CONTRACT_TYPES.map((t) => {
                      const on = filterContracts.includes(t.value)
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            setFilterContracts((prev) =>
                              prev.includes(t.value) ? prev.filter((v) => v !== t.value) : [...prev, t.value]
                            )
                            setPage(1)
                          }}
                          className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                            on
                              ? "border-[#01A89E] bg-[#01A89E] text-white"
                              : "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Disponibilidad */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Disponibilidad
                  </Label>
                  <Select value={filterAvailability} onValueChange={(v) => { setFilterAvailability(v); setPage(1) }}>
                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 border-gray-200 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="py-2.5 text-sm">Cualquier disponibilidad</SelectItem>
                      {AVAILABILITY_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value} className="py-2.5 text-sm">{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Experiencia mínima */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Experiencia
                  </Label>
                  <Select value={filterMinExperience} onValueChange={(v) => { setFilterMinExperience(v); setPage(1) }}>
                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 border-gray-200 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="py-2.5 text-sm">Cualquier experiencia</SelectItem>
                      <SelectItem value="1" className="py-2.5 text-sm">1 año o más</SelectItem>
                      <SelectItem value="2" className="py-2.5 text-sm">2 años o más</SelectItem>
                      <SelectItem value="5" className="py-2.5 text-sm">5 años o más</SelectItem>
                      <SelectItem value="10" className="py-2.5 text-sm">10 años o más</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Formación: los títulos acreditados que guarda `certificates` */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Formación
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setFilterHasTraining((v) => !v); setPage(1) }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      filterHasTraining
                        ? "border-[#01A89E] bg-[#01A89E]/5 text-[#01A89E]"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    Solo con formación acreditada
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                        filterHasTraining ? "border-[#01A89E] bg-[#01A89E] text-white" : "border-gray-300 bg-white"
                      }`}
                    >
                      {filterHasTraining && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </div>

                {/* Valoración media, filtrada por estrellas mínimas */}
                <div>
                  <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                    Valoración media
                  </Label>
                  <Select value={filterMinStars} onValueChange={(v) => { setFilterMinStars(v); setPage(1) }}>
                    <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 border-gray-200 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="py-2.5 text-sm">Cualquier valoración</SelectItem>
                      <SelectItem value="4.5" className="py-2.5 text-sm">4,5 estrellas o más</SelectItem>
                      <SelectItem value="4" className="py-2.5 text-sm">4 estrellas o más</SelectItem>
                      <SelectItem value="3" className="py-2.5 text-sm">3 estrellas o más</SelectItem>
                      <SelectItem value="2" className="py-2.5 text-sm">2 estrellas o más</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bottom actions bar - fixed at bottom of panel */}
              <div className="border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm px-4 py-3 flex gap-3">
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
        <p className="text-[13px] text-[#01A89E] font-semibold">{filtered.length} candidatos encontrados</p>
      </div>

      {/* Grid 2 columns */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {displayed.map((candidate) => (
            <WorkerVideoCard 
              key={candidate.id}
              id={candidate.id}
              name={candidate.display_name || "Candidato"}
              category={candidate.subcategory_name || candidate.category_name || "General"}
              location={candidate.location?.split(",")[0].trim() || "Espana"}
              rating={4.5}
              avatarUrl={candidate.avatar_url || "/placeholder.svg"}
              experience={candidate.experience_years ? `${candidate.experience_years} años de experiencia` : ""}
            />
          ))}
        </div>

        {displayed.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-700 font-medium">
              {candidates.length === 0 
                ? "No hay candidatos registrados todavia" 
                : "No se encontraron candidatos con estos filtros"}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {candidates.length === 0 
                ? "Los candidatos apareceran aqui cuando completen su perfil" 
                : "Intenta con otros criterios de busqueda"}
            </p>
            {activeCount > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="mt-3 rounded-xl">
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

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
      </div>
    </div>
  )
}
