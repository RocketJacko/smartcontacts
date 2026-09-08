import { NextResponse } from 'next/server'
import { z } from 'zod'
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
 * PATCH: Alternar vigencia de un plan
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { id } = params
    const body = await request.json()
    const vigente = Boolean(body?.vigente)

    const { data, error } = await authCheck.supabase!.rpc('admin_cambiar_vigencia_plan_platzi', {
      p_id: id,
      p_vigente: vigente,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al actualizar vigencia' }, { status: 500 })
  }
}

/**
 * DELETE: Eliminar plan
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { id } = params
    const { data, error } = await authCheck.supabase!.rpc('admin_eliminar_plan_platzi', {
      p_id: id,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al eliminar plan' }, { status: 500 })
  }
}
