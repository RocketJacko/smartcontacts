import { IEmailService, EmailParams } from '@/lib/domain/interfaces/i-email-service'
import { sendBookingConfirmationEmail } from '@/lib/gmail-service'

export class GmailEmailService implements IEmailService {
  public async sendBookingConfirmation(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return sendBookingConfirmationEmail(params)
  }
}
