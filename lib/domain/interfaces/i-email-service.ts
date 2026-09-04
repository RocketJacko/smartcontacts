export interface EmailParams {
  toEmail: string
  toName: string
  date: string
  time: string
  topicTitle: string
  company?: string
  meetLink?: string
}

export interface InfoRequestEmailParams {
  toEmail: string
  toName: string
  phone?: string
  company?: string
  message?: string
  topic?: string
}

export interface IEmailService {
  sendBookingConfirmation(params: EmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>
  sendInformationRequestReceipt(params: InfoRequestEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }>
}
