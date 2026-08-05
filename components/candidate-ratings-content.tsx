"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Star, Users, Loader2, MessageSquareQuote, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const RATING_CRITERIA = [
  { keys: ["punctuality", "puntualidad"], label: "Puntualidad" },
  { keys: ["attitude", "actitud"], label: "Actitud y predisposición" },
  { keys: ["learning_speed", "rapidez_aprendizaje"], label: "Rapidez de aprendizaje" },
  { keys: ["problem_solving", "resolucion_problemas"], label: "Resolución de problemas" },
  { keys: ["hygiene", "higiene"], label: "Higiene y presentación" },
  { keys: ["team_adaptation", "adaptacion_equipo"], label: "Adaptación al equipo" },
  { keys: ["contract_fulfillment", "cumplimiento_contrato"], label: "Cumplimiento del contrato" },
]

interface Review {
  id: string
  score: number
  comment: string | null
  created_at: string
  criteria: Record<string, number> | null
  job_title: string | null
  reviewer_name: string
  reviewer_avatar: string | null
  reviewer_type: string
}

interface CandidateRatingsContentProps {
  candidateId: string
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200",
            className
          )}
        />
      ))}
    </div>
  )
}

export function CandidateRatingsContent({ candidateId }: CandidateRatingsContentProps) {
  const [filter, setFilter] = useState<"all" | 1 | 2 | 3 | 4 | 5>("all")

  const { data, isLoading } = useSWR(`/api/profile/${candidateId}/ratings`, fetcher)
  const payload = data?.data

  const reviews: Review[] = payload?.reviews || []
  const distribution: Record<string, number> = payload?.distribution || {}
  const total: number = payload?.total || 0
  const average: number = payload?.average || 0
  const criteriaSummary: Record<string, number> = payload?.criteria_summary || {}
  const profile = payload?.profile

  const filteredReviews = useMemo(
    () => (filter === "all" ? reviews : reviews.filter((r) => Math.round(r.score) === filter)),
    [reviews, filter]
  )

  const criteriaFields = RATING_CRITERIA.map((criteria) => ({
    label: criteria.label,
    value: criteria.keys
      .map((key) => criteriaSummary[key])
      .find((value) => typeof value === "number") as number | undefined,
  })).filter((c) => typeof c.value === "number")

  const roles: string[] = (() => {
    const raw = profile?.specialties
    try {
      if (Array.isArray(raw)) return raw.filter(Boolean)
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
      }
    } catch { /* ignore */ }
    return profile?.job_category ? [profile.job_category] : []
  })()

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="mb-2 text-xl font-bold">Perfil no encontrado</h1>
        <Link href="/candidates" className="text-[#01A89E] underline">
          Ver candidatos
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pt-14">
      <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            href={`/profile/${candidateId}`}
            aria-label="Volver al perfil"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[17px] font-bold text-slate-900">Valoraciones y reseñas</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 px-4 pt-4">
        {/* Candidato real */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <Avatar className="h-14 w-14 border-2 border-[#01A89E]/20">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-[#01A89E]/10 text-[#01A89E] font-semibold">
                {profile.display_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-bold text-slate-900">{profile.display_name}</h2>
              {roles.length > 0 && (
                <p className="truncate text-[13px] text-slate-500">{roles.join(" · ")}</p>
              )}
            </div>
          </div>
        </section>

        {/* Resumen real */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-[86px] w-[86px] shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60">
              <span className="text-[32px] font-bold leading-none text-slate-900">
                {total > 0 ? average.toFixed(1) : "—"}
              </span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-amber-700">media</span>
            </div>
            <div className="min-w-0 flex-1">
              <Stars value={average} />
              <p className="mt-2 flex items-center gap-1.5 text-[13px] text-slate-600">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {total} {total === 1 ? "empresa ha valorado" : "empresas han valorado"}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-slate-400">
                Solo los establecimientos que le han contratado pueden valorar.
              </p>
            </div>
          </div>

          {total > 0 && (
            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = distribution[String(stars)] || 0
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setFilter(filter === stars ? "all" : (stars as 1 | 2 | 3 | 4 | 5))}
                    className="flex w-full items-center gap-3"
                  >
                    <span className="flex w-8 shrink-0 items-center gap-0.5 text-[12px] font-medium text-slate-600">
                      {stars}
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </span>
                    <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2 flex-1" />
                    <span className="w-6 shrink-0 text-right text-[12px] tabular-nums text-slate-500">
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Medias por criterio, solo si existen */}
        {criteriaFields.length > 0 && (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#01A89E]" />
              <h3 className="text-[15px] font-semibold text-slate-900">Media por criterio</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {criteriaFields.map((criteria) => (
                <div key={criteria.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <p className="min-w-0 flex-1 text-[14px] leading-snug text-slate-700">{criteria.label}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <Stars value={criteria.value!} />
                    <span className="w-7 text-right text-[13px] font-semibold tabular-nums text-slate-900">
                      {criteria.value!.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filtros */}
        {total > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Badge
              onClick={() => setFilter("all")}
              className={cn(
                "shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium",
                filter === "all"
                  ? "border-[#01A89E] bg-[#01A89E] text-white"
                  : "border-slate-200 bg-white text-slate-600"
              )}
            >
              Todas ({total})
            </Badge>
            {[5, 4, 3, 2, 1].map((stars) => (
              <Badge
                key={stars}
                onClick={() => setFilter(stars as 1 | 2 | 3 | 4 | 5)}
                className={cn(
                  "flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium",
                  filter === stars
                    ? "border-[#01A89E] bg-[#01A89E] text-white"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                {stars} <Star className="h-3 w-3 fill-current" /> ({distribution[String(stars)] || 0})
              </Badge>
            ))}
          </div>
        )}

        {/* Reseñas reales */}
        {total === 0 ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
            <MessageSquareQuote className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-[15px] font-semibold text-slate-900">Todavía no tiene valoraciones</h3>
            <p className="mt-1 text-[13px] leading-snug text-slate-500">
              Las valoraciones aparecen aquí cuando un establecimiento que le ha contratado le valora.
            </p>
          </section>
        ) : filteredReviews.length === 0 ? (
          <section className="rounded-3xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
            <Star className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-[15px] font-semibold text-slate-900">Sin valoraciones con este filtro</h3>
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-2 text-[13px] font-medium text-[#01A89E]"
            >
              Ver todas
            </button>
          </section>
        ) : (
          <div className="space-y-2.5">
            {filteredReviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name} />
                    <AvatarFallback className="bg-slate-100 text-slate-500">
                      {review.reviewer_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="truncate text-[14px] font-semibold text-slate-900">
                          {review.reviewer_name}
                        </h4>
                        <p className="text-[11.5px] text-slate-400">{formatDate(review.created_at)}</p>
                      </div>
                      <Badge className="shrink-0 rounded-full border-0 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {review.reviewer_type === "business" ? "Empresa" : "Trabajador"}
                      </Badge>
                    </div>
                    <div className="mt-1.5">
                      <Stars value={review.score} />
                    </div>
                    {review.job_title && (
                      <p className="mt-1.5 text-[12px] text-slate-500">Oferta: {review.job_title}</p>
                    )}
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                )}

                {review.criteria && Object.keys(review.criteria).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                    {RATING_CRITERIA.map((criteria) => {
                      const value = criteria.keys
                        .map((key) => review.criteria?.[key])
                        .find((v) => typeof v === "number")
                      if (typeof value !== "number") return null
                      return (
                        <span
                          key={criteria.label}
                          className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[11.5px] text-slate-600"
                        >
                          {criteria.label}
                          <span className="flex items-center gap-0.5 font-semibold text-slate-900">
                            {value.toFixed(1)}
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          </span>
                        </span>
                      )
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
