import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const updateEstadoSchema = z.object({
  estado: z.enum(['activo', 'suspendido', 'en_revision']),
})

const updateAfiliadoSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  telefono: z.string().nullable().optional(),
  banco: z.string().nullable().optional().default('Bancolombia'),
  tipo_cuenta: z.string().nullable().optional().default('ahorros'),
  numero_cuenta: z.string().nullable().optional(),
  titular_cuenta: z.string().nullable().optional(),
  numero_documento: z.string().nullable().optional(),
})

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
    const { supabase } = authCheck

    // Caso 1: Cambio de estado rápido (activo, suspendido, en_revision)
    if (body && body.estado && !body.nombre) {
      const parsed = updateEstadoSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'Estado no válido' }, { status: 400 })
      }

      const { data, error } = await supabase!.rpc('admin_cambiar_estado_afiliado', {
        p_afiliado_id: afiliadoId,
        p_estado: parsed.data.estado,
      })

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, data })
    }

    // Caso 2: Edición integral de datos de contacto y datos bancarios
    const parsedEdit = updateAfiliadoSchema.safeParse(body)
    if (!parsedEdit.success) {
      const err = parsedEdit.error.issues?.[0]?.message || 'Datos no válidos'
      return NextResponse.json({ success: false, error: err }, { status: 400 })
    }

    const d = parsedEdit.data
    const { data, error } = await supabase!.rpc('admin_actualizar_afiliado', {
      p_afiliado_id: afiliadoId,
      p_nombre: d.nombre.trim(),
      p_email: d.email.trim(),
      p_telefono: d.telefono || null,
      p_banco: d.banco || 'Bancolombia',
      p_tipo_cuenta: d.tipo_cuenta || 'ahorros',
      p_numero_cuenta: d.numero_cuenta || null,
      p_titular_cuenta: d.titular_cuenta || d.nombre.trim(),
      p_numero_documento: d.numero_documento || '0',
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error del servidor' }, { status: 500 })
  }
}
