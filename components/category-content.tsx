"use client"

import { useState, useEffect } from "react"
import { getHighlightedProfileIds, sortHighlightedFirst } from "@/lib/highlighted-profiles"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { WorkerVideoCard } from "@/components/worker-video-card"
import { MapPin, SlidersHorizontal, ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { CityAutocomplete } from "@/components/city-autocomplete"
import { formatLocation } from "@/lib/format-location"

/**
 * Jornadas que puede buscar un candidato.
 *
 * Los valores tienen que coincidir con lo que guarda
 * `profiles.contract_type_sought`; las etiquetas salen del mapa común de
 * lib/profile-constants.ts.
 */
const JORNADAS = [
  { value: "all", label: "Todas las jornadas" },
  { value: "full_time", label: "Jornada Completa" },
  { value: "part_time", label: "Media Jornada" },
  { value: "weekend", label: "Fin de Semana" },
  { value: "temporary", label: "Contrato Temporal" },
  { value: "one_time_event", label: "Por Dias" },
]

const NIVELES_EXPERIENCIA = [
  { value: "all", label: "Toda la experiencia" },
  { value: "none", label: "Sin Experiencia" },
  { value: "low", label: "Poca Experiencia (1-3 anos)" },
  { value: "medium", label: "Experiencia Media (4-6 anos)" },
  { value: "high", label: "Mucha Experiencia (7+ anos)" },
]

const OPCIONES_FLASH = [
  { value: false, label: "Todas" },
  { value: true, label: "Solo Ofertas Flash" },
]

interface CategoryContentProps {
  categoryName: string
  user: any | null
}

interface CategoryOption {
  id: string
  name: string
  slug: string
  subcategories: { id: string; name: string; slug: string }[]
}

const SPECIAL_CATEGORY_NAMES = ["Todas", "Guardados"]

export function CategoryContent({ categoryName, user }: CategoryContentProps) {
  const router = useRouter()
  const [experienceFilter, setExperienceFilter] = useState("all")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subcategoryFilter, setSubcategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("")
  const [postalCodeFilter, setPostalCodeFilter] = useState("")
  const [flashOffersOnly, setFlashOffersOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvedCategory, setResolvedCategory] = useState<{ id: string; name: string } | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([])

  // categoryName arrives as a URL slug (e.g. "camarero") for real categories,
  // or one of the special values above. Resolve the slug to its real id/name
  // so we can match candidates by category_id instead of fragile string equality.
  // Also populates the "Categoría" filter dropdown below with the real
  // candidate taxonomy (role_type='candidate') instead of a stale hardcoded list.
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        const cats = (json.data || []).filter((c: any) => c.role_type === "candidate")
        setCategoryOptions(cats)
        if (!SPECIAL_CATEGORY_NAMES.includes(categoryName)) {
          const match = cats.find((c: any) => c.slug === categoryName)
          if (match) setResolvedCategory({ id: match.id, name: match.name })
        }
      })
      .catch(() => {})
  }, [categoryName])

  // Load workers from database
  useEffect(() => {
    const loadWorkers = async () => {
      setLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          // Columnas explícitas: `select("*")` incluye las personales, que el
          // rol anónimo ya no puede leer y harían fallar la consulta entera.
          .select("id, display_name, avatar_url, location, job_category, job_subcategory, category_id, subcategory_id, custom_subcategory, specialties, experience_years, rating, total_ratings, points, level, video_reel_url, mux_playback_id, is_premium, availability_status")
          .eq("user_type", "worker")
          .eq("is_active", true)
          .order("rating", { ascending: false })

        if (error) throw error

        const mapped = (data || []).map((profile: any) => ({
          id: profile.id,
          name: profile.display_name,
          category: profile.job_category || "General",
          categoryId: profile.category_id || null,
          specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
          location: formatLocation(profile.location),
          rating: profile.rating || 0,
          avatarUrl: profile.avatar_url || "/placeholder.svg",
          experience: `${profile.experience_years || 0} años de experiencia`,
          // Sin esto, un candidato con 0 anos caia en "low" y no habia forma de
          // buscar a quien empieza.
          experienceLevel:
            profile.experience_years >= 7
              ? "high"
              : profile.experience_years >= 4
                ? "medium"
                : profile.experience_years >= 1
                  ? "low"
                  : "none",
          // Jornada que busca el candidato. Antes aquí se metía
          // `availability_status` (inmediata / 2 semanas / 1 mes), que no
          // comparte un solo valor con las opciones del filtro: "Tipo de
          // trabajo" no ha filtrado nunca nada.
          jornadas: Array.isArray(profile.contract_type_sought)
            ? profile.contract_type_sought
            : profile.contract_type_sought
              ? [profile.contract_type_sought]
              : [],
          isFlashOffer: false,
        }))
        // Ver lib/highlighted-profiles.ts: los perfiles destacados de pago
        // van delante, manteniendo el orden por valoración entre ellos.
        const highlighted = await getHighlightedProfileIds(supabase)
        setWorkers(sortHighlightedFirst(mapped, highlighted))
      } catch (e) {
        console.error("Error loading workers:", e)
      } finally {
        setLoading(false)
      }
    }
    loadWorkers()
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [])

  const filtrosActivos =
    (experienceFilter !== "all" ? 1 : 0) +
    (jobTypeFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (subcategoryFilter !== "all" ? 1 : 0) +
    (locationFilter ? 1 : 0) +
    (postalCodeFilter ? 1 : 0) +
    (flashOffersOnly ? 1 : 0)

  const limpiarFiltros = () => {
    setExperienceFilter("all")
    setJobTypeFilter("all")
    setCategoryFilter("all")
    setSubcategoryFilter("all")
    setLocationFilter("")
    setPostalCodeFilter("")
    setFlashOffersOnly(false)
  }

  const filteredWorkers = workers.filter((worker) => {
    const matchesSpecialty = (name: string) =>
      worker.specialties.some((s: string) => s === name || s.startsWith(`${name} - `))
    const matchesCategory =
      categoryName === "Todas" ||
      categoryName === "Guardados" ||
      (resolvedCategory
        ? worker.categoryId === resolvedCategory.id || worker.category === resolvedCategory.name || matchesSpecialty(resolvedCategory.name)
        : worker.category === categoryName || matchesSpecialty(categoryName))
    const matchesExperience = experienceFilter === "all" || worker.experienceLevel === experienceFilter
    const matchesJobType = jobTypeFilter === "all" || worker.jornadas.includes(jobTypeFilter)
    const selectedFilterCat = categoryOptions.find((c) => c.slug === categoryFilter)
    const matchesCategoryFilter = (() => {
      if (categoryFilter === "all" || !selectedFilterCat) return true
      if (subcategoryFilter !== "all") {
        const selectedSub = selectedFilterCat.subcategories.find((s) => s.id === subcategoryFilter)
        return worker.specialties.includes(`${selectedFilterCat.name} - ${selectedSub?.name}`)
      }
      return worker.category === selectedFilterCat.name || matchesSpecialty(selectedFilterCat.name)
    })()
    const matchesLocation = !locationFilter || worker.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesPostalCode = !postalCodeFilter || worker.location.includes(postalCodeFilter)
    const matchesFlash = !flashOffersOnly || worker.isFlashOffer

    return (
      matchesCategory &&
      matchesExperience &&
      matchesJobType &&
      matchesCategoryFilter &&
      matchesLocation &&
      matchesPostalCode &&
      matchesFlash
    )
  })

  const visibleWorkers = filteredWorkers.slice(0, visibleCount)
  const hasMore = visibleCount < filteredWorkers.length

  const loadMore = () => {
    setVisibleCount((prev) => prev + 8)
  }

  const getPageTitle = () => {
    if (categoryName === "Guardados") return "Candidatos Guardados"
    if (categoryName === "Todas") return "Todos los Candidatos"
    return resolvedCategory?.name || categoryName
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold whitespace-nowrap truncate">{getPageTitle()}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-12">{filteredWorkers.length} candidatos encontrados</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros. Mismo lenguaje que el desplegable de la página Empresas,
            que es el pensado para móvil: panel con scroll propio, etiquetas en
            versalitas, campos altos y las opciones binarias como chips grandes
            en lugar de casillas diminutas. */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full mb-4 flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700 dark:text-gray-200">Filtrar</span>
            {filtrosActivos > 0 && (
              <Badge className="bg-[#01A89E] text-white text-[12px] px-1.5 py-0 min-w-[20px] h-5 flex items-center justify-center rounded-full">
                {filtrosActivos}
              </Badge>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showFilters && (
          <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div
              className="max-h-[60vh] overflow-y-auto overscroll-contain px-4 py-5 space-y-5"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* Ofertas flash, lo primero: es un sí o no que cambia la lista
                  entera, y al final del formulario no lo veía nadie. */}
              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Ofertas flash
                </Label>
                <div className="flex flex-wrap gap-2.5">
                  {OPCIONES_FLASH.map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setFlashOffersOnly(opt.value)}
                      className={`px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-95 select-none ${
                        flashOffersOnly === opt.value
                          ? "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/25"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Experiencia
                </Label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh]">
                    {NIVELES_EXPERIENCIA.map((n) => (
                      <SelectItem key={n.value} value={n.value} className="py-2.5 text-sm">
                        {n.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Jornada Laboral
                </Label>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh]">
                    {JORNADAS.map((j) => (
                      <SelectItem key={j.value} value={j.value} className="py-2.5 text-sm">
                        {j.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Categoría
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => {
                    setCategoryFilter(v)
                    setSubcategoryFilter("all")
                  }}
                >
                  <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[40vh]">
                    <SelectItem value="all" className="py-2.5 text-sm">
                      Todas las categorías
                    </SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.slug} className="py-2.5 text-sm">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const catSeleccionada = categoryOptions.find((c) => c.slug === categoryFilter)
                if (!catSeleccionada || catSeleccionada.subcategories.length === 0) return null
                return (
                  <div>
                    <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                      Especialidad
                    </Label>
                    <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                      <SelectTrigger className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[40vh]">
                        <SelectItem value="all" className="py-2.5 text-sm">
                          Todas
                        </SelectItem>
                        {catSeleccionada.subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id} className="py-2.5 text-sm">
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })()}

              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Ciudad
                </Label>
                <CityAutocomplete
                  placeholder="Todas las ciudades"
                  value={locationFilter}
                  onChange={setLocationFilter}
                  className="h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div>
                <Label className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                  Código Postal
                </Label>
                <Input
                  placeholder="28001"
                  value={postalCodeFilter}
                  onChange={(e) => setPostalCodeFilter(e.target.value)}
                  className="h-12 text-sm rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 px-4"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 px-4 py-3">
              <Button
                onClick={limpiarFiltros}
                variant="outline"
                className="w-full h-11 rounded-2xl text-sm font-semibold"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleWorkers.map((worker) => (
            <WorkerVideoCard key={worker.id} {...worker} />
          ))}
        </div>

        {visibleWorkers.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron candidatos</h3>
            <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-8">
            <Button onClick={loadMore} size="lg" variant="outline" className="min-w-[200px] bg-transparent">
              CARGAR MÁS
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {visibleWorkers.length} de {filteredWorkers.length} candidatos
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
