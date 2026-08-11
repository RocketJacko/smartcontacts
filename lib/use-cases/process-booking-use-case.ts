import { IDomainValidator } from '@/lib/domain/interfaces/i-domain-validator'
import { IEmailService } from '@/lib/domain/interfaces/i-email-service'
import { BookingRequest, BookingResult } from '@/lib/domain/entities/booking'

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

    // Trigger async email confirmation in background
    this.emailService.sendBookingConfirmation({
      toEmail: data.email,
      toName: data.name || 'Cliente',
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || data.timeSlot || '02:00 PM',
      topicTitle: data.topic || data.service || 'Asesoría Estratégica Smartcontacts',
      company: data.company,
    }).catch((err) => {
      console.warn('[EMAIL USECASE WARN]', err)
    })

    return {
      success: true,
      message: 'Solicitud procesada con éxito',
      data,
    }
  }
}
