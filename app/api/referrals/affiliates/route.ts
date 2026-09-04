import { NextResponse } from 'next/server'
import { SupabaseReferralRepository } from '@/lib/infrastructure/repositories/supabase-referral-repository'

const repo = new SupabaseReferralRepository()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const codigo = searchParams.get('codigo')

    if (codigo) {
      const afiliado = await repo.obtenerAfiliadoPorCodigo(codigo)
      if (!afiliado) {
        return NextResponse.json({ success: false, error: 'Afiliado no encontrado' }, { status: 404 })
      }
      return NextResponse.json({ success: true, afiliado })
    }

    const afiliados = await repo.obtenerAfiliados()
    return NextResponse.json({ success: true, afiliados })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error obteniendo afiliados' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, email, telefono, codigoDeseado, datosPago } = body

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y correo electrónico son requeridos' }, { status: 400 })
    }

    const result = await repo.crearAfiliado(nombre, email, telefono, codigoDeseado, datosPago)
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error registrando afiliado' }, { status: 500 })
  }
}
