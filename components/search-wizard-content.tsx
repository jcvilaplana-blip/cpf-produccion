"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ChevronLeft, ChevronRight, Search, MapPin, Briefcase, Euro, Users, Building2 } from "lucide-react"
import type { Profile } from "@/lib/types"
import { CityAutocomplete } from "@/components/city-autocomplete"

interface Category {
  id: string
  name: string
  slug: string
  role_type: string
}

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
}

interface SearchWizardContentProps {
  profile: Profile | null
}

export function SearchWizardContent({ profile }: SearchWizardContentProps) {
  const router = useRouter()
  const isBusiness = profile?.user_type === "business"

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [category, setCategory] = useState<string>("")
  const [venueType, setVenueType] = useState<string>("")
  const [city, setCity] = useState<string>("")
  const [keyword, setKeyword] = useState("")
  const [salaryMin, setSalaryMin] = useState("")

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data || []))
      .catch(() => {})
  }, [])

  // The `categories` table holds two independent taxonomies distinguished
  // by role_type: candidate positions (Camarero, Cocinero...) and business
  // venue types (Bar, Restaurante...). Both roles pick a position in step 1;
  // candidates get an extra, independent venue-type step.
  const positionCategories = useMemo(() => categories.filter((c) => c.role_type === "candidate"), [categories])
  const venueCategories = useMemo(() => categories.filter((c) => c.role_type === "business"), [categories])

  const totalSteps = isBusiness ? 2 : 4

  const goNext = () => {
    if (step >= totalSteps) {
      handleSubmit()
      return
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goPrev = () => {
    setDirection(-1)
    setStep((s) => Math.max(1, s - 1))
  }

  const handleSubmit = () => {
    if (isBusiness) {
      const params = new URLSearchParams()
      if (category) params.set("category", category)
      if (city) params.set("city", city)
      router.push(`/candidates${params.toString() ? `?${params.toString()}` : ""}`)
    } else {
      const params = new URLSearchParams()
      if (category) params.set("jobType", category)
      if (venueType) params.set("companyType", venueType)
      if (city) params.set("location", city)
      if (salaryMin) params.set("salary", salaryMin)
      if (keyword) params.set("q", keyword)
      router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`)
    }
  }

  const progress = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-lg">
              {isBusiness ? "Buscar Candidatos" : "Buscar Empleo"}
            </h1>
            <span className="text-sm text-muted-foreground font-medium w-16 text-right">
              {step}/{totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pt-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6 sm:p-8 min-h-[360px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="flex-1"
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-5 h-5 text-[#01A89E]" />
                      <h2 className="text-xl font-bold">
                        {isBusiness ? "¿Qué tipo de candidato buscas?" : "¿Qué puesto buscas?"}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isBusiness
                        ? "Elige la categoría profesional que necesitas cubrir"
                        : "Elige la categoría de empleo que te interesa"}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setCategory("")}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          category === "" ? "border-[#01A89E] bg-[#01A89E]/10 text-[#01A89E]" : "border-muted"
                        }`}
                      >
                        Cualquiera
                      </button>
                      {positionCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(isBusiness ? c.slug : c.name)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors truncate ${
                            (isBusiness ? category === c.slug : category === c.name)
                              ? "border-[#01A89E] bg-[#01A89E]/10 text-[#01A89E]"
                              : "border-muted"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && !isBusiness && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-[#01A89E]" />
                      <h2 className="text-xl font-bold">¿En qué tipo de local?</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Elige el tipo de establecimiento que te interesa (opcional)
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setVenueType("")}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                          venueType === "" ? "border-[#01A89E] bg-[#01A89E]/10 text-[#01A89E]" : "border-muted"
                        }`}
                      >
                        Cualquiera
                      </button>
                      {venueCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setVenueType(c.name)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors truncate ${
                            venueType === c.name ? "border-[#01A89E] bg-[#01A89E]/10 text-[#01A89E]" : "border-muted"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {((step === 2 && isBusiness) || (step === 3 && !isBusiness)) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-[#01A89E]" />
                      <h2 className="text-xl font-bold">¿En qué ciudad?</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Busca una ciudad o déjalo en blanco para ver resultados de toda España
                    </p>
                    <div className="pt-2 space-y-2">
                      <Label>Ciudad</Label>
                      <CityAutocomplete
                        value={city}
                        onChange={setCity}
                        placeholder="Ej. Madrid, Barcelona..."
                        className="h-12"
                      />
                      {city && (
                        <Badge variant="outline" className="cursor-pointer" onClick={() => setCity("")}>
                          Limpiar ciudad ×
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && !isBusiness && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="w-5 h-5 text-[#01A89E]" />
                      <h2 className="text-xl font-bold">Últimos detalles</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">Opcional, para afinar tu búsqueda</p>
                    <div className="space-y-2">
                      <Label>Sueldo mínimo deseado (€/mes)</Label>
                      <Input
                        type="number"
                        placeholder="Ej. 1400"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Palabra clave</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Ej. turno de noche, idiomas..."
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          className="h-12 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <Button variant="outline" onClick={goPrev} disabled={step === 1} className="gap-2 bg-transparent">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button
                onClick={goNext}
                className="gap-2 bg-[#01A89E] hover:bg-[#018F86] text-white"
              >
                {step >= totalSteps ? (
                  <>
                    {isBusiness ? <Users className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                    Ver Resultados
                  </>
                ) : (
                  <>Siguiente <ChevronRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
