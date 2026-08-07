"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  ArrowLeft, MapPin, Star, Briefcase, MessageCircle, Heart, CalendarCheck,
  Award, Image as ImageIcon, Loader2, ChevronRight, X, Play, Pause,
  BadgeCheck, Trophy, Sparkles, Radio, FileText, Zap,
  Languages as LanguagesIcon, Download, CalendarDays, Video, Wrench,
} from "lucide-react"
import useSWR from "swr"
import { PortfolioImageViewer } from "@/components/portfolio-image-viewer"
import { InterviewRequestDialog } from "@/components/interview-request-dialog"
import { computeDisplayStatus } from "@/lib/profile-status"
import { RATING_CRITERIA, readCriterion } from "@/lib/rating-criteria"
import { saveProfileAction } from "@/lib/actions"
import { isProfileSaved } from "@/lib/supabase/queries"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CONTRACT_TYPE_LABELS, contractTypeLabel } from "@/lib/profile-constants"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ProfileDetailContentProps {
  id: string
  viewerId?: string | null
  viewerType?: "worker" | "business" | "admin" | null
  initialProfile?: any
}

// Los chips de esta ficha son estrechos, así que unos pocos tipos se abrevian.
// El resto -incluidos `weekend`, `seasonal` y `freelance`, que antes se
// mostraban en inglés- sale del mapa común.
const CONTRACT_CHIP_LABELS: Record<string, string> = {
  ...CONTRACT_TYPE_LABELS,
  full_time: "Completo",
  part_time: "Parcial",
  flash_offer: "Extra",
  parcial: "Parcial",
  completo: "Completo",
}


/** Parses a DB column that may arrive as an array, a JSON string, or null. */
function parseList(raw: unknown): any[] {
  try {
    if (Array.isArray(raw)) return raw.filter(Boolean)
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter(Boolean) : []
    }
    return []
  } catch {
    return []
  }
}

