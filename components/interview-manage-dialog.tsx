"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  X, CalendarClock, Ban, ChevronLeft, ChevronRight, Loader2, Clock, Sun, Sunset, Moon,
} from "lucide-react"
import { toast } from "sonner"
import { cancelInterviewAction, rescheduleInterviewAction } from "@/lib/actions"
import { cn } from "@/lib/utils"

type Mode = "cancel" | "reschedule"

interface InterviewManageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: Mode
  interviewId: string
  /** Fecha actual de la entrevista, para mostrarla como referencia. */
  currentScheduledAt?: string
  onDone?: () => void
}

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]
const DAYS_PER_PAGE = 28

const TIME_BANDS = [
  { id: "morning", label: "Mañana", icon: Sun, from: 9 * 60, to: 13 * 60 + 30 },
  { id: "afternoon", label: "Tarde", icon: Sunset, from: 14 * 60, to: 17 * 60 + 30 },
  { id: "evening", label: "Noche", icon: Moon, from: 18 * 60, to: 21 * 60 + 30 },
] as const

/** Motivos frecuentes, para no obligar a escribir en el momento incómodo. */
const CANCEL_REASONS = [
  "Me ha surgido un imprevisto",
  "Ya no estoy disponible en esa fecha",
  "He cubierto el puesto",
  "Prefiero no continuar el proceso",
]
const RESCHEDULE_REASONS = [
  "Me ha surgido un imprevisto",
  "No me viene bien esa hora",
  "Prefiero otro día",
]

