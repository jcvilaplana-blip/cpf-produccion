"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button" 
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  MapPin,
  Euro,
  Calendar,
  Clock,
  Briefcase,
  CheckCircle2,
  Building2,
  Star,
  Send,
  Heart,
  Share2,
  Zap,
  Eye,
  Users,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { applyToJobAction, saveJobAction } from "@/lib/actions"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"

interface JobData {
  id: string
  title: string
  description: string
  location: string
  city?: string
  salary_min?: number
  salary_max?: number
  salary_display?: string
  is_active: boolean
  created_at: string
  business_id: string
  contract_type?: string
  category?: string
  position?: string
  requirements?: string
  benefits?: string
  work_schedule?: string
  experience_required?: string
  start_date?: string
  start_date_text?: string
  views?: number
  vacancies?: number
  is_flash?: boolean
  flash_expires_at?: string
  business: {
    display_name: string
    avatar_url: string | null
    type?: string | null
  }
}

interface JobDetailContentProps {
  job: JobData
  initialHasApplied?: boolean
  initialIsSaved?: boolean
  userId?: string | null
  userProfile?: Profile | null
}

const contractTypeLabels: Record<string, string> = {
  full_time: "Jornada Completa",
  part_time: "Media Jornada",
  flash_offer: "Oferta Flash",
  one_time_event: "Evento Puntual",
  temporary: "Temporal",
}

const categoryLabels: Record<string, string> = {
  camarero: "Camarero/a",
  coctelero: "Coctelero/a",
  sommelier: "Sommelier",
  maitre: "Maitre",
  chef: "Chef",
  cocinero: "Cocinero/a",
  cortador_jamon: "Cortador de Jamon",
  office: "Office",
  recepcionista: "Recepcionista",
  platero: "Platero",
  repartidor: "Repartidor",
}

export function JobDetailContent({
  job,
  initialHasApplied = false,
  initialIsSaved = false,
  userId,
  userProfile,
}: JobDetailContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [coverLetter, setCoverLetter] = useState("")
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [hasApplied, setHasApplied] = useState(initialHasApplied)
  const [isApplying, setIsApplying] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleApply = async () => {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    setIsApplying(true)
    const result = await applyToJobAction(job.id, coverLetter || undefined)
    setIsApplying(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setHasApplied(true)
      toast.success("Candidatura enviada correctamente")
    }
  }

  const handleSave = async () => {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    setIsSaving(true)
    const result = await saveJobAction(job.id)
    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setIsSaved(result.saved ?? false)
      toast.success(result.saved ? "Oferta guardada" : "Oferta eliminada de guardados")
    }
  }

  const handleContactBusiness = () => {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    router.push(`/messages?businessId=${job.business_id}`)
  }

  const getTimeRemaining = () => {
    if (!job.flash_expires_at) return null
    const now = new Date().getTime()
    const expiry = new Date(job.flash_expires_at).getTime()
    const diff = expiry - now
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { hours, minutes, isExpired: diff <= 0 }
  }

  const timeRemaining = job.is_flash ? getTimeRemaining() : null
  const isBusinessOwner = userId === job.business_id

  return (
    <div className="min-h-screen bg-background pb-24 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Image
                src="/logo-cpf.png"
                alt="CamareroPorFavor"
                width={36}
                height={36}
                className="object-contain rounded-full"
              />
              <h1 className="text-lg font-bold truncate max-w-[200px]">
                {t("jobDetail.title")}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                disabled={isSaving}
                className={isSaved ? "text-red-500" : ""}
              >
                <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
        {/* Flash Offer Banner */}
        {job.is_flash && timeRemaining && !timeRemaining.isExpired && (
          <Card className="border-[#01A89E]/50 bg-teal-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#01A89E] p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#017A73]">Oferta Flash - Urgente</p>
                  <p className="text-sm text-[#018F86]">
                    Expira en {timeRemaining.hours}h {timeRemaining.minutes}min
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Info + Job Title */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden border flex-shrink-0">
                {job.business.avatar_url ? (
                  <Image
                    src={job.business.avatar_url}
                    alt={job.business.display_name}
                    width={56}
                    height={56}
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-balance">{job.title}</h2>
                <Link
                  href={`/business/${job.business_id}`}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1 text-sm mt-1"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {job.business.display_name}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {job.city || job.location}
                  </Badge>
                  {job.category && (
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[job.category] || job.category}
                    </Badge>
                  )}
                  {job.contract_type && (
                    <Badge variant="outline" className="text-xs">
                      {contractTypeLabels[job.contract_type] || job.contract_type}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Euro className="h-4 w-4" />
                <span>Salario</span>
              </div>
              <p className="font-semibold text-sm">
                {job.salary_display
                  ? job.salary_display
                  : job.salary_min && job.salary_max
                    ? `${job.salary_min} - ${job.salary_max} EUR/mes`
                    : job.salary_min
                      ? `Desde ${job.salary_min} EUR/mes`
                      : "A convenir"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Briefcase className="h-4 w-4" />
                <span>Tipo</span>
              </div>
              <p className="font-semibold text-sm">
                {contractTypeLabels[job.contract_type || ""] || "Jornada completa"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Calendar className="h-4 w-4" />
                <span>Inicio</span>
              </div>
              <p className="font-semibold text-sm">
                {job.start_date_text || (job.start_date
                  ? new Date(job.start_date).toLocaleDateString("es-ES")
                  : "A convenir")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-4 w-4" />
                <span>Horario</span>
              </div>
              <p className="font-semibold text-sm">{job.work_schedule || "A convenir"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground px-1">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{job.views || 0} visitas</span>
          </div>
          {job.vacancies && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{job.vacancies} vacante{job.vacancies > 1 ? "s" : ""}</span>
            </div>
          )}
          {job.experience_required && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4" />
              <span>Exp: {job.experience_required}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-base font-bold">Descripcion del puesto</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </CardContent>
        </Card>

        {/* Requirements */}
        {job.requirements && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-base font-bold">Requisitos</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-base font-bold">Beneficios</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.benefits}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact / Apply Section */}
        {!isBusinessOwner && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-bold">Contactar empresa</h3>
              {!hasApplied && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escribe un mensaje o carta de presentacion (opcional)..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>
              )}
              <Button
                onClick={handleContactBusiness}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensaje Directo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Owner Actions */}
        {isBusinessOwner && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-base font-bold">Gestionar oferta</h3>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1 bg-transparent">
                  <Link href={`/jobs/${job.id}/edit`}>Editar Oferta</Link>
                </Button>
                <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                  <Link href={`/jobs/${job.id}/applications`}>Ver Candidatos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Apply Button */}
      {!isBusinessOwner && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <div className="container mx-auto max-w-3xl">
            {hasApplied ? (
              <Button disabled className="w-full bg-green-600 hover:bg-green-600">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Candidatura Enviada
              </Button>
            ) : (
              <Button
                onClick={handleApply}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isApplying}
              >
                {isApplying ? "Enviando..." : "Aplicar a esta Oferta"}
              </Button>
            )}
          </div>
        </div>
      )}

      <BottomNavigation profile={userProfile} />
    </div>
  )
}
