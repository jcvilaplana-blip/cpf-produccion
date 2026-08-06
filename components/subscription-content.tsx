"use client"

import { useState } from "react"
import { useRouter } from "next/navigation" 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Check, Crown, ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function SubscriptionContent() {
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState<"standard" | "premium">("standard")
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const plans = [
    {
      id: "standard",
      name: "Plan Standard",
      price: "19,90€",
      period: "/mes",
      features: [
        "5 ofertas de trabajo",
        "Gestión de candidatos",
        "Mensajería con candidatos",
        "Estadísticas básicas",
        "Soporte por email",
      ],
      color: "blue",
      current: currentPlan === "standard",
    },
    {
      id: "premium",
      name: "Plan Premium",
      price: "29,90€",
      period: "/mes",
      features: [
        "20 ofertas de trabajo",
        "7 días destacado en página principal",
        "Todas las ventajas del Plan Standard",
        "Estadísticas avanzadas",
        "Soporte prioritario",
        "Insignia Premium verificada",
      ],
      color: "primary",
      popular: true,
      current: currentPlan === "premium",
    },
  ]

  const handleUpgrade = () => {
    alert("Redirigiendo a la pasarela de pago...")
    // En producción, aquí se integraría con Stripe
  }

  const handleCancelSubscription = () => {
    setShowCancelConfirm(true)
  }

  const confirmCancel = () => {
    alert("Suscripción cancelada. Tendrás acceso hasta el final del período actual.")
    setShowCancelConfirm(false)
    // En producción, aquí se cancelaría la suscripción en Stripe
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/">
              <Image src="/logo-cpf.png" alt="CamareroPorFavor" width={36} height={36} className="object-contain rounded-full" />
            </Link>
            <h1 className="text-lg font-semibold">Gestionar Suscripción</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Current Plan Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Tu Plan Actual</CardTitle>
            <CardDescription>
              Estás usando el {currentPlan === "standard" ? "Plan Standard" : "Plan Premium"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{currentPlan === "standard" ? "19,90€" : "29,90€"}/mes</p>
                <p className="text-sm text-muted-foreground">Próxima facturación: 15 de febrero de 2025</p>
              </div>
              <Badge variant={currentPlan === "premium" ? "default" : "secondary"} className="text-sm">
                {currentPlan === "premium" ? "Premium" : "Standard"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.current ? "border-primary border-2" : ""} ${plan.popular ? "shadow-lg" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Más Popular</Badge>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    Plan Actual
                  </Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className={`h-6 w-6 ${plan.id === "premium" ? "text-primary" : "text-[#01A89E]"}`} />
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {!plan.current && plan.id === "premium" && (
                  <Button onClick={handleUpgrade} className="w-full">
                    Actualizar a Premium
                  </Button>
                )}
                {plan.current && (
                  <Button variant="outline" className="w-full bg-transparent" disabled>
                    Plan Actual
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cancel Subscription */}
        {!showCancelConfirm ? (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Cancelar Suscripción</CardTitle>
              <CardDescription>
                Si cancelas tu suscripción, perderás acceso a todas las funciones premium al final del período actual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                Cancelar Suscripción
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>¿Estás seguro de que quieres cancelar tu suscripción?</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(false)}>
                  No, mantener
                </Button>
                <Button variant="destructive" size="sm" onClick={confirmCancel}>
                  Sí, cancelar
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
