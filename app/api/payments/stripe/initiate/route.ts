export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
  // Ver la nota en app/api/micropayments/create/route.ts sobre por qué la
  // versión sigue fijada pese al desajuste con los tipos del SDK.
  return new Stripe(key, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { planId, planName, amount } = await req.json()
    if (!planId || !amount) return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://camareroporfavor.com"
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: `CamareroPorFavor - ${planName}` },
          unit_amount: amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      mode: "subscription",
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
