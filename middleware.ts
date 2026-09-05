import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/infrastructure/supabase/middleware-client'
import { isIpOrDeviceBanned } from '@/lib/auth/banned-cache'

/**
 * Rutas que requieren autenticación estricta (Páginas y APIs internas)
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/referidos',
  '/api/dashboard',
  '/api/email',
  '/api/google',
  '/api/calendar',
  '/api/settings',
]

/**
 * Rutas de autenticación pública (login, register)
 */
const AUTH_ROUTES = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1'

  // 1. Identificador Persistente de Dispositivo (Supercookie sc_device_id)
  let deviceId = request.cookies.get('sc_device_id')?.value
  const hasExistingDeviceId = Boolean(deviceId)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
  }

  // 2. Control Inmediato de Baneo por IP y por Dispositivo (Cero Excepción)
  const banStatus = await isIpOrDeviceBanned(ip, deviceId)
  if (banStatus.baneado) {
    return new NextResponse(
      JSON.stringify({
        error: 'Acceso bloqueado permanentemente por motivos de seguridad a esta red o dispositivo (Código 403-BANNED).',
        motivo: banStatus.motivo,
        incidente: crypto.randomUUID(),
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Incident': 'BANNED_IP_OR_DEVICE',
        },
      }
    )
  }

  // 3. Manejo de enlaces limpios de referidos /r/:codigo (Ej: /r/ALEXIS24)
  if (pathname.startsWith('/r/')) {
    const segments = pathname.split('/').filter(Boolean)
    const referralCode = segments[1]

    if (referralCode) {
      const destination = new URL('/#agendar', request.url)
      destination.searchParams.set('ref', referralCode)

      const response = NextResponse.redirect(destination)
      const sessionToken = request.cookies.get('sc_ref_token')?.value || crypto.randomUUID()
      const maxAge = 45 * 24 * 60 * 60 // 45 días

      response.cookies.set('sc_ref_token', sessionToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge,
      })

      response.cookies.set('sc_ref_code', referralCode.toUpperCase(), {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge,
      })

      if (!hasExistingDeviceId) {
        response.cookies.set('sc_device_id', deviceId, {
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 365 * 24 * 60 * 60, // 10 años
        })
      }

      return response
    }
  }

  // 4. Manejo de enlaces con query param ?ref=CODIGO
  const refParam = searchParams.get('ref')
  if (refParam) {
    const cleanCode = refParam.trim().toUpperCase()
    const existingToken = request.cookies.get('sc_ref_token')?.value
    const sessionToken = existingToken || crypto.randomUUID()
    const maxAge = 45 * 24 * 60 * 60 // 45 días

    const response = NextResponse.next()
    response.cookies.set('sc_ref_token', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
    })

    response.cookies.set('sc_ref_code', cleanCode, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
    })
  }

  // 5. Sincronización y verificación de sesión con Supabase Auth
  const { user, supabaseResponse } = await updateSession(request)

  // Asegurar persistencia de la supercookie de dispositivo en la respuesta
  if (!hasExistingDeviceId) {
    supabaseResponse.cookies.set('sc_device_id', deviceId, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 365 * 24 * 60 * 60, // 10 años
    })
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  // 6. Bloqueo de rutas protegidas para usuarios no autenticados
  if (isProtected && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado. Se requiere iniciar sesión.',
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer error="invalid_token"',
          },
        }
      )
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 7. Si el usuario ya está autenticado e intenta ir a /login o /register -> redirigir al /dashboard
  if (isAuthRoute && user) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 8. Inyección de Cabeceras HTTP de Seguridad Estrictas (Enterprise Grade / OWASP Top 10)
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  )
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://dns.google https://*.googleapis.com; frame-ancestors 'none';"
  )

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto archivos estáticos, imágenes y llamadas internas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
