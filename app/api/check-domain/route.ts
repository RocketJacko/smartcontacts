import { NextResponse } from 'next/server'

const SUPABASE_EDGE_URL = process.env.SUPABASE_EDGE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co/functions/v1/check-domain'
const INTERNAL_APP_SECRET = process.env.CHECK_DOMAIN_SECRET || 'smartcontacts-internal-edge-secret-2026'

// Server-side IP Rate Limiting (15 reqs / 60s per IP)
const ipCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 15
const WINDOW_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1'

    const now = Date.now()
    const rateData = ipCache.get(clientIp) || { count: 0, resetTime: now + WINDOW_MS }

    if (now > rateData.resetTime) {
      rateData.count = 1
      rateData.resetTime = now + WINDOW_MS
    } else {
      rateData.count += 1
    }
    ipCache.set(clientIp, rateData)

    if (rateData.count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { valid: false, message: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { valid: false, message: 'Email no aceptado' },
        { status: 200 }
      )
    }

    // Call Supabase Edge Function with internal secret header
    const response = await fetch(SUPABASE_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-secret': INTERNAL_APP_SECRET,
      },
      body: JSON.stringify({ email }),
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => null)
      if (response.status === 401) {
        console.error('[SECURITY ALERT] Unauthorized call to Edge Function')
      }
      return NextResponse.json(
        { valid: false, message: errData?.message || 'Email no aceptado' },
        { status: 200 }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('[API CHECK DOMAIN PROXY ERROR]', error)
    return NextResponse.json(
      { valid: false, message: 'Email no aceptado' },
      { status: 200 }
    )
  }
}
