import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'
import { verificarDominioCorreoValido } from '@/lib/email-validator'

const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').trim(),
  email: z.string().email('Formato de correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de registro inválidos',
      }, { status: 400 })
    }

    const { nombre, email, password } = parsed.data

    // 1. Verificación estricta contra dominios desechables/spam (119.905 dominios)
    const domainCheck = await verificarDominioCorreoValido(email)
    if (!domainCheck.valid) {
      return NextResponse.json({
        success: false,
        error: domainCheck.reason || 'El dominio de correo no está permitido para registro.',
      }, { status: 400 })
    }

    // 2. Registro a través del suite oficial de Supabase Auth
    const supabase = await createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
        },
      },
    })

    if (authError) {
      return NextResponse.json({
        success: false,
        error: authError.message || 'Error al registrar el usuario en Supabase Auth',
      }, { status: 400 })
    }

    // El trigger en PostgreSQL (seguridad.handle_new_user) aprovisiona automáticamente el perfil en seguridad.perfiles
    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        nombre,
        rol: email === 'jesus.carmona966@pascualbravo.edu.co' ? 'super_admin' : 'user',
      },
    }, { status: 201 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error interno en el proceso de registro',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    }, { status: 500 })
  }
}
