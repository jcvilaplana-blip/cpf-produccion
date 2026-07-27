"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { sendPhoneOtp, resetRecaptcha } from "@/lib/firebase/client"
import type { ConfirmationResult } from "firebase/auth"

interface PhoneVerificationProps {
  phone: string
  verified: boolean
  onVerified: () => void
}

// Turns a Spanish local number ("600 000 000") into E.164 ("+34600000000").
// Leaves already-international numbers (starting with +) untouched.
function toE164(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith("+")) return trimmed.replace(/[\s-]/g, "")
  const digits = trimmed.replace(/\D/g, "")
  return `+34${digits}`
}

export function PhoneVerification({ phone, verified, onVerified }: PhoneVerificationProps) {
  const [step, setStep] = useState<"idle" | "sent">("idle")
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError("Introduce tu teléfono primero")
      return
    }
    setError(null)
    setSending(true)
    try {
      const result = await sendPhoneOtp(toE164(phone), "phone-verification-recaptcha")
      setConfirmationResult(result)
      setStep("sent")
    } catch (err: unknown) {
      resetRecaptcha()
      setError(err instanceof Error ? err.message : "No se pudo enviar el código. Revisa el número.")
    } finally {
      setSending(false)
    }
  }

  const handleConfirmCode = async () => {
    if (!confirmationResult || code.length < 6) return
    setError(null)
    setConfirming(true)
    try {
      await confirmationResult.confirm(code)
      onVerified()
    } catch {
      setError("Código incorrecto. Inténtalo de nuevo.")
    } finally {
      setConfirming(false)
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Teléfono verificado
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div id="phone-verification-recaptcha" className="max-w-full overflow-x-auto" />
      {step === "idle" && (
        <Button type="button" variant="outline" size="sm" onClick={handleSendCode} disabled={sending} className="w-full">
          {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
          {sending ? "Enviando código..." : "Verificar teléfono por SMS"}
        </Button>
      )}
      {step === "sent" && (
        <div className="space-y-2">
          <Label className="text-xs">Código recibido por SMS</Label>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
            />
            <Button type="button" onClick={handleConfirmCode} disabled={confirming || code.length < 6}>
              {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </Button>
          </div>
          <button type="button" onClick={handleSendCode} disabled={sending} className="text-xs text-primary underline">
            Reenviar código
          </button>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-[10px] leading-tight text-muted-foreground">
        Este sitio está protegido por reCAPTCHA y se aplican la{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
          Política de Privacidad
        </a>{" "}
        y los{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
          Términos de Servicio
        </a>{" "}
        de Google.
      </p>
    </div>
  )
}
