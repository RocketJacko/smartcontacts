import { NextResponse } from "next/server"
import crypto from "crypto"

function createServerJWT(payload: object, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encodedPayload = Buffer.from(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString("base64url")

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url")

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

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

    const webhookUrl = process.env.PLATZI_WEBHOOK_URL || "https://ventusn8n.smartcontacts.cloud/webhook-test/Paltzi"
    const webhookKey = process.env.PLATZI_WEBHOOK_KEY || "sc_platzi_live_key_2026"
    const jwtSecret = process.env.PLATZI_JWT_SECRET || process.env.CHECK_DOMAIN_SECRET || "sc_platzi_jwt_secret_key"

    // Server-side signed JWT Token for Step 2 Verification
    const jwtToken = createServerJWT(
      {
        sub: "benefit_activation_platzi_verify_code",
        accountEmail: platziAccountEmail,
        contactEmail: email,
        inputCode: String(inputCode).trim(),
      },
      jwtSecret
    )

    const payloadToWebhook = {
      event: "verify_code_and_activate",
      step: 2,
      product: "Platzi",
      duration: "5 meses",
      totalPrice: currency === "USD" ? "$25 USD" : "$90.000 COP",
      currency: currency || "COP",
      name: String(name).trim(),
      phone: String(phone).trim(),
      contactEmail: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: String(discountCode || "").trim().toUpperCase(),
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      verificationCode: String(inputCode).trim(),
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 2 VERIFY WEBHOOK CALL] Sending request to: ${webhookUrl}`)
    console.log(`[PLATZI STEP 2 PAYLOAD]`, JSON.stringify(payloadToWebhook, null, 2))

    // Forward verification request to n8n Webhook
    let webhookResponseText = ""
    let webhookResponseData: any = null
    let responseStatus = 0

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": webhookKey,
          "Authorization": `Bearer ${jwtToken}`,
        },
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

      if (!webhookRes.ok || (webhookResponseData && webhookResponseData.success === false)) {
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
