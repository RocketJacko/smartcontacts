import { NextResponse } from 'next/server'
import { SupabaseReferralRepository } from '@/lib/infrastructure/repositories/supabase-referral-repository'

const repo = new SupabaseReferralRepository()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { afiliadoId, monto, referenciaBancaria, comprobanteUrl } = body

    if (!afiliadoId || !monto || !referenciaBancaria) {
      return NextResponse.json(
        { success: false, error: 'afiliadoId, monto y referenciaBancaria son obligatorios' },
        { status: 400 }
      )
    }

    const result = await repo.liquidarAfiliado(afiliadoId, Number(monto), referenciaBancaria, comprobanteUrl)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Liquidación procesada correctamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error procesando liquidación' }, { status: 500 })
  }
}
