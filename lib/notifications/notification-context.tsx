"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"
import { PushNotification, type PushNotificationData } from "@/components/push-notification"

interface NotificationContextType {
  notifications: PushNotificationData[]
  addNotification: (notification: Omit<PushNotificationData, "id" | "timestamp">) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<PushNotificationData[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const addNotification = useCallback((notification: Omit<PushNotificationData, "id" | "timestamp">) => {
    const newNotification: PushNotificationData = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    }

    setNotifications((prev) => [...prev, newNotification])

    if (typeof window !== "undefined") {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/notification.wav")
      }
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      removeNotification(newNotification.id)
    }, 8000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearAllNotifications,
      }}
    >
      {children}

      {/* Render notifications */}
      {notifications.map((notification) => (
        <PushNotification
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
          onNavigate={removeNotification}
        />
      ))}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
