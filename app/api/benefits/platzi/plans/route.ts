import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Planes por defecto como fallback seguro en caso de contingencia
const DEFAULT_PLANES_ESTANDAR = [
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
    const rawUrl = new URL(request.url)
    let code = (
      rawUrl.searchParams.get('code') ||
      rawUrl.searchParams.get('oferta') ||
      rawUrl.searchParams.get('convenio') ||
      rawUrl.searchParams.get('ref') ||
      rawUrl.searchParams.get('referido') ||
      request.nextUrl?.searchParams?.get('code') ||
      request.nextUrl?.searchParams?.get('oferta') ||
      request.nextUrl?.searchParams?.get('convenio') ||
      request.nextUrl?.searchParams?.get('ref') ||
      ''
    ).trim().toUpperCase()

    // Fallback: Si no viene en querystring, inspeccionar Referer header
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

    // Fallback: Inspeccionar cookie sc_ref_code
    if (!code) {
      try {
        code = (request.cookies.get('sc_ref_code')?.value || '').trim().toUpperCase()
      } catch {}
    }

    // ── 1. RESPUESTA INMEDIATA: OFERTA PYTHONCODE (SIN DEPENDENCIAS DE BD) ─────────────
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

    // Cliente Supabase sin dependencia de cookies de next/headers
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return request.cookies.getAll()
            } catch {
              return []
            }
          },
          setAll() {},
        },
      }
    )

    // ── 2. SI HAY OTRO CÓDIGO: CONSULTAR OFERTAS ESPECIALES EN SUPABASE ─────────────────
    if (code) {
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
    }

    // ── 3. CATÁLOGO GENERAL ESTÁNDAR (PÚBLICO GENERAL) ──────────────────────────────────
    const { data: rpcData } = await supabase.rpc('obtener_planes_platzi_activos')
    const rawPlans = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData : DEFAULT_PLANES_ESTANDAR

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
        tipo: 'fallback',
        planes: DEFAULT_PLANES_ESTANDAR,
      },
      { status: 200 }
    )
  }
}
