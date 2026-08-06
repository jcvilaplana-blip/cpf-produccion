"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2, CalendarCheck, ChevronLeft, ChevronRight, X, Check,
  Phone, MapPin, Video, Ellipsis, Briefcase, Clock, Sun, Sunset, Moon,
} from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createInterviewRequestAction } from "@/lib/actions"
import { cn } from "@/lib/utils"

interface InterviewRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string
  workerName: string
  /** If already known (e.g. from an open chat), skips the job picker step. */
  jobId?: string
  onSent?: () => void
}

type InterviewType = "call" | "in_person" | "video_call" | "other"
type StepId = "job" | "date" | "time" | "type"

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]
/** Four weeks fit in a 7x4 grid, so the day picker never needs to scroll. */
const DAYS_PER_PAGE = 28

const TIME_BANDS = [
  { id: "morning", label: "Mañana", icon: Sun, from: 9 * 60, to: 13 * 60 + 30 },
  { id: "afternoon", label: "Tarde", icon: Sunset, from: 14 * 60, to: 17 * 60 + 30 },
  { id: "evening", label: "Noche", icon: Moon, from: 18 * 60, to: 21 * 60 + 30 },
] as const

const INTERVIEW_TYPES: { value: InterviewType; label: string; hint: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "video_call", label: "Videollamada", hint: "Online", icon: Video },
  { value: "in_person", label: "Presencial", hint: "En el local", icon: MapPin },
  { value: "call", label: "Llamada", hint: "Por teléfono", icon: Phone },
  { value: "other", label: "Otra", hint: "Tú lo defines", icon: Ellipsis },
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
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

