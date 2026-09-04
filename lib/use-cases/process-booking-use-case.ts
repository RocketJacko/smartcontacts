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

  const durMinutes = 45
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
        message: 'Dominio de correo electrónico no permitido.',
      }
    }

    const isLead = data.type === 'lead' || (!data.date && !data.timeSlot && !data.time)

    // ──────────────────────────────────────────────────────────────────────────
    // FLUJO A: PERSONA QUE SOLICITA INFORMACIÓN EN LA WEB (LEAD COMERCIAL)
    // ──────────────────────────────────────────────────────────────────────────
    if (isLead) {
      let prospectoId: string | undefined = undefined

      try {
        const { url, anonKey } = getSupabaseConfig()
        if (url && anonKey) {
          const prospectoRes = await fetch(`${url}/rest/v1/prospectos`, {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              name: data.name || 'Cliente Potencial',
              phone: data.phone || 'Sin Teléfono',
              email: data.email,
              company: data.company || 'Empresa Privada',
              topic: data.topic || data.service || data.description || 'Solicitud de información comercial',
              acepta_tratamiento_datos: data.acepta_tratamiento_datos ?? true,
            }),
          })

          if (prospectoRes.ok) {
            const created = await prospectoRes.json()
            if (Array.isArray(created) && created.length > 0) {
              prospectoId = created[0].id
            }
          }

          if (prospectoId && data.referralToken) {
            const { SupabaseReferralRepository } = await import('@/lib/infrastructure/repositories/supabase-referral-repository')
            const referralRepo = new SupabaseReferralRepository()
            await referralRepo.vincularProspectoAgendado(
              data.referralToken,
              prospectoId,
              data.email,
              data.phone || ''
            )
          }
        }
      } catch (leadDbErr) {
        console.warn('[SUPABASE LEAD STORAGE WARN]', leadDbErr)
      }

      // Enviar acuse de recibo de solicitud de información (Botón directo a WhatsApp y Propuesta)
      this.emailService.sendInformationRequestReceipt({
        toEmail: data.email,
        toName: data.name || 'Cliente',
        phone: data.phone,
        company: data.company,
        message: data.description,
        topic: data.topic || data.service,
      }).catch((err) => {
        console.warn('[INFO RECEIPT EMAIL WARN]', err)
      })

      return {
        success: true,
        message: 'Solicitud de información recibida y registrada con éxito. Te contactaremos en breve.',
        data: {
          ...data,
          prospectoId,
        },
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FLUJO B: AGENDAMIENTO REAL DE CITA CON FECHA Y HORA (GOOGLE MEET)
    // ──────────────────────────────────────────────────────────────────────────
    const timeString = data.time || data.timeSlot || '10:00 AM'
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
            p_acepta_tratamiento_datos: data.acepta_tratamiento_datos ?? true,
          }),
        })

        if (!rpcRes.ok) {
          console.error('[SUPABASE CREAR_AGENDAMIENTO ERROR]', rpcRes.status, await rpcRes.text())
        } else if (data.referralToken) {
          const rpcData = await rpcRes.json()
          if (rpcData?.prospecto_id) {
            const { SupabaseReferralRepository } = await import('@/lib/infrastructure/repositories/supabase-referral-repository')
            const referralRepo = new SupabaseReferralRepository()
            await referralRepo.vincularProspectoAgendado(
              data.referralToken,
              rpcData.prospecto_id,
              data.email,
              data.phone || ''
            )
          }
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

    // 4. Registrar la cita en Google Sheets (Google Workspace)
    let sheetResult = undefined
    try {
      const { appendBookingToGoogleSheet } = await import('@/lib/infrastructure/sheets/google-sheets-service')
      sheetResult = await appendBookingToGoogleSheet({
        fecha: cleanDate,
        hora: timeString,
        nombre: data.name || 'Cliente',
        email: data.email,
        telefono: data.phone,
        empresa: data.company,
        servicio: data.topic || data.service,
        meetLink: meetLink,
        googleEventId: googleEventId,
        estado: 'Confirmada',
        fechaRegistro: new Date().toISOString(),
      })
    } catch (sheetErr) {
      console.warn('[GOOGLE SHEETS STORAGE WARN]', sheetErr)
    }

    return {
      success: true,
      message: 'Cita agendada y sincronizada con éxito en Google Sheets, Calendar y Gmail',
      data: {
        ...data,
        date: cleanDate,
        time: timeString,
        startISO,
        endISO,
        meetLink,
        googleEventId,
        googleSheet: sheetResult,
      },
    }
  }
}
