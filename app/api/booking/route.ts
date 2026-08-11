import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDomainValidator } from '@/lib/infrastructure/repositories/supabase-domain-validator'
import { GmailEmailService } from '@/lib/infrastructure/email/gmail-email-service'
import { ProcessBookingUseCase } from '@/lib/use-cases/process-booking-use-case'

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

    const result = await processBookingUseCase.execute(validatedData)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    // Async forward to n8n Webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://ventusn8n.smartcontacts.cloud/webhook/smartcontacts-booking'
    fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'smartcontacts.cloud',
        ...result.data,
      }),
    }).catch((n8nErr) => {
      console.warn('[N8N DISPATCH WARNING]', n8nErr)
    })

    return NextResponse.json({
      success: true,
      message: 'Solicitud agendada y sincronizada exitosamente.',
      data: result.data,
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('[API BOOKING ERROR]', error)
    return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 })
  }
}
