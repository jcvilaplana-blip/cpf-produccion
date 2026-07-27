export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  verifyRedsysNotification,
  isPaymentSuccessful,
  getResponseCodeMessage,
  type RedsysNotificationData
} from "@/lib/redsys"

export async function POST(req: NextRequest) {
  // Create client inside function so it only runs at request time, not build time
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Parse form data from Redsys
    const formData = await req.formData()

    const notification: RedsysNotificationData = {
      Ds_SignatureVersion: formData.get("Ds_SignatureVersion") as string,
      Ds_MerchantParameters: formData.get("Ds_MerchantParameters") as string,
      Ds_Signature: formData.get("Ds_Signature") as string,
    }

    console.log("[Redsys Notification] Received:", {
      orderId: "pending verification",
      signatureVersion: notification.Ds_SignatureVersion,
    })

    // Verify the notification signature
    const { valid, params, error } = verifyRedsysNotification(notification)

    if (!valid || !params) {
      console.error("[Redsys Notification] Invalid signature:", error)
      return new NextResponse("KO", { status: 400 })
    }

    const orderId = params.Ds_Order
    const responseCode = params.Ds_Response
    const isSuccess = isPaymentSuccessful(responseCode)

    console.log("[Redsys Notification] Verified:", {
      orderId,
      responseCode,
      isSuccess,
      amount: params.Ds_Amount,
      authCode: params.Ds_AuthorisationCode,
    })

    // Find payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*, plan_id")
      .eq("order_id", orderId)
      .single()

    if (paymentError || !payment) {
      console.error("[Redsys Notification] Payment not found:", orderId)
      return new NextResponse("KO", { status: 404 })
    }

    // Update payment status
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: isSuccess ? "completed" : "failed",
        response_code: responseCode,
        authorization_code: params.Ds_AuthorisationCode || null,
        card_type: params.Ds_Card_Type || null,
        card_brand: params.Ds_Card_Brand || null,
        response_message: getResponseCodeMessage(responseCode),
        processed_at: new Date().toISOString(),
        raw_response: params,
      })
      .eq("id", payment.id)

    if (updateError) {
      console.error("[Redsys Notification] Error updating payment:", updateError)
      return new NextResponse("KO", { status: 500 })
    }

    // If payment successful, update user subscription
    if (isSuccess && payment.plan_id) {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      const { data: existingSub } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", payment.user_id)
        .single()

      if (existingSub) {
        await supabaseAdmin
          .from("subscriptions")
          .update({
            plan_type: payment.plan_id,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            payment_method: "redsys",
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", payment.user_id)
      } else {
        await supabaseAdmin
          .from("subscriptions")
          .insert({
            user_id: payment.user_id,
            plan_type: payment.plan_id,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: endDate.toISOString(),
            payment_method: "redsys",
          })
      }

      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_tier: payment.plan_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.user_id)

      console.log("[Redsys Notification] Subscription activated:", {
        userId: payment.user_id,
        planId: payment.plan_id,
        endDate: endDate.toISOString(),
      })
    }

    // Redsys expects "OK" response
    return new NextResponse("OK", { status: 200 })

  } catch (error) {
    console.error("[Redsys Notification] Error:", error)
    return new NextResponse("KO", { status: 500 })
  }
}

// Redsys may also send GET requests for testing
export async function GET() {
  return new NextResponse("Redsys notification endpoint active", { status: 200 })
}
