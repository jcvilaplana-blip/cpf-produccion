"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Star, Briefcase, MessageCircle, Heart, CalendarCheck,
  Globe, Clock, Award, Image as ImageIcon, Video, Loader2, FileText, ChevronRight, X
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
  initialProfile?: any
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

export function ProfileDetailContent({ id, viewerId, viewerType, initialProfile }: ProfileDetailContentProps) {
  const router = useRouter()
  const [savedProfile, setSavedProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const { data: profileData, isLoading } = useSWR(
    `/api/profile/${id}`,
    fetcher,
    {
      fallbackData: initialProfile ? { data: initialProfile } : undefined,
    }
  )

  const worker = profileData?.data

  if (!worker && isLoading) {
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
  const galleryImages = portfolioImages.slice(0, 6)

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

  useEffect(() => {
    if (!isVideoOpen || !videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play().catch(() => {})
    setIsVideoPlaying(true)
  }, [isVideoOpen])

  const handleCloseVideo = () => {
    setIsVideoOpen(false)
    if (videoRef.current) {
      videoRef.current.pause()
      setIsVideoPlaying(false)
    }
  }

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
      <section className="relative overflow-hidden">
        <div className="relative h-[52vh] min-h-[340px] bg-slate-950">
          {worker.avatar_url ? (
            <img src={worker.avatar_url} alt={worker.display_name} className="absolute inset-0 h-full w-full object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#01A89E]/30 to-[#01A89E]/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />

          <div className="absolute top-4 left-4 z-10">
            <Button variant="ghost" size="icon" className="bg-slate-900/70 text-white hover:bg-slate-900/90 rounded-full" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute top-4 right-4 z-10">
            {isBusinessViewer && (
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${savedProfile ? "bg-red-500 text-white" : "bg-slate-900/70 text-white hover:bg-slate-900/90"}`}
                onClick={handleToggleSave}
                disabled={savingProfile}
              >
                <Heart className={`h-5 w-5 ${savedProfile ? "fill-white" : ""}`} />
              </Button>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
            <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-white/95 px-5 py-6 shadow-2xl backdrop-blur-lg">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Perfil profesional</p>
                  <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{worker.display_name}</h1>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roles.map((role: string, index: number) => (
                      <Badge key={index} className="rounded-full bg-slate-100 text-slate-700 border-0 px-3 py-1 text-sm">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ubicación</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{worker.location || "No indicada"}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 px-4 py-3 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Experiencia</p>
                    <p className="mt-2 text-base font-semibold text-slate-900">{worker.experience_years ? `${worker.experience_years} años` : "Sin datos"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-4 space-y-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Valoración media</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-4xl font-bold text-slate-900">{worker.rating > 0 ? worker.rating.toFixed(1) : "—"}</div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span>{worker.total_ratings || 0} valoraciones</span>
                    </div>
                  </div>
                </div>
                <Link href={`/profile/${id}/ratings`} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100">
                  Ver valoraciones y reseñas
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-[#ECFDF5] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Tipo contrato</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {contractTypeNames.length > 0 ? (
                        contractTypeNames.map((contractType) => (
                          <Badge key={contractType} className="rounded-full bg-white text-slate-800 border border-slate-200 px-3 py-1 text-sm">
                            {contractType}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-slate-600">No especificado</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-[#EFF6FF] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-700">Búsqueda activa</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{activelySearching ? "Sí" : "No"}</p>
                    <p className="mt-2 text-sm text-slate-600">{activelySearching ? "Responde rápido a nuevas propuestas." : "Sin actividad reciente."}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Criterios de valoración</p>
                <p className="mt-1 text-sm text-slate-700">Puntualidad, actitud, rapidez, resolución, higiene, adaptación y cumplimiento</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">1–5 estrellas</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {criteriaFields.map((criteria) => (
                <div key={criteria.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{criteria.label}</p>
                    <span className="text-sm text-slate-600">{criteria.value ? criteria.value.toFixed(1) : "—"}</span>
                  </div>
                  <div className="mt-3">
                    <RatingSummary rating={criteria.value || 0} totalRatings={0} showDetails={false} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {isBusinessViewer && (
            <Button
              className="h-14 rounded-2xl bg-[#01A89E] text-white font-semibold shadow-lg hover:bg-[#018F86]"
              onClick={() => setShowInterviewDialog(true)}
            >
              <CalendarCheck className="h-4 w-4 mr-2" /> Solicitar entrevista
            </Button>
          )}
          <Button
            variant="outline"
            className="h-14 rounded-2xl font-semibold border-slate-300 text-slate-900"
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
                  <Badge key={index} className="rounded-full bg-slate-100 text-slate-700 border-0 px-3 py-1 text-sm">
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
                  <Badge key={index} className="rounded-full bg-[#FEF3C7] text-[#92400E] border-0 px-3 py-1 text-sm">
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
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Nivel</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{worker.level ? `Nivel ${worker.level}` : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Puntos acumulados</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{worker.points != null ? `${worker.points} pts` : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {galleryImages.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[#01A89E]" />
                  <h3 className="font-semibold">Galería</h3>
                </div>
                <span className="text-xs text-muted-foreground">Hasta 6 imágenes</span>
              </div>
              <PortfolioImageViewer images={galleryImages} />
            </CardContent>
          </Card>
        )}

        {presentationVideo && (
          <Card className="overflow-hidden rounded-[2rem]">
            <div className="relative aspect-[16/9] bg-black">
              <video
                src={presentationVideo}
                muted
                preload="metadata"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="rounded-full bg-white/90 p-4 shadow-lg">
                  <Video className="h-6 w-6 text-black" />
                </div>
              </button>
              <div className="absolute bottom-4 left-4 text-white">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Vídeo de presentación</p>
                <p className="text-lg font-semibold">{worker.display_name}</p>
              </div>
            </div>
          </Card>
        )}

        {isVideoOpen && presentationVideo && (
          <div className="fixed inset-0 z-50 bg-black/95 p-4 flex items-center justify-center">
            <button
              type="button"
              onClick={handleCloseVideo}
              className="absolute top-4 right-4 z-20 rounded-full bg-white/10 text-white p-2 hover:bg-white/20"
              aria-label="Cerrar video"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full max-w-3xl aspect-[16/9] rounded-[2rem] overflow-hidden bg-black shadow-2xl">
              <video
                ref={videoRef}
                src={presentationVideo}
                controls
                playsInline
                className="w-full h-full object-cover"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
            </div>
          </div>
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
                  <div key={i} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{exp.position}{exp.company ? ` · ${exp.company}` : ""}</p>
                        <p className="text-xs text-muted-foreground mt-1">{exp.startDate || "?"} - {exp.current ? "Actualidad" : exp.endDate || "?"}</p>
                      </div>
                      <Badge className="bg-[#E6FFFA] text-[#0F766E] border-0 text-xs py-1 px-2">
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
                    <Badge key={contractType} className="rounded-full bg-[#F8FAFC] text-[#0F766E] border-0 px-3 py-1 text-sm">
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
                  <Badge className={`rounded-full px-3 py-1 text-sm ${activelySearching ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
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
      </section>

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
