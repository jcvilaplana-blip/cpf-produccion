export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { breakdownFromTotal, VAT_LABEL } from "@/lib/tax"
import Stripe from "stripe"

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key, {
    // La versión de la API va fijada a propósito: el SDK v19 se genera contra
    // "2025-09-30.clover" y sus tipos describen esa forma, pero cambiarla aquí
    // cambiaría de verdad lo que devuelve Stripe. Los pagos están sin probar
    // (STRIPE_WEBHOOK_SECRET ni siquiera está configurado), así que se
    // mantiene la fijada y se marca el desajuste en lugar de tocar el
    // comportamiento a ciegas.
    // TODO(antes de lanzar): subir a la versión del SDK y probar el cobro
    // completo, incluido el webhook.
    apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
  })
}

// Nota sobre "Managed Payments": con él activado Stripe pasa a ser vendedor de
// registro y exige un código fiscal en cada producto creado al vuelo, lo que
// impedía crear las Checkout Sessions ("the product tax code is missing"). Este
// endpoint ya no crea productos -un PaymentIntent es sólo un importe-, así que
// el problema no se plantea. Sigue haciendo falta desactivarlo en la cuenta
// para las suscripciones, que sí usan Sessions.
//
// CamareroPorFavor es quien factura y liquida el IVA: el desglose se calcula
// aquí (lib/tax.ts) y viaja en los metadatos del cobro.

const FEATURE_PRICES = {
  highlight_profile: 99,  // 0.99€ in cents
  view_matches: 99,       // 0.99€ in cents
  boost_visibility: 199,  // 1.99€ in cents
  flash_job: 500,         // 5€ flat per flash offer, regardless of vacancy count
  highlight_job: 250,     // 2.5€ to highlight an existing offer for 24h
}

const FEATURE_NAMES = {
  highlight_profile: "Destacar Perfil (7 días)",
  view_matches: "Ver Empresas Interesadas",
  boost_visibility: "Impulsar Visibilidad",
  flash_job: "Oferta Flash",
  highlight_job: "Destacar Oferta (24h)",
}

const FEATURE_VALIDITY_DAYS = {
  highlight_profile: 7,
  view_matches: 30, // Access for 30 days
  boost_visibility: 3,
  flash_job: 2,     // covers the longest flash duration option (48h)
  highlight_job: 1, // 24h
}

export async function POST(request: Request) {
  try {
    const { featureType, userId, jobId, flashDurationHours } = await request.json()

    if (!featureType || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if ((featureType === "flash_job" || featureType === "highlight_job") && !jobId) {
      return NextResponse.json(
        { error: "jobId is required for job-related features" },
        { status: 400 }
      )
    }

    // FEATURE_PRICES es el importe final con IVA incluido; aquí se desglosa.
    const price = FEATURE_PRICES[featureType as keyof typeof FEATURE_PRICES]
    const name = FEATURE_NAMES[featureType as keyof typeof FEATURE_NAMES]
    const validityDays = FEATURE_VALIDITY_DAYS[featureType as keyof typeof FEATURE_VALIDITY_DAYS]

    if (!price || !name) {
      return NextResponse.json(
        { error: "Invalid feature type" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get user email for Stripe
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single()

    const { data: { user } } = await supabase.auth.getUser()

    // Calculate valid_until date
    const { baseCents, vatCents, totalCents } = breakdownFromTotal(price)

    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validityDays)

    // Create micropayment record
    const { data: micropayment, error: mpError } = await supabase
      .from("micropayments")
      .insert({
        user_id: userId,
        feature_type: featureType,
        amount_cents: totalCents,
        currency: "eur",
        status: "pending",
        valid_until: validUntil.toISOString(),
        job_id: jobId || null,
      })
      .select()
      .single()

    if (mpError) {
      console.error("Error creating micropayment:", mpError)
      return NextResponse.json(
        { error: "Error creating payment record" },
        { status: 500 }
      )
    }

    // El cobro se crea como PaymentIntent, no como Checkout Session: la Session
    // sólo se puede pagar en checkout.stripe.com, y llegar allí sacaba al
    // usuario de la aplicación al navegador del sistema justo en el momento de
    // pagar. Con un PaymentIntent el formulario se pinta dentro de la propia
    // app (components/stripe-payment-dialog.tsx) y el proceso entero ocurre
    // sin salir de ella.
    const stripe = getStripe()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "eur",
      // Sólo tarjeta, deliberadamente. `automatic_payment_methods` ofrecería
      // también medios como Bizum, que se cobran redirigiendo al banco: dentro
      // del WebView eso volvería a expulsar al usuario de la aplicación, que es
      // exactamente lo que esta migración viene a resolver.
      payment_method_types: ["card"],
      description: `CamareroPorFavor - ${name}`,
      receipt_email: user?.email ?? undefined,
      // El desglose del IVA ya no puede viajar como líneas del cobro -eso era
      // cosa de las Sessions-, así que se guarda en los metadatos para que
      // quede en el registro de Stripe, y se muestra al usuario en el resumen
      // del formulario antes de pagar.
      metadata: {
        micropayment_id: micropayment.id,
        user_id: userId,
        feature_type: featureType,
        base_cents: String(baseCents),
        vat_cents: String(vatCents),
        vat_label: VAT_LABEL,
        ...(jobId ? { job_id: jobId } : {}),
        ...(flashDurationHours ? { flash_duration_hours: String(flashDurationHours) } : {}),
      },
    })

    // Guarda el id del PaymentIntent. Antes esta columna guardaba el id de la
    // Session pese a llamarse `stripe_payment_intent_id`; ahora el nombre y el
    // contenido por fin coinciden.
    await supabase
      .from("micropayments")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", micropayment.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      micropaymentId: micropayment.id,
      // Para el resumen que se pinta junto al formulario.
      resumen: {
        nombre: name,
        validezDias: validityDays,
        baseCents,
        vatCents,
        totalCents,
        vatLabel: VAT_LABEL,
      },
    })
  } catch (error) {
    console.error("Error in micropayments/create:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
