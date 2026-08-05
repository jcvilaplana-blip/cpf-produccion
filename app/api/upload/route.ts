export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createSessionClient } from "@/lib/supabase/server"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Works out which folder the file belongs in.
 *
 * The signed-in user always wins: this route runs with the service-role key,
 * so trusting a client-supplied `userId` would let anyone write into another
 * user's folder. The form field is only honoured during registration, where
 * the account exists but has no session yet because e-mail confirmation is
 * still pending - and even then it has to look like a UUID.
 */
async function resolveOwnerId(formData: FormData): Promise<string> {
  try {
    const sessionClient = await createSessionClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (user?.id) return user.id
  } catch {
    // No session (or cookies unavailable) - fall through to the signup path.
  }

  const claimed = ((formData.get("userId") as string) || "").trim()
  return UUID_RE.test(claimed) ? claimed : "unknown"
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: "Config missing" }, { status: 500 })

    const supabase = createClient(url, key)

    const formData = await req.formData()
    const file = formData.get("file") as File
    const type = (formData.get("type") as string) || "avatar"
    const userId = await resolveOwnerId(formData)

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    // Validate file types
    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/mov"]
    const allowedPdfTypes = ["application/pdf"]
    
    if (type === "video" && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de video no permitido. Usa MP4, WebM o MOV." }, { status: 400 })
    }
    
    if ((type === "avatar" || type === "portfolio" || type === "logo" || type === "icon" || type === "flash") && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de imagen no permitido. Usa JPG, PNG, WebP o GIF." }, { status: 400 })
    }

    if (type === "cv" && !allowedPdfTypes.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten archivos PDF para el CV." }, { status: 400 })
    }

    // Max file sizes: 5MB for images, 100MB for videos, 10MB for CVs
    const maxSize = type === "video" ? 100 * 1024 * 1024 : type === "cv" ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      return NextResponse.json({ error: `Archivo demasiado grande. Maximo ${maxMB}MB.` }, { status: 400 })
    }

    const ext = file.name.split(".").pop() || (type === "video" ? "mp4" : "jpg")
    
    // Select bucket based on type
    let bucket = "avatars"
    if (type === "portfolio") bucket = "portfolio"
    if (type === "photos") bucket = "photos"
    if (type === "video") bucket = "videos"
    if (type === "cv") bucket = "cvs"
    if (type === "logo") bucket = "logos"
    if (type === "icon") bucket = "icons"
    if (type === "flash") bucket = "flash-offers"
    
    const path = `${userId}/${Date.now()}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl, type, filename: path })
  } catch (err: any) {
    console.error("Upload API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
