export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js"
import { activateFeature, type MicropaymentRow } from "@/lib/payments/activate-feature"
import { notifyFlashOfferCandidates } from "@/lib/payments/flash-fanout"
import { notifyMatchingCandidates } from "@/lib/matching/notify-match-alerts"
import { notifyUser } from "@/lib/notifications/create-notification"

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

// `ReturnType<typeof createServiceClient>` da SupabaseClient<unknown> y no
// acepta el cliente real. Mismo caso que en las rutas de creación de perfil.
type ServiceClient = SupabaseClient<any, any, any>

/**
 * Refleja en la base de datos una suscripción activa de Stripe.
 *
 * El usuario y el plan viajan como metadatos de la propia suscripción (los
 * pone el checkout), no en una tabla de correspondencias: así las renovaciones
 * y las bajas, que llegan meses después y solo traen la suscripción, siguen
 * sabiendo a quién pertenecen sin necesidad de guardar identificadores de
 * Stripe en el perfil.
 */
async function applySubscription(
  supabase: ServiceClient,
  subscription: Stripe.Subscription,
  fallbackMetadata?: Record<string, string>
) {
  const metadata = { ...(fallbackMetadata || {}), ...(subscription.metadata || {}) }
  const userId = metadata.user_id
  const planId = metadata.plan_id
  if (!userId || !planId) {
    console.error("Stripe webhook: suscripción sin user_id/plan_id en metadatos", subscription.id)
    return
  }

  // Hasta cuándo está pagado, según Stripe: más fiable que sumar 30 días.
  const periodEnd = (subscription as any).current_period_end as number | undefined
  const expiresAt = periodEnd
    ? new Date(periodEnd * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  if (planId === "premium-worker") {
    await supabase
      .from("profiles")
      .update({
        is_premium: true,
        premium_expires_at: expiresAt,
        subscription_tier: planId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  } else {
    // Planes de empresa. "premium-business" además marca el perfil premium.
    await supabase
      .from("business_profiles")
      .update({
        subscription_plan: planId,
        subscription_expires_at: expiresAt,
        ...(planId === "premium-business"
          ? { is_premium: true, premium_expires_at: expiresAt }
          : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  }

  await notifyUser(userId, {
    title: "Suscripción activada",
    body: `Tu ${metadata.plan_name || "plan"} está activo hasta el ${new Date(expiresAt).toLocaleDateString("es-ES")}.`,
    type: "aviso",
    link: "/subscribe",
  })
}

/** Baja o impago: se retira el plan, pero no se borra el historial. */
async function cancelSubscription(supabase: ServiceClient, subscription: Stripe.Subscription) {
  const metadata = subscription.metadata || {}
  const userId = metadata.user_id
  const planId = metadata.plan_id
  if (!userId) return

  if (planId === "premium-worker") {
    await supabase
      .from("profiles")
      .update({ is_premium: false, subscription_tier: null, updated_at: new Date().toISOString() })
      .eq("id", userId)
  } else {
    await supabase
      .from("business_profiles")
      .update({
        subscription_plan: null,
        is_premium: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
  }

  await notifyUser(userId, {
    title: "Suscripción finalizada",
    body: "Tu plan ya no está activo. Puedes volver a suscribirte cuando quieras.",
    type: "aviso",
    link: "/subscribe",
  })
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

  const supabase = getServiceRoleClient()
  if (!supabase) {
    console.error("Stripe webhook: service role client not configured")
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }

  // --- Suscripciones -------------------------------------------------------
  // Hasta ahora este endpoint solo miraba `micropayment_id` y devolvía
  // "received" para todo lo demás: una empresa pagaba su plan y no se le
  // activaba nada, porque el checkout de suscripción manda `plan_id`.
  if (event.type === "invoice.paid") {
    // Renovación mensual: extiende la vigencia sin volver a activar nada.
    const invoice = event.data.object as Stripe.Invoice
    const subscriptionId = typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id
    if (subscriptionId) {
      try {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        await applySubscription(supabase, subscription)
      } catch (err) {
        console.error("Stripe webhook: no se pudo renovar la suscripción", err)
      }
    }
    return NextResponse.json({ received: true })
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription
    await cancelSubscription(supabase, subscription)
    return NextResponse.json({ received: true })
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription
    // Impagos y cancelaciones dejan la suscripción en un estado que ya no da
    // derecho al plan.
    if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
      await cancelSubscription(supabase, subscription)
    } else if (subscription.status === "active" || subscription.status === "trialing") {
      await applySubscription(supabase, subscription)
    }
    return NextResponse.json({ received: true })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const metadata = session.metadata || {}
  const micropaymentId = metadata.micropayment_id

  // Alta de suscripción: el checkout la crea, y aquí se refleja en la BD.
  if (!micropaymentId && metadata.plan_id) {
    const subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id
    try {
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
        await applySubscription(supabase, subscription, metadata)
      }
    } catch (err) {
      console.error("Stripe webhook: no se pudo activar la suscripción", err)
      // 500 para que Stripe reintente: el cobro se hizo y el plan tiene que
      // acabar activándose.
      return NextResponse.json({ error: "activation failed" }, { status: 500 })
    }
    return NextResponse.json({ received: true })
  }

  if (!micropaymentId) {
    console.error("Stripe webhook: checkout.session.completed sin micropayment_id ni plan_id")
    return NextResponse.json({ received: true })
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
