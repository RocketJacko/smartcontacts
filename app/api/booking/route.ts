import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDomainValidator } from '@/lib/infrastructure/repositories/supabase-domain-validator'
import { GmailEmailService } from '@/lib/infrastructure/email/gmail-email-service'
import { ProcessBookingUseCase } from '@/lib/use-cases/process-booking-use-case'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

const domainValidator = new SupabaseDomainValidator()
const emailService = new GmailEmailService()
const processBookingUseCase = new ProcessBookingUseCase(domainValidator, emailService)

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

    // Execute Use Case
    const result = await processBookingUseCase.execute(validatedData)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    const payload = {
      timestamp: new Date().toISOString(),
      ...validatedData,
      source: 'smartcontacts.vercel.app',
    }

    // Async save to Supabase PostgreSQL (calendario.prospectos & calendario.eventos)
    try {
      const { url, anonKey } = getSupabaseConfig()
      if (url && anonKey) {
        const prospectoRes = await fetch(`${url}/rest/v1/prospectos`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'calendario',
            'Content-Profile': 'calendario',
            'Prefer': 'return=representation',
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

        if (prospectoRes.ok) {
          const prospectosData = await prospectoRes.json()
          const prospectoId = prospectosData?.[0]?.id

          if (prospectoId) {
            const startTimeStr = validatedData.date ? new Date(validatedData.date).toISOString() : new Date().toISOString()
            const endTimeObj = new Date(startTimeStr)
            endTimeObj.setHours(endTimeObj.getHours() + 1)

            const eventoRes = await fetch(`${url}/rest/v1/eventos`, {
              method: 'POST',
              headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json',
                'Accept-Profile': 'calendario',
                'Content-Profile': 'calendario',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                prospecto_id: prospectoId,
                titulo: `Agendamiento: ${validatedData.topic || 'Sesión Comercial'} - ${validatedData.name || validatedData.email}`,
                descripcion: validatedData.description || `Contacto: ${validatedData.phone || 'S/N'}. Empresa: ${validatedData.company || 'S/E'}`,
                inicio: startTimeStr,
                fin: endTimeObj.toISOString(),
                zona_horaria: 'America/Bogota',
                visibilidad: 'publico',
              }),
            })

            if (eventoRes.ok) {
              const eventoData = await eventoRes.json()
              const eventoId = eventoData?.[0]?.id
              if (eventoId) {
                await fetch(`${url}/rest/v1/participantes`, {
                  method: 'POST',
                  headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Content-Type': 'application/json',
                    'Accept-Profile': 'calendario',
                    'Content-Profile': 'calendario',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify({
                    evento_id: eventoId,
                    email: validatedData.email,
                    estado: 'pendiente',
                  }),
                })
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn('[SUPABASE CALENDARIO DISPATCH WARNING]', dbErr)
    }

    // Async forward to n8n Webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://ventusn8n.smartcontacts.cloud/webhook/smartcontacts-booking'
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((n8nErr) => {
      console.warn('[N8N DISPATCH WARNING]', n8nErr)
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud procesada con éxito.',
      data: payload,
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[API BOOKING ERROR]', error)
    return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 })
  }
}
