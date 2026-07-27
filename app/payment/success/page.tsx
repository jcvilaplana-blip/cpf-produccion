"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  useEffect(() => {
    async function checkPayment() {
      if (!orderId) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data } = await supabase
        .from("payments")
        .select("*, profiles(full_name)")
        .eq("order_id", orderId)
        .single()

      setPaymentInfo(data)
      setLoading(false)
    }

    checkPayment()
  }, [orderId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <Image
            src="/logo-cpf.png"
            alt="CamareroPorFavor"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl text-green-700">Pago Completado</CardTitle>
          <CardDescription className="text-base">
            Tu suscripcion ha sido activada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentInfo && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-medium">{paymentInfo.order_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{paymentInfo.metadata?.plan_name || paymentInfo.plan_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Importe:</span>
                <span className="font-medium">{(paymentInfo.amount / 100).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium text-green-600">Completado</span>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            <p>Recibiras un email de confirmacion con los detalles de tu suscripcion.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                Ir a mi Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/subscription">
                Ver mi Suscripcion
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
