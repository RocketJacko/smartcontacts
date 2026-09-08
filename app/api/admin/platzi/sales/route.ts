import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

/**
 * GET: Obtener lista completa de ventas Platzi
 */
export async function GET() {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { data, error } = await authCheck.supabase!.rpc('admin_obtener_ventas_platzi')
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ventas: data || [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al obtener ventas' }, { status: 500 })
  }
}

/**
 * PATCH: Actualizar estado de una venta (cuenta_activa, cod_canjeado)
 */
export async function PATCH(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const { ventaId, cuentaActiva, codCanjeado } = body

    if (!ventaId) {
      return NextResponse.json({ success: false, error: 'ID de venta requerido' }, { status: 400 })
    }

    const { data, error } = await authCheck.supabase!.rpc('admin_actualizar_estado_venta_platzi', {
      p_venta_id: ventaId,
      p_cuenta_activa: Boolean(cuentaActiva),
      p_cod_canjeado: Boolean(codCanjeado),
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al actualizar venta' }, { status: 500 })
  }
}
