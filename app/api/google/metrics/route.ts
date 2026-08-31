import { NextResponse } from 'next/server'
import { fetchGoogleMetrics } from '@/lib/infrastructure/google/google-metrics-service'

export async function GET() {
  try {
    const data = await fetchGoogleMetrics()
    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Error consultando métricas de Google' },
      { status: 500 }
    )
  }
}
