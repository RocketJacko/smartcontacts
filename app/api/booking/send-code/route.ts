import { NextResponse } from 'next/server'
import { z } from 'zod'
import { SupabaseDomainValidator } from '@/lib/infrastructure/repositories/supabase-domain-validator'
import { sendBookingVerificationCodeEmail } from '@/lib/gmail-service'
import { generateBookingOtp } from '@/lib/auth/booking-otp'
import { verifyCaptcha } from '@/lib/auth/captcha'
import { checkRateLimit } from '@/lib/auth/rate-limiter'

const domainValidator = new SupabaseDomainValidator()

const sendCodeSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  email: z.string().email('Correo electrónico no válido'),
  phone: z.string().min(5, 'El teléfono es obligatorio').optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  topic: z.string().optional(),
  captchaToken: z.string().min(1, 'Token de verificación requerido'),
  captchaAnswer: z.string().min(1, 'Respuesta de verificación requerida'),
})

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // 1. Rate Limiting por IP para evitar abuso de envíos masivos
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60)
      return NextResponse.json(
        {
          success: false,
          error: `Has enviado demasiadas solicitudes recientemente. Por favor espera ${minutes} minuto(s).`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validated = sendCodeSchema.parse(body)

    // 2. Validación obligatoria del CAPTCHA para impedir bots
    const captchaCheck = verifyCaptcha(validated.captchaToken, validated.captchaAnswer)
    if (!captchaCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: captchaCheck.reason || 'Verificación de seguridad (CAPTCHA) obligatoria o expirada.',
        },
        { status: 400 }
      )
    }

    // 3. Validación de Dominio de Correo (Bloqueo de temporales/desechables)
    const isBlocked = await domainValidator.isDomainBlocked(validated.email)
    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'El dominio de este correo electrónico no está permitido para agendamientos.',
        },
        { status: 400 }
      )
    }

    // 4. Generar código OTP criptográfico y token firmado
    const { code, otpToken } = generateBookingOtp(validated.email)

    // 5. Enviar el correo con el código de confirmación
    const emailResult = await sendBookingVerificationCodeEmail({
      toEmail: validated.email,
      toName: validated.name,
      code,
      date: validated.date,
      time: validated.time,
      topicTitle: validated.topic,
    })

    if (!emailResult.success) {
      console.error('[OTP EMAIL SEND ERROR]', emailResult.error)
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo enviar el correo de verificación. Por favor verifica tu dirección de email.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Código de confirmación enviado exitosamente a tu correo.',
        otpToken,
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos para enviar el código de verificación.',
          details: error.errors,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al procesar el envío del código.',
      },
      { status: 500 }
    )
  }
}
