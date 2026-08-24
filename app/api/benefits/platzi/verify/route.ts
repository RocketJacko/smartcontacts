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
      expectedCode,
      name,
      phone,
      email,
      platziAccountEmail,
      discountCode,
      countryCode,
      countryName,
      currency,
    } = body

    if (!inputCode || !expectedCode) {
      return NextResponse.json(
        { error: "Por favor ingresa el código de confirmación de 6 dígitos." },
        { status: 400 }
      )
    }

    if (String(inputCode).trim() !== String(expectedCode).trim()) {
      return NextResponse.json(
        { error: "El código de confirmación ingresado es incorrecto. Por favor verifica e intenta de nuevo." },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.PLATZI_WEBHOOK_URL || "https://ventusn8n.smartcontacts.cloud/webhook-test/Paltzi"
    const webhookKey = process.env.PLATZI_WEBHOOK_KEY || "sc_platzi_live_key_2026"
    const jwtSecret = process.env.PLATZI_JWT_SECRET || process.env.CHECK_DOMAIN_SECRET || "sc_platzi_jwt_secret_key"

    // Server-side signed JWT Token for Step 2 Final Verification
    const jwtToken = createServerJWT(
      {
        sub: "benefit_activation_platzi_confirmed",
        accountEmail: platziAccountEmail,
        contactEmail: email,
        verified: true,
      },
      jwtSecret
    )

    const payloadToWebhook = {
      event: "activation_confirmed",
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
      verifiedAt: new Date().toISOString(),
    }

    // Server-to-Server request to n8n Webhook for final activation
    let webhookResponseData: any = null
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

      if (webhookRes.ok) {
        webhookResponseData = await webhookRes.json().catch(() => null)
      }
    } catch (whErr) {
      console.warn("Error calling webhook on step 2 verification:", whErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: webhookResponseData?.message || "¡Beneficio de Platzi activado exitosamente!",
        details: webhookResponseData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API PLATZI ACTIVATION VERIFY ERROR]", error)
    return NextResponse.json(
      { error: "Ocurrió un error al verificar el código de activación." },
      { status: 500 }
    )
  }
}
