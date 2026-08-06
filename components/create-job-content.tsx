"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Briefcase, MapPin, Euro, Clock, Users, CheckCircle2, Zap, ImagePlus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AddressAutofill } from "@/components/address-autofill"
import { createJobAction, activateFlashWithCreditAction } from "@/lib/actions"
import { LANGUAGE_LIST } from "@/lib/profile-constants"

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  category_id: string
}

export function CreateJobContent({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [location, setLocation] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedCategoryName, setSelectedCategoryName] = useState("")
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState("")
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [isOtroSelected, setIsOtroSelected] = useState(false)
  const [otroCustomText, setOtroCustomText] = useState("")
  const [isFlash, setIsFlash] = useState(false)
  const [flashDurationHours, setFlashDurationHours] = useState("24")
  const [flashImage, setFlashImage] = useState<File | null>(null)
  const [flashImagePreview, setFlashImagePreview] = useState<string | null>(null)
  const [uniformRequired, setUniformRequired] = useState(false)
  const [tpvRequired, setTpvRequired] = useState(false)
  const [languagesRequired, setLanguagesRequired] = useState<string[]>([])

  const toggleLanguage = (lang: string) => {
    setLanguagesRequired((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    )
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("flash") === "true") setIsFlash(true)
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        const json = await res.json()
        const cats = json.data || []
        setCategories(cats)
      } catch (e) {
        console.error("Error loading categories:", e)
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  const handleCategoryChange = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    setSelectedCategoryId(categoryId)
    setSelectedCategoryName(cat?.name || "")
    setSelectedSubcategoryName("")
    setIsOtroSelected(false)
    setOtroCustomText("")
    // Sort subcategories: "Otro" always last
    const subs = cat?.subcategories || []
    const sorted = [
      ...subs.filter(s => s.name.toLowerCase() !== "otro"),
      ...subs.filter(s => s.name.toLowerCase() === "otro"),
    ]
    setSubcategories(sorted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)

    const form = e.target as HTMLFormElement
    const formData = new FormData(form)

    try {
      let imageUrl: string | null = null
      if (isFlash && flashImage) {
        try {
          const imgForm = new FormData()
          imgForm.append("file", flashImage)
          imgForm.append("type", "flash")
          imgForm.append("userId", userId)
          const imgRes = await fetch("/api/upload", { method: "POST", body: imgForm })
          if (imgRes.ok) {
            const imgData = await imgRes.json()
            imageUrl = imgData.url
          }
        } catch (e) {
          console.error("Error uploading flash offer image:", e)
        }
      }

      const position = isOtroSelected && otroCustomText
        ? otroCustomText
        : selectedSubcategoryName || selectedCategoryName

      if (isFlash) {
        // Flash offers stay inactive/invisible until the 5€ charge is
        // confirmed server-side by the Stripe webhook - never for free - so
        // this path inserts directly (is_active:false) instead of going
        // through createJobAction, whose match-alert fan-out only makes
        // sense once a job is actually live.
        const { data: insertedJob, error } = await supabase
          .from("jobs")
          .insert({
            business_id: userId,
            title: formData.get("title") as string,
            description: formData.get("description") as string,
            category: selectedCategoryName,
            position,
            city: location,
            latitude: locationCoords?.lat || null,
            longitude: locationCoords?.lng || null,
            contract_type: formData.get("workType") as string,
            work_schedule: formData.get("schedule") as string,
            salary_min: Number(formData.get("salaryMin")) || null,
            salary_max: Number(formData.get("salaryMax")) || null,
            experience_required: formData.get("experience") as string,
            requirements: formData.get("requirements") as string,
            benefits: formData.get("benefits") as string,
            is_active: false,
            is_flash: true,
            image_url: imageUrl,
          })
          .select("id")
          .single()

        if (error || !insertedJob) {
          setFormError("Error al publicar la oferta: " + (error?.message || "error desconocido"))
          return
        }

        // Spend a free-flash credit (earned via canje de puntos) instead of
        // charging Stripe, if the business has one available.
        const creditResult = await activateFlashWithCreditAction(insertedJob.id, Number(flashDurationHours))
        if (creditResult.success) {
          setShowSuccess(true)
          setTimeout(() => router.push("/my-jobs"), 2000)
          return
        }
        if (creditResult.error && creditResult.error !== "no_credit") {
          setFormError(creditResult.error)
          return
        }

        const res = await fetch("/api/micropayments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            featureType: "flash_job",
            userId,
            jobId: insertedJob.id,
            flashDurationHours: Number(flashDurationHours),
          }),
        })
        const data = await res.json()
        if (!res.ok || !data.checkoutUrl) {
          setFormError(data.error || "Error al iniciar el pago de la oferta flash")
          return
        }
        window.location.href = data.checkoutUrl
        return
      }

      const result = await createJobAction({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: selectedCategoryName,
        position,
        city: location,
        latitude: locationCoords?.lat || null,
        longitude: locationCoords?.lng || null,
        contract_type: formData.get("workType") as string,
        work_schedule: formData.get("schedule") as string,
        salary_min: Number(formData.get("salaryMin")) || null,
        salary_max: Number(formData.get("salaryMax")) || null,
        experience_required: formData.get("experience") as string,
        requirements: formData.get("requirements") as string,
        benefits: formData.get("benefits") as string,
        image_url: imageUrl,
        vacancies: Number(formData.get("vacancies")) || 1,
        start_date: (formData.get("startDate") as string) || null,
        uniform_required: uniformRequired,
        languages_required: languagesRequired,
        tpv_required: tpvRequired,
      })

      if (result.error) {
        setFormError("Error al publicar la oferta: " + result.error)
        return
      }

      setShowSuccess(true)
      setTimeout(() => router.push("/my-jobs"), 2000)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error inesperado al publicar la oferta")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6 pb-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{isFlash ? "¡Oferta Flash Publicada!" : "¡Oferta Publicada!"}</h2>
            <p className="text-muted-foreground mb-4">
              {isFlash
                ? "Tu oferta flash ya está visible en el inicio, el buscador y el listado de flash offers."
                : "Tu oferta ya está visible para los candidatos."}
            </p>
            <Button asChild className="w-full">
              <Link href="/my-jobs">Ver Mis Ofertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/business-dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={40} height={40} className="object-contain rounded-full" />
          </Link>
          <div>
            <h1 className="text-lg font-bold">Publicar Oferta</h1>
            <p className="text-[13px] text-muted-foreground">Crea una nueva oferta de trabajo</p>
          </div>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Oferta Flash */}
          <Card className={isFlash ? "border-2 border-[#F97316] bg-[#F97316]/5" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#F97316]/10 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-[#F97316]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Oferta Flash</p>
                    <p className="text-[13px] text-muted-foreground">Trabajo urgente y de corta duración, destacado en toda la app</p>
                  </div>
                </div>
                <Switch checked={isFlash} onCheckedChange={setIsFlash} />
              </div>
              {isFlash && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="flashDuration">Expira en</Label>
                  <Select value={flashDurationHours} onValueChange={setFlashDurationHours}>
                    <SelectTrigger id="flashDuration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Label htmlFor="flashImage">Imagen de la oferta</Label>
                  {flashImagePreview ? (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                      <img src={flashImagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setFlashImage(null); setFlashImagePreview(null) }}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="flashImage"
                      className="flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed border-[#F97316]/40 text-muted-foreground cursor-pointer hover:bg-[#F97316]/5 transition-colors"
                    >
                      <ImagePlus className="h-8 w-8 text-[#F97316]" />
                      <span className="text-[13px]">Sube una imagen para la oferta</span>
                    </label>
                  )}
                  <input
                    id="flashImage"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setFlashImage(file)
                      setFlashImagePreview(URL.createObjectURL(file))
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Oferta *</Label>
                <Input id="title" name="title" placeholder="Ej: Camarero/a con experiencia" required />
              </div>

              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select onValueChange={handleCategoryChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Cargando categorías..." : "Selecciona una categoría"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[300px]">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Especialidad / Puesto</Label>
                  <Select onValueChange={(v) => {
                    const sub = subcategories.find(s => s.id === v)
                    const isOtro = sub?.name.toLowerCase() === "otro"
                    setSelectedSubcategoryName(sub?.name || "")
                    setIsOtroSelected(isOtro)
                    if (!isOtro) setOtroCustomText("")
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una especialidad (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-white max-h-[300px]">
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isOtroSelected && (
                    <div className="mt-2">
                      <Label htmlFor="otroCustom">Especifica el tipo de trabajo *</Label>
                      <Input
                        id="otroCustom"
                        className="mt-1.5"
                        placeholder={`Ej: Especialista en ${selectedCategoryName}...`}
                        value={otroCustomText}
                        onChange={(e) => setOtroCustomText(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {isOtroSelected && (
                <div className="space-y-2">
                  <Label htmlFor="description">Describe Otro *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe Otro"
                    rows={5}
                    required={isOtroSelected}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ubicación y Horario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Ubicación y Horario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ubicación *</Label>
                <AddressAutofill
                  value={location}
                  onChange={(value, coords) => {
                    setLocation(value)
                    if (coords) setLocationCoords(coords)
                  }}
                  placeholder="Ej: Madrid, España"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workType">Tipo de Contrato *</Label>
                <Select name="workType" required>
                  <SelectTrigger id="workType">
                    <SelectValue placeholder="Selecciona el tipo de contrato" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="full_time">Jornada Completa</SelectItem>
                    <SelectItem value="part_time">Media Jornada</SelectItem>
                    <SelectItem value="temporary">Temporal</SelectItem>
                    <SelectItem value="seasonal">Estacional</SelectItem>
                    <SelectItem value="weekend">Fines de Semana</SelectItem>
                    <SelectItem value="freelance">Autónomo / Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule">Horario</Label>
                <Input id="schedule" name="schedule" placeholder="Ej: Lunes a Viernes, 9:00 - 17:00" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vacancies">Nº de Vacantes</Label>
                  <Input id="vacancies" name="vacancies" type="number" min={1} defaultValue={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Incorporación</Label>
                  <Input id="startDate" name="startDate" type="date" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Salario y Beneficios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Salario Mínimo (€/mes)</Label>
                  <Input id="salaryMin" name="salaryMin" type="number" placeholder="1500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Salario Máximo (€/mes)</Label>
                  <Input id="salaryMax" name="salaryMax" type="number" placeholder="2000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="benefits">Beneficios</Label>
                <Textarea id="benefits" name="benefits" placeholder="Ej: Propinas, comidas incluidas, seguro médico..." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Requisitos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Requisitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience">Experiencia Requerida *</Label>
                <Select name="experience" required>
                  <SelectTrigger id="experience">
                    <SelectValue placeholder="Selecciona el nivel de experiencia" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="none">Sin experiencia</SelectItem>
                    <SelectItem value="0-1">Menos de 1 año</SelectItem>
                    <SelectItem value="1-2">1-2 años</SelectItem>
                    <SelectItem value="3-5">3-5 años</SelectItem>
                    <SelectItem value="5-10">5-10 años</SelectItem>
                    <SelectItem value="10+">Más de 10 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="uniformRequired" className="font-normal">Uniforme requerido</Label>
                <Switch id="uniformRequired" checked={uniformRequired} onCheckedChange={setUniformRequired} />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="tpvRequired" className="font-normal">Uso de TPV requerido</Label>
                <Switch id="tpvRequired" checked={tpvRequired} onCheckedChange={setTpvRequired} />
              </div>

              <div className="space-y-2">
                <Label>Idiomas requeridos</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_LIST.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors ${
                        languagesRequired.includes(lang)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-foreground border-border"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirements">Otros Requisitos</Label>
                <Textarea id="requirements" name="requirements" placeholder="Ej: certificaciones, habilidades específicas..." rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Duración */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Duración de la Publicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duración *</Label>
                <Select required defaultValue="30">
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="15">15 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="60">60 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1 bg-transparent" type="button">
              <Link href="/business-dashboard">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              className={`flex-1 ${isFlash ? "bg-[#F97316] hover:bg-[#EA6A0E]" : "bg-primary hover:bg-primary/90"}`}
              disabled={isSubmitting || !selectedCategoryId}
            >
              {isSubmitting ? "Publicando..." : isFlash ? "Publicar Oferta Flash" : "Publicar Oferta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
