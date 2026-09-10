import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verificarDominioCorreoValido } from "@/lib/email-validator"
import { verifyCaptcha } from "@/lib/auth/captcha"
import { createServerSupabaseClient } from "@/lib/infrastructure/supabase/server-client"

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    const {
      name,
      phone,
      email,
      platziAccountEmail,
      discountCode,
      countryCode,
      countryName,
      currency,
      captchaToken,
      captchaAnswer,
      plan,
      planName,
      planId,
      meses_cubrimiento,
      precio,
      precio_formateado,
      oferta_id,
      oferta_codigo,
      institucion,
      tipo_pago,
      numero_cuotas,
    } = body

    // 2. Verificación de Seguridad Anti-Bot (CAPTCHA Autónomo)
    const captchaCheck = verifyCaptcha(captchaToken, captchaAnswer)
    if (!captchaCheck.valid) {
      return NextResponse.json(
        { error: captchaCheck.reason || "Verificación de seguridad (CAPTCHA) requerida o expirada." },
        { status: 400 }
      )
    }

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
      process.env.PLATZI_WEBHOOK_URL && !process.env.PLATZI_WEBHOOK_URL.includes("-test")
        ? process.env.PLATZI_WEBHOOK_URL
        : "https://ventusn8n.smartcontacts.cloud/webhook/Paltzi"

    // Read x-api-key strictly from Dokploy / system environment, with proven default
    const rawKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.PLATZI_WEBHOOK_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"

    const webhookKey = String(rawKey).trim()
    const rawCode = String(discountCode || "").trim()
    const selectedPlanLabel = String(plan || planName || "Plan 6 Meses").trim()

    const payloadToWebhook = {
      event: "request_code",
      step: 1,
      product: "Platzi",
      plan: selectedPlanLabel,
      planName: selectedPlanLabel,
      planId: planId ? String(planId).trim() : "",
      meses_cubrimiento: meses_cubrimiento ? Number(meses_cubrimiento) : 6,
      precioPlan: precio ? Number(precio) : null,
      precio_formateado: precio_formateado ? String(precio_formateado).trim() : "",
      tipo_pago: tipo_pago || "pago_unico",
      numero_cuotas: numero_cuotas ? Number(numero_cuotas) : 1,
      currency: currency || "COP",
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: rawCode ? rawCode.toUpperCase() : "",
      Proveedor: rawCode ? rawCode.toUpperCase() : "",
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      oferta_id: oferta_id ? String(oferta_id).trim() : null,
      oferta_codigo: oferta_codigo ? String(oferta_codigo).trim() : null,
      institucion: institucion ? String(institucion).trim() : null,
      timestamp: new Date().toISOString(),
    }

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
        webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: headersText,
          body: JSON.stringify(payloadToWebhook),
        })
        responseStatus = webhookRes.status
        webhookResponseText = await webhookRes.text()
      }

      try {
        webhookResData = JSON.parse(webhookResponseText)
      } catch {
        webhookResData = { raw: webhookResponseText }
      }

      let dataObj = webhookResData
      if (Array.isArray(dataObj) && dataObj.length > 0) {
        dataObj = dataObj[0]
      }

    const rawMsgStr = String(dataObj?.mensaje || dataObj?.message || webhookResponseText || "").trim()
    const rawErrorStr = String(dataObj?.error || dataObj?.mensajeError || "").trim()
    const msgLower = (rawMsgStr + " " + webhookResponseText).toLowerCase()

    const isSuccessMsg =
      msgLower.includes("codigo enviado") ||
      msgLower.includes("código enviado") ||
      msgLower.includes("activada") ||
      (webhookResData && webhookResData.success === true)

    const isInvalidCouponOrError = Boolean(
      (!isSuccessMsg && !webhookRes.ok && responseStatus !== 402) ||
      rawErrorStr ||
      (dataObj && dataObj.success === false) ||
      (dataObj && dataObj.aplica === false) ||
      (dataObj && dataObj.continuar === false) ||
      msgLower.includes("incompleto") ||
      msgLower.includes("no valido") ||
      msgLower.includes("no válido") ||
      msgLower.includes("inválido") ||
      msgLower.includes("invalido") ||
      msgLower.includes("no existe") ||
      msgLower.includes("no vigente") ||
      msgLower.includes("incorrecto") ||
      msgLower.includes("errado") ||
      msgLower.includes("authorization data is wrong")
    )

    if (!isSuccessMsg && isInvalidCouponOrError) {
      const cleanError = sanitizeString(
        rawErrorStr ||
        dataObj?.mensaje ||
        dataObj?.message ||
        extractCleanErrorMessage(webhookResData, "Codigo Incompleto o no valido")
      )
      return NextResponse.json(
        {
          success: false,
          error: cleanError,
          details: webhookResponseText,
        },
        { status: 400 }
      )
    }

      // Registrar venta en platzi.ventas y sincronizar métricas del revendedor
      try {
        const cookieStore = await cookies()
        const cookieRef = cookieStore.get('sc_ref_code')?.value || null
        const effectiveRef = rawCode || cookieRef || null

        const supabase = await createServerSupabaseClient()
        await supabase.rpc('registrar_venta_platzi', {
          p_name: String(name).trim(),
          p_phone: String(phone).trim(),
          p_email: String(email).trim().toLowerCase(),
          p_platzi_account_email: String(platziAccountEmail).trim().toLowerCase(),
          p_country_name: countryName || 'Colombia',
          p_cod_revendedor: effectiveRef,
          p_discount_code: rawCode || null,
          p_cod_generado: dataObj?.codigo || dataObj?.CodGenerado || null,
          p_precio_venta: Number(precio || dataObj?.price || dataObj?.Valor || 0),
          p_tipo_pago: tipo_pago || 'pago_unico',
          p_numero_cuotas: numero_cuotas ? Number(numero_cuotas) : 1,
        })
      } catch (syncErr) {
        console.error('Error registrando venta en platzi.ventas:', syncErr)
      }

      const finalMsg = rawMsgStr || `Hemos enviado un código de seguridad a tu correo electrónico ${email}.`

      return NextResponse.json(
        {
          success: true,
          verificationRequired: true,
          message: sanitizeString(finalMsg),
          planInfo: dataObj?.planInfo || null,
          details: webhookResData,
        },
        { status: 200 }
      )
    } catch (whErr: any) {
      return NextResponse.json(
        {
          error: "Error de conexión temporal con el servicio de validación.",
        },
        { status: 502 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Ocurrió un error en el servidor al procesar la solicitud." },
      { status: 500 }
    )
  }
}
