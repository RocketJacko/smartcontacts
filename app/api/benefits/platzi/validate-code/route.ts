import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const code = String(body?.code || "").trim()
    const currency = String(body?.currency || "COP")

    // URL de n8n configurada en las variables de entorno de Dokploy
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

    // Se envía el código directamente a n8n sin alterar el formato
    const payload = {
      code,
      currency,
      validarCupon: true,
      VALIDARCUPON: true,
    }

    const n8nRes = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const responseText = await n8nRes.text()
    let data: any = null

    try {
      data = JSON.parse(responseText)
    } catch {
      data = { rawResponse: responseText }
    }

    // Si n8n responde en un arreglo, extraemos el primer elemento
    if (Array.isArray(data) && data.length > 0) {
      data = data[0]
    }

    // Retornamos directamente la respuesta devuelta por n8n al frontend
    return NextResponse.json(data, { status: n8nRes.status || 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Error al conectar con el webhook de n8n.",
      },
      { status: 500 }
    )
  }
}
