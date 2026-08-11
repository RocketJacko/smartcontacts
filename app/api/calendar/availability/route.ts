import { NextResponse } from 'next/server'
import { MemoryRateLimiter } from '@/lib/infrastructure/security/memory-rate-limiter'
import { SupabaseCalendarRepository } from '@/lib/infrastructure/repositories/supabase-calendar-repository'
import { GetAvailabilityUseCase } from '@/lib/use-cases/get-availability-use-case'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

const rateLimiter = new MemoryRateLimiter()
const calendarRepo = new SupabaseCalendarRepository()
const getAvailabilityUseCase = new GetAvailabilityUseCase(calendarRepo)

export async function GET(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     '127.0.0.1'

    if (!rateLimiter.checkLimit(clientIp, 20, 60 * 1000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Reintenta en un minuto.' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || ''
    const { secretKey } = getSupabaseConfig()

    const slots = await getAvailabilityUseCase.execute(dateParam, secretKey)
    return NextResponse.json({ success: true, date: dateParam, slots }, { status: 200 })

  } catch (error: any) {
    console.error('[API AVAILABILITY ERROR]', error)
    return NextResponse.json({ error: error.message || 'Error procesando disponibilidad' }, { status: 500 })
  }
}
