import { NextResponse } from "next/server"

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

function extractCleanErrorMessage(data: any, fallbackText: string): string {
  if (!data) return fallbackText

  // If array like [{ mensaje: "..." }]
  if (Array.isArray(data) && data.length > 0) {
    return extractCleanErrorMessage(data[0], fallbackText)
  }

  // If object like { mensaje: "..." } or { message: "..." }
  if (typeof data === "object") {
    if (data.mensaje && typeof data.mensaje === "string") return data.mensaje
    if (data.message && typeof data.message === "string") return data.message
    if (data.error && typeof data.error === "string") return data.error
    if (data.detalle && typeof data.detalle === "string") return data.detalle
    if (data.detail && typeof data.detail === "string") return data.detail
  }

  if (typeof data === "string" && data.trim()) {
    try {
      const parsed = JSON.parse(data)
      return extractCleanErrorMessage(parsed, data)
    } catch {
      return data
    }
  }

  return fallbackText
}

// GET endpoint: Visually view active IP rate limit blocks in browser
export async function GET() {
  const now = Date.now()
  const activeBlocks: Array<{ ip: string; attempts: number; maxAllowed: number; minutesRemaining: number }> = []

  rateLimitMap.forEach((data, ip) => {
    if (now < data.resetAt) {
      activeBlocks.push({
        ip,
        attempts: data.count,
        maxAllowed: 5,
        minutesRemaining: Math.ceil((data.resetAt - now) / 60000),
      })
    }
  })

  return NextResponse.json(
    {
      status: "Rate Limit Memory Inspector",
      totalTrackedIPs: activeBlocks.length,
      activeBlocks,
    },
    { status: 200 }
  )
}

// DELETE endpoint: Clear all rate limit blocks from RAM memory
export async function DELETE() {
  const totalCleared = rateLimitMap.size
  rateLimitMap.clear()
  return NextResponse.json(
    {
      message: `Se han limpiado ${totalCleared} bloqueos de la memoria RAM.`,
      success: true,
    },
    { status: 200 }
  )
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

    // Clean payload matching exact form fields
    const payloadToWebhook = {
      event: "request_code",
      step: 1,
      product: "Platzi",
      duration: calculatedDuration,
      totalPrice: calculatedPrice,
      currency: currency || "COP",
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: cleanDiscountCode,
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 1 WEBHOOK CALL] URL: ${webhookUrl}`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Header validation key expected by n8n: x-api-key
    if (webhookKey) {
      headers["x-api-key"] = webhookKey
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
        const cleanError = extractCleanErrorMessage(webhookResData, webhookResponseText || "Ocurrió un error al procesar la solicitud.")
        return NextResponse.json(
          {
            error: cleanError,
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
