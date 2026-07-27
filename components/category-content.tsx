"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorkerVideoCard } from "@/components/worker-video-card"
import { MapPin, SlidersHorizontal, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface CategoryContentProps {
  categoryName: string
  user: any | null
}

const SPECIAL_CATEGORY_NAMES = ["Todas", "Guardados"]

export function CategoryContent({ categoryName, user }: CategoryContentProps) {
  const router = useRouter()
  const [experienceFilter, setExperienceFilter] = useState("all")
  const [jobTypeFilter, setJobTypeFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("")
  const [postalCodeFilter, setPostalCodeFilter] = useState("")
  const [flashOffersOnly, setFlashOffersOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvedCategory, setResolvedCategory] = useState<{ id: string; name: string } | null>(null)

  // categoryName arrives as a URL slug (e.g. "camarero") for real categories,
  // or one of the special values above. Resolve the slug to its real id/name
  // so we can match candidates by category_id instead of fragile string equality.
  useEffect(() => {
    if (SPECIAL_CATEGORY_NAMES.includes(categoryName)) return
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        const cats = json.data || []
        const match = cats.find((c: any) => c.slug === categoryName)
        if (match) setResolvedCategory({ id: match.id, name: match.name })
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
          .select("*")
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
          location: profile.location ? profile.location.split(",")[0].trim() : "España",
          rating: profile.rating || 0,
          muxPlaybackId: profile.mux_playback_id || null,
          videoUrl: profile.avatar_url || "/placeholder.svg",
          experience: `${profile.experience_years || 0} años de experiencia`,
          experienceLevel: profile.experience_years >= 7 ? "high" : profile.experience_years >= 4 ? "medium" : "low",
          jobType: profile.availability_status || "full-time",
          isFlashOffer: false,
        }))
        setWorkers(mapped)
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
    const matchesJobType = jobTypeFilter === "all" || worker.jobType === jobTypeFilter
    const matchesCategoryFilter = categoryFilter === "all" || worker.category === categoryFilter || matchesSpecialty(categoryFilter)
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
        {/* Filters Toggle */}
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="mb-4 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          {showFilters ? "Ocultar Filtros" : "Filtros"}
        </Button>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="w-full">
                <Label htmlFor="experience">Experiencia</Label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger id="experience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Más actuales</SelectItem>
                    <SelectItem value="high">Mucha Experiencia (7+ años)</SelectItem>
                    <SelectItem value="medium">Experiencia Media (4-6 años)</SelectItem>
                    <SelectItem value="low">Poca Experiencia (1-3 años)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label htmlFor="jobType">Tipo de trabajo</Label>
                <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                  <SelectTrigger id="jobType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Más actuales</SelectItem>
                    <SelectItem value="full-time">Tiempo Completo</SelectItem>
                    <SelectItem value="part-time">Tiempo Parcial</SelectItem>
                    <SelectItem value="temporary">Temporal</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label htmlFor="category">Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Más actuales</SelectItem>
                    <SelectItem value="Camarero">Camarero</SelectItem>
                    <SelectItem value="Cocinero">Cocinero</SelectItem>
                    <SelectItem value="Barista">Barista</SelectItem>
                    <SelectItem value="Chef">Chef</SelectItem>
                    <SelectItem value="Ayudante de cocina">Ayudante de cocina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label htmlFor="location">Ciudad</Label>
                <Input
                  id="location"
                  placeholder="Madrid, Barcelona..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="w-full">
                <Label htmlFor="postal">Código Postal</Label>
                <Input
                  id="postal"
                  placeholder="28001"
                  value={postalCodeFilter}
                  onChange={(e) => setPostalCodeFilter(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6 w-full">
                <input
                  type="checkbox"
                  id="flashOffers"
                  checked={flashOffersOnly}
                  onChange={(e) => setFlashOffersOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="flashOffers" className="cursor-pointer">
                  Solo Ofertas Flash
                </Label>
              </div>
            </div>

            <Button
              onClick={() => {
                setExperienceFilter("all")
                setJobTypeFilter("all")
                setCategoryFilter("all")
                setLocationFilter("")
                setPostalCodeFilter("")
                setFlashOffersOnly(false)
              }}
              variant="ghost"
              size="sm"
            >
              Limpiar filtros
            </Button>
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
