import { NextResponse } from 'next/server'

// IP Rate Limiter (30 reqs / 60s per IP)
const ipMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 30
const WINDOW_MS = 60 * 1000

// In-Memory Cache (5 min TTL)
let cacheData: any = null
let cacheTime = 0
const CACHE_TTL_MS = 5 * 60 * 1000

export async function GET(request: Request) {
  try {
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
        { error: 'Demasiadas solicitudes. Por favor reintenta en un minuto.' },
        { status: 429 }
      )
    }

    // Return memory cached data if valid
    if (cacheData && (now - cacheTime) < CACHE_TTL_MS) {
      return NextResponse.json(cacheData, { status: 200 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs'

    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/obtener_cobertura`
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[SUPABASE RPC COBERTURA ERROR]', response.status, await response.text())
      return NextResponse.json({ error: 'Error consultando datos de cobertura' }, { status: 500 })
    }

    const departamentos: Array<{
      departamento: string
      personas_naturales: number
      personas_juridicas: number
      total: number
      naturales_camaras: number
      naturales_libranza: number
    }> = await response.json()

    // Calculate aggregated totals
    let totalNaturales = 0
    let totalJuridicas = 0
    let totalPersonas = 0

    departamentos.forEach((d) => {
      totalNaturales += Number(d.personas_naturales || 0)
      totalJuridicas += Number(d.personas_juridicas || 0)
      totalPersonas += Number(d.total || 0)
    })

    const payload = {
      success: true,
      totales: {
        personas_naturales: totalNaturales,
        personas_juridicas: totalJuridicas,
        total_personas: totalPersonas,
      },
      departamentos,
    }

    // Update memory cache
    cacheData = payload
    cacheTime = now

    return NextResponse.json(payload, { status: 200 })

  } catch (error) {
    console.error('[API COVERAGE ROUTE ERROR]', error)
    return NextResponse.json({ error: 'Error inesperado consultando cobertura' }, { status: 500 })
  }
}
