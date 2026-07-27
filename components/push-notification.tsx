"use client"

import type React from "react" 

import { useEffect, useState } from "react"
import { X, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export interface PushNotificationData {
  id: string
  title: string
  message: string
  link?: string
  icon?: React.ReactNode
  timestamp: Date
}

interface PushNotificationProps {
  notification: PushNotificationData
  onClose: (id: string) => void
  onNavigate?: (id: string) => void
}

export function PushNotification({ notification, onClose, onNavigate }: PushNotificationProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Slide in animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLeaving(true)
    setTimeout(() => {
      onClose(notification.id)
    }, 300)
  }

  const handleClick = () => {
    if (notification.link) {
      setIsLeaving(true)
      setTimeout(() => {
        onNavigate?.(notification.id)
        router.push(notification.link!)
        onClose(notification.id)
      }, 200)
    }
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[9999] mx-auto max-w-md px-4 pt-4 transition-all duration-300 ease-out",
        isVisible && !isLeaving ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
      )}
    >
      <div
        onClick={handleClick}
        className={cn(
          "relative bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden",
          notification.link && "cursor-pointer hover:shadow-xl transition-shadow",
        )}
      >
        {/* Blue accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#01A89E] to-[#018F86]" />

        <div className="p-4 pt-5">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              {notification.icon || <Calendar className="w-5 h-5 text-[#018F86]" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{notification.title}</p>
              <p className="text-sm text-gray-600 mt-1 leading-snug">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-2">Ahora</p>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
