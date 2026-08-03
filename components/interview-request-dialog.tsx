"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CalendarCheck } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { createInterviewRequestAction } from "@/lib/actions"

interface InterviewRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workerId: string
  workerName: string
  /** If already known (e.g. from an open chat), skips the job picker step. */
  jobId?: string
  onSent?: () => void
}

const TIME_SLOTS = Array.from({ length: 21 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30 // 09:00 to 19:00
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0")
  const m = (totalMinutes % 60).toString().padStart(2, "0")
  return `${h}:${m}`
})

export function InterviewRequestDialog({
  open, onOpenChange, workerId, workerName, jobId: fixedJobId, onSent,
}: InterviewRequestDialogProps) {
  const supabase = useMemo(() => createClient(), [])
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [jobId, setJobId] = useState(fixedJobId || "")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("")
  const [interviewType, setInterviewType] = useState<"call" | "in_person" | "video_call" | "other">("video_call")
  const [otherDetail, setOtherDetail] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
    if (!open) {
      setDate(undefined)
      setTime("")
      setInterviewType("video_call")
      setOtherDetail("")
      setNotes("")
      if (!fixedJobId) setJobId("")
    }
  }, [open, fixedJobId])

  const handleSubmit = async () => {
    if (!jobId) { toast.error("Selecciona una oferta"); return }
    if (!date) { toast.error("Selecciona un día"); return }
    if (!time) { toast.error("Selecciona una hora"); return }
    if (interviewType === "other" && !otherDetail.trim()) { toast.error("Especifica el tipo de entrevista"); return }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-[#01A89E]" />
            Solicitar entrevista con {workerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!fixedJobId && (
            <div className="space-y-1.5">
              <Label>Oferta relacionada</Label>
              {loadingJobs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando tus ofertas...
                </div>
              ) : jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tienes ofertas activas. Crea una oferta antes de solicitar una entrevista.
                </p>
              ) : (
                <Select value={jobId} onValueChange={setJobId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una oferta" /></SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Día</Label>
            <div className="rounded-lg border flex justify-center py-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Hora</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger><SelectValue placeholder="Selecciona una hora" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {TIME_SLOTS.map((slot) => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de entrevista</Label>
            <RadioGroup value={interviewType} onValueChange={(v) => setInterviewType(v as typeof interviewType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="call" id="type-call" />
                <Label htmlFor="type-call" className="font-normal cursor-pointer">Llamada</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="type-in-person" />
                <Label htmlFor="type-in-person" className="font-normal cursor-pointer">Presencial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="video_call" id="type-video" />
                <Label htmlFor="type-video" className="font-normal cursor-pointer">Videoconferencia</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="type-other" />
                <Label htmlFor="type-other" className="font-normal cursor-pointer">Otra</Label>
              </div>
            </RadioGroup>
            {interviewType === "other" && (
              <Textarea
                placeholder="Especifica qué tipo de entrevista propones"
                value={otherDetail}
                onChange={(e) => setOtherDetail(e.target.value)}
                rows={2}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Notas (opcional)</Label>
            <Textarea
              placeholder="Información adicional para el candidato"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!fixedJobId && jobs.length === 0)}
            className="bg-[#01A89E] hover:bg-[#018F86] text-white"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarCheck className="h-4 w-4 mr-2" />}
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
