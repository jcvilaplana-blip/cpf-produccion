"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Search, MessageCircle, Check, CheckCheck, CalendarCheck, CalendarClock, Star, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BottomNavigation } from "@/components/bottom-navigation"
import type { Profile } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  getConversations as fetchConversations,
  getRelevantApplication,
  hasRated as checkHasRated,
  type Conversation,
  type Message,
  type RelevantApplication,
} from "@/lib/messaging"
import { useRealtimeMessages, useRealtimeConversations } from "@/hooks/use-realtime-messages"
import { updateApplicationStatusAction, respondToInterviewRequestAction, resolveInterviewRequestAction, notifyNewMessageAction } from "@/lib/actions"
import { RatingDialog } from "@/components/rating-dialog"
import { InterviewRequestDialog } from "@/components/interview-request-dialog"
import { InterviewManageDialog } from "@/components/interview-manage-dialog"
import { toast } from "sonner"

interface ActiveInterview {
  id: string
  status: "pending" | "confirmed" | "cancelled" | "approved" | "not_hired"
  scheduled_at: string
  interview_type: "call" | "in_person" | "video_call" | "other"
  other_type_detail: string | null
  /** Quién propuso la fecha vigente: confirma siempre el otro. */
  last_proposed_by: string | null
  rescheduled_count: number | null
  reschedule_reason: string | null
}

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  call: "Llamada",
  in_person: "Presencial",
  video_call: "Videoconferencia",
  other: "Otra",
}

const availabilityMap: Record<string, { label: string; color: string }> = {
  available: { label: "Disponible", color: "bg-emerald-100 text-emerald-700" },
  busy: { label: "Ocupado", color: "bg-amber-100 text-amber-700" },
  not_looking: { label: "No busca empleo", color: "bg-slate-100 text-slate-600" },
}

interface MessagesContentProps {
  user: { id: string; email?: string }
  profile: Profile | null
  conversations: Conversation[]
  initialConversationId?: string | null
}

