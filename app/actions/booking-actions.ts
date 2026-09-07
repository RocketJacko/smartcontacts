'use server'

import { headers } from 'next/headers'
import { SupabaseCalendarRepository } from '@/lib/infrastructure/repositories/supabase-calendar-repository'
import { GetAvailabilityUseCase } from '@/lib/use-cases/get-availability-use-case'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { sendBookingVerificationCodeEmail } from '@/lib/gmail-service'
import { generateBookingOtp, verifyBookingOtp } from '@/lib/auth/booking-otp'
import { SupabaseDomainValidator } from '@/lib/infrastructure/repositories/supabase-domain-validator'
import { verifyCaptcha } from '@/lib/auth/captcha'
import { checkRateLimit } from '@/lib/auth/rate-limiter'
import { ProcessBookingUseCase } from '@/lib/use-cases/process-booking-use-case'
import { GmailEmailService } from '@/lib/infrastructure/email/gmail-email-service'

const calendarRepo = new SupabaseCalendarRepository()
const getAvailabilityUseCase = new GetAvailabilityUseCase(calendarRepo)
const domainValidator = new SupabaseDomainValidator()
const emailService = new GmailEmailService()
const processBookingUseCase = new ProcessBookingUseCase(domainValidator, emailService)

export interface PublicSlot {
  slot: string
  status: 'disponible' | 'ocupado'
  label: string
}

export interface AvailabilityResult {
  success: boolean
  date?: string
  slots?: PublicSlot[]
  error?: string
}

export interface SendCodeResult {
  success: boolean
  otpToken?: string
  error?: string
}

export interface ConfirmBookingResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * SERVER ACTION: Valida el dominio del correo contra la lista negra de dominios bloqueados y temporales.
 */
export async function validateDomainAction(inputEmail: string): Promise<{ valid: boolean }> {
  try {
    if (!inputEmail || !inputEmail.includes('@')) return { valid: true }
    const cleanEmail = inputEmail.trim().toLowerCase()
    const isBlocked = await domainValidator.isDomainBlocked(cleanEmail)
    return { valid: !isBlocked }
  } catch {
    return { valid: true }
  }
}

/**
 * Obtiene la IP del cliente de forma segura desde las cabeceras de Next.js.
 */
async function getClientIp(): Promise<string> {
  const reqHeaders = await headers()
  const forwarded = reqHeaders.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return reqHeaders.get('x-real-ip') || '127.0.0.1'
}

/**
 * SERVER ACTION: Obtiene la disponibilidad de horarios de forma privada.
 * No expone URLs de API REST, no emite tokens internos sensibles al cliente.
 */
export async function getAvailabilityAction(dateStr: string): Promise<AvailabilityResult> {
  try {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, error: 'Fecha requerida en formato YYYY-MM-DD' }
    }

    const ip = await getClientIp()
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return { success: false, error: 'Límite de solicitudes superado. Intenta de nuevo en unos minutos.' }
    }

    const { secretKey } = getSupabaseConfig()
    const slots = await getAvailabilityUseCase.execute(dateStr, secretKey)

    // Sanitización estricta: ÚNICAMENTE entregar información indispensable de presentación.
    // CERO exposición de tokens criptográficos (bookingToken) ni infraestructura interna.
    const sanitizedSlots: PublicSlot[] = slots.map((s) => ({
      slot: s.slot,
      status: s.status as 'disponible' | 'ocupado',
      label: s.label,
    }))

    return {
      success: true,
      date: dateStr,
      slots: sanitizedSlots,
    }
  } catch (err: any) {
    return { success: false, error: 'No se pudo consultar la disponibilidad.' }
  }
}

/**
 * SERVER ACTION: Envía el código de verificación al correo del prospecto.
 * Protegido contra bots con Captcha autónomo y rate limiting sin exponer endpoints REST.
 */
