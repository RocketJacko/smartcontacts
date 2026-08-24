import { NextResponse } from "next/server"
import crypto from "crypto"

// In-memory rate limiting store (max 5 requests per 15 mins per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 5

  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count += 1
  return true
}

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
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1"

    // 1. Rate Limit Enforcement
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Has superado el límite de solicitudes de activación. Por favor espera unos minutos antes de reintentar." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, phone, email, platziAccountEmail, discountCode, countryCode, countryName, currency } = body

    if (!name || !phone || !email || !platziAccountEmail) {
      return NextResponse.json(
        { error: "Los campos Nombre, Celular, Correo de Contacto y Cuenta Platzi son requeridos." },
        { status: 400 }
      )
    }

    // Default to active production URL (without -test) if no custom env set
    const webhookUrl =
      process.env.PLATZI_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      "https://ventusn8n.smartcontacts.cloud/webhook/Paltzi"

    // Priority for x-api-key configured in Dokploy
    const webhookKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.PLATZI_WEBHOOK_KEY ||
      "sc_platzi_live_key_2026"

    const jwtSecret = process.env.PLATZI_JWT_SECRET || process.env.CHECK_DOMAIN_SECRET || "sc_platzi_jwt_secret_key"

    // 2. Server-side signed JWT Token for Step 1
    const jwtToken = createServerJWT(
      {
        sub: "benefit_activation_platzi_step1_request_code",
        accountEmail: platziAccountEmail,
        contactEmail: email,
      },
      jwtSecret
    )

    const payloadToWebhook = {
      event: "request_code",
      step: 1,
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
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 1 WEBHOOK CALL] Sending request to: ${webhookUrl}`)
    console.log(`[PLATZI STEP 1 KEY USED] ${webhookKey.substring(0, 10)}...`)

    // 3. Server-to-Server request to n8n Webhook
    let webhookResponseText = ""
    let webhookResData: any = null
    let responseStatus = 0

    // Provide headers matching n8n Header Auth credentials
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": webhookKey,
      "X-API-KEY": webhookKey,
      "Authorization": webhookKey.startsWith("Bearer ") ? webhookKey : `Bearer ${jwtToken}`,
    }

    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadToWebhook),
      })

      responseStatus = webhookRes.status
      webhookResponseText = await webhookRes.text()

      console.log(`[PLATZI STEP 1 WEBHOOK RESPONSE STATUS] ${responseStatus}`)
      console.log(`[PLATZI STEP 1 WEBHOOK RESPONSE BODY] ${webhookResponseText}`)

      try {
        webhookResData = JSON.parse(webhookResponseText)
      } catch {
        webhookResData = { raw: webhookResponseText }
      }

      if (!webhookRes.ok) {
        return NextResponse.json(
          {
            error: `El webhook de n8n retornó estado HTTP ${responseStatus}. Detalle: ${webhookResponseText || 'Sin respuesta'}. Por favor verifica que la clave en 'Header Auth account' de n8n coincida con la variable de entorno x-api-key (${webhookKey.substring(0, 8)}...).`,
            details: webhookResponseText,
          },
          { status: 502 }
        )
      }
    } catch (whErr: any) {
      console.error("[PLATZI STEP 1 FETCH ERROR]", whErr)
      return NextResponse.json(
        {
          error: `Error de conexión al llamar al webhook de n8n (${webhookUrl}): ${whErr.message || String(whErr)}`,
        },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        verificationRequired: true,
        message: webhookResData?.message || `Hemos enviado un código de seguridad a tu correo electrónico ${email}.`,
        details: webhookResData,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[API PLATZI ACTIVATION STEP 1 ERROR]", error)
    return NextResponse.json(
      { error: `Ocurrió un error en el servidor: ${error.message || String(error)}` },
      { status: 500 }
    )
  }
}