export function MessagesContent({
  user,
  profile,
  conversations: initialConversations,
  initialConversationId,
}: MessagesContentProps) {
  // createClient() returns a new client instance every call - memoize so it
  // doesn't destabilize effect dependency arrays that include `supabase`.
  const supabase = useMemo(() => createClient(), [])
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    initialConversationId
      ? initialConversations.find((c) => c.id === initialConversationId) || null
      : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Job application linking this conversation's two participants (if any),
  // used to offer interview/hire confirmation and unlock mutual ratings.
  const [activeApplication, setActiveApplication] = useState<RelevantApplication | null>(null)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [activeInterview, setActiveInterview] = useState<ActiveInterview | null>(null)
  const [showInterviewDialog, setShowInterviewDialog] = useState(false)
  const [isUpdatingInterview, setIsUpdatingInterview] = useState(false)
  const [interviewDialog, setInterviewDialog] = useState<{ open: boolean; mode: "cancel" | "reschedule" }>({
    open: false,
    mode: "cancel",
  })

  const loadActiveInterview = useCallback(async (applicationId: string) => {
    const { data } = await supabase
      .from("interview_requests")
      .select("id, status, scheduled_at, interview_type, other_type_detail, last_proposed_by, rescheduled_count, reschedule_reason")
      .eq("application_id", applicationId)
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveInterview(data || null)
  }, [supabase])

  // WhatsApp-style anchoring: pin the scroll to the newest message at the
  // bottom. Scrolling the container directly (instead of scrollIntoView on a
  // sentinel) keeps the page behind the chat from moving on mobile.
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const run = () => {
      const el = messagesContainerRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    run()
    requestAnimationFrame(() => {
      const el = messagesContainerRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior })
    })
  }, [])

  useEffect(() => {
    if (!selectedConversation || messages.length === 0) return
    scrollToBottom()
  }, [messages, selectedConversation, scrollToBottom])

  // Load the job application (if any) tying the two participants together
  useEffect(() => {
    setActiveApplication(null)
    setAlreadyRated(false)
    setActiveInterview(null)
    if (!selectedConversation || !profile) return

    const otherId = selectedConversation.other_participant?.id
    const otherType = selectedConversation.other_participant?.user_type
    if (!otherId) return

    const workerId = profile.user_type === "business" ? otherId : user.id
    const businessId = profile.user_type === "business" ? user.id : otherId
    // Only makes sense between a worker and a business
    if (profile.user_type === otherType) return

    const loadApplication = async () => {
      const app = await getRelevantApplication(supabase, workerId, businessId)
      if (!app) return
      setActiveApplication(app)
      if (app.status === "accepted") {
        const rated = await checkHasRated(supabase, user.id, otherId, app.job_id)
        setAlreadyRated(rated)
      }
      loadActiveInterview(app.id)
    }
    loadApplication()
  }, [selectedConversation, profile, supabase, user.id, loadActiveInterview])

  // El seguimiento tiene que decir lo mismo en los dos chats. Sin esto, quien
  // contrata o cancela ve desaparecer el bloque al instante, pero al otro le
  // sigue apareciendo -con botones que ya no valen- hasta que recarga.
  // Escucha la entrevista y la candidatura de esta conversación.
  useEffect(() => {
    const applicationId = activeApplication?.id
    if (!applicationId) return

    const channel = supabase
      .channel(`process:${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interview_requests",
          filter: `application_id=eq.${applicationId}`,
        },
        // loadActiveInterview solo devuelve pending/confirmed, así que en
        // cuanto pasa a contratado, no contratado o cancelada queda en null y
        // el bloque se retira solo en ambos lados.
        () => loadActiveInterview(applicationId)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `id=eq.${applicationId}`,
        },
        (payload) => {
          const status = (payload.new as { status?: string })?.status
          if (status) setActiveApplication((prev) => (prev ? { ...prev, status } : prev))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, activeApplication?.id, loadActiveInterview])

  const handleApplicationStatusChange = async (newStatus: string) => {
    if (!activeApplication) return
    setIsUpdatingStatus(true)
    const result = await updateApplicationStatusAction(activeApplication.id, newStatus)
    setIsUpdatingStatus(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setActiveApplication((prev) => (prev ? { ...prev, status: newStatus } : prev))
    const labels: Record<string, string> = {
      interview: "Entrevista confirmada",
      accepted: "Contratación confirmada — ya podéis valoraros mutuamente",
      rejected: "Candidatura rechazada",
    }
    toast.success(labels[newStatus] || "Estado actualizado")
  }

  const handleInterviewResponse = async (response: "confirmed" | "cancelled") => {
    if (!activeInterview) return
    setIsUpdatingInterview(true)
    const result = await respondToInterviewRequestAction(activeInterview.id, response)
    setIsUpdatingInterview(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(response === "confirmed" ? "Entrevista confirmada" : "Entrevista cancelada")
    if (activeApplication) {
      loadActiveInterview(activeApplication.id)
      if (response === "cancelled") setActiveApplication((prev) => (prev ? { ...prev, status: "pending" } : prev))
    }
  }

  const handleInterviewResolve = async (resolution: "approved" | "not_hired") => {
    if (!activeInterview) return
    setIsUpdatingInterview(true)
    const result = await resolveInterviewRequestAction(activeInterview.id, resolution)
    setIsUpdatingInterview(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(
      resolution === "approved"
        ? "Contratación confirmada — ya podéis valoraros mutuamente"
        : "Entrevista cerrada sin contratación"
    )
    setActiveApplication((prev) => (prev ? { ...prev, status: resolution === "approved" ? "accepted" : "rejected" } : prev))
    setActiveInterview(null)
    // Al contratar, la valoración es el paso siguiente: se abre sola.
    if (resolution === "approved") setShowRatingDialog(true)
  }

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      const msgs = await getMessages(supabase, selectedConversation.id)
      setMessages(msgs)
      setIsLoadingMessages(false)
      scrollToBottom()

      // Mark as read
      await markConversationAsRead(supabase, selectedConversation.id, user.id)
      // Update unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, unread_count: 0 } : c))
      )
    }

    loadMessages()
  }, [selectedConversation, supabase, user.id, scrollToBottom])

  // Realtime: new messages in the selected conversation
  const handleNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      scrollToBottom("smooth")

      // Mark incoming message as read since we're viewing the conversation
      if (message.receiver_id === user.id) {
        markConversationAsRead(supabase, message.conversation_id!, user.id)
      }
    },
    [supabase, user.id, scrollToBottom]
  )

  useRealtimeMessages({
    supabase,
    conversationId: selectedConversation?.id || null,
    userId: user.id,
    onNewMessage: handleNewMessage,
  })

  // Realtime: refresh conversation list on changes
  const refreshConversations = useCallback(async () => {
    const updated = await fetchConversations(supabase, user.id)
    setConversations(updated)
  }, [supabase, user.id])

  useRealtimeConversations({
    supabase,
    userId: user.id,
    onUpdate: refreshConversations,
  })

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || isSending) return

    const content = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      receiver_id: selectedConversation.other_participant?.id || "",
      content,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom("smooth")

    const sent = await sendMessage(
      supabase,
      selectedConversation.id,
      user.id,
      selectedConversation.other_participant?.id || "",
      content
    )

    if (sent) {
      // Replace optimistic message with real one
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? sent : m)))

      // Feed entry for the recipient. Best-effort: the message is already sent,
      // and realtime already alerts them if they have the app open.
      const receiverId = selectedConversation.other_participant?.id
      if (receiverId) {
        notifyNewMessageAction(receiverId, content).catch(() => {})
      }
    }

    setIsSending(false)
  }

  // Qué justifica mostrar el bloque de seguimiento. Se calcula por contenido y
  // no por "existe una candidatura": tras cerrar el proceso -contratado, no
  // contratado o entrevista cancelada- la candidatura sigue existiendo, y
  // usarla como condición dejaba una franja gris vacía sobre el campo de
  // escribir. Lo mismo le pasaba al candidato con una candidatura pendiente,
  // porque esos botones son solo del establecimiento.
  const applicationStatus = activeApplication?.status
  const showsBusinessActions =
    profile?.user_type === "business" && ["pending", "interview"].includes(applicationStatus || "")
  const showsRating = applicationStatus === "accepted"
  const hasProcessInfo = Boolean(activeInterview) || showsBusinessActions || showsRating

  const filteredConversations = conversations.filter((conv) =>
    conv.other_participant?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Ayer"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("es-ES", { weekday: "short" })
    }
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
  }

  // WhatsApp-style day separator between message groups
  const formatDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    const diffDays = Math.round((startOf(new Date()) - startOf(date)) / 86400000)
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Ayer"
    if (diffDays < 7) return date.toLocaleDateString("es-ES", { weekday: "long" })
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "long" })
  }

  const isSameDay = (a: string, b: string) =>
    new Date(a).toDateString() === new Date(b).toDateString()

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6 md:pt-14">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {selectedConversation ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedConversation(null)
                  setMessages([])
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Image
              src="/logo-cpf.png"
              alt="CamareroPorFavor"
              width={36}
              height={36}
              className="object-contain rounded-full"
            />
            {selectedConversation ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={selectedConversation.other_participant?.avatar_url || undefined}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {selectedConversation.other_participant?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-base font-semibold leading-tight">
                    {selectedConversation.other_participant?.display_name}
                  </h1>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] text-muted-foreground">
                      {selectedConversation.other_participant?.user_type === "business"
                        ? "Empresa"
                        : "Trabajador"}
                    </p>
                    {selectedConversation.other_participant?.user_type !== "business" &&
                      selectedConversation.other_participant?.availability_status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[12px] px-1.5 py-0 h-4 border-0",
                            availabilityMap[selectedConversation.other_participant.availability_status]?.color ||
                              "bg-slate-100 text-slate-600"
                          )}
                        >
                          {availabilityMap[selectedConversation.other_participant.availability_status]?.label ||
                            selectedConversation.other_participant.availability_status}
                        </Badge>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <h1 className="text-xl font-bold">Mensajes</h1>
            )}
          </div>

        </div>
      </header>

      {selectedConversation && activeApplication && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          ratedUserId={selectedConversation.other_participant?.id || ""}
          ratedUserName={selectedConversation.other_participant?.display_name || "Usuario"}
          ratedUserType={selectedConversation.other_participant?.user_type as "worker" | "business" | undefined}
          jobId={activeApplication.job_id}
          onSuccess={() => setAlreadyRated(true)}
        />
      )}

      {activeInterview && (
        <InterviewManageDialog
          open={interviewDialog.open}
          onOpenChange={(open) => setInterviewDialog((prev) => ({ ...prev, open }))}
          mode={interviewDialog.mode}
          interviewId={activeInterview.id}
          currentScheduledAt={activeInterview.scheduled_at}
          onDone={() => activeApplication && loadActiveInterview(activeApplication.id)}
        />
      )}

      {selectedConversation && activeApplication && profile?.user_type === "business" && (
        <InterviewRequestDialog
          open={showInterviewDialog}
          onOpenChange={setShowInterviewDialog}
          jobId={activeApplication.job_id}
          workerId={activeApplication.worker_id}
          workerName={selectedConversation.other_participant?.display_name || "el candidato"}
          onSent={() => loadActiveInterview(activeApplication.id)}
        />
      )}

      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {conversations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes conversaciones</h3>
              <p className="text-muted-foreground mb-4">
                Comienza a aplicar a trabajos o contacta con candidatos para iniciar conversaciones.
              </p>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link href="/dashboard">Explorar Trabajos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 h-[calc(100dvh-11rem)] min-h-[22rem] md:h-[calc(100dvh-10rem)]">
            {/* Conversations List */}
            <div
              className={cn(
                "md:col-span-1 flex flex-col gap-3",
                selectedConversation && "hidden md:flex"
              )}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-1.5">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg text-left transition-colors w-full hover:bg-accent",
                      selectedConversation?.id === conversation.id &&
                        "bg-accent ring-1 ring-primary/20"
                    )}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <Avatar className="h-11 w-11 flex-shrink-0">
                      <AvatarImage
                        src={conversation.other_participant?.avatar_url || undefined}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conversation.other_participant?.display_name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <span className="font-semibold text-sm truncate">
                          {conversation.other_participant?.display_name}
                        </span>
                        <span className="text-[13px] text-muted-foreground flex-shrink-0">
                          {formatTime(conversation.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] text-muted-foreground truncate">
                          {conversation.last_message || "Inicia una conversacion"}
                        </p>
                        {(conversation.unread_count || 0) > 0 && (
                          <Badge className="bg-primary text-primary-foreground text-[13px] h-5 min-w-5 flex items-center justify-center flex-shrink-0">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat View */}
            <div
              className={cn(
                "md:col-span-2 flex flex-col",
                !selectedConversation && "hidden md:flex md:items-center md:justify-center"
              )}
            >
              {selectedConversation ? (
                <Card className="flex-1 flex flex-col overflow-hidden">
                  {/* Messages area - oldest at the top, newest pinned to the
                      bottom, like WhatsApp. `mt-auto` keeps short threads
                      anchored down without clipping long ones. */}
                  <div
                    ref={messagesContainerRef}
                    className="flex-1 flex flex-col overflow-y-auto overscroll-contain p-4"
                  >
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Envia el primer mensaje para iniciar la conversacion
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-auto flex flex-col gap-1.5">
                        {messages.map((message, index) => {
                          const isOwn = message.sender_id === user.id
                          const previous = messages[index - 1]
                          const showDaySeparator =
                            !previous || !isSameDay(previous.created_at, message.created_at)
                          return (
                            <div key={message.id}>
                              {showDaySeparator && (
                                <div className="flex justify-center py-3">
                                  <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium capitalize text-muted-foreground">
                                    {formatDayLabel(message.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                                <div
                                  className={cn(
                                    "max-w-[78%] rounded-2xl px-3.5 py-2",
                                    isOwn
                                      ? "bg-primary text-primary-foreground rounded-br-sm"
                                      : "bg-muted text-foreground rounded-bl-sm"
                                  )}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                  <div
                                    className={cn(
                                      "flex items-center justify-end gap-1 -mb-0.5 mt-0.5",
                                      isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                                    )}
                                  >
                                    <span className="text-[12px]">
                                      {new Date(message.created_at).toLocaleTimeString("es-ES", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {isOwn &&
                                      (message.read ? (
                                        <CheckCheck className="h-3.5 w-3.5" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Seguimiento del proceso: candidatura y entrevista.
                      Va aquí, pegado al campo de escribir, y no en la
                      cabecera: así queda siempre a la vista de los dos sin
                      tener que subir el scroll del chat. El contenedor solo
                      aparece si hay algo que mostrar, para no dejar una
                      franja vacía en las conversaciones sin proceso. */}
                  {selectedConversation && hasProcessInfo && (
                  <div className="border-t bg-muted/20 px-3 py-2 space-y-2 max-h-[42vh] overflow-y-auto shrink-0">
                  {/* Interview / hire confirmation + mutual rating */}
                  {selectedConversation && activeApplication && (
                    <div className="flex flex-wrap items-center gap-2 px-1 pb-3 pt-1">
                      {profile?.user_type === "business" &&
                        ["pending", "interview"].includes(activeApplication.status) && (
                          <>
                            {activeApplication.status === "pending" && !activeInterview && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[13px]"
                                onClick={() => setShowInterviewDialog(true)}
                              >
                                <CalendarCheck className="h-3 w-3 mr-1" />
                                Citar entrevista
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="h-7 text-[13px] bg-green-600 hover:bg-green-700"
                              disabled={isUpdatingStatus}
                              onClick={() => handleApplicationStatusChange("accepted")}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Confirmar contratación
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[13px] text-destructive"
                              disabled={isUpdatingStatus}
                              onClick={() => handleApplicationStatusChange("rejected")}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                      {activeApplication.status === "accepted" && !alreadyRated && (
                        <Button
                          size="sm"
                          className="h-7 text-[13px] bg-primary hover:bg-primary/90"
                          onClick={() => setShowRatingDialog(true)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Valorar a {selectedConversation.other_participant?.display_name}
                        </Button>
                      )}
                      {activeApplication.status === "accepted" && alreadyRated && (
                        <Badge variant="outline" className="h-7 text-[13px] px-2 flex items-center gap-1 border-0 bg-emerald-50 text-emerald-700">
                          <Check className="h-3 w-3" />
                          Ya has valorado esta contratación
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Active interview request banner */}
                  {selectedConversation && activeInterview && (
                    <div className="mx-1 mb-3 rounded-lg border bg-muted/40 px-3 py-2 text-[13px] space-y-1.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        <CalendarCheck className="h-3.5 w-3.5 text-[#01A89E]" />
                        Entrevista {activeInterview.status === "pending" ? "propuesta" : "confirmada"}:{" "}
                        {new Date(activeInterview.scheduled_at).toLocaleString("es-ES", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}{" "}
                        · {INTERVIEW_TYPE_LABELS[activeInterview.interview_type]}
                        {activeInterview.interview_type === "other" && activeInterview.other_type_detail
                          ? ` (${activeInterview.other_type_detail})`
                          : ""}
                      </div>
                      {activeInterview.rescheduled_count ? (
                        <p className="text-[12px] text-amber-700">
                          Fecha cambiada {activeInterview.rescheduled_count}{" "}
                          {activeInterview.rescheduled_count === 1 ? "vez" : "veces"}
                          {activeInterview.reschedule_reason ? ` · ${activeInterview.reschedule_reason}` : ""}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        {/* Confirmar: siempre lo hace quien NO propuso la fecha vigente. */}
                        {activeInterview.status === "pending" &&
                          activeInterview.last_proposed_by !== user.id && (
                            <Button
                              size="sm"
                              className="h-6 text-[12px] bg-green-600 hover:bg-green-700"
                              disabled={isUpdatingInterview}
                              onClick={() => handleInterviewResponse("confirmed")}
                            >
                              Confirmar
                            </Button>
                          )}
                        {activeInterview.status === "pending" &&
                          activeInterview.last_proposed_by === user.id && (
                            <span className="text-[12px] text-muted-foreground py-1">
                              Esperando confirmación de la otra parte
                            </span>
                          )}

                        {/* Cancelar y reprogramar: ambos roles, mientras siga viva. */}
                        {["pending", "confirmed"].includes(activeInterview.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[12px]"
                              onClick={() => setInterviewDialog({ open: true, mode: "reschedule" })}
                            >
                              <CalendarClock className="h-3 w-3 mr-1" />
                              Cambiar fecha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[12px] text-destructive"
                              onClick={() => setInterviewDialog({ open: true, mode: "cancel" })}
                            >
                              Cancelar
                            </Button>
                          </>
                        )}

                        {/* Cierre tras celebrarse: solo el establecimiento. */}
                        {activeInterview.status === "confirmed" && profile?.user_type === "business" && (
                          <div className="w-full mt-1 pt-2 border-t">
                            <p className="text-[12px] text-muted-foreground mb-1.5">
                              Cuando termine la entrevista, indica el resultado:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-[12px] bg-green-600 hover:bg-green-700"
                                disabled={isUpdatingInterview}
                                onClick={() => handleInterviewResolve("approved")}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Candidato contratado
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[12px]"
                                disabled={isUpdatingInterview}
                                onClick={() => handleInterviewResolve("not_hired")}
                              >
                                <X className="h-3 w-3 mr-1" />
                                No contratado
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                  )}
                  {/* Message Input */}
                  <div className="p-3 border-t bg-card">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      {/* Sin autoFocus: en móvil abría el teclado nada más
                          entrar en la conversación, tapando los mensajes que
                          el usuario venía a leer. Se abre al tocar el campo. */}
                      <Input
                        placeholder="Escribe un mensaje..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim() || isSending}
                        className="bg-primary hover:bg-primary/90 flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Selecciona una conversacion para comenzar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNavigation profile={profile} />
    </div>
  )
}
