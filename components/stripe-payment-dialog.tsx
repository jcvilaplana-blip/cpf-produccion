"use client"

import { useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatEuros } from "@/lib/tax"
import { Loader2, Lock } from "lucide-react"

/**
 * Formulario de pago incrustado.
 *
 * Sustituye al salto a checkout.stripe.com. Aquel se abría en el navegador del
 * sistema cuando la aplicación corre dentro del WebView de Capacitor, de modo
 * que el usuario salía de CamareroPorFavor justo en el momento de pagar y
 * volvía -si volvía- por una redirección. Aquí el cobro ocurre en un diálogo
 * dentro de la propia pantalla desde la que se compra.
 *
 * Los datos de la tarjeta no pasan por nuestro servidor en ningún momento: el
 * Payment Element los recoge en un iframe de Stripe y los confirma contra
 * Stripe directamente, con el `clientSecret` que emitió el backend.
 */

// Fuera del componente a propósito: `loadStripe` inyecta el script de Stripe en
// la página, y llamarlo en cada render lo recargaría una y otra vez.
const clavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = clavePublica ? loadStripe(clavePublica) : null

export interface ResumenPago {
  nombre: string
  validezDias?: number
  baseCents: number
  vatCents: number
  totalCents: number
  vatLabel: string
}

interface StripePaymentDialogProps {
  /** Emitido por el backend al crear el cobro. `null` mantiene el diálogo cerrado. */
  clientSecret: string | null
  resumen: ResumenPago | null
  onClose: () => void
  /** Se invoca cuando Stripe confirma el cobro sin necesidad de redirección. */
  onSuccess: () => void
  /**
   * A dónde vuelve el usuario si su banco exige autenticación (3-D Secure).
   * Debe ser una URL de nuestro propio dominio para que el WebView la trate
   * como navegación interna y no expulse al usuario de la aplicación.
   */
  returnUrl: string
}

export function StripePaymentDialog({
  clientSecret,
  resumen,
  onClose,
  onSuccess,
  returnUrl,
}: StripePaymentDialogProps) {
  const opciones = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            locale: "es" as const,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#01A89E",
                borderRadius: "8px",
                fontFamily: "system-ui, sans-serif",
              },
            },
          }
        : undefined,
    [clientSecret]
  )

  const abierto = Boolean(clientSecret && resumen)

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar pago</DialogTitle>
          <DialogDescription>
            {resumen?.nombre}
            {resumen?.validezDias ? ` · ${resumen.validezDias} días` : ""}
          </DialogDescription>
        </DialogHeader>

        {resumen && (
          <div className="text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Base imponible</span>
              <span>{formatEuros(resumen.baseCents)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>{resumen.vatLabel}</span>
              <span>{formatEuros(resumen.vatCents)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatEuros(resumen.totalCents)}</span>
            </div>
          </div>
        )}

        {!stripePromise ? (
          <p className="text-sm text-destructive">
            La pasarela de pago no está configurada. Inténtalo más tarde.
          </p>
        ) : (
          opciones && (
            // La `key` fuerza a Elements a rearrancar si se abre un cobro
            // distinto: `clientSecret` no se puede cambiar en caliente.
            <Elements key={clientSecret} stripe={stripePromise} options={opciones}>
              <FormularioPago
                onSuccess={onSuccess}
                onCancel={onClose}
                returnUrl={returnUrl}
                total={resumen?.totalCents ?? 0}
              />
            </Elements>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}

function FormularioPago({
  onSuccess,
  onCancel,
  returnUrl,
  total,
}: {
  onSuccess: () => void
  onCancel: () => void
  returnUrl: string
  total: number
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listo, setListo] = useState(false)

  const pagar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements || procesando) return

    setProcesando(true)
    setError(null)

    // `redirect: "if_required"` mantiene el pago dentro de la aplicación
    // siempre que se pueda. Sólo si el banco exige 3-D Secure se navega, y
    // `return_url` trae de vuelta a nuestro dominio.
    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    })

    if (err) {
      // Los errores de tarjeta y de validación traen un mensaje ya traducido
      // por Stripe; el resto son fallos que el usuario no puede accionar.
      setError(
        err.type === "card_error" || err.type === "validation_error"
          ? err.message ?? "No se pudo completar el pago."
          : "No se pudo completar el pago. Inténtalo de nuevo."
      )
      setProcesando(false)
      return
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess()
      return
    }

    // `processing` en tarjetas es raro pero posible: el cobro acabará
    // liquidándose y el webhook lo activará, así que se trata como bueno.
    if (paymentIntent?.status === "processing") {
      onSuccess()
      return
    }

    setError("El pago no se ha completado. Revisa los datos e inténtalo de nuevo.")
    setProcesando(false)
  }

  return (
    <form onSubmit={pagar} className="space-y-4">
      <PaymentElement onReady={() => setListo(true)} />

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Pago seguro procesado por Stripe
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={procesando}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#01A89E] hover:bg-[#018F86] text-white"
          disabled={!listo || procesando}
        >
          {procesando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando…
            </>
          ) : (
            `Pagar ${formatEuros(total)}`
          )}
        </Button>
      </div>
    </form>
  )
}
