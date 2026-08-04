"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Star, Briefcase, MessageCircle, Heart, CalendarCheck,
  Globe, Clock, Award, Image as ImageIcon, Video, Loader2, FileText, ChevronRight
} from "lucide-react"
import useSWR from "swr"
import { PortfolioImageViewer } from "@/components/portfolio-image-viewer"
import { PortfolioVideoViewer } from "@/components/portfolio-video-viewer"
import { InterviewRequestDialog } from "@/components/interview-request-dialog"
import { RatingSummary } from "@/components/rating-summary"
import { computeDisplayStatus } from "@/lib/profile-status"
import { saveProfileAction } from "@/lib/actions"
import { isProfileSaved } from "@/lib/supabase/queries"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ProfileDetailContentProps {
  id: string
  viewerId?: string | null
  viewerType?: "worker" | "business" | "admin" | null
}

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: "Completo",
  part_time: "Parcial",
  flash_offer: "Extra",
  one_time_event: "Prácticas",
  indefinite: "Indefinido",
  temporal: "Temporal",
  extra: "Extra",
  parcial: "Parcial",
  completo: "Completo",
  practicas: "Prácticas",
  "prácticas": "Prácticas",
}

const RATING_CRITERIA = [
  { keys: ["punctuality", "puntualidad"], label: "Puntualidad" },
  { keys: ["attitude", "actitud"], label: "Actitud y predisposición" },
  { keys: ["learning_speed", "rapidez_aprendizaje"], label: "Rapidez de aprendizaje" },
  { keys: ["problem_solving", "resolucion_problemas"], label: "Resolución de problemas" },
  { keys: ["hygiene", "higiene"], label: "Higiene y presentación" },
  { keys: ["team_adaptation", "adaptacion_equipo"], label: "Adaptación al equipo" },
  { keys: ["contract_fulfillment", "cumplimiento_contrato"], label: "Cumplimiento del contrato" },
]

