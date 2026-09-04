import { NextResponse } from 'next/server'
import { SupabaseReferralRepository } from '@/lib/infrastructure/repositories/supabase-referral-repository'

const repo = new SupabaseReferralRepository()

export async function GET() {
  try {
    const conversiones = await repo.obtenerConversiones()
    return NextResponse.json({ success: true, conversiones })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error obteniendo conversiones' }, { status: 500 })
  }
}

/**
 * Atribución manual B2B: Vincula un prospecto a un afiliado desde el CRM.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      afiliadoId,
      prospectoId,
      monto = 0,
      motivo = 'Atribución comercial manual',
      tipoComision = 'monto_fijo',
      porcentaje = 0,
      valorComision = 0,
      autor = 'Admin Smartcontacts',
    } = body

    if (!afiliadoId || !prospectoId) {
      return NextResponse.json({ success: false, error: 'afiliadoId y prospectoId son obligatorios' }, { status: 400 })
    }

    const result = await repo.atribucionManual(
      afiliadoId,
      prospectoId,
      Number(monto),
      motivo,
      tipoComision,
      Number(porcentaje),
      Number(valorComision),
      autor
    )

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Atribución manual registrada exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error en atribución manual' }, { status: 500 })
  }
}
