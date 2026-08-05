export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function upsertProfileWithRetry(supabase: ReturnType<typeof createClient>, profileData: any) {
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error } = await supabase
      .from("profiles")
      .upsert(profileData)

    if (!error) {
      return null
    }

    const isForeignKeyError = error.code === "23503" || error.message?.includes("profiles_id_fkey")
    if (attempt === maxAttempts || !isForeignKeyError) {
      return error
    }

    await sleep(300)
  }

  return null
}

export async function POST(request: Request) {
  try {
    const { profileData } = await request.json()
    
    if (!profileData?.id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Use service role key to bypass RLS for new user profile creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    })
    
    // Create worker profile
    const profileError = await upsertProfileWithRetry(supabase, profileData)
    if (profileError) {
      console.error("Worker profile creation error:", profileError)
      return NextResponse.json({ error: "Error al crear perfil: " + profileError.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
