"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createServiceClient(url, key)
}

/**
 * Guarda (o reasigna) el token push del dispositivo actual.
 *
 * FCM reutiliza un token cuando la app se reinstala o cuando otra persona
 * inicia sesión en el mismo teléfono, así que el token es único globalmente:
 * si reaparece bajo otra cuenta tiene que cambiar de dueño, no duplicarse. Por
 * eso el upsert va contra la columna `token` y se hace con la clave de
 * servicio: el usuario nuevo no puede modificar la fila del anterior.
 */
export async function registerDeviceTokenAction(
  token: string,
  platform: "android" | "ios" | "web",
  deviceInfo?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado" }
  if (!token || token.length < 20) return { error: "Token no válido" }

  const service = getServiceRoleClient()
  if (!service) return { error: "Configuración incompleta" }

  const { error } = await service
    .from("device_tokens")
    .upsert(
      {
        user_id: user.id,
        token,
        platform,
        device_info: deviceInfo?.slice(0, 300) || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    )

  if (error) return { error: error.message }
  return { success: true }
}

/** Al cerrar sesión, para que el dispositivo deje de recibir avisos ajenos. */
export async function unregisterDeviceTokenAction(token: string) {
  const service = getServiceRoleClient()
  if (!service || !token) return { success: true }

  await service.from("device_tokens").delete().eq("token", token)
  return { success: true }
}
