import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const resolvedParams = await params
  const slug = resolvedParams?.slug?.trim() || ''

  const url = new URL(request.url)
  const targetUrl = new URL('/beneficios', url.origin)
  if (slug) {
    targetUrl.searchParams.set('oferta', slug.toUpperCase())
  }

  // Conservar cualquier otro query param pasado
  url.searchParams.forEach((value, key) => {
    if (key !== 'slug') {
      targetUrl.searchParams.set(key, value)
    }
  })

  return NextResponse.redirect(targetUrl, 307)
}
