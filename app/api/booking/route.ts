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

    // Save lead to Supabase PostgreSQL table (calendario.prospectos)
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/prospectos`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'calendario',
            'Content-Profile': 'calendario',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            name: validatedData.name || 'Sin Nombre',
            phone: validatedData.phone || 'Sin Teléfono',
            email: validatedData.email,
            company: validatedData.company || null,
            is_company: validatedData.isCompany ?? true,
            service: validatedData.service || null,
            topic: validatedData.topic || null,
            description: validatedData.description || null,
            status: 'pendiente',
          }),
        })
      }
    } catch (dbErr) {
      console.warn('[SUPABASE CALENDARIO.PROSPECTOS SAVE WARNING]', dbErr)
    }

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