export async function sendBookingCodeAction(data: {
  name: string
  email: string
  phone?: string
  date?: string
  time?: string
  topic?: string
  captchaToken: string
  captchaAnswer: string
}): Promise<SendCodeResult> {
  try {
    const ip = await getClientIp()

    // 1. Rate limiting por IP
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60)
      return {
        success: false,
        error: `Has enviado demasiadas solicitudes. Por favor espera ${minutes} minuto(s).`,
      }
    }

    // 2. Validación obligatoria del CAPTCHA
    if (!data.captchaToken || !data.captchaAnswer) {
      return { success: false, error: 'Verificación de seguridad (CAPTCHA) obligatoria.' }
    }
    const captchaCheck = verifyCaptcha(data.captchaToken, data.captchaAnswer)
    if (!captchaCheck.valid) {
      return { success: false, error: captchaCheck.reason || 'CAPTCHA inválido o expirado.' }
    }

    // 3. Validación de correo y dominio
    const cleanEmail = (data.email || '').trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Correo electrónico no válido.' }
    }

    const isBlocked = await domainValidator.isDomainBlocked(cleanEmail)
    if (isBlocked) {
      return { success: false, error: 'El dominio de este correo electrónico no está permitido.' }
    }

    // 4. Generación criptográfica segura de OTP
    const { code, otpToken } = generateBookingOtp(cleanEmail)

    // 5. Envío del correo con el código de confirmación
    const emailResult = await sendBookingVerificationCodeEmail({
      toEmail: cleanEmail,
      toName: data.name.trim(),
      code,
      date: data.date,
      time: data.time,
      topicTitle: data.topic,
    })

    if (!emailResult.success) {
      return { success: false, error: 'No se pudo enviar el correo de verificación. Revisa la dirección ingresada.' }
    }

    return {
      success: true,
      otpToken,
    }
  } catch (err: any) {
    return { success: false, error: 'Error al procesar el envío del código.' }
  }
}

/**
 * SERVER ACTION: Valida el código de confirmación y registra la cita oficialmente.
 * Ejecuta sincronización en Google Calendar, Sheets y Supabase de forma 100% privada en servidor.
 */
export async function confirmBookingAction(data: {
  name: string
  email: string
  phone: string
  company?: string
  isCompany?: boolean
  topic?: string
  service?: string
  description?: string
  date?: string
  time?: string
  timeSlot?: string
  acepta_tratamiento_datos?: boolean
  otpToken: string
  otpCode: string
}): Promise<ConfirmBookingResult> {
  try {
    const ip = await getClientIp()

    // 1. Rate limiting
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
    }

    // 2. Verificación estricta del OTP
    if (!data.otpToken || !data.otpCode) {
      return { success: false, error: 'Código de confirmación de 6 dígitos obligatorio.' }
    }

    const otpCheck = verifyBookingOtp(data.email, data.otpCode, data.otpToken)
    if (!otpCheck.valid) {
      return { success: false, error: otpCheck.reason || 'Código de confirmación incorrecto o expirado.' }
    }

    // 3. Procesar el agendamiento
    const result = await processBookingUseCase.execute({
      type: 'booking',
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      company: data.company || (data.isCompany ? 'Empresa Privada' : 'Persona Natural'),
      isCompany: data.isCompany,
      service: data.service || data.topic || 'Asesoría Estratégica & Comercial',
      topic: data.topic || 'Asesoría Estratégica & Comercial',
      date: data.date,
      time: data.time || data.timeSlot,
      timeSlot: data.timeSlot || data.time,
      acepta_tratamiento_datos: data.acepta_tratamiento_datos ?? true,
      description: `${data.description || ''} | IP: ${ip}`,
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Error al procesar la cita.' }
    }

    return {
      success: true,
      message: 'Cita agendada y confirmada exitosamente.',
    }
  } catch (err: any) {
    return { success: false, error: 'Error al confirmar la reserva.' }
  }
}
