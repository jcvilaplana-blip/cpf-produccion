import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { GlobalBottomNavigation } from "@/components/global-bottom-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { Footer } from "@/components/footer"
import { ScrollToTop } from "@/components/scroll-to-top"

import { LanguageProvider } from "@/lib/i18n/language-context"
import { AuthProvider } from "@/components/providers/auth-provider"
import { NotificationProvider } from "@/lib/notifications/notification-context"
import { NotificationTrigger } from "@/components/notification-trigger"
import { MessageAlerts } from "@/components/message-alerts"
import { PushRegistrar } from "@/components/push-registrar"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "CamareroPorFavor - Empleo en Hosteleria con Video",
  description:
    "La app que conecta a profesionales de la hosteleria con bares, restaurantes y hoteles en toda Espana.",
  generator: "CamareroPorFavor",
  openGraph: {
    title: "CamareroPorFavor - Empleo en Hosteleria con Video",
    description:
      "La app que conecta a profesionales de la hosteleria con bares, restaurantes y hoteles en toda Espana.",
    url: "https://camareroporfavor.com",
    siteName: "CamareroPorFavor",
    images: [
      {
        url: "https://camareroporfavor.com/logo-cpf.png",
        width: 512,
        height: 512,
        alt: "CamareroPorFavor Logo",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CamareroPorFavor - Empleo en Hosteleria con Video",
    description:
      "La app que conecta a profesionales de la hosteleria con bares, restaurantes y hoteles en toda Espana.",
    images: ["https://camareroporfavor.com/logo-cpf.png"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="theme-color" content="#01A89E" />
        <link rel="icon" href="/icono512.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <TopNavigation />
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <GlobalBottomNavigation />
              <ScrollToTop />
              <NotificationTrigger />
              <MessageAlerts />
              <PushRegistrar />
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
