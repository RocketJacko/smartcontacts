import { NextResponse } from 'next/server'
import crypto from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs'
const SECRET_KEY = process.env.CHECK_DOMAIN_SECRET || 'smartcontacts-booking-secret-2026'

// IP Rate Limiter (15 reqs / 60s per IP)
const ipMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 20
const WINDOW_MS = 60 * 1000

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // YYYY-MM-DD

    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json({ error: 'Fecha inválida (YYYY-MM-DD requerida)' }, { status: 400 })
    }

    // IP Rate Limit check
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1'

    const now = Date.now()
    const rateData = ipMap.get(clientIp) || { count: 0, resetTime: now + WINDOW_MS }

    if (now > rateData.resetTime) {
      rateData.count = 1
      rateData.resetTime = now + WINDOW_MS
    } else {
      rateData.count += 1
    }
    ipMap.set(clientIp, rateData)

    if (rateData.count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Demasiadas peticiones. Intenta en un minuto.' },
        { status: 429 }
      )
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Falta configuración de Supabase' }, { status: 500 })
    }

    // Invoke PL/pgSQL function obtener_disponibilidad via Supabase REST RPC
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/obtener_disponibilidad`
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_fecha: dateParam }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[SUPABASE RPC AVAILABILITY ERROR]', response.status, await response.text())
      return NextResponse.json({ error: 'Error consultando disponibilidad en base de datos' }, { status: 500 })
    }

    const rawSlots: Array<{ slot: string; status: string; label: string }> = await response.json()

    // Sign each available slot with an ephemeral 5-minute transactional token
    const signedSlots = rawSlots.map((item) => {
      if (item.status === 'disponible') {
        const payloadStr = JSON.stringify({
          slot: item.slot,
          date: dateParam,
          exp: now + 5 * 60 * 1000, // 5 min TTL
        })
        const signature = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex')
        const bookingToken = Buffer.from(`${payloadStr}|${signature}`).toString('base64')

        return {
          ...item,
          bookingToken,
        }
      }
      return item
    })

    return NextResponse.json({
      success: true,
      date: dateParam,
      slots: signedSlots,
    })

  } catch (error) {
    console.error('[API AVAILABILITY ROUTE ERROR]', error)
    return NextResponse.json({ error: 'Error procesando solicitud de disponibilidad' }, { status: 500 })
  }
}
