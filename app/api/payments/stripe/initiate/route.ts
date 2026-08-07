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

/**
 * Alta de suscripción cobrada dentro de la aplicación.
 *
 * Antes esto creaba una Checkout Session y devolvía su URL, que sólo se puede
 * pagar en checkout.stripe.com: dentro del WebView de Capacitor eso abría el
 * navegador del sistema y expulsaba al usuario de la aplicación justo al ir a
 * pagar. Ahora se crea la suscripción por API en estado `incomplete` y se
 * devuelve el `clientSecret` de su primera factura, que el Payment Element
 * confirma sin salir de la pantalla.
 *
 * Diferencia importante respecto al checkout: `subscriptions.create` no acepta
 * productos al vuelo -eso era exclusivo de `line_items[].price_data` en las
 * Sessions-, así que hace falta un Product y un Price de verdad en Stripe. Se
 * crean bajo demanda con identificadores deterministas y se reutilizan.
 */

/** Product estable por plan: el mismo plan siempre apunta al mismo producto. */
async function obtenerProducto(stripe: Stripe, planId: string, planName: string) {
  const productId = `cpf-plan-${planId}`
  try {
    return await stripe.products.retrieve(productId)
  } catch {
    return await stripe.products.create({
      id: productId,
      name: `CamareroPorFavor - ${planName}`,
      // El IVA no viaja como línea aparte porque una suscripción por API no
      // admite dos precios recurrentes creados al vuelo. El importe cobrado es
      // el mismo (el precio configurado ya lo incluye) y el desglose se
      // muestra al usuario antes de pagar y queda en los metadatos.
      description: `Suscripción mensual. Precio con IVA incluido.`,
    })
  }
}

/**
 * Price estable por plan e importe. El importe entra en la clave a propósito:
 * si algún día sube el precio del plan, se crea un Price nuevo en lugar de
 * cobrar el viejo, y los suscriptores actuales conservan el suyo.
 */
async function obtenerPrecio(stripe: Stripe, productId: string, planId: string, totalCents: number) {
  const lookupKey = `cpf-${planId}-${totalCents}-eur-mes`
  const existentes = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  })
  if (existentes.data.length > 0) return existentes.data[0]

  return await stripe.prices.create({
    product: productId,
    currency: "eur",
    unit_amount: totalCents,
    recurring: { interval: "month" },
    lookup_key: lookupKey,
  })
}

/** Reutiliza el cliente de Stripe del usuario para no duplicarlo en cada alta. */
async function obtenerCliente(stripe: Stripe, email: string | undefined, userId: string) {
  if (email) {
    const existentes = await stripe.customers.list({ email, limit: 1 })
    if (existentes.data.length > 0) return existentes.data[0]
  }
  return await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  })
}

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
    const { baseCents, vatCents, totalCents } = breakdownFromTotal(plan.priceInCents)

    const stripe = getStripe()

    const producto = await obtenerProducto(stripe, planId, planName)
    const precio = await obtenerPrecio(stripe, producto.id, planId, totalCents)
    const cliente = await obtenerCliente(stripe, user.email, user.id)

    const metadata = {
      user_id: user.id,
      plan_id: planId,
      plan_name: planName,
      base_cents: String(baseCents),
      vat_cents: String(vatCents),
      vat_label: VAT_LABEL,
    }

    const subscription = await stripe.subscriptions.create({
      customer: cliente.id,
      items: [{ price: precio.id }],
      // `default_incomplete` deja la suscripción esperando a que se pague su
      // primera factura, que es justo lo que va a hacer el Payment Element.
      // Sin esto Stripe intentaría cobrar de inmediato y fallaría: todavía no
      // hay ningún método de pago asociado al cliente.
      payment_behavior: "default_incomplete",
      payment_settings: {
        // La tarjeta queda guardada como método por defecto para que las
        // renovaciones mensuales se cobren solas.
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
      // Los metadatos van en la suscripción, no en una sesión: los eventos de
      // renovación y de baja llegan meses después y sólo traen la suscripción.
      // Sin esto el webhook no sabría a qué usuario y plan corresponden.
      metadata,
    })

    const factura = subscription.latest_invoice as Stripe.Invoice | null
    const intent = (factura as any)?.payment_intent as Stripe.PaymentIntent | null
    const clientSecret = intent?.client_secret

    if (!clientSecret) {
      console.error("Stripe: la suscripción se creó sin PaymentIntent", subscription.id)
      return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      resumen: {
        nombre: planName,
        baseCents,
        vatCents,
        totalCents,
        vatLabel: VAT_LABEL,
      },
    })
  } catch (error) {
    console.error("Error initiating Stripe payment:", error)
    return NextResponse.json({ error: "Error al iniciar el pago" }, { status: 500 })
  }
}
