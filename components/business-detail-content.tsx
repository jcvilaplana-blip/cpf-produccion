"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { requestToWorkHereAction } from "@/lib/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PortfolioImageViewer } from "@/components/portfolio-image-viewer"
import { BUSINESS_RATING_CRITERIA, readCriterion } from "@/lib/rating-criteria"
import {
  ArrowLeft, MapPin, Star, Briefcase, CheckCircle, MessageCircle, Heart,
  Send, X, Loader2, Phone, Globe, Sparkles, Users, BadgeCheck,
  Image as ImageIcon, ChevronRight, Play, Pause,
} from "lucide-react"

interface BusinessData {
  id: string
  display_name: string
  type: string
  location: string
  rating: number
  totalRatings: number
  activeJobs: number
  logo: string
  verified: boolean
  description: string
  source: "supabase"
  phone?: string
  website?: string
  city?: string
  address?: string
  company_description?: string
  service_description?: string
  photos?: string[]
  video_url?: string | null
  latitude?: number | null
  longitude?: number | null
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

export function BusinessDetailContent({ id }: { id: string }) {
  const router = useRouter()
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContactForm, setShowContactForm] = useState(false)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  // Medias por criterio de las valoraciones que le han dejado los candidatos.
  const [criteriaSummary, setCriteriaSummary] = useState<Record<string, number>>({})
  const [ratingsTotal, setRatingsTotal] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  // Un establecimiento no puede guardarse a sí mismo en favoritos: cuando el
  // que mira es el dueño del perfil, el control de guardado no se ofrece.
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [isPremiumWorker, setIsPremiumWorker] = useState(false)
  const [requestingToWork, setRequestingToWork] = useState(false)
  const [requestedToWork, setRequestedToWork] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [showVideoOverlay, setShowVideoOverlay] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadBusiness = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: bp } = await supabase.from("business_profiles").select("*").eq("id", id).single()
      if (bp) {
        const { data: profile } = await supabase.from("profiles").select("display_name, location, rating, total_ratings, phone").eq("id", id).single()

        // El mismo endpoint que usa el perfil del candidato: agrega los
        // criterios de cualquier perfil, sea trabajador o establecimiento.
        fetch(`/api/profile/${id}/ratings`)
          .then((r) => (r.ok ? r.json() : null))
          .then((payload) => {
            if (!payload?.data) return
            setCriteriaSummary(payload.data.criteria_summary || {})
            setRatingsTotal(payload.data.total || 0)
          })
          .catch(() => {})
        const { data: jobsData } = await supabase.from("jobs").select("*").eq("business_id", id).eq("is_active", true).order("created_at", { ascending: false })
        setBusiness({
          id: bp.id, display_name: bp.company_name || profile?.display_name || "Empresa",
          type: bp.business_type || "General", location: bp.city || bp.address || profile?.location || "Espana",
          // Sin valoraciones, 0: antes ponía 4.5 por defecto y el perfil
          // mostraba una nota que nadie había dado.
          rating: profile?.rating ?? 0,
          totalRatings: profile?.total_ratings ?? 0, activeJobs: jobsData?.length || 0,
          logo: bp.company_logo_url || "/images/companies/el-gourmet.jpg", verified: bp.verified || false,
          description: bp.company_description || bp.service_description || "", source: "supabase",
          phone: bp.phone || profile?.phone, website: bp.website, city: bp.city, address: bp.address,
          company_description: bp.company_description, service_description: bp.service_description,
          photos: Array.isArray(bp.photos) ? bp.photos : [],
          video_url: bp.video_url || null,
          latitude: bp.latitude || null,
          longitude: bp.longitude || null,
        })
        setJobs(jobsData || [])
        setLoading(false)
        return
      }
    } catch { /* fall through */ }
    setBusiness(null)
    setLoading(false)
  }, [id])

  useEffect(() => { loadBusiness() }, [loadBusiness])

  useEffect(() => {
    const checkFavorite = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return
      setIsOwnProfile(user.id === id)
      const [{ data: saved }, { data: profile }] = await Promise.all([
        supabase.from("saved_businesses").select("id").eq("user_id", user.id).eq("business_id", id).maybeSingle(),
        supabase.from("profiles").select("user_type, is_premium, premium_expires_at").eq("id", user.id).single(),
      ])
      setIsFavorite(!!saved)
      const premiumActive =
        profile?.user_type === "worker" &&
        profile?.is_premium &&
        (!profile?.premium_expires_at || new Date(profile.premium_expires_at) > new Date())
      setIsPremiumWorker(!!premiumActive)
    }
    checkFavorite()
  }, [id])

  // "Tipo de trabajador que busca" y "búsqueda activa" no son campos de
  // `business_profiles`: no existen en el esquema. Se derivan de sus ofertas
  // abiertas, que es el dato real y además siempre está al día — un campo
  // manual quedaría obsoleto en cuanto cerrara una oferta y se olvidara de
  // actualizarlo.
  const workerTypesSought = useMemo(() => {
    const set = new Set<string>()
    for (const job of jobs) {
      // `category` es la categoría profesional (Camarero, Cocinero...), la
      // misma taxonomía que ofrece el buscador en "¿Qué tipo de trabajador
      // buscas?". `position` es una sub-posición dentro de ella ("Sala"), que
      // no pertenece a esa lista: sólo sirve de reserva si falta la categoría.
      const value = job.category || job.position
      if (value) set.add(String(value))
    }
    return [...set]
  }, [jobs])

  const isActivelyHiring = jobs.length > 0

  const criteriaRows = useMemo(
    () =>
      BUSINESS_RATING_CRITERIA
        .map((criterion) => ({ label: criterion.label, value: readCriterion(criteriaSummary, criterion) }))
        .filter((row) => typeof row.value === "number"),
    [criteriaSummary]
  )

  const handleRequestToWork = async () => {
    setRequestingToWork(true)
    try {
      const result = await requestToWorkHereAction(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setRequestedToWork(true)
        toast.success("Le hemos avisado a la empresa de tu interés")
      }
    } finally {
      setRequestingToWork(false)
    }
  }

  const handleToggleFavorite = async () => {
    // Defensa además de ocultar el botón: el estado podría llegar aquí por
    // otra vía y guardarse a uno mismo no debe ser posible.
    if (isOwnProfile) return
    setFavoriteLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push(`/auth/login?redirect=/business/${id}`); return }

      if (isFavorite) {
        await supabase.from("saved_businesses").delete().eq("user_id", user.id).eq("business_id", id)
        setIsFavorite(false)
      } else {
        await supabase.from("saved_businesses").insert({ user_id: user.id, business_id: id })
        setIsFavorite(true)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) { router.push(`/auth/login?redirect=/business/${id}`); return }
      const { data: existingConv } = await supabase.from("conversations").select("id")
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${id}),and(participant_1.eq.${id},participant_2.eq.${user.id})`).single()
      let conversationId = existingConv?.id
      if (!conversationId) {
        const { data: newConv } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: id, last_message: message.trim(), last_message_at: new Date().toISOString() }).select("id").single()
        conversationId = newConv?.id
      }
      if (conversationId) {
        await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, receiver_id: id, content: message.trim(), read: false })
        await supabase.from("conversations").update({ last_message: message.trim(), last_message_at: new Date().toISOString() }).eq("id", conversationId)
        setSent(true); setMessage("")
        setTimeout(() => { setSent(false); setShowContactForm(false); router.push("/messages") }, 1500)
      }
    } catch {
      setSent(true); setMessage("")
      setTimeout(() => { setSent(false); setShowContactForm(false) }, 2000)
    } finally { setSending(false) }
  }

  const toggleVideoPlayback = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) el.play().catch(() => {})
    else el.pause()
  }

  const handleCloseVideo = () => {
    videoRef.current?.pause()
    setIsVideoOpen(false)
    setIsVideoPlaying(false)
    setShowVideoOverlay(true)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center pb-20"><Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" /></div>
  if (!business) return (
    <div className="min-h-screen flex items-center justify-center pb-20">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Empresa no encontrada</h1>
        <p className="text-muted-foreground mb-4">Esta empresa no existe o fue eliminada.</p>
        <Button asChild><Link href="/businesses">Ver empresas</Link></Button>
      </div>
    </div>
  )

  const photos = business.photos || []
  const mapQuery = business.address || business.location || business.city || business.display_name

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-14">
      {/* 1 — Cabecera: imagen con el nombre y el tipo de establecimiento dentro */}
      <header className="relative">
        <div className="relative aspect-[3/4] max-h-[74vh] w-full overflow-hidden bg-slate-900 sm:aspect-[16/10]">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.display_name}
              className="absolute inset-0 h-full w-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#01A89E] to-[#015F59]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/20" />

          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)]">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Volver"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/45 text-white backdrop-blur-md active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {/* Guardado en favoritos, igual que en el perfil del candidato.
                No se muestra en el propio perfil: guardarse a uno mismo no
                significa nada y ensuciaría la lista de guardados. */}
            {!isOwnProfile && (
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                aria-label={isFavorite ? "Quitar de guardados" : "Guardar establecimiento"}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors active:scale-95",
                  isFavorite ? "bg-rose-500 text-white" : "bg-slate-950/45 text-white"
                )}
              >
                <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
              </button>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-6">
            <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
              {business.display_name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <p className="text-[16px] font-medium leading-snug text-white/90 drop-shadow-sm">
                {business.type}
              </p>
              {business.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[12px] font-semibold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verificada
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        {/* 2 — Ubicación */}
        <Section>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#01A89E]/10">
              <MapPin className="h-5 w-5 text-[#01A89E]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Ubicación</p>
              <p className="truncate text-[15px] font-semibold text-slate-900">
                {business.location || "No especificada"}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-700 active:bg-slate-200"
            >
              Ver mapa
            </a>
          </div>
        </Section>

        {/* 3 — Ofertas publicadas (izquierda) y valoraciones (derecha) */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/business/${id}/jobs`}
            className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors active:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#01A89E]" />
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Ofertas</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" />
            </div>
            <p className="mt-2 text-3xl font-bold leading-none text-slate-900">{business.activeJobs}</p>
            <p className="mt-1.5 text-[12px] leading-snug text-slate-500">
              {business.activeJobs === 1 ? "oferta publicada" : "ofertas publicadas"}
            </p>
          </Link>

          <Link
            href={`/business/${id}/ratings`}
            className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors active:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Valoración</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-active:translate-x-0.5" />
            </div>
            <p className="mt-2 text-3xl font-bold leading-none text-slate-900">
              {business.totalRatings > 0 ? business.rating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5">
              <Stars value={business.rating} />
            </div>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">
              {business.totalRatings} {business.totalRatings === 1 ? "valoración" : "valoraciones"}
            </p>
          </Link>
        </div>

        {/* 4 — Tipo de trabajador que busca */}
        <Section icon={Users} title="Tipo de trabajador que busca">
          {workerTypesSought.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {workerTypesSought.map((type) => (
                <span
                  key={type}
                  className="rounded-full bg-[#01A89E]/10 px-3 py-1.5 text-[13px] font-semibold text-[#01A89E]"
                >
                  {type}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[14px] text-slate-500">No tiene ofertas abiertas ahora mismo.</p>
          )}
        </Section>

        {/* 5 — Indicador de búsqueda activa */}
        <Section>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                isActivelyHiring ? "bg-emerald-100" : "bg-slate-100"
              )}
            >
              <span className={cn("h-3 w-3 rounded-full", isActivelyHiring ? "bg-emerald-500" : "bg-slate-400")} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-slate-900">
                {isActivelyHiring ? "Busca personal activamente" : "No busca personal ahora mismo"}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
                {isActivelyHiring
                  ? `Tiene ${business.activeJobs} ${business.activeJobs === 1 ? "oferta abierta" : "ofertas abiertas"}.`
                  : "No tiene ofertas abiertas en este momento."}
              </p>
            </div>
          </div>
        </Section>

        {/* 6 — Criterios de valoración. Solo si alguien ha valorado: una lista
            de guiones no aporta nada. */}
        {criteriaRows.length > 0 && (
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
              {criteriaRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <p className="min-w-0 flex-1 text-[14px] leading-snug text-slate-700">{row.label}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Stars value={row.value || 0} />
                    <span className="w-7 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                      {row.value!.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href={`/business/${id}/ratings`}
              className="mt-3 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-900 active:bg-slate-100"
            >
              Ver valoraciones y reseñas
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </Section>
        )}

        {/* 7 — Sobre la empresa */}
        <Section icon={MessageCircle} title="Sobre la empresa">
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">
            {business.description || business.company_description || "Empresa registrada en la plataforma CamareroPorFavor."}
          </p>
          {business.service_description && (
            <>
              <p className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Tipo de servicio</p>
              <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">
                {business.service_description}
              </p>
            </>
          )}
        </Section>

        {/* 8 — Estadísticas */}
        <Section icon={Briefcase} title="Estadísticas">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Sector</span>
              <span className="text-[15px] font-semibold text-slate-900">{business.type}</span>
            </div>
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Ubicación</span>
              <span className="text-[15px] font-semibold text-slate-900">{business.location}</span>
            </div>
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Valoración</span>
              <span className="flex items-center gap-1 text-[15px] font-semibold text-slate-900">
                {business.totalRatings > 0 ? business.rating.toFixed(1) : "—"}
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </span>
            </div>
            <div>
              <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">Estado</span>
              <span className="flex items-center gap-1 text-[15px] font-semibold text-slate-900">
                {business.verified ? <><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Verificada</> : "Pendiente"}
              </span>
            </div>
          </div>
        </Section>

        {/* 9 — Galería en cuadrícula */}
        {photos.length > 0 && (
          <Section
            icon={ImageIcon}
            title="Galería"
            action={<span className="text-[12px] text-slate-400">{photos.length}</span>}
          >
            <PortfolioImageViewer images={photos} />
          </Section>
        )}
        {/* 10 — Vídeo del establecimiento, apaisado y al ancho de la galería.
            Va dentro del mismo `main` que el resto: cuando estaba en un bloque
            aparte, entre dos `<main>`, quedaba fuera del `space-y-3` que marca
            el ritmo vertical de la página y se abría un hueco desproporcionado
            justo encima. `-mx-4` lo saca a sangre completa en móvil sin
            romper ese ritmo. */}
        {business.video_url && (
          <div className="-mx-4 sm:mx-0">
            <button
              type="button"
              onClick={() => setIsVideoOpen(true)}
              className="relative block w-full overflow-hidden bg-black sm:rounded-3xl"
              aria-label="Reproducir vídeo del establecimiento"
            >
            {/* `#t=0.1` fuerza a los navegadores móviles a pintar el primer
                fotograma como portada. */}
            <video
              src={`${business.video_url}#t=0.1`}
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
                  Vídeo del establecimiento
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{business.display_name}</p>
              </div>
            </button>
          </div>
        )}

        {/* 11 — Información de contacto */}
        {(business.phone || business.website || business.address) && (
          <Section icon={Phone} title="Información de contacto">
            <div className="space-y-3">
              {business.phone && (
                <div className="flex items-center gap-3 text-[14px] text-slate-700">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <a href={`tel:${business.phone}`} className="hover:underline">{business.phone}</a>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-3 text-[14px]">
                  <Globe className="h-4 w-4 shrink-0 text-slate-400" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="truncate text-[#01A89E] hover:underline">
                    {business.website}
                  </a>
                </div>
              )}
              {business.address && (
                <div className="flex items-center gap-3 text-[14px] text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{business.address}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 12 — Acciones rápidas */}
        <Section icon={Sparkles} title="Acciones rápidas">
          <div className="flex gap-3">
            <Button
              className="h-12 flex-1 rounded-xl bg-[#01A89E] text-[14px] font-bold text-white hover:bg-[#018F86]"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Contactar
            </Button>
            {!isOwnProfile && (
              <Button
                variant="outline"
                className={cn(
                  "h-12 flex-1 rounded-xl text-[14px] font-bold",
                  isFavorite && "border-[#01A89E] bg-[#01A89E]/5 text-[#01A89E]"
                )}
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
              >
                <Heart className={cn("mr-2 h-5 w-5", isFavorite && "fill-[#01A89E]")} /> Favorito
              </Button>
            )}
          </div>

          {isPremiumWorker && (
            <Button
              variant="outline"
              className="mt-3 h-12 w-full rounded-xl border-[#F48221]/40 text-[14px] font-bold text-[#F48221] hover:bg-[#F48221]/5 disabled:opacity-60"
              onClick={handleRequestToWork}
              disabled={requestingToWork || requestedToWork}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {requestedToWork ? "Interés enviado" : requestingToWork ? "Enviando..." : "Quiero trabajar aquí"}
            </Button>
          )}

          {showContactForm && (
            <div className="mt-3 rounded-2xl border border-[#01A89E]/30 bg-teal-50/50 p-4">
              {sent ? (
                <div className="py-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="font-semibold text-green-700">Mensaje enviado</p>
                  <p className="mt-1 text-[14px] text-slate-500">Redirigiendo al chat...</p>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold">Enviar mensaje a {business.display_name}</h3>
                    <button onClick={() => setShowContactForm(false)} className="rounded-full p-1 hover:bg-slate-200">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hola, me interesa trabajar con ustedes..."
                    className="mb-3 min-h-[100px] resize-none rounded-xl border-slate-200 bg-white text-[14px]"
                  />
                  <Button
                    className="h-11 w-full rounded-xl bg-[#01A89E] font-bold text-white hover:bg-[#018F86]"
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                  >
                    {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="mr-2 h-4 w-4" /> Enviar mensaje</>}
                  </Button>
                </>
              )}
            </div>
          )}
        </Section>
      </main>

      {/* Reel del vídeo, igual que en el perfil del candidato */}
      {isVideoOpen && business.video_url && (
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
              src={business.video_url}
              playsInline
              autoPlay
              className="h-full w-full object-contain"
              onPlay={() => { setIsVideoPlaying(true); setShowVideoOverlay(false) }}
              onPause={() => { setIsVideoPlaying(false); setShowVideoOverlay(true) }}
              onEnded={() => { setIsVideoPlaying(false); setShowVideoOverlay(true) }}
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
    </div>
  )
}
