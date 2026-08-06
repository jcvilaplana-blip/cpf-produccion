import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Todos los buckets donde `/api/upload` deja ficheros, siempre bajo una
// carpeta con el id del usuario (`${userId}/${timestamp}.${ext}`).
const BUCKETS = ["avatars", "portfolio", "photos", "videos", "cvs", "logos", "flash-offers"]

/**
 * Borra por completo la cuenta del usuario que hace la petición.
 *
 * El id NUNCA se toma del cuerpo de la petición: se lee de la sesión
 * verificada. Aceptarlo de fuera convertiría esto en un borrado de cuentas
 * ajenas para cualquiera que supiera un uuid.
 *
 * Las filas de la base de datos no se borran una a una: el esquema declara
 * `ON DELETE CASCADE` desde `profiles` hacia el resto de tablas y desde
 * `auth.users` hacia `profiles`, así que eliminar el usuario de autenticación
 * arrastra candidaturas, mensajes, conversaciones, entrevistas, valoraciones,
 * pagos, tokens de dispositivo y demás. Los ficheros de Storage sí hay que
 * borrarlos aparte, porque no participan de esas cascadas.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No has iniciado sesión." }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error("account/delete: falta SUPABASE_SERVICE_ROLE_KEY")
    return NextResponse.json(
      { error: "El borrado de cuentas no está configurado en el servidor." },
      { status: 500 }
    )
  }

  const admin = createServiceClient(url, serviceKey)

  // 1) Ficheros subidos. Un fallo aquí no debe impedir el borrado de la
  //    cuenta: es peor dejar al usuario con la cuenta viva porque un bucket
  //    no respondiera. Se registra y se continúa.
  for (const bucket of BUCKETS) {
    try {
      const { data: files, error } = await admin.storage.from(bucket).list(user.id)
      if (error || !files?.length) continue
      await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`))
    } catch (err) {
      console.error(`account/delete: no se pudieron borrar los ficheros de ${bucket}`, err)
    }
  }

  // 2) El usuario de autenticación. Esto dispara las cascadas del esquema.
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error("account/delete: fallo al eliminar el usuario", deleteError)
    return NextResponse.json(
      { error: "No se ha podido eliminar la cuenta. Inténtalo de nuevo." },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
