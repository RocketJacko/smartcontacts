import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || "").trim()
    const currency = String(body?.currency || "COP").toUpperCase()

    // Read n8n webhook URL from Dokploy environment / fallback
    const webhookUrl =
      process.env.PLATZI_WEBHOOK_URL ||
      process.env.N8N_WEBHOOK_URL ||
      "https://ventusn8n.smartcontacts.cloud/webhook/Paltzi"

    const rawKey =
      process.env["x-api-key"] ||
      process.env.X_API_KEY ||
      process.env.x_api_key ||
      process.env.PLATZI_WEBHOOK_KEY ||
      ""

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (rawKey) {
      headers["x-api-key"] = String(rawKey).trim()
    }

    const payloadToN8n = {
      event: "validate_coupon",
      validarCupon: true,
      VALIDARCUPON: true,
      code: rawCode,
      discountCode: rawCode.toUpperCase(),
      currency,
    }

    let n8nRes: Response
    let responseText = ""
    let data: any = null

    try {
      n8nRes = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payloadToN8n),
      })
      responseText = await n8nRes.text()

      try {
        data = JSON.parse(responseText)
      } catch {
        const jsonMatch = responseText.match(/(\{|\[)[\s\S]*(\}|\])/)
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0])
          } catch {}
        }
      }
    } catch (err: any) {
      console.warn("[N8N WEBHOOK VALIDATE FETCH ERROR]", err?.message)
    }

    if (Array.isArray(data) && data.length > 0) {
      data = data[0]
    }

    // Determine validity from n8n response or HTTP status
    const isValid = Boolean(
      data?.valid ??
      data?.valido ??
      data?.success ??
      (data && !data.error && !data.mensajeError)
    )

    // Extract dynamic fields returned by n8n
    const planName = data?.planName || data?.plan || (isValid ? "Plan de Beneficio" : "Plan Invalido")
    const duration = data?.duration || data?.duracion || "1 año"
    const rawPriceCop = Number(data?.priceCop ?? data?.price ?? data?.valor ?? (isValid ? 0 : 400909.75))
    const discountLabel = data?.discountLabel || data?.label || data?.descuentoLabel || ""
    const errorMessage = data?.error || data?.mensaje || data?.message || data?.detalle || ""

    // Format price according to user currency (COP vs USD)
    let formattedPrice = data?.formattedPrice || data?.precioFormateado || ""
    if (!formattedPrice) {
      if (currency === "USD") {
        if (rawPriceCop === 0) {
          formattedPrice = "$0 USD"
        } else {
          const usdValue = data?.priceUsd || Math.round(rawPriceCop / 3800)
          formattedPrice = `$${usdValue} USD`
        }
      } else {
        if (rawPriceCop === 0) {
          formattedPrice = "$0 COP"
        } else {
          formattedPrice = `$${Math.round(rawPriceCop).toLocaleString("es-CO")} COP`
        }
      }
    }

    return NextResponse.json(
      {
        valid: isValid,
        codeKey: rawCode.toUpperCase(),
        planName,
        duration,
        priceCop: rawPriceCop,
        formattedPrice,
        discountLabel,
        error: !isValid ? (errorMessage || `El código "${rawCode}" no es un código de descuento válido.`) : "",
        validarCupon: true,
        VALIDARCUPON: true,
        rawN8nResponse: data,
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error.message || "Error al validar el código con el servidor n8n.",
        validarCupon: true,
        VALIDARCUPON: true,
      },
      { status: 500 }
    )
  }
}
