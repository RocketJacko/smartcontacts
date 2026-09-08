import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const liquidarSchema = z.object({
  afiliado_id: z.string().uuid('ID de afiliado no válido'),
  monto: z.number().positive('El monto debe ser un número positivo'),
  metodo: z.string().optional().default('Transferencia Bancaria'),
  referencia: z.string().optional().default(''),
  notas: z.string().optional().default(''),
})

async function verificarSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, error: 'No autorizado', status: 401 }
  }

  if (user.email === 'jesus.carmona966@pascualbravo.edu.co') {
    return { authorized: true, user, supabase }
  }

  const { data: perfilData } = await supabase.rpc('obtener_mi_perfil')
  if (perfilData?.rol === 'super_admin') {
    return { authorized: true, user, supabase }
  }

  return { authorized: false, error: 'Se requiere rol de Super Administrador.', status: 403 }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const parsed = liquidarSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de liquidación inválidos',
      }, { status: 400 })
    }

    const { afiliado_id, monto, metodo, referencia, notas } = parsed.data
    const { supabase } = authCheck

    const { data, error } = await supabase!.rpc('admin_liquidar_afiliado', {
      p_afiliado_id: afiliado_id,
      p_monto: monto,
      p_metodo: metodo,
      p_referencia: referencia || null,
      p_notas: notas || null,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ success: false, error: data?.error || 'No se pudo liquidar' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Comisión liquidada exitosamente',
      data,
    }, { status: 200 })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
