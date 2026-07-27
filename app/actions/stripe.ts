"use server"

export async function startCheckoutSession(planId: string) {
  throw new Error("Las suscripciones no están disponibles en modo Beta")
}

export async function getSubscriptionStatus() {
  return null
}

export async function cancelSubscription() {
  throw new Error("Las suscripciones no están disponibles en modo Beta")
}

// Uncomment the following code to enable Stripe actions
/*
export async function startCheckoutSession(planId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan || plan.id === "free") {
    throw new Error(`Plan con id "${planId}" no encontrado o no válido`)
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  let customerId: string | undefined

  // Check if user already has a subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single()

  if (existingSubscription?.stripe_customer_id) {
    customerId = existingSubscription.stripe_customer_id
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile?.display_name,
      metadata: {
        user_id: user.id,
      },
    })
    customerId = customer.id
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: plan.name,
            description: plan.description,
          },
          unit_amount: plan.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    mode: "subscription",
    metadata: {
      user_id: user.id,
      plan_id: planId,
    },
  })

  return session.client_secret
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  return subscription
}

export async function cancelSubscription() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  if (!subscription?.stripe_subscription_id) {
    throw new Error("No se encontró suscripción activa")
  }

  // Cancel at period end
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  return { success: true }
}
*/
