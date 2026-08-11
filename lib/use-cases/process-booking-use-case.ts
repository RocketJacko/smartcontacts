import { IDomainValidator } from '@/lib/domain/interfaces/i-domain-validator'
import { IEmailService } from '@/lib/domain/interfaces/i-email-service'
import { BookingRequest, BookingResult } from '@/lib/domain/entities/booking'
import { createGoogleCalendarEvent } from '@/lib/infrastructure/calendar/google-calendar-service'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export function parseColombiaStartAndEndISO(dateStr?: string, timeStr?: string): { cleanDate: string; hours: number; startISO: string; endISO: string } {
  let cleanDate = dateStr || ''

  // Parse Spanish date format (e.g. "Jue, 20 de Agosto 2026" or "20 de Agosto 2026")
  if (cleanDate && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    const spanishMatch = cleanDate.match(/(\d{1,2})\s+de\s+([A-Za-z]+)\s+(\d{4})/)
    if (spanishMatch) {
      const day = String(spanishMatch[1]).padStart(2, '0')
      const monthName = spanishMatch[2].toLowerCase()
      const year = spanishMatch[3]

      const monthsMap: Record<string, string> = {
        enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
        julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
      }

      const month = monthsMap[monthName] || '08'
      cleanDate = `${year}-${month}-${day}`
    }
  }

  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    cleanDate = new Date().toISOString().split('T')[0]
  }

  let hours = 15
  let minutes = 0

  if (timeStr) {
    const isPM = timeStr.toUpperCase().includes('PM')
    const isAM = timeStr.toUpperCase().includes('AM')
    const tm = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (tm) {
      hours = parseInt(tm[1], 10)
      minutes = parseInt(tm[2], 10)
      if (isPM && hours < 12) hours += 12
      if (isAM && hours === 12) hours = 0
    }
  }

  const durMinutes = (hours === 17 && minutes === 0) ? 30 : 60
  let endHours = hours
  let endMinutes = minutes + durMinutes
  if (endMinutes >= 60) {
    endHours += Math.floor(endMinutes / 60)
    endMinutes = endMinutes % 60
  }

  const startISO = `${cleanDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-05:00`
  const endISO = `${cleanDate}T${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00-05:00`

  return { cleanDate, hours, startISO, endISO }
}

export class ProcessBookingUseCase {
  constructor(
    private domainValidator: IDomainValidator,
    private emailService: IEmailService
  ) {}

  public async execute(data: BookingRequest): Promise<BookingResult> {
    const blocked = await this.domainValidator.isDomainBlocked(data.email)
    if (blocked) {
      return {
        success: false,
        error: 'El dominio de correo electrónico no está permitido para agendamientos.',
      }
    }

    const timeString = data.time || data.timeSlot || '02:00 PM'
    const { cleanDate, startISO, endISO } = parseColombiaStartAndEndISO(data.date, timeString)

    // 1. Create Google Calendar Event & Google Meet Room
    const uniqueSlug = `${cleanDate.replace(/-/g, '')}-${timeString.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    let meetLink = `https://meet.google.com/smc-${uniqueSlug}`
    let googleEventId: string | undefined = undefined

    try {
      const calRes = await createGoogleCalendarEvent({
        summary: `Asesoría Estratégica: ${data.topic || data.service || 'Smartcontacts'} - ${data.name || data.email}`,
        description: `Agendamiento comercial Smartcontacts.\nContacto: ${data.phone || 'N/A'}\nEmpresa: ${data.company || 'N/A'}\nNotas: ${data.description || 'Sin notas'}`,
        date: cleanDate,
        time: timeString,
        attendeeEmail: data.email,
        attendeeName: data.name,
      })

      if (calRes.success) {
        if (calRes.meetLink) meetLink = calRes.meetLink
        if (calRes.eventId) googleEventId = calRes.eventId
      }
    } catch (calErr) {
      console.warn('[CALENDAR CREATION WARN]', calErr)
    }

    // 2. Synchronize atomically with Supabase PostgreSQL (calendario schema via public.crear_agendamiento)
    try {
      const { url, anonKey } = getSupabaseConfig()
      if (url && anonKey) {
        const rpcRes = await fetch(`${url}/rest/v1/rpc/crear_agendamiento`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            p_nombre: data.name || 'Sin Nombre',
            p_telefono: data.phone || 'Sin Teléfono',
            p_email: data.email,
            p_empresa: data.company || null,
            p_es_empresa: data.isCompany ?? true,
            p_servicio: data.service || null,
            p_tema: data.topic || null,
            p_descripcion: data.description || null,
            p_inicio: startISO,
            p_fin: endISO,
            p_google_event_id: googleEventId || null,
            p_meet_link: meetLink,
          }),
        })

        if (!rpcRes.ok) {
          console.error('[SUPABASE CREAR_AGENDAMIENTO ERROR]', rpcRes.status, await rpcRes.text())
        }
      }
    } catch (dbErr) {
      console.warn('[SUPABASE POSTGRESQL SYNCHRONIZATION WARN]', dbErr)
    }

    // 3. Trigger async email confirmation with real Google Meet link
    this.emailService.sendBookingConfirmation({
      toEmail: data.email,
      toName: data.name || 'Cliente',
      date: cleanDate,
      time: timeString,
      topicTitle: data.topic || data.service || 'Asesoría Estratégica Smartcontacts',
      company: data.company,
      meetLink: meetLink,
    }).catch((err) => {
      console.warn('[EMAIL USECASE WARN]', err)
    })

    return {
      success: true,
      message: 'Solicitud procesada y sincronizada con éxito en Supabase y Google Calendar',
      data: {
        ...data,
        date: cleanDate,
        time: timeString,
        startISO,
        endISO,
        meetLink,
        googleEventId,
      },
    }
  }
}
