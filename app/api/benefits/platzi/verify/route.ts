import { NextResponse } from "next/server"

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

    // Clean payload matching exact form fields + inputCode sent directly to n8n
    const payloadToWebhook = {
      event: "verify_code_and_activate",
      step: 2,
      product: "Platzi",
      currency: currency || "COP",
      inputCode: String(inputCode).trim(),
      codigo: String(inputCode).trim(),
      verificationCode: String(inputCode).trim(),
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      platziAccountEmail: String(platziAccountEmail).trim().toLowerCase(),
      discountCode: rawCode.toUpperCase(),
      countryCode: countryCode || "CO",
      countryName: countryName || "Colombia",
      timestamp: new Date().toISOString(),
    }

    console.log(`[PLATZI STEP 2 VERIFY WEBHOOK CALL] URL: ${webhookUrl}`)

    const headersJson: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (webhookKey) headersJson["x-api-key"] = webhookKey

    const headersText: Record<string, string> = {
      "Content-Type": "text/plain",
    }
    if (webhookKey) headersText["x-api-key"] = webhookKey

    let webhookResponseText = ""
    let webhookResponseData: any = null
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
        console.warn("[PLATZI VERIFY WEBHOOK 422 RETRY WITH TEXT/PLAIN]")
        webhookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: headersText,
          body: JSON.stringify(payloadToWebhook),
        })
        responseStatus = webhookRes.status
        webhookResponseText = await webhookRes.text()
      }

      console.log(`[PLATZI STEP 2 WEBHOOK RESPONSE STATUS] ${responseStatus}`)
      console.log(`[PLATZI STEP 2 WEBHOOK RESPONSE BODY] ${webhookResponseText}`)

      try {
        webhookResponseData = JSON.parse(webhookResponseText)
      } catch {
        webhookResponseData = { raw: webhookResponseText }
      }

      let dataObj = webhookResponseData
      if (Array.isArray(dataObj) && dataObj.length > 0) {
        dataObj = dataObj[0]
      }

      const bodyLower = webhookResponseText.toLowerCase()
      const rawErrorStr = String(dataObj?.error || dataObj?.mensajeError || "").trim()

      const isExplicitError = Boolean(
        rawErrorStr ||
        (dataObj && dataObj.success === false) ||
        bodyLower.includes("incorrecto") ||
        bodyLower.includes("errado") ||
        bodyLower.includes("mal escrito") ||
        bodyLower.includes("no coincide")
      )

      if (!webhookRes.ok && isExplicitError) {
        const cleanError = extractCleanErrorMessage(
          webhookResponseData,
          webhookResponseText || "El código de seguridad ingresado es incorrecto o está mal escrito."
        )
        return NextResponse.json(
          {
            success: false,
            error: cleanError,
          },
          { status: 400 }
        )
      }

      const cleanSuccessMsg = extractCleanErrorMessage(
        webhookResponseData,
        "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
      )

      return NextResponse.json(
        {
          success: true,
          message: cleanSuccessMsg,
          planInfo: dataObj?.planInfo || null,
          details: webhookResponseData,
        },
        { status: 200 }
      )
    } catch (whErr: any) {
      console.error("[PLATZI STEP 2 FETCH ERROR]", whErr)
      return NextResponse.json(
        {
          success: false,
          error: `Error de conexión al llamar al webhook de n8n en el paso 2: ${whErr.message || String(whErr)}`,
        },
        { status: 502 }
      )
    }
  } catch (error: any) {
    console.error("[API PLATZI ACTIVATION VERIFY ERROR]", error)
    return NextResponse.json(
      { success: false, error: `Ocurrió un error en el servidor al verificar el código: ${error.message || String(error)}` },
      { status: 500 }
    )
  }
}
