import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PlanSchema = z.object({
  id: z.string().optional().nullable(),
  nombre_plan: z.string().min(2, 'Nombre de plan requerido'),
  meses_cubrimiento: z.number().int().min(1, 'Al menos 1 mes'),
  precio: z.number().min(0, 'Precio debe ser positivo'),
  moneda: z.string().min(2).default('COP'),
  tipo_pago: z.enum(['pago_unico', 'cuotas']).default('pago_unico'),
  numero_cuotas: z.number().int().min(1).default(1),
  admite_cuotas: z.boolean().default(false),
  max_cuotas: z.number().int().min(1).default(1),
  pago_anticipado: z.boolean().default(false),
  vigente: z.boolean().default(true),
  es_oferta_especial: z.boolean().default(false),
  codigo_oferta: z.string().optional().nullable(),
  institucion_empresa: z.string().optional().nullable(),
  cupos_maximos: z.number().int().nullable().optional(),
  caracteristicas: z.string().optional().default(''),
  total_disponibles: z.number().int().nullable().optional(),
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

/**
 * GET: Listar catálogo unificado de planes de Platzi (Planes Estándar + Ofertas Especiales)
 */
export async function GET() {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const supabase = authCheck.supabase!

    // 1. Obtener planes estándar desde platzi.planes
    const { data: planesEstandar, error: errorPlanes } = await supabase.rpc('admin_obtener_planes_platzi')

    // 2. Obtener ofertas especiales desde referidos.ofertas_especiales
    const { data: ofertasEspeciales, error: errorOfertas } = await supabase.rpc('admin_listar_ofertas')

    const planesMapeados: any[] = []

    // Mapear planes estándar
    if (Array.isArray(planesEstandar)) {
      planesEstandar.forEach((p: any) => {
        planesMapeados.push({
          id: p.id,
          nombre_plan: p.nombre_plan,
          meses_cubrimiento: Number(p.meses_cubrimiento) || 6,
          precio: Number(p.precio) || 0,
          moneda: p.moneda || 'COP',
          vigente: Boolean(p.vigente),
          caracteristicas: p.caracteristicas || '',
          total_disponibles: p.total_disponibles ?? null,
          tipo_pago: 'pago_unico',
          numero_cuotas: 1,
          admite_cuotas: false,
          max_cuotas: 1,
          pago_anticipado: false,
          es_oferta_especial: false,
          codigo_oferta: null,
          institucion_empresa: null,
          cupos_maximos: null,
          cupos_usados: 0,
          created_at: p.created_at || new Date().toISOString(),
        })
      })
    }

    // Mapear ofertas especiales como planes unificados
    if (Array.isArray(ofertasEspeciales)) {
      ofertasEspeciales.forEach((o: any) => {
        planesMapeados.push({
          id: o.id,
          nombre_plan: o.titulo,
          meses_cubrimiento: Number(o.meses_cubrimiento) || 12,
          precio: Number(o.precio_cop) || 0,
          moneda: 'COP',
          vigente: Boolean(o.activo),
          caracteristicas: o.descripcion || '',
          total_disponibles: o.cupos_maximos ?? null,
          tipo_pago: 'pago_unico',
          numero_cuotas: 1,
          admite_cuotas: false,
          max_cuotas: 1,
          pago_anticipado: true,
          es_oferta_especial: true,
          codigo_oferta: o.codigo_oferta,
          institucion_empresa: o.institucion_empresa,
          cupos_maximos: o.cupos_maximos ?? null,
          cupos_usados: o.cupos_usados || 0,
          created_at: o.creado_en || new Date().toISOString(),
        })
      })
    }

    return NextResponse.json({
      success: true,
      planes: planesMapeados,
      total: planesMapeados.length,
      total_estandar: Array.isArray(planesEstandar) ? planesEstandar.length : 0,
      total_ofertas: Array.isArray(ofertasEspeciales) ? ofertasEspeciales.length : 0,
    }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al obtener planes unificados' }, { status: 500 })
  }
}

/**
 * POST: Crear o actualizar plan de Platzi u oferta especial unificada
 */
export async function POST(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const supabase = authCheck.supabase!
    const body = await request.json()
    const parsed = PlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de plan inválidos',
      }, { status: 400 })
    }

    const val = parsed.data

    // ── Caso A: Es Oferta Especial / Convenio ──────────────────────────────────
    if (val.es_oferta_especial) {
      const cleanCode = (val.codigo_oferta || '').trim().toUpperCase()
      if (!cleanCode) {
        return NextResponse.json({
          success: false,
          error: 'Las ofertas especiales requieren un código de oferta (ej. PYTHONCODE).',
        }, { status: 400 })
      }

      if (val.id) {
        // Actualizar oferta existente
        const { data, error } = await supabase.rpc('admin_actualizar_oferta', {
          p_id: val.id,
          p_titulo: val.nombre_plan,
          p_descripcion: val.caracteristicas || '',
          p_institucion_empresa: val.institucion_empresa || '',
          p_precio_cop: val.precio,
          p_precio_usd: Math.round(val.precio / 4000) || 24,
          p_meses_cubrimiento: val.meses_cubrimiento,
          p_caracteristicas: [],
          p_afiliado_id: null,
          p_fecha_fin: null,
          p_cupos_maximos: val.cupos_maximos ?? null,
        })

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Asegurar vigencia
        await supabase.rpc('admin_toggle_oferta', {
          p_id: val.id,
          p_activo: val.vigente,
        })

        return NextResponse.json({ success: true, id: val.id, es_oferta_especial: true }, { status: 200 })
      } else {
        // Crear nueva oferta
        const { data, error } = await supabase.rpc('admin_crear_oferta', {
          p_codigo_oferta: cleanCode,
          p_titulo: val.nombre_plan,
          p_descripcion: val.caracteristicas || '',
          p_institucion_empresa: val.institucion_empresa || '',
          p_precio_cop: val.precio,
          p_precio_usd: Math.round(val.precio / 4000) || 24,
          p_meses_cubrimiento: val.meses_cubrimiento,
          p_caracteristicas: [],
          p_afiliado_id: null,
          p_fecha_fin: null,
          p_cupos_maximos: val.cupos_maximos ?? null,
        })

        if (error) {
          return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        if (data && data.success === false) {
          return NextResponse.json({ success: false, error: data.error }, { status: 400 })
        }

        return NextResponse.json({ success: true, data, es_oferta_especial: true }, { status: 200 })
      }
    }

    // ── Caso B: Es Plan Estándar en platzi.planes ──────────────────────────────
    const { data, error } = await supabase.rpc('admin_guardar_plan_platzi', {
      p_id: val.id || null,
      p_nombre_plan: val.nombre_plan,
      p_meses_cubrimiento: val.meses_cubrimiento,
      p_precio: val.precio,
      p_moneda: val.moneda,
      p_tipo_pago: val.tipo_pago,
      p_numero_cuotas: val.numero_cuotas,
      p_pago_anticipado: val.pago_anticipado,
      p_vigente: val.vigente,
      p_caracteristicas: val.caracteristicas || null,
      p_total_disponibles: val.total_disponibles ?? null,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data, es_oferta_especial: false }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al guardar plan' }, { status: 500 })
  }
}