/** Media columns hold either plain URLs or `{ url }` objects. */
function parseMediaList(raw: unknown): string[] {
  return parseList(raw)
    .map((item) => (typeof item === "string" ? item : item?.url || item?.src || ""))
    .filter(Boolean)
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5"
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm", className)}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-[#01A89E]" />}
            <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function ProfileDetailContent({ id, viewerId, viewerType, initialProfile }: ProfileDetailContentProps) {
  const router = useRouter()
  const [savedProfile, setSavedProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  // Qué vídeo hay abierto en el reel, no si hay uno abierto: el mismo
  // reproductor sirve ahora al de presentación y a los adicionales.
  const [videoAbierto, setVideoAbierto] = useState<string | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showVideoOverlay, setShowVideoOverlay] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const isBusinessViewer = viewerType === "business" && viewerId !== id

  const { data: profileData, isLoading } = useSWR(`/api/profile/${id}`, fetcher, {
    fallbackData: initialProfile ? { data: initialProfile } : undefined,
  })

  const worker = profileData?.data

  // --- Hooks must all run before any early return (rules of hooks) ---
  useEffect(() => {
    if (!isBusinessViewer || !viewerId) return
    let mounted = true
    isProfileSaved(viewerId, id).then(({ isSaved }) => {
      if (mounted) setSavedProfile(isSaved)
    })
    return () => {
      mounted = false
    }
  }, [isBusinessViewer, viewerId, id])

  useEffect(() => {
    if (!videoAbierto || !videoRef.current) return
    const el = videoRef.current
    el.currentTime = 0
    el.play().catch(() => {})
    setShowVideoOverlay(false)
  }, [videoAbierto])

  // Body scroll lock while the reel is open, so the page behind doesn't move.
  useEffect(() => {
    if (!videoAbierto) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [videoAbierto])

  const handleCloseVideo = useCallback(() => {
    videoRef.current?.pause()
    setIsVideoPlaying(false)
    setVideoAbierto(null)
  }, [])

  const toggleVideoPlayback = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => {})
    } else {
      el.pause()
    }
  }, [])

  const handleRequestInterview = useCallback(() => {
    if (!viewerId) {
      router.push(`/auth/login?redirect=/profile/${id}`)
      return
    }
    if (!isBusinessViewer) {
      toast.error("Solo las empresas pueden solicitar entrevistas")
      return
    }
    setShowInterviewDialog(true)
  }, [viewerId, isBusinessViewer, router, id])

  const handleToggleSave = useCallback(async () => {
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
    toast.success(saved ? "Perfil guardado en tus favoritos" : "Perfil eliminado de guardados")
  }, [viewerId, isBusinessViewer, router, id])

  const handleMessage = useCallback(() => {
    if (!viewerId) {
      router.push(`/auth/login?redirect=/profile/${id}`)
      return
    }
    router.push(
      `/messages?candidateId=${worker?.id}&candidateName=${encodeURIComponent(worker?.display_name || "")}`
    )
  }, [viewerId, router, id, worker?.id, worker?.display_name])

  if (!worker && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 pb-20">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Perfil no encontrado</h1>
          <p className="mb-4 text-muted-foreground">Este perfil no existe o fue eliminado.</p>
          <Button asChild>
            <Link href="/candidates">Ver candidatos</Link>
          </Button>
        </div>
      </div>
    )
  }

  // --- Derived data ---
  const specialties: string[] = parseList(worker.specialties).filter((s) => typeof s === "string")
  const contractTypes: string[] = parseList(worker.contract_type_sought).filter((s) => typeof s === "string")
  const portfolioImages = parseMediaList(worker.portfolio_images)
  const portfolioVideos = parseMediaList(worker.portfolio_videos)

  // The first portfolio video doubles as the "vídeo de presentación" uploaded
  // during candidate registration - a featured slot, not a parallel system.
  const presentationVideo = portfolioVideos[0] || null
  const extraVideos = portfolioVideos.slice(1)
  const galleryImages = portfolioImages.slice(0, 6)

  const certifications: any[] = parseList(worker.certificates)
  const badges: any[] = parseList(worker.badges)
  const workExperience = parseList(worker.work_experience)
  const skills: string[] = parseList(worker.skills).filter((s) => typeof s === "string")
  const languages: string[] = parseList(worker.languages).map((l: any) =>
    typeof l === "string" ? l : [l?.name || l?.language, l?.level].filter(Boolean).join(" · ")
  ).filter(Boolean)
  const ratingCriteriaSummary: Record<string, number> = worker.rating_criteria_summary || {}

  const age: number | null = (() => {
    if (!worker.date_of_birth) return null
    const birth = new Date(worker.date_of_birth)
    if (Number.isNaN(birth.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    const monthDiff = now.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) years -= 1
    return years >= 0 && years < 120 ? years : null
  })()

  const memberSince = worker.created_at
    ? new Date(worker.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : null

  const roles = specialties.length > 0 ? specialties : worker.job_category ? [worker.job_category] : []
  const contractTypeNames = contractTypes.map((ct) => CONTRACT_CHIP_LABELS[ct] || contractTypeLabel(ct)).filter(Boolean)

  const avail = computeDisplayStatus({
    selfReported: worker.availability_status,
    hasActiveInterview: Boolean(worker.has_active_interview),
    hasOpenApplication: Boolean(worker.has_open_application),
  })
  const activelySearching =
    worker.availability_status === "available" || worker.has_open_application || worker.has_active_interview

  const criteriaFields = RATING_CRITERIA.map((criteria) => ({
    label: criteria.label,
    value: readCriterion(ratingCriteriaSummary, criteria),
  }))

  const rating: number = typeof worker.rating === "number" ? worker.rating : 0
  const totalRatings: number = worker.total_ratings || 0
  const experienceYears: number | null =
    typeof worker.experience_years === "number" ? worker.experience_years : null

  /** Sections 6/17 and 7/18 are requested twice: as a summary near the top and
   *  again as detail at the end of the sheet. */
  const contractChips = (
    <div className="flex flex-wrap gap-2">
      {contractTypeNames.length > 0 ? (
        contractTypeNames.map((contractType) => (
          <Badge
            key={contractType}
            className="rounded-full border border-[#01A89E]/25 bg-[#01A89E]/10 px-3 py-1 text-[13px] font-medium text-[#00776F]"
          >
            {contractType}
          </Badge>
        ))
      ) : (
        <span className="text-sm text-slate-500">No especificado</span>
      )}
    </div>
  )

  const activeSearchBlock = (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
          activelySearching ? "bg-emerald-100" : "bg-slate-100"
        )}
      >
        <Radio className={cn("h-5 w-5", activelySearching ? "text-emerald-600" : "text-slate-400")} />
        {activelySearching && (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-slate-900">
            {activelySearching ? "Buscando activamente" : "No busca activamente"}
          </p>
          <Badge className={cn("rounded-full border-0 px-2.5 py-0.5 text-[12px] font-medium", avail.color)}>
            {avail.label}
          </Badge>
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-slate-500">
          {activelySearching
            ? "Revisa ofertas y responde rápido a nuevas propuestas."
            : "Sin señales recientes de búsqueda activa."}
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 1 + 2 — Header: foto de perfil con nombre y tipos de empleo dentro */}
      <header className="relative">
        <div className="relative aspect-[3/4] max-h-[74vh] w-full overflow-hidden bg-slate-900 sm:aspect-[16/10]">
          {worker.avatar_url ? (
            <img
              src={worker.avatar_url}
              alt={worker.display_name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#01A89E] to-[#015F59]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/20" />

          {/* Safe-area aware top bar */}
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-md active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {isBusinessViewer && (
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={savingProfile}
                aria-label={savedProfile ? "Quitar de guardados" : "Guardar perfil"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors active:scale-95",
                  savedProfile ? "bg-rose-500 text-white" : "bg-slate-950/45 text-white"
                )}
              >
                <Heart className={cn("h-5 w-5", savedProfile && "fill-current")} />
              </button>
            )}
          </div>

          {/* Nombre + tipos de empleo, directamente sobre la imagen */}
          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6">
            <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
              {worker.display_name}
            </h1>
            {roles.length > 0 && (
              <p className="mt-1.5 text-[16px] font-medium leading-snug text-white/90 drop-shadow-sm">
                {roles.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        {/* 3 — Ubicación */}
        <Section>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#01A89E]/10">
              <MapPin className="h-5 w-5 text-[#01A89E]" />
            </span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Ubicación</p>
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {worker.location || "No especificada"}
              </p>
            </div>
          </div>
        </Section>

        {/* 4 + 5 — Experiencia (izquierda) y valoraciones reales (derecha) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#01A89E]" />
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Experiencia</p>
            </div>
            <p className="mt-2 text-3xl font-bold leading-none text-slate-900">
              {experienceYears !== null ? experienceYears : "—"}
              {experienceYears !== null && (
                <span className="ml-1 text-sm font-semibold text-slate-500">
                  {experienceYears === 1 ? "año" : "años"}
                </span>
              )}
            </p>
            <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
              {experienceYears !== null ? "en hostelería" : "Sin datos"}
            </p>
          </div>

          <Link
            href={`/profile/${id}/ratings`}
            className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors active:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Valoración
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" />
            </div>
            <p className="mt-2 text-3xl font-bold leading-none text-slate-900">
              {totalRatings > 0 ? rating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5">
              <Stars value={rating} />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">
              {totalRatings} {totalRatings === 1 ? "valoración" : "valoraciones"}
            </p>
          </Link>
        </div>

        {/* 6 — Tipo de contrato que busca */}
        <Section icon={FileText} title="Tipo de contrato que busca">
          {contractChips}
        </Section>

        {/* 7 — Indicador de búsqueda activa */}
        <Section>{activeSearchBlock}</Section>

        {/* Criterios de valoración (1 a 5 estrellas) */}
        <Section
          icon={Sparkles}
          title="Criterios de valoración"
          action={
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-500">
              1–5 ★
            </span>
          }
        >
          <div className="divide-y divide-slate-100">
            {criteriaFields.map((criteria) => (
              <div key={criteria.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <p className="min-w-0 flex-1 text-[14px] leading-snug text-slate-700">{criteria.label}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <Stars value={criteria.value || 0} />
                  <span className="w-7 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                    {criteria.value ? criteria.value.toFixed(1) : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 8 — Valoración media real de empresas */}
        <Section>
          <div className="flex items-center gap-4">
            <div className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60">
              <span className="text-[28px] font-bold leading-none text-slate-900">
                {totalRatings > 0 ? rating.toFixed(1) : "—"}
              </span>
              <span className="mt-0.5 text-[12px] font-medium uppercase tracking-wider text-amber-700">
                media
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-slate-900">Valoración media de empresas</p>
              <div className="mt-1.5">
                <Stars value={rating} size="md" />
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
                {totalRatings > 0
                  ? `Basada en ${totalRatings} ${totalRatings === 1 ? "valoración real" : "valoraciones reales"} de establecimientos que le han contratado.`
                  : "Aún no tiene valoraciones. Solo los establecimientos que le hayan contratado pueden valorarle."}
              </p>
            </div>
          </div>
          <Link
            href={`/profile/${id}/ratings`}
            className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-900 active:bg-slate-100"
          >
            Ver valoraciones y reseñas
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        </Section>

        {/* 9 — CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleRequestInterview}
            className="h-[58px] rounded-2xl bg-[#01A89E] text-[15px] font-semibold text-white shadow-lg shadow-[#01A89E]/25 hover:bg-[#018F86] active:scale-[0.98]"
          >
            <CalendarCheck className="mr-1.5 h-[18px] w-[18px]" />
            Pedir entrevista
          </Button>
          <Button
            variant="outline"
            onClick={handleMessage}
            className="h-[58px] rounded-2xl border-slate-300 bg-white text-[15px] font-semibold text-slate-900 active:scale-[0.98]"
          >
            <MessageCircle className="mr-1.5 h-[18px] w-[18px]" />
            Enviar mensaje
          </Button>
        </div>
        {!isBusinessViewer && (
          <p className="px-1 text-[12px] leading-snug text-slate-500">
            Solo las cuentas de empresa pueden solicitar entrevistas y guardar candidatos. Inicia sesión con una
            cuenta de establecimiento.
          </p>
        )}

        {/* 10 — Certificados verificados */}
        {certifications.length > 0 && (
          <Section icon={BadgeCheck} title="Certificados verificados">
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, index) => (
                <Badge
                  key={index}
                  className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-medium text-emerald-800"
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {typeof cert === "string" ? cert : cert?.name || cert?.title || ""}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* 11 — Insignias */}
        {badges.length > 0 && (
          <Section icon={Award} title="Insignias">
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-800"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {typeof badge === "string" ? badge : badge?.name || ""}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* 12 — Nivel y puntos de gamificación */}
        <Section icon={Trophy} title="Nivel y puntos">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-[#01A89E]/10 to-[#01A89E]/5 p-3.5">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#00776F]">Nivel</p>
              <p className="mt-1.5 text-2xl font-bold leading-none text-slate-900">
                {worker.level ? worker.level : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-violet-100/70 to-violet-50 p-3.5">
              <p className="flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.14em] text-violet-700">
                <Zap className="h-3 w-3" /> Puntos
              </p>
              <p className="mt-1.5 text-2xl font-bold leading-none text-slate-900">
                {worker.points != null ? worker.points : "—"}
              </p>
            </div>
          </div>
        </Section>

        {/* 13 — Galería (hasta 6 imágenes) */}
        {galleryImages.length > 0 && (
          <Section
            icon={ImageIcon}
            title="Galería"
            action={
              <span className="text-[12px] text-slate-400">
                {galleryImages.length}/6
              </span>
            }
          >
            <PortfolioImageViewer images={galleryImages} />
          </Section>
        )}
        {/* 14 — Vídeo de presentación, apaisado y al ancho de la galería.
            Va dentro del mismo `main` que el resto: cuando estaba en un bloque
            aparte, entre dos `<main>`, quedaba fuera del `space-y-3` que marca
            el ritmo vertical de la página y se abría un hueco desproporcionado
            justo encima. `-mx-4` lo saca a sangre completa en móvil sin romper
            ese ritmo. Mismo tratamiento que el vídeo del establecimiento. */}
        {presentationVideo && (
          <div className="-mx-4 sm:mx-0">
            <button
              type="button"
              onClick={() => setVideoAbierto(presentationVideo)}
              className="relative block w-full overflow-hidden bg-black sm:rounded-3xl"
              aria-label="Reproducir vídeo de presentación"
            >
              {/* `#t=0.1` fuerza a los navegadores móviles a pintar el primer
                  fotograma como portada. */}
              <video
                src={`${presentationVideo}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
              <span className="absolute left-1/2 top-1/2 flex h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-2xl">
                <Play className="ml-1 h-7 w-7 fill-slate-900 text-slate-900" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/70">
                  Vídeo de presentación
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{worker.display_name}</p>
              </div>
            </button>
          </div>
        )}

        {/* 15 — Sobre mí */}
        {worker.bio && (
          <Section icon={MessageCircle} title="Sobre mí">
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">{worker.bio}</p>
          </Section>
        )}

        {/* 16 — Experiencia */}
        {workExperience.length > 0 && (
          <Section icon={Briefcase} title="Experiencia">
            <div className="space-y-2.5">
              {workExperience.map((exp: any, i: number) => (
                <div key={i} className="rounded-2xl border border-slate-200 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold leading-snug text-slate-900">{exp.position}</p>
                      {exp.company && <p className="text-[13px] text-slate-600">{exp.company}</p>}
                      <p className="mt-1 text-[12px] text-slate-400">
                        {exp.startDate || "?"} — {exp.current ? "Actualidad" : exp.endDate || "?"}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0 rounded-full border-0 px-2.5 py-0.5 text-[12px] font-medium",
                        exp.current ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {exp.current ? "Actual" : "Anterior"}
                    </Badge>
                  </div>
                  {exp.description && (
                    <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Idiomas */}
        {languages.length > 0 && (
          <Section icon={LanguagesIcon} title="Idiomas">
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <Badge
                  key={language}
                  className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[13px] font-medium text-blue-800"
                >
                  {language}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Habilidades */}
        {skills.length > 0 && (
          <Section icon={Wrench} title="Habilidades">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {/* Ficha de datos */}
        <Section icon={CalendarDays} title="Ficha del candidato">
          <dl className="divide-y divide-slate-100">
            {[
              { label: "Edad", value: age !== null ? `${age} años` : null },
              { label: "Categoría", value: worker.job_category },
              { label: "Especialidad", value: worker.job_subcategory },
              { label: "Ubicación", value: worker.location },
              {
                label: "Experiencia",
                value: experienceYears !== null ? `${experienceYears} ${experienceYears === 1 ? "año" : "años"}` : null,
              },
              { label: "En la plataforma desde", value: memberSince },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-[14px] text-slate-500">{row.label}</dt>
                  <dd className="text-right text-[14px] font-medium capitalize text-slate-900">{row.value}</dd>
                </div>
              ))}
          </dl>
        </Section>

        {/* CV descargable */}
        {worker.cv_url && (
          <Section>
            <a
              href={worker.cv_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#01A89E]/10">
                <FileText className="h-5 w-5 text-[#01A89E]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-slate-900">Currículum</span>
                <span className="block truncate text-[12px] text-slate-500">
                  {worker.cv_filename || "Descargar CV en PDF"}
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          </Section>
        )}

        {/* Vídeos adicionales */}
        {extraVideos.length > 0 && (
          <Section icon={Video} title="Más vídeos">
            {/* Abren el mismo reel a pantalla completa que el vídeo de
                presentación. Antes eran `<video controls>` incrustados en una
                celda de media pantalla: el fotograma de portada se veía, pero
                los controles nativos quedaban tan pequeños que reproducirlos
                era cuestión de suerte. */}
            <div className="grid grid-cols-2 gap-2">
              {extraVideos.map((videoUrl) => (
                <button
                  key={videoUrl}
                  type="button"
                  onClick={() => setVideoAbierto(videoUrl)}
                  aria-label="Reproducir vídeo"
                  className="relative block overflow-hidden rounded-2xl bg-black"
                >
                  <video
                    src={`${videoUrl}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-[9/16] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-xl">
                    <Play className="ml-0.5 h-5 w-5 fill-slate-900 text-slate-900" />
                  </span>
                </button>
              ))}
            </div>
          </Section>
        )}

        {/* 17 — Tipo de contrato que busca (detalle final) */}
        <Section icon={FileText} title="Tipo de contrato que busca">
          {contractChips}
        </Section>

      </main>

      {/* Reel a pantalla completa, compartido por todos los vídeos del perfil */}
      {videoAbierto && (
        <div className="fixed inset-0 z-[60] bg-black">
          <button
            type="button"
            onClick={handleCloseVideo}
            aria-label="Cerrar vídeo"
            className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-full w-full" onClick={toggleVideoPlayback}>
            <video
              ref={videoRef}
              src={videoAbierto}
              playsInline
              autoPlay
              className="h-full w-full object-contain"
              onPlay={() => {
                setIsVideoPlaying(true)
                setShowVideoOverlay(false)
              }}
              onPause={() => {
                setIsVideoPlaying(false)
                setShowVideoOverlay(true)
              }}
              onEnded={() => {
                setIsVideoPlaying(false)
                setShowVideoOverlay(true)
              }}
            />
            {/* Único control: play/pause centrado */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                showVideoOverlay || !isVideoPlaying ? "opacity-100" : "opacity-0"
              )}
            >
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                {isVideoPlaying ? (
                  <Pause className="h-8 w-8 fill-white text-white" />
                ) : (
                  <Play className="ml-1 h-8 w-8 fill-white text-white" />
                )}
              </span>
            </div>
          </div>
        </div>
      )}

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
