export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createRedsysPaymentForm, generateOrderId, getRedsysConfig } from "@/lib/redsys"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { planId, planName, amount } = body

    if (!planId || !amount) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    // Check Redsys configuration
    const config = getRedsysConfig()
    if (!config.merchantCode || !config.secretKey) {
      return NextResponse.json({ 
        error: "Pasarela de pago no configurada" 
      }, { status: 500 })
    }

    // Generate unique order ID
    const orderId = generateOrderId()
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
      (req.headers.get("x-forwarded-proto") || "https") + "://" + req.headers.get("host")

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        order_id: orderId,
        plan_id: planId,
        amount: amount,
        currency: "EUR",
        status: "pending",
        payment_method: "redsys",
        metadata: {
          plan_name: planName,
          environment: config.environment,
        },
      })
      .select()
      .single()

    if (paymentError) {
      console.error("Error creating payment record:", paymentError)
      return NextResponse.json({ 
        error: "Error al crear registro de pago" 
      }, { status: 500 })
    }

    // Create Redsys payment form data
    const redsysData = createRedsysPaymentForm({
      orderId,
      amount: amount, // Already in cents
      productDescription: `CamareroPorFavor - ${planName}`,
      urlOK: `${baseUrl}/payment/success?order=${orderId}`,
      urlKO: `${baseUrl}/payment/error?order=${orderId}`,
      urlNotification: `${baseUrl}/api/payments/redsys/notification`,
    })

    return NextResponse.json({
      success: true,
      orderId,
      paymentId: payment.id,
      redsys: redsysData,
    })

  } catch (error) {
    console.error("Error initiating Redsys payment:", error)
    return NextResponse.json({ 
      error: "Error al iniciar el pago" 
    }, { status: 500 })
  }
}
