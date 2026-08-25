import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      inputCode,
      name,
      phone,
      email,
      platziAccountEmail,
      discountCode,
      countryCode,
      countryName,
      currency,
    } = body

    if (!inputCode || !String(inputCode).trim()) {
      return NextResponse.json(
        { error: "Por favor ingresa el código de seguridad enviado a tu correo electrónico." },
        { status: 400 }
      )
    }

    // Exact Webhook Test URL requested by user
    const webhookUrl =
      process.env.PLATZI_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      "https://ventusn8n.smartcontacts.cloud/webhook-test/Paltzi"

    // Read x-api-key strictly from Dokploy / system environment
    const rawKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.x_api_key ||
      process.env.PLATZI_WEBHOOK_KEY ||
      ""

    const webhookKey = String(rawKey).trim()
    const cleanDiscountCode = String(discountCode || "").trim().toUpperCase()

    // Dynamic price & duration calculation for n8n payload
    let calculatedDuration = "1 año"
    let calculatedPrice = currency === "USD" ? "$105 USD" : "$400.909,75 COP"

    if (cleanDiscountCode === "PLAN CS") {
      calculatedDuration = "5 meses"
      calculatedPrice = currency === "USD" ? "$25 USD" : "$90.000 COP"
    } else if (cleanDiscountCode === "COMPUESTUDIOS") {
      calculatedDuration = "1 año"
      calculatedPrice = "$0 COP"
    } else if (cleanDiscountCode === "PLAN AS") {
      calculatedDuration = "1 año"
      calculatedPrice = currency === "USD" ? "$48 USD" : "$180.000 COP"
    } else if (cleanDiscountCode === "PLAN BS") {
      calculatedDuration = "1 año"
      calculatedPrice = currency === "USD" ? "$43 USD" : "$160.000 COP"
    } else if (cleanDiscountCode === "CODIFICANDOANDO") {
      calculatedDuration = "1 año"
      calculatedPrice = currency === "USD" ? "$20 USD" : "$75.000 COP"
    }

    // Clean payload matching exact form fields + inputCode (no jwtToken)
    const payloadToWebhook = {
      event: "verify_code_and_activate",
      step: 2,
      product: "Platzi",
      duration: calculatedDuration,
      totalPrice: calculatedPrice,
      currency: currency || "COP",
      inputCode: String(inputCode).trim(),
      codigo: String(inputCode).trim(),
      verificationCode: String(inputCode).trim(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: cleanDiscountCode,
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 2 VERIFY WEBHOOK CALL] URL: ${webhookUrl}`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Header validation key expected by n8n: x-api-key
    if (webhookKey) {
      headers["x-api-key"] = webhookKey
    }

    let webhookResponseText = ""
    let webhookResponseData: any = null
    let responseStatus = 0

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadToWebhook),
      })

      responseStatus = webhookRes.status
      webhookResponseText = await webhookRes.text()

      console.log(`[PLATZI STEP 2 WEBHOOK RESPONSE STATUS] ${responseStatus}`)
      console.log(`[PLATZI STEP 2 WEBHOOK RESPONSE BODY] ${webhookResponseText}`)

      try {
        webhookResponseData = JSON.parse(webhookResponseText)
      } catch {
        webhookResponseData = { raw: webhookResponseText }
      }

      // Check if n8n processed the workflow successfully or returned a missing respond node message
      const isWorkflowExecuted =
        webhookRes.ok ||
        webhookResponseText.includes("No Respond to Webhook node") ||
        (webhookResponseData && webhookResponseData.success !== false && !webhookResponseData.error)

      if (!isWorkflowExecuted) {
        return NextResponse.json(
          {
            error:
              webhookResponseData?.error ||
              webhookResponseData?.message ||
              `El webhook de n8n retornó estado ${responseStatus}. Detalle: ${webhookResponseText || 'Código incorrecto o no verificado'}.`,
          },
          { status: 400 }
        )
      }
    } catch (whErr: any) {
      console.error("[PLATZI STEP 2 FETCH ERROR]", whErr)
      return NextResponse.json(
        {
          error: `Error de conexión al llamar al webhook de n8n en el paso 2: ${whErr.message || String(whErr)}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: webhookResponseData?.message || "¡Beneficio de Platzi activado exitosamente!",
        details: webhookResponseData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[API PLATZI ACTIVATION VERIFY ERROR]", error)
    return NextResponse.json(
      { error: `Ocurrió un error en el servidor al verificar el código: ${error.message || String(error)}` },
      { status: 500 }
    )
  }
}
