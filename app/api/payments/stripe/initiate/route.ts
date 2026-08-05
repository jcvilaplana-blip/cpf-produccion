export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import { breakdownFromTotal, VAT_LABEL } from "@/lib/tax"
import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
  // Ver la nota en app/api/micropayments/create/route.ts sobre por qué la
  // versión sigue fijada pese al desajuste con los tipos del SDK.
  return new Stripe(key, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
}

// Stripe activa "Managed Payments" por defecto en cuentas nuevas: con él Stripe
// pasa a ser vendedor de registro, calcula y liquida el IVA, y por eso exige un
// código fiscal en cada producto creado al vuelo. Sin desactivarlo la sesión NI
// SE CREA -"the product tax code is missing"-, así que el botón de pagar fallaba
// tanto en suscripciones como en micropagos.
//
// Se desactiva porque CamareroPorFavor es quien factura y liquida el IVA: el
// desglose se calcula aquí (lib/tax.ts) y viaja como una línea propia del
// cobro, en lugar de delegar el impuesto en Stripe como vendedor de registro.
//
// El cast existe porque el SDK v19 todavía no tipa este campo, más reciente que
// la versión de API que tenemos fijada; el endpoint sí lo acepta.
const MANAGED_PAYMENTS_OFF = {
  managed_payments: { enabled: false },
} as unknown as Stripe.Checkout.SessionCreateParams

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { planId } = await req.json()
    if (!planId) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })

    // El precio sale del catálogo del servidor, NO del cuerpo de la petición.
    // Antes se cobraba el `amount` que enviaba el navegador: cualquiera podía
    // suscribirse al plan Premium por un céntimo cambiando la petición.
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 400 })

    const planName = plan.name
    const { baseCents, vatCents } = breakdownFromTotal(plan.priceInCents)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      ...MANAGED_PAYMENTS_OFF,
      payment_method_types: ["card"],
      // Dos líneas: servicio e IVA por separado, para que el desglose también
      // se vea en la pantalla de Stripe y no solo en el resumen previo.
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `CamareroPorFavor - ${planName}` },
            unit_amount: baseCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "eur",
            product_data: { name: VAT_LABEL },
            unit_amount: vatCents,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Los mismos metadatos, también en la suscripción creada: los eventos de
      // renovación y de baja llegan meses después y solo traen la suscripción,
      // sin la sesión de checkout. Sin esto no habría forma de saber a qué
      // usuario y plan corresponden.
      subscription_data: {
        metadata: { user_id: user.id, plan_id: planId, plan_name: planName },
      },
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe?new=1`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        plan_name: planName,
      },
    })

    return NextResponse.json({ checkoutUrl: session.url })
  } catch (error) {
    console.error("Error initiating Stripe payment:", error)
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 })
  }
}
