import crypto from 'crypto'
import { ICalendarRepository } from '@/lib/domain/interfaces/i-calendar-repository'
import { BookingSlot } from '@/lib/domain/entities/booking'
import { getSupabaseConfig } from '../supabase/supabase-client'

export class SupabaseCalendarRepository implements ICalendarRepository {
  public async getAvailability(date: string): Promise<BookingSlot[]> {
    const { url, anonKey } = getSupabaseConfig()
    const rpcUrl = `${url}/rest/v1/rpc/obtener_disponibilidad`

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_fecha: date }),
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Error en RPC Supabase obtener_disponibilidad (${response.status})`)
    }

    return response.json()
  }

  public signAvailableSlots(slots: BookingSlot[], date: string, secretKey: string): BookingSlot[] {
    const now = Date.now()
    return slots.map((item) => {
      if (item.status === 'disponible') {
        const payloadStr = JSON.stringify({
          slot: item.slot,
          date: date,
          exp: now + 5 * 60 * 1000,
        })
        const signature = crypto.createHmac('sha256', secretKey).update(payloadStr).digest('hex')
        const bookingToken = Buffer.from(`${payloadStr}|${signature}`).toString('base64')

        return { ...item, bookingToken }
      }
      return item
    })
  }
}
