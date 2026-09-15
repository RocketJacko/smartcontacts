import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Planes por defecto como fallback seguro en caso de contingencia
const DEFAULT_PLANS = [
  {
    id: '0807dfb2-83bd-4390-88cc-b85a77eb9388',
    nombre_plan: 'Plan 6 meses',
    meses_cubrimiento: 6,
    precio: 120000,
    moneda: 'COP',
    vigente: true,
    es_oferta_especial: false,
    tipo_pago: 'pago_unico',
    admite_cuotas: false,
    numero_cuotas: 1,
    max_cuotas: 1,
    pago_anticipado: false,
    caracteristicas: 'Accesos completo en tu cuneta personal por 6 meses',
    total_disponibles: null,
  },
  {
    id: 'b381bcfd-53f5-4ef3-b5d6-6c5863bb3450',
    nombre_plan: 'Plan 12 Meses Pago Único',
    meses_cubrimiento: 12,
    precio: 160000,
    moneda: 'COP',
    vigente: true,
    es_oferta_especial: false,
    tipo_pago: 'pago_unico',
    admite_cuotas: true,
    numero_cuotas: 1,
    max_cuotas: 2,
    pago_anticipado: false,
    caracteristicas: 'Suscripción anual con tarifa preferencial',
    total_disponibles: null,
  },
  {
    id: 'cc7a5125-02a8-44d7-92b5-9e6ef4dca49f',
    nombre_plan: 'Plan 12  Meses',
    meses_cubrimiento: 12,
    precio: 180000,
    moneda: 'COP',
    vigente: true,
    es_oferta_especial: false,
    tipo_pago: 'pago_unico',
    admite_cuotas: false,
    numero_cuotas: 1,
    max_cuotas: 1,
    pago_anticipado: false,
    caracteristicas: 'Pagos de 90000 cada 6 meses',
    total_disponibles: null,
  },
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let code = (
      searchParams.get('code') ||
      searchParams.get('oferta') ||
      searchParams.get('convenio') ||
      searchParams.get('ref') ||
      searchParams.get('referido') ||
      ''
    ).trim().toUpperCase()

    // Fallback: Si no viene en searchParams, extraer de referer header
    if (!code) {
      try {
        const referer = request.headers.get('referer')
        if (referer) {
          const refUrl = new URL(referer)
          code = (
            refUrl.searchParams.get('oferta') ||
            refUrl.searchParams.get('convenio') ||
            refUrl.searchParams.get('code') ||
            refUrl.searchParams.get('ref') ||
            ''
          ).trim().toUpperCase()
        }
      } catch {}
    }

    // Fallback: Si aún no hay código, inspeccionar cookie de referido sc_ref_code
    if (!code) {
      code = (request.cookies.get('sc_ref_code')?.value || '').trim().toUpperCase()
    }

    const supabase = await createServerSupabaseClient()

    // ── 1. MANEJO PRIORITARIO: Oferta especial PYTHONCODE ($120.000 COP, 1 año) ───────────
    if (code === 'PYTHONCODE') {
      const planPythonCode = {
        id: '399f6ed5-6d64-4c0f-b7ef-dc69b31038e2',
        nombre_plan: 'Oferta especial familia PythonCode',
        meses_cubrimiento: 12,
        precio: 120000,
        moneda: 'COP',
        vigente: true,
        es_oferta_especial: true,
        codigo_oferta: 'PYTHONCODE',
        institucion_empresa: 'PythonCode',
        tipo_pago: 'pago_unico',
        admite_cuotas: false,
        numero_cuotas: 1,
        max_cuotas: 1,
        pago_anticipado: true,
        caracteristicas: 'Solo aplica para los integrantes de la cominidad',
      }

      return NextResponse.json(
        {
          success: true,
          tipo: 'oferta_especial_directa',
          codigo: 'PYTHONCODE',
          planes: [planPythonCode],
          oferta: {
            id: '399f6ed5-6d64-4c0f-b7ef-dc69b31038e2',
            codigo_oferta: 'PYTHONCODE',
            titulo: 'Oferta especial familia PythonCode',
            descripcion: 'Solo aplica para los integrantes de la cominidad',
            institucion_empresa: 'PythonCode',
            precio_cop: 120000,
            precio_usd: 24,
            meses_cubrimiento: 12,
            tipo_pago: 'pago_unico',
            numero_cuotas: 1,
            pago_anticipado: true,
            activo: true,
          },
        },
        { status: 200 }
      )
    }

    // ── 2. CONSULTA EN TABLA DE OFERTAS ESPECIALES SI HAY CÓDIGO ───────────
    if (code) {
      // 2a. Consultar en referidos.ofertas_especiales
      try {
        const { data: ofertaBd } = await supabase
          .from('referidos.ofertas_especiales')
          .select('*')
          .ilike('codigo_oferta', code)
          .eq('activo', true)
          .maybeSingle()

        if (ofertaBd) {
          const offerPlan = {
            id: ofertaBd.id,
            nombre_plan: ofertaBd.titulo,
            meses_cubrimiento: Number(ofertaBd.meses_cubrimiento) || 12,
            precio: Number(ofertaBd.precio_cop) || 120000,
            moneda: 'COP',
            tipo_pago: 'pago_unico',
            admite_cuotas: false,
            numero_cuotas: 1,
            max_cuotas: 1,
            pago_anticipado: true,
            vigente: Boolean(ofertaBd.activo),
            es_oferta_especial: true,
            caracteristicas: ofertaBd.descripcion || 'Tarifa preferencial asignada por convenio',
            codigo_oferta: ofertaBd.codigo_oferta,
            institucion_empresa: ofertaBd.institucion_empresa,
          }

          return NextResponse.json(
            {
              success: true,
              tipo: 'oferta_especial_directa',
              codigo: code,
              oferta: ofertaBd,
              planes: [offerPlan],
            },
            { status: 200 }
          )
        }
      } catch {}

      // 2b. Consultar en referidos.enlaces (si el afiliado tiene un plan_id exclusivo)
      try {
        const { data: enlaceData } = await supabase
          .from('referidos.enlaces')
          .select('id, codigo_referido, slug_personalizado, plan_id, afiliado_id')
          .or(`codigo_referido.ilike.${code},slug_personalizado.ilike.${code}`)
          .eq('activo', true)
          .maybeSingle()

        if (enlaceData?.plan_id) {
          const { data: planEspecial } = await supabase
            .from('platzi.planes')
            .select('*')
            .eq('id', enlaceData.plan_id)
            .eq('vigente', true)
            .maybeSingle()

          if (planEspecial) {
            const planFormat = {
              id: planEspecial.id,
              nombre_plan: planEspecial.nombre_plan,
              meses_cubrimiento: planEspecial.meses_cubrimiento,
              precio: Number(planEspecial.precio),
              moneda: planEspecial.moneda || 'COP',
              tipo_pago: 'pago_unico',
              admite_cuotas: false,
              numero_cuotas: 1,
              max_cuotas: 1,
              pago_anticipado: false,
              vigente: true,
              es_oferta_especial: true,
              codigo_oferta: code,
              institucion_empresa: null,
              caracteristicas: planEspecial.caracteristicas || 'Tarifa preferencial asignada por enlace',
            }

            return NextResponse.json(
              {
                success: true,
                tipo: 'oferta_especial_enlace',
                codigo: code,
                enlace_id: enlaceData.id,
                afiliado_id: enlaceData.afiliado_id,
                planes: [planFormat],
              },
              { status: 200 }
            )
          }
        }
      } catch {}
    }

    // ── 3. CATÁLOGO GENERAL ESTÁNDAR: Consultar planes regulares de platzi.planes ───────────
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_planes_platzi_activos')
    const rawPlans = !rpcError && Array.isArray(rpcData) && rpcData.length > 0 ? rpcData : DEFAULT_PLANS

    // Filtrar para mostrar únicamente los planes regulares al público general
    const isSpecialPlan = (p: any) => {
      if (p.es_oferta_especial === true) return true
      const name = (p.nombre_plan || '').toLowerCase()
      const char = (p.caracteristicas || '').toLowerCase()
      return (
        name.includes('oferta especial') ||
        name.includes('convenio') ||
        name.includes('pythoncode') ||
        char.includes('solo aplica para')
      )
    }
    const regularPlans = rawPlans.filter((p: any) => !isSpecialPlan(p))
    const finalPlans = regularPlans.length > 0 ? regularPlans : rawPlans

    return NextResponse.json(
      {
        success: true,
        tipo: code ? 'revendedor_estandar' : 'estandar',
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
