"use client"

import { useEffect } from "react"
import { Briefcase, Bell } from "lucide-react"
import { useNotifications } from "@/lib/notifications/notification-context"
import { notificationService } from "@/lib/notifications/notification-service"

/**
 * NotificationTrigger Component
 *
 * Polls /api/notifications (via notificationService) for notifications
 * sent by an admin and targeted at the current user, and surfaces new
 * unread ones as toast popups.
 */
export function NotificationTrigger() {
  const { addNotification } = useNotifications()

  useEffect(() => {
    notificationService.initialize()

    const unsubscribe = notificationService.subscribe((notification) => {
      const notificationId = notification.data?.id
      if (notificationId) notificationService.markAsRead(notificationId)

      addNotification({
        title: notification.title,
        message: notification.message,
        link: notification.link,
        icon:
          notification.type === "job" ? (
            <Briefcase className="w-5 h-5 text-[#01A89E]" />
          ) : (
            <Bell className="w-5 h-5 text-[#01A89E]" />
          ),
      })
    })

    return () => {
      unsubscribe()
      notificationService.stop()
    }
  }, [addNotification])

  return null
}
