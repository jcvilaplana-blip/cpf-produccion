/* eslint-disable no-undef */
/**
 * Service worker de Firebase Cloud Messaging.
 *
 * Es lo que permite que el navegador muestre el aviso con la pestaña cerrada.
 * Se sirve desde /firebase-messaging-sw.js (raíz del sitio), que es donde el
 * SDK lo busca por defecto.
 *
 * Los service workers no leen variables de entorno ni módulos del bundle, así
 * que la configuración va escrita aquí. Son identificadores públicos: viajan
 * al navegador de todos modos.
 */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: "AIzaSyC2kZTCXs9BtVf5-sSrStVdaSfQT4rBpd8",
  authDomain: "camareroporfavor-864ef.firebaseapp.com",
  projectId: "camareroporfavor-864ef",
  storageBucket: "camareroporfavor-864ef.firebasestorage.app",
  messagingSenderId: "745823906774",
  appId: "1:745823906774:web:433195c4b3e29463811277",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "CamareroPorFavor"
  const body = payload.notification?.body || ""
  const link = payload.data?.link || "/messages"

  self.registration.showNotification(title, {
    body,
    icon: "/logo-cpf.png",
    badge: "/logo-cpf.png",
    tag: "cpf-message",
    data: { link },
  })
})

// Al pulsar el aviso: reutilizar una pestaña abierta si la hay, o abrir una.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const link = event.notification.data?.link || "/messages"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(link)
          return client.focus()
        }
      }
      return self.clients.openWindow(link)
    })
  )
})
