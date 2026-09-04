export interface BookingSlot {
  slot: string
  status: 'disponible' | 'ocupado'
  label: string
  bookingToken?: string
}

export interface BookingRequest {
  type?: 'lead' | 'booking'
  name?: string
  phone?: string
  email: string
  date?: string
  time?: string
  timeSlot?: string
  company?: string
  isCompany?: boolean
  service?: string
  topic?: string
  description?: string
  acepta_tratamiento_datos?: boolean
  referralToken?: string
  referralCode?: string
}

export interface BookingResult {
  success: boolean
  message: string
  data?: Record<string, any>
  error?: string
}