export function InterviewRequestDialog({
  open, onOpenChange, workerId, workerName, jobId: fixedJobId, onSent,
}: InterviewRequestDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobId, setJobId] = useState(fixedJobId || "")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("")
  const [band, setBand] = useState<(typeof TIME_BANDS)[number]["id"]>("morning")
  const [interviewType, setInterviewType] = useState<InterviewType>("video_call")
  const [otherDetail, setOtherDetail] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [pageOffset, setPageOffset] = useState(0)

  const steps: StepId[] = useMemo(
    () => (fixedJobId ? ["date", "time", "type"] : ["job", "date", "time", "type"]),
    [fixedJobId]
  )
  const step = steps[stepIndex]

  const today = useMemo(() => startOfDay(new Date()), [])

  // The grid always starts on the Monday of the current week so weekday
  // columns line up, but days before today are disabled.
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
    const fmt = (d: Date, withYear: boolean) =>
      d.toLocaleDateString("es-ES", { month: "long", ...(withYear ? { year: "numeric" } : {}) })
    if (first.getMonth() === last.getMonth()) return fmt(first, true)
    return `${fmt(first, false)} – ${fmt(last, true)}`
  }, [pageDays])

  useEffect(() => {
    if (!open || fixedJobId) return
    const loadJobs = async () => {
      setLoadingJobs(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingJobs(false); return }
      const { data } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("business_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
      setJobs(data || [])
      setLoadingJobs(false)
    }
    loadJobs()
  }, [open, fixedJobId, supabase])

  useEffect(() => {
    if (open) return
    setDate(undefined)
    setTime("")
    setBand("morning")
    setInterviewType("video_call")
    setOtherDetail("")
    setNotes("")
    setStepIndex(0)
    setPageOffset(0)
    if (!fixedJobId) setJobId("")
  }, [open, fixedJobId])

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1))
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0))

  const canContinue =
    step === "job" ? Boolean(jobId)
    : step === "date" ? Boolean(date)
    : step === "time" ? Boolean(time)
    : interviewType !== "other" || otherDetail.trim().length > 0

  const handleSubmit = async () => {
    if (!jobId) { toast.error("Selecciona una oferta"); return }
    if (!date) { toast.error("Selecciona un día"); return }
    if (!time) { toast.error("Selecciona una hora"); return }
    if (interviewType === "other" && !otherDetail.trim()) {
      toast.error("Especifica el tipo de entrevista"); return
    }

    const [h, m] = time.split(":").map(Number)
    const scheduledAt = new Date(date)
    scheduledAt.setHours(h, m, 0, 0)

    setSubmitting(true)
    const result = await createInterviewRequestAction(
      jobId, workerId, interviewType, scheduledAt.toISOString(), otherDetail || undefined, notes || undefined
    )
    setSubmitting(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(`Solicitud de entrevista enviada a ${workerName}`)
    onOpenChange(false)
    onSent?.()
  }

  const selectedJobTitle = jobs.find((j) => j.id === jobId)?.title

  const stepTitles: Record<StepId, string> = {
    job: "¿Para qué oferta?",
    date: "Elige el día",
    time: "Elige la hora",
    type: "¿Cómo será la entrevista?",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-b-none rounded-t-[28px] border-0 p-0 shadow-2xl data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-w-[440px] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-[28px]"
      >
        {/* Header */}
        <div className="relative px-5 pb-4 pt-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:scale-95 sm:top-5"
          >
            <X className="h-4 w-4" />
          </button>

          <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-[#01A89E]">
            Entrevista con {workerName}
          </p>
          <DialogTitle className="mt-1 pr-10 text-[20px] font-bold leading-tight text-slate-900">
            {stepTitles[step]}
          </DialogTitle>

          {/* Progreso */}
          <div className="mt-3.5 flex gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i <= stepIndex ? "bg-[#01A89E]" : "bg-slate-200"
                )}
              />
            ))}
          </div>
        </div>

        {/* Cuerpo: altura fija, sin scroll vertical */}
        <div className="h-[366px] px-5">
          {/* --- Paso 1: oferta --- */}
          {step === "job" && (
            <div className="h-full">
              {loadingJobs ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando tus ofertas…
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <Briefcase className="mb-3 h-9 w-9 text-slate-300" />
                  <p className="text-sm font-medium text-slate-900">No tienes ofertas activas</p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Crea una oferta antes de solicitar una entrevista.
                  </p>
                </div>
              ) : (
                <div className="-mx-1 h-full space-y-2 overflow-y-auto px-1 pb-1">
                  {jobs.map((j) => {
                    const selected = jobId === j.id
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => { setJobId(j.id); goNext() }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors active:scale-[0.99]",
                          selected
                            ? "border-[#01A89E] bg-[#01A89E]/5"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                            selected ? "bg-[#01A89E] text-white" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {selected ? <Check className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                        </span>
                        <span className="min-w-0 flex-1 text-[14px] font-medium leading-snug text-slate-900">
                          {j.title}
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- Paso 2: día --- */}
          {step === "date" && (
            <div className="flex h-full flex-col">
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
                  <span key={d} className="text-center text-[12px] font-medium text-slate-400">
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {pageDays.map((d) => {
                  const past = d < today
                  const selected = date ? isSameDay(d, date) : false
                  const isToday = isSameDay(d, today)
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={past}
                      onClick={() => { setDate(d); goNext() }}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-xl text-[14px] font-semibold transition-colors",
                        past && "cursor-not-allowed text-slate-300",
                        !past && !selected && "bg-slate-50 text-slate-800 active:bg-slate-100",
                        selected && "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/30",
                        isToday && !selected && !past && "ring-1 ring-inset ring-[#01A89E]/40"
                      )}
                    >
                      {d.getDate()}
                      {isToday && (
                        <span
                          className={cn(
                            "mt-0.5 h-1 w-1 rounded-full",
                            selected ? "bg-white" : "bg-[#01A89E]"
                          )}
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-auto flex gap-2 pb-1">
                {[
                  { label: "Hoy", offset: 0 },
                  { label: "Mañana", offset: 1 },
                  { label: "En una semana", offset: 7 },
                ].map(({ label, offset }) => {
                  const d = new Date(today)
                  d.setDate(today.getDate() + offset)
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setPageOffset(0); setDate(d); goNext() }}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-medium text-slate-700 active:bg-slate-200"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* --- Paso 3: hora --- */}
          {step === "time" && (
            <div className="flex h-full flex-col">
              <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
                {TIME_BANDS.map((b) => {
                  const Icon = b.icon
                  const active = band === b.id
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBand(b.id)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold transition-colors",
                        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {b.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {slotsBetween(
                  TIME_BANDS.find((b) => b.id === band)!.from,
                  TIME_BANDS.find((b) => b.id === band)!.to
                ).map((slot) => {
                  const selected = time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { setTime(slot); goNext() }}
                      className={cn(
                        "rounded-xl py-2.5 text-[14px] font-semibold tabular-nums transition-colors",
                        selected
                          ? "bg-[#01A89E] text-white shadow-md shadow-[#01A89E]/30"
                          : "bg-slate-50 text-slate-800 active:bg-slate-100"
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>

              {date && (
                <p className="mt-auto flex items-center gap-1.5 pb-1 text-[12px] text-slate-500">
                  <CalendarCheck className="h-3.5 w-3.5 text-[#01A89E]" />
                  {date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              )}
            </div>
          )}

          {/* --- Paso 4: tipo + nota --- */}
          {step === "type" && (
            <div className="flex h-full flex-col">
              <div className="grid grid-cols-2 gap-2">
                {INTERVIEW_TYPES.map((t) => {
                  const Icon = t.icon
                  const selected = interviewType === t.value
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setInterviewType(t.value)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-colors active:scale-[0.98]",
                        selected ? "border-[#01A89E] bg-[#01A89E]/5" : "border-slate-200 bg-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl",
                          selected ? "bg-[#01A89E] text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="text-[13.5px] font-semibold leading-tight text-slate-900">{t.label}</span>
                      <span className="text-[11.5px] leading-none text-slate-500">{t.hint}</span>
                    </button>
                  )
                })}
              </div>

              {interviewType === "other" && (
                <Input
                  value={otherDetail}
                  onChange={(e) => setOtherDetail(e.target.value)}
                  placeholder="¿Qué tipo de entrevista propones?"
                  className="mt-2.5 h-11 rounded-xl"
                />
              )}

              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nota para el candidato (opcional)"
                rows={2}
                className="mt-2.5 resize-none rounded-xl"
              />

              <div className="mt-auto flex flex-wrap items-center gap-1.5 pb-1">
                {selectedJobTitle && (
                  <span className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                    {selectedJobTitle}
                  </span>
                )}
                {date && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                    {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                )}
                {time && (
                  <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-medium text-slate-600">
                    <Clock className="h-3 w-3" /> {time}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4">
          {stepIndex > 0 && (
            <Button
              variant="ghost"
              onClick={goBack}
              className="h-12 rounded-xl px-3 text-slate-600"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
            </Button>
          )}
          {step === "type" ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canContinue || !jobId}
              className="h-12 flex-1 rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white shadow-lg shadow-[#01A89E]/25 hover:bg-[#018F86]"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CalendarCheck className="mr-2 h-4 w-4" />
              )}
              Enviar solicitud
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canContinue}
              className="h-12 flex-1 rounded-xl bg-[#01A89E] text-[15px] font-semibold text-white shadow-lg shadow-[#01A89E]/25 hover:bg-[#018F86]"
            >
              Continuar <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
