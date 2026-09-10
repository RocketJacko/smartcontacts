import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function verificarSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

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

const toggleSchema = z.object({
  activo: z.boolean(),
})

const actualizarOfertaSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().optional().nullable().default(''),
  institucion_empresa: z.string().optional().nullable().default(''),
  precio_cop: z.coerce.number().positive(),
  precio_usd: z.coerce.number().positive(),
  meses_cubrimiento: z.coerce.number().int().positive().default(12),
  caracteristicas: z.array(z.string()).optional().default([]),
  afiliado_id: z.string().uuid().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  cupos_maximos: z.coerce.number().int().positive().optional().nullable(),
  tipo_pago: z.enum(['pago_unico', 'cuotas']).default('pago_unico'),
  numero_cuotas: z.coerce.number().int().positive().default(1),
  pago_anticipado: z.boolean().default(false),
})

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
    const ofertaId = resolvedParams.id
    if (!ofertaId) {
      return NextResponse.json({ success: false, error: 'ID de oferta no proporcionado' }, { status: 400 })
    }

    const body = await request.json()
    const { supabase } = authCheck

    // 1. Verificar si es una petición de conmutación rápida (toggle activo/inactivo)
    if (body && typeof body.activo === 'boolean' && Object.keys(body).length === 1) {
      const toggleParsed = toggleSchema.safeParse(body)
      if (!toggleParsed.success) {
        return NextResponse.json({ success: false, error: 'Estado booleano no válido' }, { status: 400 })
      }

      const { data, error } = await supabase!.rpc('admin_toggle_oferta', {
        p_id: ofertaId,
        p_activo: toggleParsed.data.activo,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // 2. Edición completa de datos de la oferta
    const parsed = actualizarOfertaSchema.safeParse(body)
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || 'Datos de actualización no válidos'
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 })
    }

    const d = parsed.data
    const { data, error } = await supabase!.rpc('admin_actualizar_oferta', {
      p_id: ofertaId,
      p_titulo: d.titulo.trim(),
      p_descripcion: d.descripcion || '',
      p_institucion_empresa: d.institucion_empresa || '',
      p_precio_cop: d.precio_cop,
      p_precio_usd: d.precio_usd,
      p_meses_cubrimiento: d.meses_cubrimiento,
      p_caracteristicas: d.caracteristicas,
      p_afiliado_id: d.afiliado_id || null,
      p_fecha_fin: d.fecha_fin || null,
      p_cupos_maximos: d.cupos_maximos || null,
      p_tipo_pago: d.tipo_pago,
      p_numero_cuotas: d.numero_cuotas,
      p_pago_anticipado: d.pago_anticipado,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const resolvedParams = await params
    const ofertaId = resolvedParams.id
    if (!ofertaId) {
      return NextResponse.json({ success: false, error: 'ID de oferta no proporcionado' }, { status: 400 })
    }

    const { supabase } = authCheck
    const { data, error } = await supabase!.rpc('admin_eliminar_oferta', {
      p_id: ofertaId,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
