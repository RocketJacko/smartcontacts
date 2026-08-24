import { NextRequest, NextResponse } from 'next/server'
import { SERVICES_WEBHOOK_URL, SERVICES_CONFIG } from '@/lib/config/services-config'
import { generateServiceRequestToken } from '@/lib/security/jwt-service'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const serviceId = formData.get('serviceId') as string
    const nombre = formData.get('nombre') as string
    const telefono = formData.get('telefono') as string
    const email = formData.get('email') as string

    if (!serviceId || !nombre || !telefono || !email) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios en la solicitud.' },
        { status: 400 }
      )
    }

    const service = SERVICES_CONFIG.find(s => s.id === serviceId)
    const serviceName = service ? service.name : serviceId

    // Generar JWT firmado con 5 minutos de expiración (300 segundos)
    const jwtToken = generateServiceRequestToken({
      serviceId,
      serviceName,
      email,
      nombre,
      telefono,
    }, 300)

    // Clonar FormData para adjuntar el JWT y metadatos adicionales antes de enviar a n8n
    const outgoingFormData = new FormData()
    formData.forEach((value, key) => {
      outgoingFormData.append(key, value)
    })
    outgoingFormData.append('jwt_token', jwtToken)
    outgoingFormData.append('submitted_at', new Date().toISOString())

    // Enviar POST al Webhook con el token en headers y en el body
    const webhookResponse = await fetch(SERVICES_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'X-Service-Token': jwtToken,
      },
      body: outgoingFormData,
    })

    if (!webhookResponse.ok) {
      const responseText = await webhookResponse.text().catch(() => '')
      console.error(`[SERVICES WEBHOOK ERROR] (${webhookResponse.status}):`, responseText)
      return NextResponse.json(
        {
          success: false,
          error: `El servidor del webhook respondió con estado (${webhookResponse.status}). Intente nuevamente.`,
        },
        { status: webhookResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud procesada y transmitida exitosamente al webhook.',
      tokenGenerated: true,
    })
  } catch (err: any) {
    console.error('[SERVICES SUBMIT API ERROR]:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Error interno al procesar el envío del servicio.',
      },
      { status: 500 }
    )
  }
}
