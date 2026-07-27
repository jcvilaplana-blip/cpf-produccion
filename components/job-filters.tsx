"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SlidersHorizontal, MapPin, Loader2 } from "lucide-react"
import { type JobFilters, JOB_CATEGORIES, JOB_TYPES, SALARY_RANGES, DISTANCE_OPTIONS } from "@/lib/filters"
import { getCurrentLocation, SPANISH_CITIES } from "@/lib/geolocation"

interface JobFiltersProps {
  filters: JobFilters
  onFiltersChange: (filters: JobFilters) => void
  jobCount?: number
}

export function JobFiltersComponent({ filters, onFiltersChange, jobCount }: JobFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const location = await getCurrentLocation()
      onFiltersChange({
        ...filters,
        userLocation: location.coordinates,
        location: location.city || location.address || "Mi ubicación",
      })
    } catch (error) {
      console.error("Error obteniendo ubicación:", error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value })

    if (value.length > 0) {
      const suggestions = SPANISH_CITIES.filter((city) => city.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
      setLocationSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (city: string) => {
    onFiltersChange({ ...filters, location: city })
    setShowSuggestions(false)
  }

  const handleReset = () => {
    onFiltersChange({
      search: "",
      category: undefined,
      jobType: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
      location: undefined,
      distance: undefined,
      userLocation: undefined,
      sortBy: "recent",
    })
  }

  const activeFiltersCount = [
    filters.category && filters.category !== "Todos",
    filters.jobType && filters.jobType !== "Todos",
    filters.salaryMin || filters.salaryMax,
    filters.location,
    filters.distance && filters.distance !== 999999,
  ].filter(Boolean).length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de búsqueda</SheetTitle>
          <SheetDescription>
            Refina tu búsqueda de trabajos
            {jobCount !== undefined && ` (${jobCount} resultados)`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Búsqueda por texto */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Título, empresa, descripción..."
              value={filters.search || ""}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={filters.category || "Todos"}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, category: value === "Todos" ? undefined : value })
              }
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {JOB_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de trabajo */}
          <div className="space-y-2">
            <Label htmlFor="jobType">Tipo de trabajo</Label>
            <Select
              value={filters.jobType || "Todos"}
              onValueChange={(value) => onFiltersChange({ ...filters, jobType: value === "Todos" ? undefined : value })}
            >
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rango salarial */}
          <div className="space-y-2">
            <Label>Salario mensual</Label>
            <Select
              value={
                filters.salaryMin !== undefined || filters.salaryMax !== undefined
                  ? `${filters.salaryMin || 0}-${filters.salaryMax || 999999}`
                  : "0-999999"
              }
              onValueChange={(value) => {
                const [min, max] = value.split("-").map(Number)
                onFiltersChange({
                  ...filters,
                  salaryMin: min === 0 ? undefined : min,
                  salaryMax: max === 999999 ? undefined : max,
                })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona rango" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_RANGES.map((range) => (
                  <SelectItem key={range.label} value={`${range.min}-${range.max}`}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="location"
                  placeholder="Ciudad o dirección"
                  value={filters.location || ""}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => filters.location && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {showSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                    {locationSuggestions.map((city) => (
                      <button
                        key={city}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => handleSuggestionClick(city)}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button variant="outline" size="icon" onClick={handleGetCurrentLocation} disabled={isLoadingLocation}>
                {isLoadingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Distancia */}
          {filters.location && (
            <div className="space-y-2">
              <Label htmlFor="distance">Distancia máxima</Label>
              <Select
                value={String(filters.distance || 999999)}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    distance: Number(value) === 999999 ? undefined : Number(value),
                  })
                }
              >
                <SelectTrigger id="distance">
                  <SelectValue placeholder="Selecciona distancia" />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((option) => (
                    <SelectItem key={option.label} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ordenar por */}
          <div className="space-y-2">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={filters.sortBy || "recent"}
              onValueChange={(value: "recent" | "salary" | "distance") =>
                onFiltersChange({ ...filters, sortBy: value })
              }
            >
              <SelectTrigger id="sortBy">
                <SelectValue placeholder="Selecciona orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="salary">Mejor salario</SelectItem>
                {filters.userLocation && <SelectItem value="distance">Más cercanos</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleReset}>
              Limpiar
            </Button>
            <Button className="flex-1" onClick={() => setIsOpen(false)}>
              Aplicar filtros
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
