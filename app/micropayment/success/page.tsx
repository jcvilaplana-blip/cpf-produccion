"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles, Heart, Loader2, Zap, Star, Clock } from "lucide-react"
import Link from "next/link"

const POLL_INTERVAL_MS = 1500
const MAX_POLLS = 14 // ~21s

type PollState = "checking" | "completed" | "still-pending"

function MicropaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<PollState>("checking")
  const [featureType, setFeatureType] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const attemptsRef = useRef(0)

  const mpId = searchParams.get("mp_id")

  useEffect(() => {
    if (!mpId) {
      setState("still-pending")
      return
    }

    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/micropayments/${mpId}/status`)
        if (!res.ok) throw new Error("status check failed")
        const data = await res.json()
        if (cancelled) return

        if (data.status === "completed") {
          setFeatureType(data.featureType)
          setJobId(data.jobId)
          setState("completed")
          return
        }

        attemptsRef.current += 1
        if (attemptsRef.current >= MAX_POLLS) {
          setFeatureType(data.featureType)
          setState("still-pending")
          return
        }
        setTimeout(poll, POLL_INTERVAL_MS)
      } catch {
        if (!cancelled) setState("still-pending")
      }
    }

    poll()
    return () => {
      cancelled = true
    }
  }, [mpId])

  if (state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#01A89E] mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Confirmando tu pago...</p>
        </div>
      </div>
    )
  }

  if (state === "still-pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="pt-8 pb-6 px-6 text-center">
            <Clock className="w-10 h-10 text-[#F48221] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-2">Seguimos procesando tu pago</h1>
            <p className="text-muted-foreground mb-6">
              Stripe puede tardar unos segundos más en confirmarlo. En cuanto se complete, se activará
              automáticamente - no hace falta que pagues de nuevo. Te avisaremos.
            </p>
            <Button asChild className="w-full bg-[#01A89E] hover:bg-[#01A89E]/90">
              <Link href="/my-jobs">Volver a Mis Ofertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isHighlightProfile = featureType === "highlight_profile"
  const isMatches = featureType === "view_matches"
  const isFlashJob = featureType === "flash_job"
  const isHighlightJob = featureType === "highlight_job"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#01A89E]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#01A89E]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">¡Pago completado!</h1>

          <p className="text-muted-foreground mb-6">
            {isHighlightProfile && "Tu perfil ahora está destacado y aparecerá primero en las búsquedas durante 7 días."}
            {isMatches && "Ya puedes ver qué empresas han guardado tu perfil o les ha gustado."}
            {isFlashJob && "Tu oferta flash ya está activa y visible con prioridad. Estamos avisando a candidatos disponibles en tu zona."}
            {isHighlightJob && "Tu oferta ya está destacada durante las próximas 24 horas."}
            {!isHighlightProfile && !isMatches && !isFlashJob && !isHighlightJob && "Tu compra se ha procesado correctamente."}
          </p>

          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg mb-6">
            {isHighlightProfile && (
              <>
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-medium">Perfil Destacado - 7 días</span>
              </>
            )}
            {isMatches && (
              <>
                <Heart className="w-5 h-5 text-pink-500" />
                <span className="font-medium">Ver Empresas Interesadas - 30 días</span>
              </>
            )}
            {isFlashJob && (
              <>
                <Zap className="w-5 h-5 text-[#F97316]" />
                <span className="font-medium">Oferta Flash activada</span>
              </>
            )}
            {isHighlightJob && (
              <>
                <Star className="w-5 h-5 text-[#F48221]" />
                <span className="font-medium">Oferta Destacada - 24h</span>
              </>
            )}
          </div>

          <div className="space-y-3">
            {(isFlashJob || isHighlightJob) ? (
              <Button asChild className="w-full bg-[#01A89E] hover:bg-[#01A89E]/90">
                <Link href={jobId ? `/jobs/${jobId}` : "/my-jobs"}>Ver mi oferta</Link>
              </Button>
            ) : (
              <Button asChild className="w-full bg-[#01A89E] hover:bg-[#01A89E]/90">
                <Link href="/dashboard">Volver a mi perfil</Link>
              </Button>
            )}

            {isMatches && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/edit-profile">Ver empresas interesadas</Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">Recibirás un email con el recibo de tu compra.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function MicropaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    }>
      <MicropaymentSuccessContent />
    </Suspense>
  )
}
