import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || '').trim().toUpperCase()

    if (!rawCode) {
      return NextResponse.json({ success: false, error: 'Código de referido requerido' }, { status: 400 })
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip') ||
      '127.0.0.1'

    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 32)
    const userAgent = request.headers.get('user-agent') || 'desconocido'

    // Generar o usar token de sesión
    const tokenSesion = body?.sessionToken || `ref_${crypto.randomUUID()}`

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('registrar_clic', {
      p_codigo: rawCode,
      p_token_sesion: tokenSesion,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      data,
      sessionToken: tokenSesion,
      code: rawCode,
    })

    // Fijar cookie de atribución segura durante 45 días
    response.cookies.set('sc_ref_code', rawCode, {
      maxAge: 45 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    response.cookies.set('sc_ref_token', tokenSesion, {
      maxAge: 45 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error al procesar referido' }, { status: 500 })
  }
}
