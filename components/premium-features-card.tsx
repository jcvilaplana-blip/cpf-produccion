"use client"

import { useState } from "react"
import { PaymentSummaryDialog } from "@/components/payment-summary-dialog"
import { StripePaymentDialog, type ResumenPago } from "@/components/stripe-payment-dialog"
import { formatEuros } from "@/lib/tax"

// Mismo importe que FEATURE_PRICES en app/api/micropayments/create/route.ts.
// El servidor es quien decide el cobro; esto solo es lo que se enseña.
const HIGHLIGHT_PROFILE_PRICE_CENTS = 99
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Eye, Heart, Crown, Loader2, CheckCircle2, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface PremiumFeaturesCardProps {
  onPurchaseComplete?: () => void
}

export function PremiumFeaturesCard({ onPurchaseComplete }: PremiumFeaturesCardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [showMatchesDialog, setShowMatchesDialog] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [hasAccessToMatches, setHasAccessToMatches] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [highlightEndDate, setHighlightEndDate] = useState<string | null>(null)

  const supabase = createClient()

  // Check if profile is currently highlighted
  const checkHighlightStatus = async () => {
    if (!user?.id) return
    
    const { data } = await supabase
      .from("highlighted_profiles")
      .select("end_date")
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .single()
    
    if (data) {
      setIsHighlighted(true)
      setHighlightEndDate(data.end_date)
    }
  }

  // Check if user has access to view matches
  const checkMatchesAccess = async () => {
    if (!user?.id) return false
    
    const { data } = await supabase
      .from("micropayments")
      .select("id")
      .eq("user_id", user.id)
      .eq("feature_type", "view_matches")
      .eq("status", "completed")
      .gt("valid_until", new Date().toISOString())
      .single()
    
    return !!data
  }

  // Handle highlight profile purchase
  // Antes de la pasarela se muestra el desglose del importe.
  const [showSummary, setShowSummary] = useState(false)
  // Cobro en curso. El formulario se pinta en un diálogo dentro de la app en
  // lugar de mandar al usuario a checkout.stripe.com.
  const [pago, setPago] = useState<{
    clientSecret: string
    resumen: ResumenPago
    micropaymentId: string
    featureType: string
  } | null>(null)

  const handleHighlightProfile = async () => {
    if (!user?.id) return
    setLoading("highlight")

    try {
      // Create payment via Stripe
      const response = await fetch("/api/micropayments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureType: "highlight_profile",
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.clientSecret) {
        setShowSummary(false)
        setPago({
          clientSecret: data.clientSecret,
          resumen: data.resumen,
          micropaymentId: data.micropaymentId,
          featureType: "highlight_profile",
        })
      } else if (data.success) {
        // Direct success (for testing or already highlighted)
        setIsHighlighted(true)
        onPurchaseComplete?.()
      }
    } catch (error) {
      console.error("Error purchasing highlight:", error)
    } finally {
      setLoading(null)
    }
  }

  // Handle view matches purchase
  const handleViewMatches = async () => {
    if (!user?.id) return
    setLoading("matches")

    try {
      // Check if already has access
      const hasAccess = await checkMatchesAccess()
      
      if (hasAccess) {
        // Already has access, show matches
        setHasAccessToMatches(true)
        await loadMatches()
        setShowMatchesDialog(true)
      } else {
        // Need to purchase
        const response = await fetch("/api/micropayments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            featureType: "view_matches",
            userId: user.id,
          }),
        })

        const data = await response.json()

        if (data.clientSecret) {
          setPago({
            clientSecret: data.clientSecret,
            resumen: data.resumen,
            micropaymentId: data.micropaymentId,
            featureType: "view_matches",
          })
        }
      }
    } catch (error) {
      console.error("Error purchasing matches view:", error)
    } finally {
      setLoading(null)
    }
  }

  // Load matches/likes from businesses
  const loadMatches = async () => {
    if (!user?.id) return
    setLoadingMatches(true)

    try {
      const { data } = await supabase
        .from("profile_interactions")
        .select(`
          id,
          interaction_type,
          created_at,
          business_id,
          business_profiles!inner(
            id,
            company_name,
            company_logo_url,
            city,
            business_type
          )
        `)
        .eq("candidate_id", user.id)
        .in("interaction_type", ["like", "save"])
        .order("created_at", { ascending: false })

      setMatches(data || [])
    } catch (error) {
      console.error("Error loading matches:", error)
    } finally {
      setLoadingMatches(false)
    }
  }

  return (
    <>
      <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
            <CardTitle className="text-base">Funciones Premium</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Highlight Profile */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#01A89E]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#01A89E]" />
              </div>
              <div>
                <p className="font-medium text-sm">Destacar mi perfil</p>
                <p className="text-[13px] text-muted-foreground">Aparece primero en las búsquedas (7 días)</p>
              </div>
            </div>
            <div className="text-right">
              {isHighlighted ? (
                <Badge className="bg-[#01A89E] text-white">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Activo
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSummary(true)}
                  disabled={loading === "highlight"}
                  className="bg-[#01A89E] hover:bg-[#01A89E]/90"
                >
                  {loading === "highlight" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>{formatEuros(HIGHLIGHT_PROFILE_PRICE_CENTS)}</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* View Matches */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium text-sm">Ver quién me ha guardado</p>
                <p className="text-[13px] text-muted-foreground">Descubre qué empresas les interesas</p>
              </div>
            </div>
            <div className="text-right">
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewMatches}
                disabled={loading === "matches"}
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                {loading === "matches" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-1" />
                    0,99€
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-[12px] text-center text-muted-foreground pt-2">
            Pago seguro con Stripe. IVA incluido.
          </p>
        </CardContent>
      </Card>

      {/* Matches Dialog */}
      <Dialog open={showMatchesDialog} onOpenChange={setShowMatchesDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Empresas interesadas en ti
            </DialogTitle>
            <DialogDescription>
              Estas empresas han guardado tu perfil o les ha gustado
            </DialogDescription>
          </DialogHeader>

          {loadingMatches ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#01A89E]" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aún no hay empresas que hayan guardado tu perfil.
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Completa tu perfil y sube un video para atraer más empresas.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center overflow-hidden">
                    {match.business_profiles?.company_logo_url ? (
                      <img
                        src={match.business_profiles.company_logo_url}
                        alt={match.business_profiles.company_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {match.business_profiles?.company_name || "Empresa"}
                    </p>
                    <p className="text-[13px] text-muted-foreground truncate">
                      {match.business_profiles?.city || "Sin ubicación"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[12px]">
                    {match.interaction_type === "like" ? "Le gustas" : "Guardado"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Desglose (servicio + IVA + total) antes de abrir Stripe */}
      <PaymentSummaryDialog
        open={showSummary}
        onOpenChange={setShowSummary}
        concept="Destacar mi perfil"
        detail="Aparece primero en las búsquedas durante 7 días"
        totalCents={HIGHLIGHT_PROFILE_PRICE_CENTS}
        loading={loading === "highlight"}
        onConfirm={handleHighlightProfile}
      />

      <StripePaymentDialog
        clientSecret={pago?.clientSecret ?? null}
        resumen={pago?.resumen ?? null}
        returnUrl={
          typeof window !== "undefined" && pago
            ? `${window.location.origin}/micropayment/success?mp_id=${pago.micropaymentId}`
            : ""
        }
        onClose={() => setPago(null)}
        onSuccess={() => {
          if (!pago) return
          // "Destacar perfil" se compra desde Editar perfil y se confirma allí
          // mismo, sin sacar al usuario de su pantalla; el resto pasa por la
          // página de éxito, que espera a que el webhook active la compra.
          if (pago.featureType === "highlight_profile") {
            setPago(null)
            setIsHighlighted(true)
            onPurchaseComplete?.()
            return
          }
          window.location.href = `/micropayment/success?mp_id=${pago.micropaymentId}`
        }}
      />
    </>
  )
}
