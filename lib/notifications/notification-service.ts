/**
 * Notification Service
 *
 * Polls the app's own /api/notifications endpoint (backed by the
 * public.notifications table) for notifications sent by an admin and
 * targeted at the current user (all / candidates / businesses / a
 * specific user), and emits any unseen ones to subscribers.
 */

export interface NotificationPayload {
  id: string
  title: string
  message: string
  link?: string
  type?: "interview" | "message" | "job" | "application" | "general"
  data?: Record<string, any>
}

const POLL_INTERVAL_MS = 30000

function mapDbTypeToPayloadType(dbType: string): NotificationPayload["type"] {
  if (dbType === "oferta") return "job"
  return "general"
}

export class NotificationService {
  private static instance: NotificationService
  private subscribers: ((notification: NotificationPayload) => void)[] = []
  private seenIds = new Set<string>()
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private initialized = false

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  subscribe(callback: (notification: NotificationPayload) => void) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback)
    }
  }

  private emit(notification: NotificationPayload) {
    this.subscribers.forEach((callback) => callback(notification))
  }

  async initialize() {
    if (this.initialized) return true
    this.initialized = true

    await this.poll()
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS)

    return true
  }

  stop() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    this.initialized = false
  }

  private async poll() {
    const notifications = await this.fetchPendingNotifications()
    for (const n of notifications) {
      if (this.seenIds.has(n.id)) continue
      this.seenIds.add(n.id)
      this.emit(n)
    }
  }

  /**
   * Fetch unread notifications targeted at the current user.
   */
  async fetchPendingNotifications(): Promise<NotificationPayload[]> {
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) return []
      const json = await res.json()
      const rows = (json.data || []) as any[]
      return rows
        .filter((n) => !n.is_read)
        .map((n) => ({
          id: n.id,
          title: n.title,
          message: n.body,
          link: n.link || undefined,
          type: mapDbTypeToPayloadType(n.type),
          data: { id: n.id },
        }))
    } catch {
      return []
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      })
    } catch {
      // best-effort
    }
  }
}

export const notificationService = NotificationService.getInstance()
