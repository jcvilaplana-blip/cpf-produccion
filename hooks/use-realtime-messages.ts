"use client"

import { useEffect, useRef, useCallback } from "react"
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js"
import type { Message } from "@/lib/messaging"

interface UseRealtimeMessagesOptions {
  supabase: SupabaseClient
  conversationId: string | null
  userId: string
  onNewMessage: (message: Message) => void
  onMessageRead?: (messageId: string) => void
}

export function useRealtimeMessages({
  supabase,
  conversationId,
  userId,
  onNewMessage,
  onMessageRead,
}: UseRealtimeMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onNewMessageRef = useRef(onNewMessage)
  const onMessageReadRef = useRef(onMessageRead)

  // Keep refs up to date
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
    onMessageReadRef.current = onMessageRead
  }, [onNewMessage, onMessageRead])

  useEffect(() => {
    if (!conversationId) return

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          // Only add if not sent by us (we add optimistically)
          if (newMessage.sender_id !== userId) {
            onNewMessageRef.current(newMessage)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message
          if (updated.read && onMessageReadRef.current) {
            onMessageReadRef.current(updated.id)
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversationId, userId])

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
  }, [supabase])

  return { cleanup }
}

/**
 * Hook to subscribe to conversation list updates (new messages across all conversations)
 */
export function useRealtimeConversations({
  supabase,
  userId,
  onUpdate,
}: {
  supabase: SupabaseClient
  userId: string
  onUpdate: () => void
}) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!userId) return

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          onUpdateRef.current()
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])
}
