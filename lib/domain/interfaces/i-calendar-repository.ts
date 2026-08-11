import { BookingSlot } from '../entities/booking'

export interface ICalendarRepository {
  getAvailability(date: string): Promise<BookingSlot[]>
  signAvailableSlots(slots: BookingSlot[], date: string, secretKey: string): BookingSlot[]
}
