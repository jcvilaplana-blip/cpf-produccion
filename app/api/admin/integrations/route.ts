export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/admin-auth"

/**
 * Estado real de cada integración, deducido de la configuración del servidor.
 *
 * Antes el panel llevaba esta lista escrita a mano, y mentía: daba RedSys por
 * "conectado" sin tener ni una variable definida, y seguía marcando las
 * notificaciones push como "pendiente" después de configurarlas. Un panel de
 * administración que informa de lo que alguien escribió una vez, en lugar de
 * lo que hay, es peor que no tenerlo.
 *
 * Solo se devuelve si cada clave está presente y no vacía. Nunca su valor.
 */
export async function GET() {
  const { error, supabase } = await verifyAdmin()
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 })

  const has = (name: string) => Boolean((process.env[name] || "").trim())

  const integrations = [
    {
      key: "supabase",
      name: "Supabase",
      desc: "Base de datos, autenticación y almacenamiento",
      required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
      configUrl: "https://supabase.com/dashboard",
    },
    {
      key: "stripe",
      name: "Stripe",
      desc: "Suscripciones y micropagos (Destacar, Flash)",
      required: ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET"],
      configUrl: "https://dashboard.stripe.com",
    },
    {
      key: "redsys",
      name: "RedSys",
      desc: "Pasarela de pago para tarjetas españolas",
      required: ["REDSYS_MERCHANT_CODE", "REDSYS_SECRET_KEY", "REDSYS_TERMINAL"],
      configUrl: "https://canales.redsys.es",
    },
    {
      key: "firebase",
      name: "Firebase Cloud Messaging",
      desc: "Notificaciones push y verificación por SMS",
      required: ["FIREBASE_SERVICE_ACCOUNT", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
      configUrl: "https://console.firebase.google.com",
    },
    {
      key: "resend",
      name: "Resend",
      desc: "Correos de verificación y recuperación de contraseña",
      required: ["RESEND_API_KEY", "EMAIL_FROM"],
      configUrl: "https://resend.com/overview",
    },
    {
      key: "mapbox",
      name: "Mapbox",
      desc: "Mapas y geolocalización",
      required: ["NEXT_PUBLIC_MAPBOX_TOKEN"],
      configUrl: "https://account.mapbox.com",
    },
  ]

  const data = integrations.map((integration) => {
    const missing = integration.required.filter((name) => !has(name))
    return {
      key: integration.key,
      name: integration.name,
      desc: integration.desc,
      configUrl: integration.configUrl,
      status: missing.length === 0 ? "conectado" : missing.length === integration.required.length ? "sin configurar" : "incompleto",
      missing,
    }
  })

  // Stripe en modo prueba no mueve dinero real: conviene que se vea.
  const stripeKey = (process.env.STRIPE_SECRET_KEY || "").trim()
  const stripeMode = !stripeKey ? null : stripeKey.startsWith("sk_live") ? "produccion" : "pruebas"

  return NextResponse.json({ data, stripeMode })
}
