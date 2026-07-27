"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation" 
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Profile, BusinessProfile, JobCategory, ContractType } from "@/lib/types"
import { AddressAutofill } from "@/components/address-autofill"
import { toast } from "sonner"

interface JobCreateFormProps {
  user: any
  profile: Profile
  businessProfile: BusinessProfile | null
}

const categoryOptions: { value: JobCategory; label: string }[] = [
  { value: "camarero", label: "Camarero/a" },
  { value: "coctelero", label: "Coctelero/a" },
  { value: "sommelier", label: "Sommelier" },
  { value: "maitre", label: "Maitre" },
  { value: "chef", label: "Chef" },
  { value: "cocinero", label: "Cocinero/a" },
  { value: "cortador_jamon", label: "Cortador de Jamon" },
  { value: "office", label: "Office" },
  { value: "recepcionista", label: "Recepcionista" },
  { value: "platero", label: "Platero" },
  { value: "repartidor", label: "Repartidor" },
]

const contractTypeOptions: { value: ContractType; label: string }[] = [
  { value: "full_time", label: "Jornada Completa" },
  { value: "part_time", label: "Media Jornada" },
  { value: "flash_offer", label: "Oferta Flash" },
  { value: "one_time_event", label: "Evento Puntual" },
]

const positionOptions = ["Junior", "Intern/Trainee", "Senior", "Manager", "Director"]

export function JobCreateForm({ user, profile, businessProfile }: JobCreateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    category: "camarero" as JobCategory,
    contractType: "full_time" as ContractType,
    position: "Junior",
    description: "",
    requirements: "",
    salaryDisplay: "",
    location: "",
    companyName: businessProfile?.company_name || profile.display_name,
    startDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Simulate successful job creation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success("Trabajo publicado exitosamente")
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear el trabajo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.category) {
      setError("Por favor, completa el título y categoría primero")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Simulate AI generation (in production, you would call an AI API)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const generatedDescription = `Estamos buscando un/a ${formData.title} para unirse a nuestro equipo. Esta es una excelente oportunidad para profesionales apasionados por la hostelería que buscan crecer en un ambiente dinámico y profesional.

Responsabilidades principales:
- Atención al cliente de alta calidad
- Trabajo en equipo con el resto del personal
- Mantener los estándares de servicio
- Contribuir a un ambiente de trabajo positivo

Ofrecemos:
- Ambiente de trabajo profesional
- Oportunidades de crecimiento
- Equipo comprometido y experimentado`

      setFormData((prev) => ({ ...prev, description: generatedDescription }))
    } catch (error) {
      setError("Error al generar la descripción")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateRequirements = async () => {
    if (!formData.position) {
      setError("Por favor, selecciona el nivel del puesto primero")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const generatedRequirements = `Requisitos para el puesto:
- Experiencia previa en el sector hostelero
- Excelentes habilidades de comunicación
- Capacidad para trabajar bajo presión
- Disponibilidad horaria flexible
- Actitud positiva y proactiva
- Trabajo en equipo

Valorable:
- Formación específica en hostelería
- Conocimientos de idiomas
- Referencias laborales`

      setFormData((prev) => ({ ...prev, requirements: generatedRequirements }))
    } catch (error) {
      setError("Error al generar los requisitos")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
              <h1 className="text-xl font-bold">Publicar Trabajo</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl pb-24">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Crear Nueva Oferta de Trabajo</CardTitle>
            <CardDescription>Completa los detalles de la oferta para atraer a los mejores candidatos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Logo Upload */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed">
                    <span className="text-sm text-muted-foreground text-center px-2">Logo Empresa</span>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as JobCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título del Trabajo / Designación</Label>
                <Input
                  id="title"
                  placeholder="Ej: Camarero/a, Chef, Bartender"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Job Position */}
              <div className="space-y-2">
                <Label htmlFor="position">Nivel del Puesto</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger id="position">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location with Autofill */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <AddressAutofill
                  id="location"
                  value={formData.location}
                  onChange={(value, coords) => {
                    setFormData({ ...formData, location: value })
                  }}
                  placeholder="Buscar ciudad o dirección..."
                  types="place,locality,address"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  placeholder="Nombre de tu empresa"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              {/* Job Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descripción del Trabajo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating}
                    className="text-primary bg-transparent"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generando..." : "Generar"}
                  </Button>
                </div>
                <Textarea
                  id="description"
                  placeholder="Describe el puesto, responsabilidades y lo que ofreces..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              {/* Job Requirements */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requisitos del Trabajo</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateRequirements}
                    disabled={isGenerating}
                    className="text-primary bg-transparent"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? "Generando..." : "Generar"}
                  </Button>
                </div>
                <Textarea
                  id="requirements"
                  placeholder="Experiencia, habilidades, certificaciones necesarias..."
                  rows={6}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                />
              </div>

              {/* Salary */}
              <div className="space-y-2">
                <Label htmlFor="salary">Salario</Label>
                <Input
                  id="salary"
                  placeholder="Ej: 1.800€ - 2.200€/mes"
                  value={formData.salaryDisplay}
                  onChange={(e) => setFormData({ ...formData, salaryDisplay: e.target.value })}
                />
              </div>

              {/* Contract Type */}
              <div className="space-y-2">
                <Label>Tipo de Contrato</Label>
                <div className="grid grid-cols-2 gap-3">
                  {contractTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={formData.contractType === option.value ? "default" : "outline"}
                      className={formData.contractType === option.value ? "bg-primary" : ""}
                      onClick={() => setFormData({ ...formData, contractType: option.value })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                {isLoading ? "Publicando..." : "Publicar Trabajo"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
