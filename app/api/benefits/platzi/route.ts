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

    // 2. Generate 6-digit verification code (PIN)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    const webhookUrl = process.env.PLATZI_WEBHOOK_URL || "https://ventusn8n.smartcontacts.cloud/webhook-test/Paltzi"
    const webhookKey = process.env.PLATZI_WEBHOOK_KEY || "sc_platzi_live_key_2026"
    const jwtSecret = process.env.PLATZI_JWT_SECRET || process.env.CHECK_DOMAIN_SECRET || "sc_platzi_jwt_secret_key"

    // 3. Server-side signed JWT Token
    const jwtToken = createServerJWT(
      {
        sub: "benefit_activation_platzi_step1",
        accountEmail: platziAccountEmail,
        contactEmail: email,
        verificationCode,
      },
      jwtSecret
    )

    const payloadToWebhook = {
      event: "activation_requested",
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
      verificationCode,
      timestamp: new Date().toISOString(),
    }

    // 4. Server-to-Server request to n8n Webhook
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": webhookKey,
        "Authorization": `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(payloadToWebhook),
    })

    if (!webhookRes.ok) {
      console.warn(`Webhook n8n step 1 response status: ${webhookRes.status}`)
    }

    return NextResponse.json(
      {
        success: true,
        verificationRequired: true,
        verificationCode, // sent to client for verification step
        message: "Solicitud iniciada. Ingresa el código de confirmación enviado a tu correo/WhatsApp.",
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[API PLATZI ACTIVATION STEP 1 ERROR]", error)
    return NextResponse.json(
      { error: "Ocurrió un error al procesar la solicitud inicial de activación." },
      { status: 500 }
    )
  }
}
