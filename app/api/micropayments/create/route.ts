export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured")
  }
  return new Stripe(key, {
    apiVersion: "2024-06-20",
  })
}

const FEATURE_PRICES = {
  highlight_profile: 99, // 0.99€ in cents
  view_matches: 99,      // 0.99€ in cents
  boost_visibility: 199, // 1.99€ in cents
}

const FEATURE_NAMES = {
  highlight_profile: "Destacar Perfil (7 días)",
  view_matches: "Ver Empresas Interesadas",
  boost_visibility: "Impulsar Visibilidad",
}

const FEATURE_VALIDITY_DAYS = {
  highlight_profile: 7,
  view_matches: 30, // Access for 30 days
  boost_visibility: 3,
}

export async function POST(request: Request) {
  try {
    const { featureType, userId } = await request.json()

    if (!featureType || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

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
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + validityDays)

    // Create micropayment record
    const { data: micropayment, error: mpError } = await supabase
      .from("micropayments")
      .insert({
        user_id: userId,
        feature_type: featureType,
        amount_cents: price,
        currency: "eur",
        status: "pending",
        valid_until: validUntil.toISOString(),
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
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `CamareroPorFavor - ${name}`,
              description: `Acceso a ${name} por ${validityDays} días`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/micropayment/success?session_id={CHECKOUT_SESSION_ID}&feature=${featureType}&mp_id=${micropayment.id}`,
      cancel_url: `${baseUrl}/micropayment/cancel?mp_id=${micropayment.id}`,
      customer_email: user?.email,
      metadata: {
        micropayment_id: micropayment.id,
        user_id: userId,
        feature_type: featureType,
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
