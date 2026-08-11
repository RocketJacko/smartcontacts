import { NextResponse } from 'next/server'

const SUPABASE_EDGE_URL = process.env.SUPABASE_EDGE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co/functions/v1/check-domain'
const INTERNAL_APP_SECRET = process.env.CHECK_DOMAIN_SECRET || 'smartcontacts-internal-edge-secret-2026'

// Server-side IP Rate Limiting (High threshold for reverse proxy compatibility)
const ipCache = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 500
const WINDOW_MS = 60 * 1000

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
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

    // Fallback to valid: true if rate limited to prevent blocking real users
    if (rateData.count > RATE_LIMIT_MAX) {
      console.warn('[RATE LIMIT EXCEEDED FOR IP]', clientIp)
      return NextResponse.json({ valid: true, message: 'Permitido por fallback' }, { status: 200 })
    }

    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { valid: true, message: 'Formato inerte' },
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
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[EDGE FUNCTION HTTP WARNING]', response.status)
      // Fail-open: if Edge Function errors, allow user to proceed
      return NextResponse.json({ valid: true, message: 'Fail-open' }, { status: 200 })
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('[API CHECK DOMAIN PROXY ERROR]', error)
    // Fail-open: do not block legitimate users if API fails
    return NextResponse.json({ valid: true, message: 'Fail-open' }, { status: 200 })
  }
}
