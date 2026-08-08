"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button" 
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  X,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/language-context"
import { applyToJobAction, withdrawApplicationAction, saveJobAction, activateHighlightWithCreditAction } from "@/lib/actions"
import { toast } from "sonner"
import type { Profile } from "@/lib/types"
import { contractTypeLabel } from "@/lib/profile-constants"
import { MicropaymentCards } from "@/components/micropayment-cards"
import { StripePaymentDialog, type ResumenPago } from "@/components/stripe-payment-dialog"

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
  is_highlighted?: boolean
  highlight_expires_at?: string
  image_url?: string | null
  business: {
    display_name: string
    avatar_url: string | null
    type?: string | null
  }
}

interface JobDetailContentProps {
  job: JobData
  /**
   * Estado de la candidatura del usuario en esta oferta, o null si no se ha
   * inscrito. No es un booleano a propósito: "enviada" y "ya respondida" son
   * situaciones distintas y el botón no puede decir lo mismo en las dos.
   */
  initialApplicationStatus?: string | null
  initialIsSaved?: boolean
  userId?: string | null
  userProfile?: Profile | null
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
  initialApplicationStatus = null,
  initialIsSaved = false,
  userId,
  userProfile,
}: JobDetailContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(initialApplicationStatus)
  const [isApplying, setIsApplying] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isHighlighting, setIsHighlighting] = useState(false)
  // Cobro de "destacar oferta" en curso, pagado dentro de la propia pantalla.
  const [pago, setPago] = useState<{
    clientSecret: string
    resumen: ResumenPago
    micropaymentId: string
  } | null>(null)

  const handleApply = async () => {
    if (!userId) {
      router.push("/auth/login")
      return
    }
    setIsApplying(true)
    const result = await applyToJobAction(job.id)
    setIsApplying(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      setApplicationStatus("pending")
      toast.success("Candidatura enviada correctamente")
    }
  }

  const handleWithdraw = async () => {
    setIsWithdrawing(true)
    const result = await withdrawApplicationAction(job.id)
    setIsWithdrawing(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    // Vuelve al estado inicial: puede volver a interesarle más adelante.
    setApplicationStatus("withdrawn")
    toast.success("Has cancelado tu candidatura")
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

  // Qué se le puede ofrecer al candidato depende del estado de su candidatura.
  //
  // Antes bastaba con que existiera la fila para dejar el botón clavado en
  // "Candidatura Enviada" para siempre, incluso después de que el
  // establecimiento hubiera respondido y cerrado el proceso. Y "Ya no me
  // interesa" se mostraba también sobre candidaturas ya aceptadas, que la
  // acción rechaza expresamente: el botón parecía no hacer nada.
  const esperandoRespuesta = applicationStatus === "pending"
  const conEntrevista = applicationStatus === "interview"
  const seleccionado = applicationStatus === "accepted"
  const descartado = applicationStatus === "rejected"
  const finalizado = applicationStatus === "completed"
  // Una candidatura retirada se puede reactivar; una rechazada, no (la acción
  // de inscribirse sólo readmite las retiradas).
  const puedeInscribirse = !applicationStatus || applicationStatus === "withdrawn"
  // Cancelar sólo tiene sentido mientras el proceso siga vivo y sin resolver.
  const puedeRetirarse = esperandoRespuesta || conEntrevista

  const timeRemaining = job.is_flash ? getTimeRemaining() : null
  const isBusinessOwner = userId === job.business_id
  const isCurrentlyHighlighted = Boolean(
    job.is_highlighted && job.highlight_expires_at && new Date(job.highlight_expires_at) > new Date()
  )

  const handleHighlight = async () => {
    if (!userId) return
    setIsHighlighting(true)
    try {
      // Spend a highlight credit (earned via canje de puntos) if available,
      // before falling back to a real Stripe charge.
      const creditResult = await activateHighlightWithCreditAction(job.id)
      if (creditResult.success) {
        toast.success("Oferta destacada durante 24h")
        router.refresh()
        setIsHighlighting(false)
        return
      }
      if (creditResult.error && creditResult.error !== "no_credit") {
        toast.error(creditResult.error)
        setIsHighlighting(false)
        return
      }

      const res = await fetch("/api/micropayments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureType: "highlight_job", userId, jobId: job.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.clientSecret) {
        toast.error(data.error || "Error al iniciar el pago")
        setIsHighlighting(false)
        return
      }
      // El formulario de pago se abre sobre esta pantalla; antes esto saltaba a
      // checkout.stripe.com y, dentro de la app, al navegador del sistema.
      setPago({
        clientSecret: data.clientSecret,
        resumen: data.resumen,
        micropaymentId: data.micropaymentId,
      })
      setIsHighlighting(false)
    } catch {
      toast.error("Error al iniciar el pago")
      setIsHighlighting(false)
    }
  }

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

      {/* Imagen de la oferta. Va a ancho completo bajo la cabecera fija, antes
          que cualquier otra cosa: es lo que identifica la oferta de un vistazo.
          Sólo aparece si la empresa subió una. */}
      {job.image_url && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
          <Image
            src={job.image_url}
            alt={job.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

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
            {/* Sin miniatura: la oferta ya se presenta con su imagen a ancho
                completo en la cabecera, y repetirla aquí en pequeño sólo
                estrechaba el título. */}
            <div className="flex items-start gap-4">
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
                  <Badge variant="secondary" className="gap-1 text-[13px]">
                    <MapPin className="h-3 w-3" />
                    {job.city || job.location}
                  </Badge>
                  {job.category && (
                    <Badge variant="outline" className="text-[13px]">
                      {categoryLabels[job.category] || job.category}
                    </Badge>
                  )}
                  {job.contract_type && (
                    <Badge variant="outline" className="text-[13px]">
                      {contractTypeLabel(job.contract_type)}
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
              <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
                <Euro className="h-4 w-4" />
                <span>Sueldo</span>
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
              <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
                <Briefcase className="h-4 w-4" />
                <span>Tipo</span>
              </div>
              <p className="font-semibold text-sm">
                {contractTypeLabel(job.contract_type) || "Jornada Completa"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
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
              <div className="flex items-center gap-2 text-muted-foreground text-[13px] mb-1">
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

        {/* Compras aplicables a ESTA oferta, para el dueño. "Destacar" cobra
            aquí mismo con `handleHighlight`, que gasta primero un canje de
            puntos si lo hay y sólo si no, abre el pago. */}
        {isBusinessOwner && (
          <MicropaymentCards
            rol="business"
            jobId={job.id}
            onDestacarOferta={job.is_flash ? undefined : handleHighlight}
            destacarDeshabilitado={isCurrentlyHighlighted || isHighlighting}
            destacarEtiqueta={
              isCurrentlyHighlighted
                ? "Ya destacada"
                : isHighlighting
                  ? "Preparando el pago…"
                  : undefined
            }
          />
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
              {!job.is_flash && (
                <Button
                  variant="outline"
                  className="w-full border-[#F48221]/40 text-[#F48221] hover:bg-[#F48221]/5 disabled:opacity-60"
                  onClick={handleHighlight}
                  disabled={isCurrentlyHighlighted || isHighlighting}
                >
                  <Star className="h-4 w-4 mr-2" />
                  {isCurrentlyHighlighted
                    ? "Ya destacada"
                    : isHighlighting
                      ? "Redirigiendo al pago..."
                      : "Destacar oferta 24h - 2,5€"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Apply Button */}
      {!isBusinessOwner && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <div className="container mx-auto max-w-3xl">
            {puedeInscribirse ? (
              <Button
                onClick={handleApply}
                className="w-full bg-primary hover:bg-primary/90"
                size="lg"
                disabled={isApplying}
              >
                {isApplying ? "Enviando..." : "Me interesa la Oferta"}
              </Button>
            ) : seleccionado ? (
              // El establecimiento ya respondió: se acabó la espera, y lo útil
              // aquí es hablar con él, no cancelar.
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 rounded-md bg-green-50 py-2.5 text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Te han seleccionado</span>
                </div>
                <Button onClick={handleContactBusiness} variant="outline" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Hablar con la empresa
                </Button>
              </div>
            ) : descartado ? (
              <div className="flex items-center justify-center gap-2 rounded-md bg-muted py-3 text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">No te han seleccionado en esta oferta</span>
              </div>
            ) : finalizado ? (
              <div className="flex items-center justify-center gap-2 rounded-md bg-muted py-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Trabajo finalizado</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Button disabled className="w-full bg-green-600 hover:bg-green-600">
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {conEntrevista ? "Entrevista propuesta" : "Candidatura Enviada"}
                </Button>
                {puedeRetirarse && (
                  <Button
                    variant="outline"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/5"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {isWithdrawing ? "Cancelando..." : "Ya no me interesa"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <StripePaymentDialog
        clientSecret={pago?.clientSecret ?? null}
        resumen={pago?.resumen ?? null}
        returnUrl={
          typeof window !== "undefined" && pago
            ? `${window.location.origin}/micropayment/success?mp_id=${pago.micropaymentId}`
            : ""
        }
        onClose={() => setPago(null)}
        onSuccess={() => {
          if (!pago) return
          router.push(`/micropayment/success?mp_id=${pago.micropaymentId}`)
        }}
      />
    </div>
  )
}
