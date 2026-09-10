import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Planes por defecto como fallback seguro en caso de contingencia
const DEFAULT_PLANS = [
  {
    id: 'cc7a5125-02a8-44d7-92b5-9e6ef4dca49f',
    nombre_plan: 'Plan 6 Meses',
    meses_cubrimiento: 6,
    precio: 95000,
    moneda: 'COP',
    vigente: true,
    caracteristicas: 'Acceso completo a la plataforma Platzi por 6 meses',
    total_disponibles: null,
  },
  {
    id: 'b381bcfd-53f5-4ef3-b5d6-6c5863bb3450',
    nombre_plan: 'Plan 12 Meses Pago Único',
    meses_cubrimiento: 12,
    precio: 180000,
    moneda: 'COP',
    vigente: true,
    caracteristicas: 'Suscripción anual con tarifa preferencial y soporte continuo',
    total_disponibles: null,
  },
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = (
      searchParams.get('code') ||
      searchParams.get('oferta') ||
      searchParams.get('convenio') ||
      searchParams.get('ref') ||
      searchParams.get('referido') ||
      ''
    ).trim().toUpperCase()

    const supabase = await createServerSupabaseClient()

    // 1. Si hay un código, verificar si corresponde a una oferta especial activa en referidos.ofertas_especiales
    if (code) {
      const { data: offerData } = await supabase.rpc('obtener_oferta_publica', {
        p_codigo: code,
      })

      if (offerData?.success && offerData?.valida && offerData?.oferta) {
        const off = offerData.oferta
        const offerPlan = {
          id: `offer-${off.id}`,
          nombre_plan: off.titulo,
          meses_cubrimiento: off.meses_cubrimiento,
          precio: Number(off.precio_cop),
          moneda: 'COP',
          tipo_pago: off.tipo_pago || 'pago_unico',
          numero_cuotas: off.numero_cuotas || 1,
          pago_anticipado: Boolean(off.pago_anticipado),
          vigente: true,
          caracteristicas:
            off.descripcion ||
            (off.institucion_empresa ? `Convenio especial ${off.institucion_empresa}` : 'Plan exclusivo de convenio'),
          codigo_oferta: off.codigo_oferta,
          codigo_referido: off.codigo_referido,
          institucion_empresa: off.institucion_empresa,
        }

        return NextResponse.json(
          {
            success: true,
            tipo: 'oferta_especial',
            codigo: code,
            oferta: off,
            planes: [offerPlan],
          },
          { status: 200 }
        )
      }
    }

    // 2. Si no es oferta especial, obtener planes de platzi.planes
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_planes_platzi_activos')

    const rawPlans = !rpcError && Array.isArray(rpcData) && rpcData.length > 0 ? rpcData : DEFAULT_PLANS

    // Separar convenios institucionales / ofertas especiales de los planes estándar regulares
    const isConvenio = (p: any) => {
      const name = (p.nombre_plan || '').toLowerCase()
      const char = (p.caracteristicas || '').toLowerCase()
      return (
        name.includes('convenio') ||
        name.includes('universidad') ||
        name.includes('univalle') ||
        name.includes('oferta') ||
        name.includes('especial') ||
        char.includes('convenio')
      )
    }

    const regularPlans = rawPlans.filter((p: any) => !isConvenio(p))
    const convenioPlans = rawPlans.filter((p: any) => isConvenio(p))

    // Si el código coincide con el nombre de un plan de convenio en platzi.planes:
    if (code) {
      const matched = convenioPlans.find(
        (cp: any) =>
          cp.nombre_plan.toLowerCase().includes(code.toLowerCase()) ||
          (cp.caracteristicas || '').toLowerCase().includes(code.toLowerCase())
      )
      if (matched) {
        return NextResponse.json(
          {
            success: true,
            tipo: 'convenio_plan',
            codigo: code,
            planes: [matched],
          },
          { status: 200 }
        )
      }
    }

    // Si es un revendedor regular o acceso sin oferta especial: entregar únicamente planes regulares aislados
    const finalPlans = code
      ? [regularPlans[0] || rawPlans[0]]
      : regularPlans.length > 0
      ? regularPlans
      : DEFAULT_PLANS

    return NextResponse.json(
      {
        success: true,
        tipo: code ? 'revendedor' : 'estandar',
        codigo: code || null,
        planes: finalPlans,
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        planes: DEFAULT_PLANS,
      },
      { status: 200 }
    )
  }
}
