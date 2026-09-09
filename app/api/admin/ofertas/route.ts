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

const crearOfertaSchema = z.object({
  codigo_oferta: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(50, 'El código no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'El código solo puede contener letras, números, guiones y guiones bajos'),
  titulo: z.string().min(3, 'El título es requerido'),
  descripcion: z.string().optional().nullable().default(''),
  institucion_empresa: z.string().optional().nullable().default(''),
  precio_cop: z.coerce.number().positive('El precio en COP debe ser mayor a 0'),
  precio_usd: z.coerce.number().positive('El precio en USD debe ser mayor a 0'),
  meses_cubrimiento: z.coerce.number().int().positive().default(12),
  caracteristicas: z.array(z.string()).optional().default([]),
  afiliado_id: z.string().uuid().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  cupos_maximos: z.coerce.number().int().positive().optional().nullable(),
})

export async function GET() {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { supabase } = authCheck
    const { data, error } = await supabase!.rpc('admin_listar_ofertas')

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        ofertas: Array.isArray(data) ? data : [],
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const parsed = crearOfertaSchema.safeParse(body)

    if (!parsed.success) {
      const errorDetail = parsed.error.issues?.[0]?.message || 'Datos de oferta no válidos'
      return NextResponse.json({ success: false, error: errorDetail }, { status: 400 })
    }

    const { supabase } = authCheck
    const dataToSend = parsed.data

    const { data, error } = await supabase!.rpc('admin_crear_oferta', {
      p_codigo_oferta: dataToSend.codigo_oferta.toUpperCase().trim(),
      p_titulo: dataToSend.titulo.trim(),
      p_descripcion: dataToSend.descripcion || '',
      p_institucion_empresa: dataToSend.institucion_empresa || '',
      p_precio_cop: dataToSend.precio_cop,
      p_precio_usd: dataToSend.precio_usd,
      p_meses_cubrimiento: dataToSend.meses_cubrimiento,
      p_caracteristicas: dataToSend.caracteristicas,
      p_afiliado_id: dataToSend.afiliado_id || null,
      p_fecha_fin: dataToSend.fecha_fin || null,
      p_cupos_maximos: dataToSend.cupos_maximos || null,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ success: false, error: data?.error || 'Error al registrar oferta' }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
