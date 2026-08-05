"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { registerDeviceTokenAction } from "@/app/actions/push"

/**
 * Registra el dispositivo para recibir notificaciones push.
 *
 * Dos caminos según dónde corra:
 *  - Dentro de la app (Capacitor): usa @capacitor/push-notifications, que ya
 *    estaba instalado pero sin usar. El token lo da Firebase vía
 *    google-services.json.
 *  - En el navegador: usa firebase/messaging con la clave VAPID y el service
 *    worker de public/firebase-messaging-sw.js.
 *
 * Todo se carga con import dinámico para no meter estas librerías en el bundle
 * de quien nunca las necesita, y todo falla en silencio: no poder registrar
 * avisos jamás debe impedir usar la aplicación.
 */
export function PushRegistrar() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const registered = useRef(false)

  const userId = user?.id

  useEffect(() => {
    if (!isAuthenticated || !userId || registered.current) return
    if (typeof window === "undefined") return

    registered.current = true
    let cancelled = false

    const isNativeApp = Boolean((window as any).Capacitor?.isNativePlatform?.())

    const registerNative = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications")

        const status = await PushNotifications.checkPermissions()
        let granted = status.receive === "granted"
        if (!granted) {
          const asked = await PushNotifications.requestPermissions()
          granted = asked.receive === "granted"
        }
        if (!granted || cancelled) return

        PushNotifications.addListener("registration", (tokenData) => {
          const platform = (window as any).Capacitor?.getPlatform?.() === "ios" ? "ios" : "android"
          registerDeviceTokenAction(tokenData.value, platform, navigator.userAgent).catch(() => {})
        })

        PushNotifications.addListener("registrationError", (err) => {
          console.error("push: registro nativo falló", err)
        })

        // Al tocar el aviso, abrir donde corresponda.
        PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
          const link = (action.notification?.data as any)?.link
          if (typeof link === "string" && link.startsWith("/")) router.push(link)
        })

        await PushNotifications.register()
      } catch (err) {
        console.error("push: no se pudo inicializar en la app", err)
      }
    }

    const registerWeb = async () => {
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      if (!vapidKey) return
      if (!("serviceWorker" in navigator) || !("Notification" in window)) return

      try {
        // No preguntar de golpe al entrar: solo si ya se concedió antes. La
        // petición explícita se hace desde ajustes, no de sopetón.
        if (Notification.permission !== "granted") return

        const [{ getMessaging, getToken }, { getFirebaseApp }] = await Promise.all([
          import("firebase/messaging"),
          import("@/lib/firebase/client"),
        ])

        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        const messaging = getMessaging(getFirebaseApp())
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        })

        if (token && !cancelled) {
          registerDeviceTokenAction(token, "web", navigator.userAgent).catch(() => {})
        }
      } catch (err) {
        console.error("push: no se pudo inicializar en el navegador", err)
      }
    }

    if (isNativeApp) registerNative()
    else registerWeb()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, userId, router])

  return null
}
