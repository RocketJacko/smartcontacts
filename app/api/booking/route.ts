import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDomainBlocked } from '@/lib/blocked-domains'

const bookingSchema = z.object({
  type: z.enum(['lead', 'booking']).default('booking'),
  name: z.string().min(2, 'Name is required').optional(),
  phone: z.string().min(5, 'Phone is required').optional(),
  email: z.string().email('Invalid email address').or(z.string()),
  date: z.string().optional(),
  time: z.string().optional(),
  timeSlot: z.string().optional(),
  company: z.string().optional(),
  isCompany: z.boolean().optional(),
  service: z.string().optional(),
  topic: z.string().optional(),
  description: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Validar si el dominio del correo está bloqueado en Supabase
    const blocked = await isDomainBlocked(validatedData.email)
    if (blocked) {
      console.warn('[SMARTCONTACTS SPAM BLOCKED]', validatedData.email)
      return NextResponse.json(
        {
          success: false,
          error: 'El dominio de correo electrónico no está permitido para agendamientos. Por favor ingresa un correo corporativo o personal válido.',
        },
        { status: 400 }
      )
    }

    const payload = {
      timestamp: new Date().toISOString(),
      ...validatedData,
      source: 'smartcontacts.vercel.app',
    }

    // Log for Vercel Serverless Logs
    console.log('[SMARTCONTACTS LEAD RECEIVED]', payload)

    // Forward to n8n Webhook on ventus server (ventusn8n.smartcontacts.cloud)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://ventusn8n.smartcontacts.cloud/webhook/smartcontacts-booking'
    
    try {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } catch (n8nErr) {
      console.warn('[SMARTCONTACTS N8N DISPATCH WARNING]', n8nErr)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud recibida exitosamente. Se ha procesado en la agenda comercial.',
        data: payload,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error procesando la solicitud' },
      { status: 500 }
    )
  }
}
