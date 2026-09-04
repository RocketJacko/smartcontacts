import { IEmailService, EmailParams, InfoRequestEmailParams } from '@/lib/domain/interfaces/i-email-service'
import { sendBookingConfirmationEmail, sendInformationRequestReceiptEmail } from '@/lib/gmail-service'

export class GmailEmailService implements IEmailService {
  public async sendBookingConfirmation(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return sendBookingConfirmationEmail(params)
  }

  public async sendInformationRequestReceipt(params: InfoRequestEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return sendInformationRequestReceiptEmail(params)
  }
}
