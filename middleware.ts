import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
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
    const response = NextResponse.next()

    const existingToken = request.cookies.get('sc_ref_token')?.value
    const sessionToken = existingToken || crypto.randomUUID()
    const maxAge = 45 * 24 * 60 * 60 // 45 días

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

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto archivos estáticos, imágenes y llamadas internas
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
