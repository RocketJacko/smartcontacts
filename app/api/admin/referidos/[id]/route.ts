import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const updateEstadoSchema = z.object({
  estado: z.enum(['activo', 'suspendido', 'en_revision']),
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const resolvedParams = await params
    const afiliadoId = resolvedParams.id
    if (!afiliadoId) {
      return NextResponse.json({ success: false, error: 'ID de afiliado no proporcionado' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = updateEstadoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 })
    }

    const { supabase } = authCheck
    const { data, error } = await supabase!.rpc('admin_cambiar_estado_afiliado', {
      p_afiliado_id: afiliadoId,
      p_estado: parsed.data.estado,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
