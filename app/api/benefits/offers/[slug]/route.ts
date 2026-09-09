import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    const slug = resolvedParams?.slug?.trim()

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Código de oferta no proporcionado' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc('obtener_oferta_publica', {
      p_codigo: slug,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.success === false) {
      return NextResponse.json(
        {
          success: false,
          valida: false,
          motivo: data?.motivo || 'no_encontrada',
          error: data?.error || 'Oferta no encontrada',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error del servidor' },
      { status: 500 }
    )
  }
}
