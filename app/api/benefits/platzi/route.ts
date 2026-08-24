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

    const webhookUrl =
      process.env.PLATZI_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      "https://ventusn8n.smartcontacts.cloud/webhook/Paltzi"

    // In Linux/Docker containers (Dokploy), environment variable names with hyphens (x-api-key)
    // are automatically converted to uppercase with underscores (X_API_KEY) or x_api_key.
    const rawKey =
      process.env.X_API_KEY ||
      process.env.x_api_key ||
      process.env["x-api-key"] ||
      process.env.PLATZI_WEBHOOK_KEY ||
      process.env.CHECK_DOMAIN_SECRET ||
      ""

    const webhookKey = String(rawKey).trim()
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
      jwtToken,
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 1 WEBHOOK CALL] URL: ${webhookUrl}`)
    console.log(`[PLATZI STEP 1 KEY SENT] ${webhookKey.substring(0, 5)}... (len: ${webhookKey.length})`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (webhookKey) {
      headers["x-api-key"] = webhookKey
      headers["X-API-KEY"] = webhookKey
    }

    let webhookResponseText = ""
    let webhookResData: any = null
    let responseStatus = 0

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
            error: `El webhook de n8n retornó HTTP ${responseStatus}: ${webhookResponseText || 'Sin respuesta'}. Por favor verifica que en Dokploy la variable esté configurada como X_API_KEY o x-api-key con la misma clave de n8n.`,
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
