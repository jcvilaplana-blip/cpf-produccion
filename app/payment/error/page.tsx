"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft, RefreshCcw, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

function PaymentErrorContent() {
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
        .select("*")
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
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <Image
            src="/logo-cpf.png"
            alt="CamareroPorFavor"
            width={48}
            height={48}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl text-red-700">Pago No Completado</CardTitle>
          <CardDescription className="text-base">
            Ha ocurrido un error al procesar tu pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentInfo && (
            <div className="bg-red-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-medium">{paymentInfo.order_id}</span>
              </div>
              {paymentInfo.response_message && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Motivo:</span>
                  <span className="font-medium text-red-600">{paymentInfo.response_message}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estado:</span>
                <span className="font-medium text-red-600">Fallido</span>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Por favor, verifica los datos de tu tarjeta e intentalo de nuevo.</p>
            <p>Si el problema persiste, contacta con tu entidad bancaria.</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/subscribe">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Intentar de Nuevo
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Si necesitas ayuda, contacta con{" "}
              <a href="mailto:soporte@camareroporfavor.com" className="text-primary hover:underline">
                soporte@camareroporfavor.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  )
}
