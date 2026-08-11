import { IDomainValidator } from '@/lib/domain/interfaces/i-domain-validator'
import { IEmailService } from '@/lib/domain/interfaces/i-email-service'
import { BookingRequest, BookingResult } from '@/lib/domain/entities/booking'
import { createGoogleCalendarEvent } from '@/lib/infrastructure/calendar/google-calendar-service'

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

    // 1. Create Google Calendar Event & Google Meet Room
    let meetLink = 'https://meet.google.com'
    try {
      const calRes = await createGoogleCalendarEvent({
        summary: `Asesoría Estratégica: ${data.topic || data.service || 'Smartcontacts'} - ${data.name || data.email}`,
        description: `Agendamiento comercial Smartcontacts.\nContacto: ${data.phone || 'N/A'}\nEmpresa: ${data.company || 'N/A'}\nNotas: ${data.description || 'Sin notas'}`,
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || data.timeSlot || '02:00 PM',
        attendeeEmail: data.email,
        attendeeName: data.name,
      })

      if (calRes.success && calRes.meetLink) {
        meetLink = calRes.meetLink
      }
    } catch (calErr) {
      console.warn('[CALENDAR CREATION WARN]', calErr)
    }

    // 2. Trigger async email confirmation with real Google Meet link
    this.emailService.sendBookingConfirmation({
      toEmail: data.email,
      toName: data.name || 'Cliente',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || data.timeSlot || '02:00 PM',
      topicTitle: data.topic || data.service || 'Asesoría Estratégica Smartcontacts',
      company: data.company,
      meetLink: meetLink,
    }).catch((err) => {
      console.warn('[EMAIL USECASE WARN]', err)
    })

    return {
      success: true,
      message: 'Solicitud procesada con éxito',
      data: {
        ...data,
        meetLink,
      },
    }
  }
}
