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

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"
    const stripe = getStripe()
    
    const session = await stripe.checkout.sessions.create({
      // Ver la nota junto a MANAGED_PAYMENTS_OFF.
      ...MANAGED_PAYMENTS_OFF,
      payment_method_types: ["card"],
      // Servicio e IVA como líneas separadas, para que el desglose se vea
      // también en la pantalla de Stripe y no solo en el resumen previo.
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `CamareroPorFavor - ${name}`,
              description: `Acceso a ${name} por ${validityDays} días`,
            },
            unit_amount: baseCents,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "eur",
            product_data: { name: VAT_LABEL },
            unit_amount: vatCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // "Destacar mi perfil" se compra desde Editar perfil, así que se vuelve
      // allí y la confirmación se da en un modal, sin sacar al usuario de su
      // pantalla. El resto de compras siguen usando la página de éxito.
      success_url:
        featureType === "highlight_profile"
          ? `${baseUrl}/edit-profile?destacado=1`
          : `${baseUrl}/micropayment/success?session_id={CHECKOUT_SESSION_ID}&feature=${featureType}&mp_id=${micropayment.id}`,
      cancel_url: `${baseUrl}/micropayment/cancel?mp_id=${micropayment.id}`,
      customer_email: user?.email,
      metadata: {
        micropayment_id: micropayment.id,
        user_id: userId,
        feature_type: featureType,
        ...(jobId ? { job_id: jobId } : {}),
        ...(flashDurationHours ? { flash_duration_hours: String(flashDurationHours) } : {}),
      },
    })

    // Update micropayment with Stripe session ID
    await supabase
      .from("micropayments")
      .update({ stripe_payment_intent_id: session.id })
      .eq("id", micropayment.id)

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      micropaymentId: micropayment.id,
    })
  } catch (error) {
    console.error("Error in micropayments/create:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
