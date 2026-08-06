"use client"

import { useState } from "react"
import { Flag, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

interface ReportContentDialogProps {
  contentType: "video" | "profile" | "message" | "job"
  contentId: string
  reportedUserId: string
  triggerClassName?: string
  triggerVariant?: "ghost" | "outline" | "default"
  triggerSize?: "sm" | "default" | "icon"
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Contenido inapropiado", description: "Contenido que no cumple con las normas" },
  { value: "nudity", label: "Desnudos o contenido sexual", description: "Imágenes o videos con contenido adulto" },
  { value: "violence", label: "Violencia o contenido peligroso", description: "Amenazas, violencia gráfica" },
  { value: "harassment", label: "Acoso o bullying", description: "Comportamiento abusivo hacia otros" },
  { value: "hate_speech", label: "Discurso de odio", description: "Discriminación por raza, género, etc." },
  { value: "spam", label: "Spam o engaño", description: "Contenido publicitario no deseado" },
  { value: "fake", label: "Perfil o información falsa", description: "Suplantación de identidad" },
  { value: "other", label: "Otro motivo", description: "Especifica en la descripción" },
]

export function ReportContentDialog({
  contentType,
  contentId,
  reportedUserId,
  triggerClassName,
  triggerVariant = "ghost",
  triggerSize = "icon",
}: ReportContentDialogProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!reason) {
      setError("Por favor selecciona un motivo")
      return
    }

    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setError("Debes iniciar sesión para reportar contenido")
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from("reports")
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          content_type: contentType,
          content_id: contentId,
          reason,
          description: description.trim() || null,
        })

      if (insertError) {
        setError("Error al enviar el reporte. Inténtalo de nuevo.")
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        setReason("")
        setDescription("")
      }, 2000)
    } catch {
      setError("Error inesperado. Inténtalo de nuevo.")
    }

    setLoading(false)
  }

  const contentTypeLabels: Record<string, string> = {
    video: "vídeo",
    profile: "perfil",
    message: "mensaje",
    job: "oferta",
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          title="Reportar contenido"
        >
          <Flag className="h-4 w-4" />
          {triggerSize !== "icon" && <span className="ml-1.5">Reportar</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {success ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Reporte enviado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Gracias por ayudarnos a mantener la comunidad segura
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <DialogTitle>Reportar {contentTypeLabels[contentType]}</DialogTitle>
                  <DialogDescription>
                    Ayúdanos a mantener la comunidad segura
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Motivo del reporte *</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? "border-red-300 bg-red-50"
                          : "border-border hover:border-red-200 hover:bg-red-50/50"
                      }`}
                    >
                      <RadioGroupItem value={r.value} className="mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{r.label}</p>
                        <p className="text-[13px] text-muted-foreground">{r.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Descripción adicional (opcional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proporciona más detalles sobre el problema..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar reporte"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
