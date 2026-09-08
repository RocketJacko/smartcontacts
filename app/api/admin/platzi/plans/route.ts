import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PlanSchema = z.object({
  id: z.string().uuid().optional(),
  nombre_plan: z.string().min(2, 'Nombre de plan requerido'),
  meses_cubrimiento: z.number().int().min(1, 'Al menos 1 mes'),
  precio: z.number().min(0, 'Precio debe ser positivo'),
  moneda: z.string().min(2).default('COP'),
  vigente: z.boolean().default(true),
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
 * GET: Listar planes de Platzi
 */
export async function GET() {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { data, error } = await authCheck.supabase!.rpc('admin_obtener_planes_platzi')
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, planes: data || [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al obtener planes' }, { status: 500 })
  }
}

/**
 * POST: Crear o actualizar plan de Platzi
 */
export async function POST(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const parsed = PlanSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de plan inválidos',
      }, { status: 400 })
    }

    const val = parsed.data
    const { data, error } = await authCheck.supabase!.rpc('admin_guardar_plan_platzi', {
      p_id: val.id || null,
      p_nombre_plan: val.nombre_plan,
      p_meses_cubrimiento: val.meses_cubrimiento,
      p_precio: val.precio,
      p_moneda: val.moneda,
      p_vigente: val.vigente,
      p_caracteristicas: val.caracteristicas || null,
      p_total_disponibles: val.total_disponibles ?? null,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al guardar plan' }, { status: 500 })
  }
}
