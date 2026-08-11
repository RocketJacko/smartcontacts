import { ICalendarRepository } from '@/lib/domain/interfaces/i-calendar-repository'
import { BookingSlot } from '@/lib/domain/entities/booking'

export class GetAvailabilityUseCase {
  constructor(private calendarRepo: ICalendarRepository) {}

  public async execute(date: string, secretKey: string): Promise<BookingSlot[]> {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Fecha inválida (YYYY-MM-DD requerida)')
    }

    const rawSlots = await this.calendarRepo.getAvailability(date)
    return this.calendarRepo.signAvailableSlots(rawSlots, date, secretKey)
  }
}
