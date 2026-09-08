import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Esquema de validación para nuevo revendedor / afiliado
const nuevoAfiliadoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  email: z.string().email('Correo electrónico no válido').toLowerCase().trim(),
  telefono: z.string().optional().default(''),
  codigo_deseado: z.string().optional().transform(v => (v ? v.trim().toUpperCase() : undefined)),
  banco: z.string().optional().default('Bancolombia'),
  tipo_cuenta: z.enum(['ahorros', 'corriente', 'billetera_digital']).optional().default('ahorros'),
  numero_cuenta: z.string().optional().default(''),
  titular_cuenta: z.string().optional().default(''),
  numero_documento: z.string().optional().default('0'),
})

/**
 * Validador de sesión y rol Super Admin
 */
async function verificarSuperAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, error: 'No autorizado', status: 401 }
  }

  // Comprobación de rol de Super Admin
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
 * GET: Obtener lista completa de revendedores con enlaces, métricas y saldos
 */
export async function GET() {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const { supabase } = authCheck
    const { data, error } = await supabase!.rpc('admin_obtener_afiliados')

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      afiliados: data || [],
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}

/**
 * POST: Crear un nuevo revendedor con su código y enlace oficial
 */
export async function POST(request: Request) {
  try {
    const authCheck = await verificarSuperAdmin()
    if (!authCheck.authorized) {
      return NextResponse.json({ success: false, error: authCheck.error }, { status: authCheck.status })
    }

    const body = await request.json()
    const parsed = nuevoAfiliadoSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de formulario inválidos',
      }, { status: 400 })
    }

    const {
      nombre,
      email,
      telefono,
      codigo_deseado,
      banco,
      tipo_cuenta,
      numero_cuenta,
      titular_cuenta,
      numero_documento,
    } = parsed.data

    const { supabase } = authCheck
    const { data, error } = await supabase!.rpc('crear_afiliado_con_enlace', {
      p_nombre: nombre,
      p_email: email,
      p_telefono: telefono || null,
      p_codigo_deseado: codigo_deseado || null,
      p_banco: banco,
      p_tipo_cuenta: tipo_cuenta,
      p_numero_cuenta: numero_cuenta || null,
      p_titular_cuenta: titular_cuenta || nombre,
      p_numero_documento: numero_documento || '0',
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({ success: false, error: data?.error || 'No se pudo crear el revendedor' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Revendedor creado exitosamente',
      afiliado: data,
    }, { status: 201 })

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error interno al crear revendedor' }, { status: 500 })
  }
}
