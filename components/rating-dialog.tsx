"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createRatingAction } from "@/lib/actions"
import { RATING_CRITERIA } from "@/lib/rating-criteria"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ratedUserId: string
  ratedUserName: string
  jobId: string
  /**
   * Los siete criterios describen a un trabajador (puntualidad, higiene,
   * adaptación al equipo…). Al valorar a una empresa no aplican, así que ahí
   * se mantiene la valoración global de siempre.
   */
  ratedUserType?: "worker" | "business" | null
  onSuccess?: () => void
}

function StarRow({
  value,
  onChange,
  size = "md",
}: {
  value: number
  onChange: (v: number) => void
  size?: "md" | "lg"
}) {
  const cls = size === "lg" ? "h-9 w-9" : "h-7 w-7"
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} de 5`}
          className="transition-transform active:scale-90"
        >
          <Star
            className={cn(
              cls,
              "transition-colors",
              star <= value ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function RatingDialog({
  open, onOpenChange, ratedUserId, ratedUserName, jobId, ratedUserType, onSuccess,
}: RatingDialogProps) {
  const router = useRouter()
  const [scores, setScores] = useState<Record<string, number>>({})
  const [overall, setOverall] = useState(0)
  const [review, setReview] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Los criterios describen a un trabajador; a una empresa se la valora en
  // global, como hasta ahora.
  const usesCriteria = ratedUserType !== "business"

  useEffect(() => {
    if (open) return
    setScores({})
    setOverall(0)
    setReview("")
    setError(null)
  }, [open])

  const rated = RATING_CRITERIA.filter((c) => scores[c.key] > 0)
  const allRated = rated.length === RATING_CRITERIA.length

  // La nota global es la media de los criterios: pedirla aparte además de los
  // siete sería preguntar dos veces lo mismo y podría contradecirse.
  const average = useMemo(() => {
    if (!usesCriteria) return overall
    if (rated.length === 0) return 0
    const total = rated.reduce((sum, c) => sum + scores[c.key], 0)
    return Math.round((total / rated.length) * 10) / 10
  }, [usesCriteria, overall, rated, scores])

  const canSubmit = usesCriteria ? allRated : overall > 0

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError(
        usesCriteria
          ? "Valora los siete criterios antes de enviar"
          : "Selecciona una calificación"
      )
      return
    }
    if (!jobId) {
      setError("No se encontró la oferta asociada a esta contratación")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createRatingAction(
        ratedUserId,
        jobId,
        usesCriteria ? Math.round(average) : overall,
        review,
        usesCriteria ? scores : undefined
      )
      if (result.error) {
        setError(result.error)
        return
      }

      onOpenChange(false)
      router.refresh()
      onSuccess?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al enviar la valoración")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-[28px] border-0 p-0 shadow-2xl data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-[460px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px]"
      >
        <div className="relative px-5 pb-3 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#01A89E]">
            Valoración
          </p>
          <DialogTitle className="mt-1 pr-10 text-[20px] font-bold leading-tight text-slate-900">
            Valorar a {ratedUserName}
          </DialogTitle>
          <p className="mt-1 text-[13px] leading-snug text-slate-500">
            {usesCriteria
              ? "Puntúa los siete criterios. Aparecerán en su perfil público."
              : "Comparte tu experiencia trabajando con este establecimiento."}
          </p>
        </div>

        <div className="max-h-[52vh] overflow-y-auto px-5">
          {usesCriteria ? (
            <div className="divide-y divide-slate-100">
              {RATING_CRITERIA.map((criterion) => (
                <div
                  key={criterion.key}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium leading-snug text-slate-900">
                      {criterion.label}
                    </p>
                    <p className="text-[12px] leading-snug text-slate-400">{criterion.hint}</p>
                  </div>
                  <StarRow
                    value={scores[criterion.key] || 0}
                    onChange={(v) => setScores((prev) => ({ ...prev, [criterion.key]: v }))}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-2">
              <p className="mb-2 text-[14px] font-medium text-slate-900">Calificación</p>
              <StarRow value={overall} onChange={setOverall} size="lg" />
            </div>
          )}

          <div className="py-4">
            <p className="mb-2 text-[14px] font-medium text-slate-900">
              Comentario <span className="font-normal text-slate-400">(opcional)</span>
            </p>
            <Textarea
              placeholder="Cuenta cómo fue la experiencia…"
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              className="resize-none rounded-xl"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">{review.length}/500</p>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-destructive/10 p-3 text-[13px] text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
          {usesCriteria && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] text-slate-500">
                {rated.length}/{RATING_CRITERIA.length} criterios
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-900">
                Media
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {average > 0 ? average.toFixed(1) : "—"}
                </span>
              </span>
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !canSubmit}
            className="h-12 w-full rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white hover:bg-[#018F86]"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Enviando…" : "Enviar valoración"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
