import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/infrastructure/supabase/middleware-client'

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

  // 1. Manejo de enlaces limpios /r/:codigo (Ej: /r/ALEXIS24)
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

      return response
    }
  }

  // 2. Manejo de enlaces con query param ?ref=CODIGO
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

  // 3. Sincronización y verificación de sesión con Supabase Auth
  const { user, supabaseResponse } = await updateSession(request)

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  // 4. Bloqueo de rutas protegidas para usuarios no autenticados
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

  // 5. Si el usuario ya está autenticado e intenta ir a /login o /register -> redirigir al /dashboard
  if (isAuthRoute && user) {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // 6. Inyección de Cabeceras HTTP de Seguridad Estrictas (Security Headers)
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')

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
