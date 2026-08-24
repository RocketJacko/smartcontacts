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
      "https://ventusn8n.smartcontacts.cloud/webhook-test/Paltzi"

    // Read strictly from Dokploy / system environment without dummy fallbacks
    const rawKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.x_api_key ||
      process.env.PLATZI_WEBHOOK_KEY ||
      ""

    const webhookKey = String(rawKey).trim()
    const jwtSecret = (
      process.env.PLATZI_JWT_SECRET ||
      process.env.CHECK_DOMAIN_SECRET ||
      ""
    ).trim()

    // 2. Server-side signed JWT Token for Step 1
    const jwtToken = createServerJWT(
      {
        sub: "benefit_activation_platzi_step1_request_code",
        accountEmail: platziAccountEmail,
        contactEmail: email,
      },
      jwtSecret || "sc_platzi_jwt_secret"
    )

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanPlatziEmail = String(platziAccountEmail).trim().toLowerCase()
    const cleanName = String(name).trim()
    const cleanPhone = String(phone).trim()
    const cleanDiscountCode = String(discountCode || "").trim().toUpperCase()

    // Split name into parts for n8n validation node compatibility
    const nameParts = cleanName.split(/\s+/).filter(Boolean)
    const primerNombre = nameParts[0] || cleanName
    const segundoNombre = nameParts.length > 2 ? nameParts[1] : ""
    const primerApellido = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const apellidos = nameParts.slice(1).join(" ")

    const payloadToWebhook = {
      event: "request_code",
      step: 1,
      product: "Platzi",
      duration: "5 meses",
      totalPrice: currency === "USD" ? "$25 USD" : "$90.000 COP",
      currency: currency || "COP",
      
      // Name field variations for n8n validation nodes
      primer_nombre: primerNombre,
      primerNombre: primerNombre,
      "primer nombre": primerNombre,
      segundo_nombre: segundoNombre,
      primer_apellido: primerApellido,
      apellidos: apellidos,
      nombre: cleanName,
      name: cleanName,
      nombre_completo: cleanName,
      
      // Contact & Phone field variations
      celular: cleanPhone,
      phone: cleanPhone,
      telefono: cleanPhone,
      correo: cleanEmail,
      email: cleanEmail,
      contactEmail: cleanEmail,
      
      // Account & Discount variations
      cuenta_platzi: cleanPlatziEmail,
      platziAccountEmail: cleanPlatziEmail,
      codigo_descuento: cleanDiscountCode,
      discountCode: cleanDiscountCode,
      
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      jwtToken,
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 1 WEBHOOK CALL] Sending request to: ${webhookUrl}`)
    console.log(`[PLATZI STEP 1 KEY SENT] ${webhookKey ? webhookKey.substring(0, 6) + "..." : "NONE"}`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (webhookKey) {
      headers["x-api-key"] = webhookKey
      headers["X-API-KEY"] = webhookKey
      headers["Authorization"] = webhookKey
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

      if (!webhookRes.ok || (webhookResData && webhookResData.success === false)) {
        return NextResponse.json(
          {
            error: webhookResData?.message || `El webhook de n8n retornó HTTP ${responseStatus}: ${webhookResponseText || 'Sin respuesta'}.`,
            details: webhookResponseText,
          },
          { status: 400 }
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
