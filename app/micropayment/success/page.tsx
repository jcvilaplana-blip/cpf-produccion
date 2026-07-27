"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Sparkles, Heart, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

function MicropaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [feature, setFeature] = useState<string | null>(null)

  const sessionId = searchParams.get("session_id")
  const featureType = searchParams.get("feature")
  const mpId = searchParams.get("mp_id")

  useEffect(() => {
    async function confirmPayment() {
      if (!mpId) {
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Update micropayment status to completed
      const { error } = await supabase
        .from("micropayments")
        .update({ status: "completed" })
        .eq("id", mpId)

      if (!error && featureType === "highlight_profile") {
        // Create highlighted profile entry
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        if (user) {
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 7)

          await supabase.from("highlighted_profiles").insert({
            profile_id: user.id,
            micropayment_id: mpId,
            end_date: endDate.toISOString(),
            is_active: true,
          })

          // Update profile to mark as highlighted
          await supabase
            .from("profiles")
            .update({ is_premium: true })
            .eq("id", user.id)
        }
      }

      setFeature(featureType)
      setLoading(false)
    }

    confirmPayment()
  }, [mpId, featureType])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#01A89E]" />
      </div>
    )
  }

  const isHighlight = feature === "highlight_profile"
  const isMatches = feature === "view_matches"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-teal-50 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardContent className="pt-8 pb-6 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#01A89E]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#01A89E]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            ¡Pago completado!
          </h1>

          <p className="text-muted-foreground mb-6">
            {isHighlight && "Tu perfil ahora está destacado y aparecerá primero en las búsquedas durante 7 días."}
            {isMatches && "Ya puedes ver qué empresas han guardado tu perfil o les ha gustado."}
            {!isHighlight && !isMatches && "Tu compra se ha procesado correctamente."}
          </p>

          <div className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg mb-6">
            {isHighlight && (
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
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-[#01A89E] hover:bg-[#01A89E]/90">
              <Link href="/dashboard">
                Volver a mi perfil
              </Link>
            </Button>
            
            {isMatches && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/edit-profile">
                  Ver empresas interesadas
                </Link>
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Recibirás un email con el recibo de tu compra.
          </p>
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
