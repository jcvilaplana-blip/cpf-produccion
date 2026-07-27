import type { SupabaseClient } from "@supabase/supabase-js"

export interface Conversation {
  id: string
  participant_1: string
  participant_2: string
  last_message: string | null
  last_message_at: string
  created_at: string
  other_participant?: {
    id: string
    display_name: string
    avatar_url: string | null
    user_type: string
    availability_status?: string | null
  }
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string | null
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
  job_id?: string | null
}

/**
 * Get all conversations for a user, enriched with the other participant's profile
 */
export async function getConversations(supabase: SupabaseClient, userId: string): Promise<Conversation[]> {
  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order("last_message_at", { ascending: false })

  if (error || !conversations) return []

  const otherIds = conversations.map((c) =>
    c.participant_1 === userId ? c.participant_2 : c.participant_1
  )

  if (otherIds.length === 0) return []

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, user_type, availability_status")
    .in("id", otherIds)

  const { data: unreadCounts } = await supabase
    .from("messages")
    .select("conversation_id")
    .eq("receiver_id", userId)
    .eq("read", false)

  const unreadMap: Record<string, number> = {}
  if (unreadCounts) {
    for (const msg of unreadCounts) {
      if (msg.conversation_id) {
        unreadMap[msg.conversation_id] = (unreadMap[msg.conversation_id] || 0) + 1
      }
    }
  }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || [])

  return conversations.map((conv) => {
    const otherId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1
    return {
      ...conv,
      other_participant: profileMap.get(otherId) || {
        id: otherId,
        display_name: "Usuario",
        avatar_url: null,
        user_type: "worker",
        availability_status: null,
      },
      unread_count: unreadMap[conv.id] || 0,
    }
  })
}

/**
 * Get messages for a specific conversation
 */
export async function getMessages(supabase: SupabaseClient, conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) return []
  return data || []
}

/**
 * Send a message and update the conversation
 */
export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  jobId?: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      read: false,
      job_id: jobId || null,
    })
    .select()
    .single()

  if (error) return null

  await supabase
    .from("conversations")
    .update({
      last_message: content.substring(0, 100),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId)

  return data
}

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  supabase: SupabaseClient,
  userId1: string,
  userId2: string
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .or(
      `and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`
    )
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      participant_1: userId1,
      participant_2: userId2,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (error) return null
  return created.id
}

/**
 * Mark all messages in a conversation as read for a user
 */
export async function markConversationAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("messages")
    .update({ read: true })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", userId)
    .eq("read", false)
}

export interface RelevantApplication {
  id: string
  job_id: string
  worker_id: string
  status: string
  job_title: string
}

/**
 * Find the most recent job application linking a worker and a business,
 * so the chat can offer interview/hire confirmation and unlock ratings.
 */
export async function getRelevantApplication(
  supabase: SupabaseClient,
  workerId: string,
  businessId: string
): Promise<RelevantApplication | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("id, job_id, worker_id, status, jobs!inner(title, business_id)")
    .eq("worker_id", workerId)
    .eq("jobs.business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  const job = Array.isArray(data.jobs) ? data.jobs[0] : data.jobs
  return {
    id: data.id,
    job_id: data.job_id,
    worker_id: data.worker_id,
    status: data.status,
    job_title: job?.title || "Oferta",
  }
}

/**
 * Whether `fromUserId` has already rated `toUserId` for a given job.
 */
export async function hasRated(
  supabase: SupabaseClient,
  fromUserId: string,
  toUserId: string,
  jobId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("ratings")
    .select("id")
    .eq("from_user_id", fromUserId)
    .eq("to_user_id", toUserId)
    .eq("job_id", jobId)
    .maybeSingle()

  return !!data
}