export function ProfileDetailContent({ id, viewerId, viewerType }: ProfileDetailContentProps) {
  const router = useRouter()
  const [savedProfile, setSavedProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)

  // Fetch real profile data from Supabase
  const { data: profileData, isLoading } = useSWR(`/api/profile/${id}`, fetcher)
  const worker = profileData?.data

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Perfil no encontrado</h1>
          <p className="text-muted-foreground mb-4">Este perfil no existe o fue eliminado.</p>
          <Button asChild><Link href="/candidates">Ver candidatos</Link></Button>
        </div>
      </div>
    )
  }

  const isBusinessViewer = viewerType === "business" && viewerId !== id

  useEffect(() => {
    if (!isBusinessViewer || !viewerId) return
    let mounted = true
    const loadSaved = async () => {
      const { isSaved } = await isProfileSaved(viewerId, id)
      if (mounted) setSavedProfile(isSaved)
    }
    loadSaved()
    return () => {
      mounted = false
    }
  }, [isBusinessViewer, viewerId, id])

  const specialties: string[] = (() => {
    try {
      if (Array.isArray(worker.specialties)) return worker.specialties
      if (typeof worker.specialties === "string") return JSON.parse(worker.specialties)
      return []
    } catch { return [] }
  })()
  const languages: string[] = (() => {
    try {
      let raw = worker.languages
      if (typeof raw === "string") raw = JSON.parse(raw)
      if (!Array.isArray(raw)) return []
      return raw.map((l: any) =>
        typeof l === "string" ? l : [l.name || l.language, l.level].filter(Boolean).join(" - ")
      )
    } catch { return [] }
  })()
  const contractTypes: string[] = (() => {
    try {
      if (Array.isArray(worker.contract_type_sought)) return worker.contract_type_sought
      if (typeof worker.contract_type_sought === "string") return JSON.parse(worker.contract_type_sought)
      return []
    } catch { return [] }
  })()
  const portfolioImages: string[] = Array.isArray(worker.portfolio_images) ? worker.portfolio_images : []
  const portfolioVideos: string[] = Array.isArray(worker.portfolio_videos) ? worker.portfolio_videos : []
  // First portfolio video doubles as the "vídeo de presentación" - a
  // distinct, featured slot instead of a parallel upload system.
  const presentationVideo = portfolioVideos[0] || null
  const otherVideos = portfolioVideos.slice(1)

  const skills = Array.isArray(worker.skills) ? worker.skills : []
  const workExperience = Array.isArray(worker.work_experience) ? worker.work_experience : []
  const certifications: string[] = Array.isArray(worker.certificates) ? worker.certificates : []
  const badges: string[] = Array.isArray(worker.badges) ? worker.badges : []
  const ratingCriteriaSummary: Record<string, number> = worker.rating_criteria_summary || {}
  const roles = specialties.length > 0 ? specialties : worker.job_category ? [worker.job_category] : ["Sin categoría"]
  const contractTypeNames = contractTypes
    .map((ct) => CONTRACT_TYPE_LABELS[ct] || ct)
    .filter(Boolean)
  const activelySearching =
    worker.availability_status === "available" || worker.has_open_application || worker.has_active_interview
  const criteriaFields = RATING_CRITERIA.map((criteria) => ({
    label: criteria.label,
    value: criteria.keys
      .map((key) => ratingCriteriaSummary[key])
      .find((value) => typeof value === "number") as number | undefined,
  }))

  const avail = computeDisplayStatus({
    selfReported: worker.availability_status,
    hasActiveInterview: Boolean(worker.has_active_interview),
    hasOpenApplication: Boolean(worker.has_open_application),
  })

  const birthDate = worker.date_of_birth
    ? new Date(worker.date_of_birth).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    : null

  const handleToggleSave = async () => {
    if (!viewerId) {
      router.push(`/auth/login?redirect=/profile/${id}`)
      return
    }
    if (!isBusinessViewer) {
      toast.error("Solo empresas pueden guardar perfiles")
      return
    }

    setSavingProfile(true)
    const result = await saveProfileAction(id)
    setSavingProfile(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    const saved = Boolean(result.saved)
    setSavedProfile(saved)
    toast.success(saved ? "Perfil guardado" : "Perfil eliminado de guardados")
  }

  const handleMessage = () => {
    if (!viewerId) {
      router.push(`/auth/login?redirect=/profile/${id}`)
      return
    }
    router.push(`/messages?candidateId=${worker.id}&candidateName=${encodeURIComponent(worker.display_name)}`)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero - avatar */}
      <div className="relative w-full aspect-[9/12] max-h-[50vh] bg-black overflow-hidden">
        {worker.avatar_url ? (
          <img src={worker.avatar_url} alt={worker.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#01A89E]/20 to-[#01A89E]/5 flex items-center justify-center">
            <div className="h-28 w-28 rounded-full bg-white/80 flex items-center justify-center text-4xl font-bold text-[#01A89E]">
              {(worker.display_name || "?")[0]?.toUpperCase()}
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20 pointer-events-none" />

        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" className="bg-black/40 text-white hover:bg-black/60 rounded-full" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          {isBusinessViewer && (
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${savedProfile ? "bg-red-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
              onClick={handleToggleSave}
              disabled={savingProfile}
            >
              <Heart className={`h-5 w-5 ${savedProfile ? "fill-white" : ""}`} />
            </Button>
          )}
        </div>

        <div className="absolute top-14 left-4 flex flex-col gap-1.5 z-10">
          {worker.is_premium && (
            <Badge className="bg-[#F5A623]/90 text-white border-0 text-xs px-2.5 py-1">
              <Award className="h-3.5 w-3.5 mr-1" /> Premium
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 text-white">
          <h1 className="text-2xl font-bold">{worker.display_name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((role: string, index: number) => (
              <Badge key={index} className="bg-white/15 text-white border-0 text-[11px] py-1 px-2">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ubicación</p>
                <p className="mt-1 text-base font-semibold">{worker.location || "No indicada"}</p>
              </div>
              <Badge className={`${avail.color} border-0 text-xs px-2.5 py-1`}>{avail.label}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Años de experiencia</p>
              <p className="mt-2 text-xl font-semibold">{worker.experience_years ? `${worker.experience_years} años` : "Sin datos"}</p>
            </CardContent>
          </Card>
          <Link href={`/profile/${id}/ratings`} className="block">
            <Card className="h-full hover:border-primary transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valoraciones</p>
                    <p className="mt-2 text-xl font-semibold">{worker.rating > 0 ? worker.rating.toFixed(1) : "—"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-muted-foreground">{worker.total_ratings || 0}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">Solo establecimientos que han contratado al trabajador pueden valorar</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tipo de contrato buscado</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {contractTypeNames.length > 0 ? (
                  contractTypeNames.map((contractType) => (
                    <Badge key={contractType} variant="secondary" className="rounded-full px-3 py-1">
                      {contractType}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No especificado</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#01A89E]/10 text-[#01A89E] border-0 text-xs px-2.5 py-1">Buscando activamente</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {activelySearching
                  ? "El candidato está activo en la plataforma y responde rápidamente a ofertas."
                  : "Actualmente no hay actividad reciente en su búsqueda."}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Criterios de valoración</h3>
                <p className="text-sm text-muted-foreground">1 a 5 estrellas según empresas que han contratado</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Real</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {criteriaFields.map((criteria) => (
                <div key={criteria.label} className="rounded-3xl border border-[#E5E7EB] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{criteria.label}</p>
                    <span className="text-sm text-muted-foreground">{criteria.value ? criteria.value.toFixed(1) : "—"}</span>
                  </div>
                  <div className="mt-3">
                    <RatingSummary rating={criteria.value || 0} totalRatings={0} showDetails={false} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valoración media real de empresas</p>
                <p className="mt-2 text-2xl font-semibold">{worker.rating > 0 ? worker.rating.toFixed(1) : "Sin datos"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-muted-foreground">{worker.total_ratings || 0} valoraciones</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {isBusinessViewer && (
            <Button
              className="h-14 rounded-2xl font-semibold bg-[#01A89E] hover:bg-[#018F86] text-white"
              onClick={() => setShowInterviewDialog(true)}
            >
              <CalendarCheck className="h-4 w-4 mr-2" /> Solicitar entrevista
            </Button>
          )}
          <Button
            variant="outline"
            className="h-14 rounded-2xl font-semibold"
            onClick={handleMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Enviar mensaje
          </Button>
        </div>

        {certifications.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Certificados verificados</h3>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full px-3 py-1">
                    {typeof cert === "string" ? cert : JSON.stringify(cert)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {badges.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Insignias</h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <Badge key={index} className="rounded-full px-3 py-1 bg-[#F5A623]/10 text-[#A16207] border-0">
                    {badge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nivel de gamificación</p>
              <p className="mt-2 text-2xl font-semibold">{worker.level ? `Nivel ${worker.level}` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Puntos acumulados</p>
              <p className="mt-2 text-2xl font-semibold">{worker.points != null ? `${worker.points} pts` : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {portfolioImages.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#01A89E]" />
                  <h3 className="font-semibold">Galería</h3>
                </div>
                <span className="text-xs text-muted-foreground">{portfolioImages.length} imágenes</span>
              </div>
              <PortfolioImageViewer images={portfolioImages} />
            </CardContent>
          </Card>
        )}

        {presentationVideo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Video className="h-4 w-4 text-[#01A89E]" />
                <h3 className="font-semibold">Vídeo de presentación</h3>
              </div>
              <PortfolioVideoViewer videos={[presentationVideo]} reel />
            </CardContent>
          </Card>
        )}

        {worker.bio && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Sobre mí</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{worker.bio}</p>
            </CardContent>
          </Card>
        )}

        {workExperience.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Experiencia</h3>
              <div className="space-y-3">
                {workExperience.map((exp: any, i: number) => (
                  <div key={i} className="rounded-3xl border border-[#E5E7EB] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{exp.position}{exp.company ? ` · ${exp.company}` : ""}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exp.startDate || "?"} - {exp.current ? "Actualidad" : exp.endDate || "?"}</p>
                      </div>
                      <Badge className="bg-[#01A89E]/10 text-[#0F766E] border-0 text-xs py-1 px-2">
                        {exp.current ? "Actual" : "Anterior"}
                      </Badge>
                    </div>
                    {exp.description && <p className="mt-3 text-sm text-muted-foreground">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Tipo de contrato buscado</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {contractTypeNames.length > 0 ? contractTypeNames.map((contractType: string) => (
                    <Badge key={contractType} variant="secondary" className="rounded-full px-3 py-1">
                      {contractType}
                    </Badge>
                  )) : (
                    <span className="text-sm text-muted-foreground">Sin datos</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Búsqueda activa</p>
                <div className="mt-2">
                  <Badge className="bg-[#01A89E]/10 text-[#0F766E] border-0 text-sm px-3 py-1">
                    {activelySearching ? "Sí, activo" : "No activo"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activelySearching ? "El candidato revisa ofertas y responde rápido." : "No hay señales recientes de búsqueda activa."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isBusinessViewer && (
        <InterviewRequestDialog
          open={showInterviewDialog}
          onOpenChange={setShowInterviewDialog}
          workerId={id}
          workerName={worker.display_name}
        />
      )}
    </div>
  )
}
