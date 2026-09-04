import { NextResponse } from 'next/server'
import { SupabaseReferralRepository } from '@/lib/infrastructure/repositories/supabase-referral-repository'

const repo = new SupabaseReferralRepository()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { codigo, tokenSesion, ipHash } = body

    if (!codigo || !tokenSesion) {
      return NextResponse.json({ success: false, error: 'Código y token de sesión requeridos' }, { status: 400 })
    }

    const userAgent = request.headers.get('user-agent') || 'desconocido'
    const result = await repo.registrarClic(codigo, tokenSesion, ipHash, userAgent)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error registrando clic' }, { status: 500 })
  }
}
