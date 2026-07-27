import { createClient } from "@/lib/supabase/server"
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans"
import { SubscribeContent } from "@/components/subscribe-content"
import { redirect } from "next/navigation"

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; verified?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/create-profile")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  const isNewBusiness = params.new === "1" || params.verified === "1"

  return (
    <SubscribeContent
      user={user}
      profile={profile}
      plans={SUBSCRIPTION_PLANS}
      currentSubscription={currentSubscription}
      isNewBusiness={isNewBusiness}
    />
  )
}
