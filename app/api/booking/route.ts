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
  acepta_tratamiento_datos: z.boolean().optional(),
  referralToken: z.string().optional(),
  referralCode: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    const userAgent = request.headers.get('user-agent') || 'desconocido'
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'

    // Extraer token de atribución de cookie si no vino explícito en el body
    const cookieHeader = request.headers.get('cookie') || ''
    const cookieMatch = cookieHeader.match(/sc_ref_token=([^;]+)/)
    const cookieToken = cookieMatch ? decodeURIComponent(cookieMatch[1]) : undefined
    const referralToken = validatedData.referralToken || cookieToken

    const result = await processBookingUseCase.execute({
      ...validatedData,
      referralToken,
      description: `${validatedData.description || ''} | IP Consent: ${ip} | Browser: ${userAgent.substring(0, 80)}`,
    })
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Solicitud agendada y sincronizada exitosamente en Google Calendar, Google Sheets y Supabase.',
      data: result.data,
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Error procesando la solicitud' }, { status: 500 })
  }
}
