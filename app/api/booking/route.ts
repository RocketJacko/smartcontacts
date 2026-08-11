import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDomainBlocked } from '@/lib/blocked-domains'
import { sendBookingConfirmationEmail } from '@/lib/gmail-service'

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

    // Save lead to Supabase PostgreSQL table (calendario.prospectos & calendario.eventos)
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co'
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs'

      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        // 1. Insertar prospecto
        const prospectoRes = await fetch(`${SUPABASE_URL}/rest/v1/prospectos`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
            // Calcular fecha/hora de inicio y fin para el evento en calendario.eventos
            const startTimeStr = validatedData.date ? new Date(validatedData.date).toISOString() : new Date().toISOString()
            const endTimeObj = new Date(startTimeStr)
            endTimeObj.setHours(endTimeObj.getHours() + 1)
            const endTimeStr = endTimeObj.toISOString()

            // 2. Insertar evento vinculado al prospecto en calendario.eventos
            const eventoRes = await fetch(`${SUPABASE_URL}/rest/v1/eventos`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
                fin: endTimeStr,
                zona_horaria: 'America/Bogota',
                visibilidad: 'publico',
              }),
            })

            if (eventoRes.ok) {
              const eventoData = await eventoRes.json()
              const eventoId = eventoData?.[0]?.id

              if (eventoId) {
                // 3. Registrar al prospecto como participante en calendario.participantes
                await fetch(`${SUPABASE_URL}/rest/v1/participantes`, {
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

    // Async Non-blocking Gmail Confirmation Email Dispatch
    if (validatedData.email) {
      sendBookingConfirmationEmail({
        toEmail: validatedData.email,
        toName: validatedData.name || 'Cliente',
        date: validatedData.date || new Date().toISOString().split('T')[0],
        time: validatedData.time || validatedData.timeSlot || '02:00 PM',
        topicTitle: validatedData.topic || validatedData.service || 'Asesoría Estratégica Smartcontacts',
        company: validatedData.company,
      }).catch((emailErr) => {
        console.warn('[GMAIL ASYNC DISPATCH EXCEPTION]', emailErr)
      })
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
