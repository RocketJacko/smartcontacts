import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'
import { checkRateLimit, recordFailedAttempt, recordSuccessfulAttempt } from '@/lib/auth/rate-limiter'

const loginSchema = z.object({
  email: z.string().email('Formato de correo electrónico inválido').toLowerCase().trim(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1'

    // 1. Control de Rate Limiting (Anti-Fuerza Bruta)
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfterSeconds || 60) / 60)
      return NextResponse.json({
        success: false,
        error: `Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente por seguridad. Intenta nuevamente en ${minutes} minuto(s).`,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      }, {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.retryAfterSeconds || 900) },
      })
    }

    // 2. Validación de Entrada Estricta con Zod (Anti-Inyección)
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: parsed.error.errors[0]?.message || 'Datos de inicio de sesión inválidos',
      }, { status: 400 })
    }

    const { email, password } = parsed.data

    // 3. Autenticación con Supabase Auth
    const supabase = await createServerSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      const failed = recordFailedAttempt(ip)
      const attemptsLeft = failed.remainingAttempts

      // Registrar auditoría persistente en PostgreSQL (seguridad.intentos_login)
      try {
        await supabase.rpc('registrar_intento_login', {
          p_ip: ip,
          p_email: email,
          p_exitoso: false,
          p_user_agent: request.headers.get('user-agent') || 'desconocido',
        })
      } catch {}

      const errorMsg = attemptsLeft > 0
        ? `Credenciales incorrectas. Te quedan ${attemptsLeft} intento(s) antes del bloqueo temporal.`
        : 'Has superado el límite de intentos. Acceso bloqueado por 15 minutos.'

      return NextResponse.json({
        success: false,
        error: errorMsg,
        remainingAttempts: attemptsLeft,
      }, { status: 401 })
    }

    // 4. Éxito: Limpiar historial de intentos en memoria y en PostgreSQL
    recordSuccessfulAttempt(ip)
    try {
      await supabase.rpc('registrar_intento_login', {
        p_ip: ip,
        p_email: email,
        p_exitoso: true,
        p_user_agent: request.headers.get('user-agent') || 'desconocido',
      })
    } catch {}

    // 5. Obtener Perfil y Rol desde seguridad.perfiles vía RPC segura
    const { data: perfilData } = await supabase.rpc('obtener_mi_perfil')
    await supabase.rpc('registrar_login_exitoso', { p_user_id: authData.user.id })

    const perfil = perfilData && !perfilData.error ? perfilData : {
      id: authData.user.id,
      email: authData.user.email,
      rol: email === 'jesus.carmona966@pascualbravo.edu.co' ? 'super_admin' : 'user',
      nombre: authData.user.user_metadata?.nombre || email.split('@')[0],
    }

    return NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: perfil.id,
        email: perfil.email,
        nombre: perfil.nombre,
        rol: perfil.rol,
      },
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error interno de autenticación',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    }, { status: 500 })
  }
}
