"use client"

import { useState, useEffect, useRef } from "react"
import { PaymentSummaryDialog } from "@/components/payment-summary-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Check, Crown, Sparkles, CreditCard, Loader2, PartyPopper } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { SubscriptionPlan } from "@/lib/subscription-plans"

interface SubscribeContentProps {
  user: any
  profile: any
  plans: SubscriptionPlan[]
  currentSubscription: any
  isNewBusiness?: boolean
}

export function SubscribeContent({
  user,
  profile,
  plans,
  currentSubscription,
  isNewBusiness = false,
}: SubscribeContentProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [redsysData, setRedsysData] = useState<{
    url: string
    Ds_SignatureVersion: string
    Ds_MerchantParameters: string
    Ds_Signature: string
  } | null>(null)

  // Auto-submit form when Redsys data is ready
  useEffect(() => {
    if (redsysData && formRef.current) {
      formRef.current.submit()
    }
  }, [redsysData])

  // Pulsar el plan ya no va directo a la pasarela: primero se muestra el
  // desglose (servicio + IVA + total) y solo al confirmar se abre Stripe.
  const [summaryPlan, setSummaryPlan] = useState<{ id: string; name: string; priceInCents: number } | null>(null)

  const handleSubscribe = (planId: string, planName: string, priceInCents: number) => {
    if (planId === "free") return
    setSummaryPlan({ id: planId, name: planName, priceInCents })
  }

  const startCheckout = async () => {
    if (!summaryPlan) return
    setIsLoading(true)
    setLoadingPlanId(summaryPlan.id)

    try {
      // Solo se manda el id: el precio lo pone el servidor desde su catálogo.
      const response = await fetch("/api/payments/stripe/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: summaryPlan.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar el pago")
      }

      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error("Error starting payment:", error)
      alert(error instanceof Error ? error.message : "Error al iniciar el proceso de pago")
      setIsLoading(false)
      setLoadingPlanId(null)
      setSummaryPlan(null)
    }
  }

  // Only show business plans to business users
  const visiblePlans = plans.filter((p) =>
    profile?.user_type === "business"
      ? p.id !== "free" && p.id !== "premium-worker"
      : p.id !== "premium-business"
  )

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {!isNewBusiness && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/business-dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Image
              src="/logo-cpf.png"
              alt="CamareroPorFavor"
              width={36}
              height={36}
              className="object-contain rounded-full"
            />
            <h1 className="text-xl font-bold">
              {isNewBusiness ? "Elige tu Plan para Empezar" : "Suscripción"}
            </h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Plan vigente. La página ya cargaba `currentSubscription` de la tabla
            `subscriptions` y no lo mostraba en ninguna parte: solo se veía el
            catálogo, sin forma de saber a qué estabas suscrito ni hasta cuándo. */}
        {currentSubscription && (() => {
          const plan = plans.find((p) => p.id === currentSubscription.plan_type)
          const end = currentSubscription.current_period_end
          const daysLeft = end ? Math.ceil((new Date(end).getTime() - Date.now()) / 86400000) : null
          return (
            <div className="mb-8 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
                    Tu suscripción
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {plan?.name || currentSubscription.plan_type}
                  </h2>
                  {plan && (
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  )}
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  {currentSubscription.status === "active" ? "Activa" : currentSubscription.status}
                </Badge>
              </div>

              {end && (
                <div className="mt-4 rounded-xl bg-background/70 px-4 py-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Válida hasta el </span>
                    <strong>
                      {new Date(end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </strong>
                    {typeof daysLeft === "number" && daysLeft >= 0 && (
                      <span className="text-muted-foreground"> · quedan {daysLeft} días</span>
                    )}
                  </p>
                  {currentSubscription.current_period_start && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Periodo iniciado el{" "}
                      {new Date(currentSubscription.current_period_start).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                    </p>
                  )}
                </div>
              )}

              {plan && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold">Incluye</p>
                  <ul className="space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}

        {/* Banner para empresa recién registrada */}
        {isNewBusiness && (
          <div className="mb-8 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-6 text-center">
            <PartyPopper className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">
              ¡Bienvenida, {profile?.display_name || "empresa"}!
            </h2>
            <p className="text-muted-foreground">
              Tu cuenta ha sido creada correctamente. Para publicar ofertas de empleo y acceder al panel de empresa,
              selecciona y activa tu plan de suscripción.
            </p>
          </div>
        )}

        {/* Suscripción activa */}
        {currentSubscription && !isNewBusiness && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Crown className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Suscripción Activa</h3>
                    <p className="text-sm text-muted-foreground">
                      Plan: {currentSubscription.plan_type} — Renovación:{" "}
                      {new Date(currentSubscription.current_period_end).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Activo</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planes */}
        <div className={`grid gap-6 mb-10 ${visiblePlans.length > 1 ? "md:grid-cols-2" : "max-w-md mx-auto"}`}>
          {visiblePlans.map((plan) => {
            const isActive = currentSubscription?.plan_type === plan.id
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "border-primary border-2 shadow-lg" : ""} ${isActive ? "border-green-500 border-2" : ""}`}
              >
                {plan.popular && !isActive && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Más Popular
                    </Badge>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-500 text-white px-4 py-1">Plan Actual</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl mb-1">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {plan.priceInCents === 0 ? "Gratis" : `${(plan.priceInCents / 100).toFixed(2).replace(".", ",")}€`}
                    </span>
                    {plan.priceInCents > 0 && <span className="text-muted-foreground">/mes</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular && !isActive ? "bg-primary hover:bg-primary/90" : ""}`}
                    variant={plan.popular && !isActive ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id, plan.name, plan.priceInCents)}
                    disabled={isLoading || plan.id === "free" || isActive}
                  >
                    {isActive ? (
                      "Plan Actual"
                    ) : plan.id === "free" ? (
                      "Plan Gratuito"
                    ) : loadingPlanId === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        {isNewBusiness ? "Activar Plan" : "Suscribirme"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Seguridad de pago */}
        <div className="text-center text-sm text-muted-foreground mb-8">
          <p>
            Pago seguro con tarjeta a través de{" "}
            <span className="font-semibold text-foreground">Redsys</span>,
            la pasarela de los principales bancos españoles.
          </p>
          <p className="mt-1">Compatible con Visa, Mastercard y demás tarjetas de crédito y débito.</p>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          {[
            {
              q: "¿Puedo cancelar en cualquier momento?",
              a: "Sí, puedes cancelar tu suscripción desde tu perfil. Mantendrás el acceso hasta el final del período de facturación.",
            },
            {
              q: "¿Hay reembolsos?",
              a: "Ofrecemos reembolso completo dentro de los primeros 7 días si no estás satisfecho.",
            },
          ].map(({ q, a }) => (
            <Card key={q}>
              <CardHeader>
                <CardTitle className="text-base">{q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Hidden Redsys Form */}
      {redsysData && (
        <form ref={formRef} action={redsysData.url} method="POST" className="hidden">
          <input type="hidden" name="Ds_SignatureVersion" value={redsysData.Ds_SignatureVersion} />
          <input type="hidden" name="Ds_MerchantParameters" value={redsysData.Ds_MerchantParameters} />
          <input type="hidden" name="Ds_Signature" value={redsysData.Ds_Signature} />
        </form>
      )}

      {/* Desglose del importe antes de ir a la pasarela */}
      {summaryPlan && (
        <PaymentSummaryDialog
          open={Boolean(summaryPlan)}
          onOpenChange={(open) => { if (!open) setSummaryPlan(null) }}
          concept={summaryPlan.name}
          detail="Suscripción mensual"
          totalCents={summaryPlan.priceInCents}
          recurring
          loading={isLoading}
          onConfirm={startCheckout}
        />
      )}
    </div>
  )
}