function slotsBetween(from: number, to: number) {
  const slots: string[] = []
  for (let m = from; m <= to; m += 30) {
    slots.push(`${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`)
  }
  return slots
}

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function InterviewManageDialog({
  open, onOpenChange, mode, interviewId, currentScheduledAt, onDone,
}: InterviewManageDialogProps) {
  const [reason, setReason] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("")
  const [band, setBand] = useState<(typeof TIME_BANDS)[number]["id"]>("morning")
  const [pageOffset, setPageOffset] = useState(0)
  const [step, setStep] = useState<"when" | "why">(mode === "cancel" ? "why" : "when")
  const [submitting, setSubmitting] = useState(false)

  const today = useMemo(() => startOfDay(new Date()), [])

  const pageDays = useMemo(() => {
    const monday = new Date(today)
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
    monday.setDate(monday.getDate() + pageOffset * DAYS_PER_PAGE)
    return Array.from({ length: DAYS_PER_PAGE }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [today, pageOffset])

  const pageLabel = useMemo(() => {
    const first = pageDays[0]
    const last = pageDays[pageDays.length - 1]
    const fmt = (d: Date, y: boolean) =>
      d.toLocaleDateString("es-ES", { month: "long", ...(y ? { year: "numeric" } : {}) })
    return first.getMonth() === last.getMonth() ? fmt(first, true) : `${fmt(first, false)} – ${fmt(last, true)}`
  }, [pageDays])

  useEffect(() => {
    if (open) return
    setReason("")
    setDate(undefined)
    setTime("")
    setBand("morning")
    setPageOffset(0)
    setStep(mode === "cancel" ? "why" : "when")
  }, [open, mode])

  const canSubmit =
    reason.trim().length >= 3 && (mode === "cancel" || (Boolean(date) && Boolean(time)))

  const handleSubmit = async () => {
    setSubmitting(true)
    let result: { error?: string; success?: boolean }

    if (mode === "cancel") {
      result = await cancelInterviewAction(interviewId, reason)
    } else {
      const [h, m] = time.split(":").map(Number)
      const scheduled = new Date(date!)
      scheduled.setHours(h, m, 0, 0)
      result = await rescheduleInterviewAction(interviewId, scheduled.toISOString(), reason)
    }

    setSubmitting(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(
      mode === "cancel" ? "Entrevista cancelada" : "Nueva fecha propuesta: falta que la confirmen"
    )
    onOpenChange(false)
    onDone?.()
  }

  const suggestions = mode === "cancel" ? CANCEL_REASONS : RESCHEDULE_REASONS
  const Icon = mode === "cancel" ? Ban : CalendarClock

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-[28px] border-0 p-0 shadow-2xl data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-[440px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px]"
      >
        <div className="relative px-5 pb-4 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#01A89E]">
            <Icon className="h-3.5 w-3.5" />
            {mode === "cancel" ? "Cancelar entrevista" : "Cambiar la fecha"}
          </p>
          <DialogTitle className="mt-1 pr-10 text-[20px] font-bold leading-tight text-slate-900">
            {mode === "cancel"
              ? "¿Por qué la cancelas?"
              : step === "when"
              ? "Elige la nueva fecha"
              : "¿Por qué la cambias?"}
          </DialogTitle>
          {currentScheduledAt && (
            <p className="mt-1 text-[12px] text-slate-500">
              Ahora:{" "}
              {new Date(currentScheduledAt).toLocaleString("es-ES", {
                weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>

        <div className="min-h-[300px] px-5">
          {mode === "reschedule" && step === "when" && (
            <div>
              <div className="flex items-center justify-between pb-2">
                <button
                  type="button"
                  onClick={() => setPageOffset((p) => Math.max(0, p - 1))}
                  disabled={pageOffset === 0}
                  aria-label="Semanas anteriores"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 disabled:opacity-30"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-[14px] font-semibold capitalize text-slate-900">{pageLabel}</span>
                <button
                  type="button"
                  onClick={() => setPageOffset((p) => p + 1)}
                  aria-label="Semanas siguientes"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 pb-1">
                {WEEKDAYS.map((d) => (
                  <span key={d} className="text-center text-[11px] font-medium text-slate-400">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {pageDays.map((d) => {
                  const past = d < today
                  const selected = date ? isSameDay(d, date) : false
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={past}
                      onClick={() => setDate(d)}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl text-[14px] font-semibold",
                        past && "cursor-not-allowed text-slate-300",
                        !past && !selected && "bg-slate-50 text-slate-800",
                        selected && "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/30"
                      )}
                    >
                      {d.getDate()}
                    </button>
                  )
                })}
              </div>

              {date && (
                <>
                  <div className="mt-3 flex gap-1 rounded-2xl bg-slate-100 p-1">
                    {TIME_BANDS.map((b) => {
                      const BandIcon = b.icon
                      const active = band === b.id
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBand(b.id)}
                          className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold",
                            active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                          )}
                        >
                          <BandIcon className="h-3.5 w-3.5" />
                          {b.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 pb-1">
                    {slotsBetween(
                      TIME_BANDS.find((b) => b.id === band)!.from,
                      TIME_BANDS.find((b) => b.id === band)!.to
                    ).map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={cn(
                          "rounded-xl py-2.5 text-[14px] font-semibold tabular-nums",
                          time === slot
                            ? "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/30"
                            : "bg-slate-50 text-slate-800"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {(mode === "cancel" || step === "why") && (
            <div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReason(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                      reason === s
                        ? "border-[#01A89E] bg-[#01A89E]/10 text-[#00776F]"
                        : "border-slate-200 bg-white text-slate-600"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Escribe el motivo…"
                rows={3}
                className="mt-3 resize-none rounded-xl"
              />
              <p className="mt-2 text-[12px] leading-snug text-slate-500">
                La otra parte verá este motivo. Es obligatorio: una cancelación sin explicación
                deja al otro sin saber qué ha pasado.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
          {mode === "reschedule" && step === "why" && (
            <Button variant="ghost" onClick={() => setStep("when")} className="h-12 rounded-xl px-3 text-slate-600">
              <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
            </Button>
          )}
          {mode === "reschedule" && step === "when" ? (
            <Button
              onClick={() => setStep("why")}
              disabled={!date || !time}
              className="h-12 flex-1 rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white hover:bg-[#018F86]"
            >
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                "h-12 flex-1 rounded-xl text-[15px] font-semibold text-white",
                mode === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-[#01A89E] hover:bg-[#018F86]"
              )}
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : mode === "cancel" ? (
                <Ban className="mr-2 h-4 w-4" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              {mode === "cancel" ? "Cancelar entrevista" : "Proponer nueva fecha"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
