import "server-only"
import { createSign } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

/**
 * Envío de notificaciones push por Firebase Cloud Messaging (API HTTP v1).
 *
 * Se firma el JWT a mano con `node:crypto` en lugar de instalar
 * `firebase-admin`: son unas pocas líneas, evita arrastrar una dependencia
 * pesada a un proyecto que ya instala con --legacy-peer-deps, y no requiere
 * tocar el bundle del cliente.
 *
 * La antigua "clave de servidor" (API legacy) fue retirada por Google en junio
 * de 2024; la vía admitida es esta, con cuenta de servicio y OAuth2.
 */

interface ServiceAccount {
  project_id: string
  private_key: string
  client_email: string
  token_uri: string
}

export interface PushMessage {
  title: string
  body: string
  /** Ruta interna a la que navegar al tocar el aviso. */
  link?: string
}

const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging"

let cachedAccount: ServiceAccount | null | undefined
let cachedToken: { value: string; expiresAt: number } | null = null

/** Lee la credencial de FIREBASE_SERVICE_ACCOUNT (base64 o JSON en claro). */
function getServiceAccount(): ServiceAccount | null {
  if (cachedAccount !== undefined) return cachedAccount

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
  if (!raw) {
    cachedAccount = null
    return null
  }

  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8")
    const parsed = JSON.parse(json) as ServiceAccount
    cachedAccount = parsed.private_key && parsed.client_email ? parsed : null
  } catch {
    console.error("push: FIREBASE_SERVICE_ACCOUNT no se pudo interpretar")
    cachedAccount = null
  }

  return cachedAccount
}

export function isPushConfigured(): boolean {
  return getServiceAccount() !== null
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/**
 * Token OAuth2 de acceso, obtenido con un JWT firmado por la cuenta de
 * servicio. Se cachea: dura una hora y pedir uno por notificación sería
 * absurdo.
 */
async function getAccessToken(account: ServiceAccount): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value
  }

  const now = Math.floor(Date.now() / 1000)
  const tokenUri = account.token_uri || "https://oauth2.googleapis.com/token"

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: FCM_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    })
  )

  const signer = createSign("RSA-SHA256")
  signer.update(`${header}.${claims}`)
  signer.end()
  const signature = base64url(signer.sign(account.private_key.replace(/\\n/g, "\n")))

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  })

  if (!response.ok) {
    console.error("push: no se pudo obtener el token OAuth:", await response.text())
    return null
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) return null

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  }
  return cachedToken.value
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/**
 * Envía a un único dispositivo.
 * @returns "ok" | "invalid" (token muerto, hay que borrarlo) | "error"
 */
async function sendToToken(
  accessToken: string,
  projectId: string,
  token: string,
  message: PushMessage
): Promise<"ok" | "invalid" | "error"> {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: message.title, body: message.body },
        // `data` llega también con la app cerrada y es lo que usa la app para
        // saber a dónde navegar al tocar el aviso.
        data: { link: message.link || "/messages" },
        android: {
          priority: "HIGH",
          notification: {
            sound: "default",
            channel_id: "cpf_messages",
            default_vibrate_timings: true,
          },
        },
        apns: {
          payload: { aps: { sound: "default", badge: 1 } },
        },
        webpush: {
          notification: { icon: "/logo-cpf.png", badge: "/logo-cpf.png" },
          fcm_options: { link: message.link || "/messages" },
        },
      },
    }),
  })

  if (response.ok) return "ok"

  const errorText = await response.text()
  // 404 UNREGISTERED / 400 INVALID_ARGUMENT sobre el token = instalación
  // desaparecida (app desinstalada, token caducado).
  if (
    response.status === 404 ||
    errorText.includes("UNREGISTERED") ||
    errorText.includes("INVALID_ARGUMENT")
  ) {
    return "invalid"
  }

  console.error(`push: fallo al enviar (${response.status}):`, errorText.slice(0, 300))
  return "error"
}

/**
 * Envía a todos los dispositivos de un usuario y limpia los tokens muertos.
 *
 * Nunca lanza: un aviso que no llega no debe tumbar la acción que lo originó
 * (enviar un mensaje, mostrar interés en una oferta...).
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<void> {
  const account = getServiceAccount()
  if (!account) return // Push sin configurar: silencio, no error.

  const supabase = getServiceRoleClient()
  if (!supabase) return

  try {
    const { data: devices } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", userId)

    if (!devices || devices.length === 0) return

    const accessToken = await getAccessToken(account)
    if (!accessToken) return

    const results = await Promise.all(
      devices.map(async (device) => ({
        token: device.token,
        result: await sendToToken(accessToken, account.project_id, device.token, message),
      }))
    )

    const dead = results.filter((r) => r.result === "invalid").map((r) => r.token)
    if (dead.length > 0) {
      await supabase.from("device_tokens").delete().in("token", dead)
    }
  } catch (err) {
    console.error("push: sendPushToUser falló", err)
  }
}
