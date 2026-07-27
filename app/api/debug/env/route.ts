import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  // Only show if variables are SET, not their actual values (security)
  return NextResponse.json({
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN ? "SET" : "NOT_SET",
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? "SET" : "NOT_SET",
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN ? "SET" : "NOT_SET",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT_SET",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "NOT_SET",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "SET" : "NOT_SET",
  })
}
