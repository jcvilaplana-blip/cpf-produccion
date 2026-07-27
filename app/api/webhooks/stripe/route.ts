export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"

// Beta mode - Stripe webhooks disabled
// This endpoint exists to prevent build errors but doesn't process webhooks
export async function POST(request: Request) {
  return NextResponse.json(
    {
      received: true,
      message: "Beta mode - webhook processing disabled",
    },
    { status: 200 },
  )
}
