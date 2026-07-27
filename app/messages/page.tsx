import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversations, getOrCreateConversation } from "@/lib/messaging"
import { MessagesContent } from "@/components/messages-content"


export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    candidateId?: string
    businessId?: string
    offerId?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If navigating to message a specific user, ensure conversation exists
  let initialConversationId: string | null = null
  const targetUserId = params.candidateId || params.businessId

  if (targetUserId) {
    initialConversationId = await getOrCreateConversation(supabase, user.id, targetUserId)
  }

  // Get all conversations
  const conversations = await getConversations(supabase, user.id)

  return (
    <MessagesContent
      user={user}
      profile={profile}
      conversations={conversations}
      initialConversationId={initialConversationId}
    />
  )
}
