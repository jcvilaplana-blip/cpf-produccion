export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { activateFeature, type MicropaymentRow } from "@/lib/payments/activate-feature"
import { notifyFlashOfferCandidates } from "@/lib/payments/flash-fanout"
import { notifyMatchingCandidates } from "@/lib/matching/notify-match-alerts"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured")
  // Ver la nota en app/api/micropayments/create/route.ts sobre por qué la
  // versión sigue fijada pese al desajuste con los tipos del SDK.
  return new Stripe(key, { apiVersion: "2024-06-20" as Stripe.LatestApiVersion })
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

// Real server-side payment verification. Previously this endpoint was a
// no-op stub ("Beta mode") and activation happened client-side on
// /micropayment/success - meaning nobody actually confirmed Stripe charged
// the card. Now that Flash/Destacar charge real money to businesses, this
// verifies the event signature and is the ONLY place activation happens.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    console.error("Stripe webhook: missing signature or STRIPE_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 })
  }

  // Signature verification requires the untouched raw body bytes.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error("Stripe webhook: signature verification failed", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata || {}
  const micropaymentId = metadata.micropayment_id

  if (!micropaymentId) {
    console.error("Stripe webhook: checkout.session.completed with no micropayment_id in metadata")
    return NextResponse.json({ received: true })
  }

  const supabase = getServiceRoleClient()
  if (!supabase) {
    console.error("Stripe webhook: service role client not configured")
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  const { data: micropayment } = await supabase
    .from("micropayments")
    .select("id, user_id, feature_type, job_id, status")
    .eq("id", micropaymentId)
    .single()

  if (!micropayment) {
    console.error(`Stripe webhook: micropayment ${micropaymentId} not found`)
    return NextResponse.json({ received: true })
  }

  // Idempotency guard: Stripe retries webhook delivery on non-2xx responses
  // (and can rarely double-deliver even on 2xx) - never re-run activation.
  if (micropayment.status === "completed") {
    return NextResponse.json({ received: true, alreadyProcessed: true })
  }

  await supabase.from("micropayments").update({ status: "completed" }).eq("id", micropaymentId)

  const row: MicropaymentRow = {
    id: micropayment.id,
    user_id: micropayment.user_id,
    feature_type: micropayment.feature_type,
    job_id: micropayment.job_id,
    status: "completed",
  }

  await activateFeature(supabase, row, {
    flashDurationHours: metadata.flash_duration_hours ? Number(metadata.flash_duration_hours) : undefined,
  })

  // Best-effort: the charge and job activation above are authoritative and
  // already succeeded, so a notification failure must never turn into a
  // failed webhook response (which would make Stripe retry the whole thing,
  // including re-charging logic guards).
  if (row.feature_type === "flash_job" && row.job_id) {
    try {
      const { data: job } = await supabase
        .from("jobs")
        .select("id, title, city, location, contract_type, category, position")
        .eq("id", row.job_id)
        .single()

      // A flash job hasn't "been published" while payment was pending, so
      // this is also where 7.2's match-alert fires for it - run first (the
      // stricter, opt-in superset) so its recipients are excluded from the
      // broader city-only flash fan-out below.
      let notifiedUserIds = new Set<string>()
      if (job) {
        const result = await notifyMatchingCandidates(supabase, job)
        notifiedUserIds = result.notifiedUserIds
      }
      await notifyFlashOfferCandidates(supabase, row.job_id, notifiedUserIds)
    } catch (err) {
      console.error("Stripe webhook: flash offer notification fan-out failed", err)
    }
  }

  return NextResponse.json({ received: true })
}