/**
 * PATCH: Alternar vigencia de un plan u oferta especial
 */
export async function PATCH(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const supabase = authCheck.supabase!
    const body = await request.json()
    const { id, vigente, es_oferta_especial } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (es_oferta_especial) {
      const { data, error } = await supabase.rpc('admin_toggle_oferta', {
        p_id: id,
        p_activo: Boolean(vigente),
      })
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data }, { status: 200 })
    } else {
      const { error } = await supabase
        .from('planes')
        .update({ vigente: Boolean(vigente), updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        // Fallback a SQL si el schema no está expuesto directamente
        const { error: rpcError } = await supabase.rpc('admin_guardar_plan_platzi', {
          p_id: id,
          p_vigente: Boolean(vigente),
        })
        if (rpcError) return NextResponse.json({ success: false, error: rpcError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, id, vigente: Boolean(vigente) }, { status: 200 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al cambiar vigencia' }, { status: 500 })
  }
}

/**
 * DELETE: Eliminar plan u oferta especial
 */
export async function DELETE(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const supabase = authCheck.supabase!
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const isOffer = searchParams.get('es_oferta_especial') === 'true'

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 })
    }

    if (isOffer) {
      const { data, error } = await supabase.rpc('admin_eliminar_oferta', { p_id: id })
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, data }, { status: 200 })
    } else {
      const { error } = await supabase.from('planes').delete().eq('id', id)
      if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      return NextResponse.json({ success: true }, { status: 200 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al eliminar plan' }, { status: 500 })
  }
}

