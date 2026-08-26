import { NextResponse } from "next/server"
import { verificarDominioCorreoValido } from "@/lib/email-validator"

// In-memory rate limiting store (max 20 requests per 15 mins per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 20

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

function sanitizeString(str: string): string {
  if (!str) return ""
  let clean = str.trim()
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim()
  }
  return clean
}

function extractCleanErrorMessage(data: any, fallbackText: string): string {
  if (!data) return sanitizeString(fallbackText)

  if (Array.isArray(data) && data.length > 0) {
    return extractCleanErrorMessage(data[0], fallbackText)
  }

  if (typeof data === "object" && data !== null) {
    if (data.labelIds || data.threadId || (data.id && !data.message && !data.mensaje && !data.error)) {
      return "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
    }
    if (data.mensaje && typeof data.mensaje === "string") return sanitizeString(data.mensaje)
    if (data.message && typeof data.message === "string") return sanitizeString(data.message)
    if (data.error && typeof data.error === "string") return sanitizeString(data.error)
    if (data.detalle && typeof data.detalle === "string") return sanitizeString(data.detalle)
    if (data.detail && typeof data.detail === "string") return sanitizeString(data.detail)
  }

  if (typeof data === "string" && data.trim()) {
    const rawStr = data.trim()

    const jsonMatch = rawStr.match(/(\{|\[)[\s\S]*(\}|\])/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        const extracted = extractCleanErrorMessage(parsed, "")
        if (extracted) return sanitizeString(extracted)
      } catch {
        // ignore parse error
      }
    }

    if (rawStr.includes("threadId") || rawStr.includes("labelIds") || rawStr.includes('"SENT"')) {
      return "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
    }

    let cleaned = rawStr.replace(/^El webhook de n8n [^:]+:\s*/i, "")
    cleaned = cleaned.replace(/^HTTP \d+ error:\s*/i, "")

    return sanitizeString(cleaned)
  }

  return sanitizeString(fallbackText)
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
        maxAllowed: 20,
        minutesRemaining: Math.ceil((data.resetAt - now) / 60000),
      })
    }
  })

  return NextResponse.json(
    {
      status: "Rate Limit Memory Inspector",
      maxAllowed: 20,
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
        { error: "Has superado el límite de solicitudes de activación (máximo 20 intentos). Por favor espera unos minutos antes de reintentar." },
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

    // Real DNS Domain Validation (Google DNS Over HTTPS + Supabase Blocked List)
    const contactEmailCheck = await verificarDominioCorreoValido(email)
    if (!contactEmailCheck.valid) {
      return NextResponse.json(
        { error: contactEmailCheck.reason || `El correo de contacto "${email}" no tiene un dominio de correo válido.` },
        { status: 400 }
      )
    }

    const platziEmailCheck = await verificarDominioCorreoValido(platziAccountEmail)
    if (!platziEmailCheck.valid) {
      return NextResponse.json(
        { error: platziEmailCheck.reason || `El correo de la cuenta Platzi "${platziAccountEmail}" no tiene un dominio válido.` },
        { status: 400 }
      )
    }

    // Default Webhook URL set to Production as requested by user
    const webhookUrl =
      process.env.PLATZI_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      "https://ventusn8n.smartcontacts.cloud/webhook/Paltzi"

    // Read x-api-key strictly from Dokploy / system environment
    const rawKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.x_api_key ||
      process.env.PLATZI_WEBHOOK_KEY ||
      ""

    const webhookKey = String(rawKey).trim()
    const rawCode = String(discountCode || "").trim()

    // Clean payload matching exact form fields sent directly to n8n
    const payloadToWebhook = {
      event: "request_code",
      step: 1,
      product: "Platzi",
      currency: currency || "COP",
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: rawCode.toUpperCase(),
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 1 WEBHOOK CALL] URL: ${webhookUrl}`)

    const headersJson: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (webhookKey) headersJson["x-api-key"] = webhookKey

    const headersText: Record<string, string> = {
      "Content-Type": "text/plain",
    }
    if (webhookKey) headersText["x-api-key"] = webhookKey

    let webhookResponseText = ""
    let webhookResData: any = null
    let responseStatus = 0
    let webhookRes: Response

    try {
      webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: headersJson,
        body: JSON.stringify(payloadToWebhook),
      })

      responseStatus = webhookRes.status
      webhookResponseText = await webhookRes.text()

      // Retry with text/plain if n8n body parser rejects application/json with HTTP 422
      if (responseStatus === 422 || webhookResponseText.includes("Failed to parse request body")) {
        console.warn("[PLATZI WEBHOOK 422 RETRY WITH TEXT/PLAIN]")
        webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: headersText,
          body: JSON.stringify(payloadToWebhook),
        })
        responseStatus = webhookRes.status
        webhookResponseText = await webhookRes.text()
      }

      console.log(`[PLATZI STEP 1 WEBHOOK RESPONSE STATUS] ${responseStatus}`)
      console.log(`[PLATZI STEP 1 WEBHOOK RESPONSE BODY] ${webhookResponseText}`)

      try {
        webhookResData = JSON.parse(webhookResponseText)
      } catch {
        webhookResData = { raw: webhookResponseText }
      }

      if (!webhookRes.ok || (webhookResData && webhookResData.success === false)) {
        const cleanError = extractCleanErrorMessage(
          webhookResData,
          webhookResponseText || "Ocurrió un error al procesar la solicitud."
        )
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
        message: extractCleanErrorMessage(webhookResData, `Hemos enviado un código de seguridad a tu correo electrónico ${email}.`),
        planInfo: webhookResData?.planInfo || null,
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
