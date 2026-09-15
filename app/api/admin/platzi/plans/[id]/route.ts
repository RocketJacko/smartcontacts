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
 * PATCH: Alternar vigencia de un plan u oferta especial
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { id } = await params
    const body = await request.json()
    const vigente = Boolean(body?.vigente)
    const isOffer = Boolean(body?.es_oferta_especial)
    const supabase = authCheck.supabase!

    if (isOffer) {
      const { data, error } = await supabase.rpc('admin_toggle_oferta', {
        p_id: id,
        p_activo: vigente,
      })
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data }, { status: 200 })
    }

    // Intentar toggle de oferta especial si existe en referidos
    const { data: toggleOfferData, error: toggleOfferErr } = await supabase.rpc('admin_toggle_oferta', {
      p_id: id,
      p_activo: vigente,
    })

    if (!toggleOfferErr && toggleOfferData?.success) {
      return NextResponse.json({ success: true, data: toggleOfferData }, { status: 200 })
    }

    // Si no es oferta, actualizar en platzi.planes
    const { data, error } = await supabase.rpc('admin_cambiar_vigencia_plan_platzi', {
      p_id: id,
      p_vigente: vigente,
    })

    if (error) {
      // Fallback directo sobre la tabla platzi.planes
      const { error: directErr } = await supabase
        .from('planes')
        .update({ vigente })
        .eq('id', id)
      if (directErr) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id, vigente }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al actualizar vigencia' }, { status: 500 })
  }
}

/**
 * DELETE: Eliminar plan u oferta especial
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const isOffer = searchParams.get('es_oferta_especial') === 'true'
    const supabase = authCheck.supabase!

    if (isOffer) {
      const { data, error } = await supabase.rpc('admin_eliminar_oferta', { p_id: id })
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data }, { status: 200 })
    }

    // Intentar eliminar oferta especial si coincide el id
    const { data: delOffer, error: delOfferErr } = await supabase.rpc('admin_eliminar_oferta', { p_id: id })
    if (!delOfferErr && delOffer?.success) {
      return NextResponse.json({ success: true, data: delOffer }, { status: 200 })
    }

    const { data, error } = await supabase.rpc('admin_eliminar_plan_platzi', {
      p_id: id,
    })

    if (error) {
      const { error: directErr } = await supabase.from('planes').delete().eq('id', id)
      if (directErr) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al eliminar plan' }, { status: 500 })
  }
}

