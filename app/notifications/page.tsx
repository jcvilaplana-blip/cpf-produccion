"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bell, Loader2 } from "lucide-react"
import { notificationService } from "@/lib/notifications/notification-service"

interface NotificationRow {
  id: string
  title: string
  body: string
  type: string
  link: string | null
  created_at: string
  is_read: boolean
}

// Minimal persistent inbox - notifications were previously only surfaced as
// a transient 8s toast with nowhere to review them afterward. Reuses the
// existing /api/notifications (+ /read) routes, no new backend needed.
export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.status === 401) {
          router.push("/auth/login")
          return
        }
        const data = await res.json()
        setNotifications(data.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const handleOpen = async (n: NotificationRow) => {
    if (!n.is_read) {
      await notificationService.markAsRead(n.id)
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }
    if (n.link) router.push(n.link)
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pt-14">
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur border-b pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">Notificaciones</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#01A89E]" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No tienes notificaciones</p>
              <p className="text-[13px] text-muted-foreground mt-1">Aquí verás avisos de ofertas, entrevistas y más.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`cursor-pointer transition-colors ${!n.is_read ? "border-[#01A89E]/40 bg-[#01A89E]/5" : ""}`}
                onClick={() => handleOpen(n)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight">{n.title}</p>
                    {!n.is_read && <Badge className="bg-[#01A89E] text-white text-[12px] flex-shrink-0">Nueva</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
                  <p className="text-[13px] text-muted-foreground mt-2">
                    {new Date(n.created_at).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
