import { NextResponse } from "next/server"

// Force dynamic to ensure env vars are read at runtime
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  // Try all possible variable names
  const token = process.env.MAPBOX_TOKEN || 
                process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 
                process.env.MAPBOX_ACCESS_TOKEN ||
                ""
  
  // Return with CORS headers for cross-origin requests
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Cache-Control": "no-store, max-age=0",
  }
  
  if (!token) {
    return NextResponse.json(
      { error: "Mapbox token not configured", token: "" }, 
      { status: 200, headers }
    )
  }
  
  return NextResponse.json({ token }, { headers })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
