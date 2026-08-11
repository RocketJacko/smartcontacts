export interface EmailParams {
  toEmail: string
  toName: string
  date: string
  time: string
  topicTitle: string
  company?: string
  meetLink?: string
}

export interface IEmailService {
  sendBookingConfirmation(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>
}
