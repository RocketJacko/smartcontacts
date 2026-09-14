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
    es_oferta_especial: false,
    tipo_pago: 'pago_unico',
    admite_cuotas: false,
    numero_cuotas: 1,
    max_cuotas: 1,
    pago_anticipado: false,
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
    es_oferta_especial: false,
    tipo_pago: 'pago_unico',
    admite_cuotas: true,
    numero_cuotas: 1,
    max_cuotas: 2,
    pago_anticipado: false,
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

    // Manejo prioritario para oferta PYTHONCODE (Plan 1 año con pago anticipado)
    if (code === 'PYTHONCODE') {
      const planPythonCode = {
        id: 'plan-pythoncode-1year',
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
            id: 'plan-pythoncode-1year',
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

    // 1. Si hay un código, consultar si el revendedor tiene un enlace con plan_id asignado (Oferta Especial / Convenio)
    if (code) {
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
              tipo_pago: planEspecial.tipo_pago || 'pago_unico',
              admite_cuotas: Boolean(planEspecial.admite_cuotas || planEspecial.max_cuotas > 1),
              numero_cuotas: planEspecial.numero_cuotas || 1,
              max_cuotas: planEspecial.max_cuotas || 1,
              pago_anticipado: Boolean(planEspecial.pago_anticipado),
              vigente: true,
              es_oferta_especial: true,
              codigo_oferta: planEspecial.codigo_oferta || code,
              institucion_empresa: planEspecial.institucion_empresa,
              caracteristicas:
                planEspecial.caracteristicas ||
                (planEspecial.institucion_empresa
                  ? `Convenio especial ${planEspecial.institucion_empresa}`
                  : 'Tarifa preferencial asignada por enlace'),
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
      } catch {
        // Continuar a las siguientes validaciones si falla la consulta directa
      }

      // 2. Verificar si el código coincide directamente con un plan de oferta especial en platzi.planes (por codigo_oferta)
      try {
        const { data: planPorOferta } = await supabase
          .from('platzi.planes')
          .select('*')
          .eq('codigo_oferta', code)
          .eq('vigente', true)
          .maybeSingle()

        if (planPorOferta) {
          const planFormat = {
            id: planPorOferta.id,
            nombre_plan: planPorOferta.nombre_plan,
            meses_cubrimiento: planPorOferta.meses_cubrimiento,
            precio: Number(planPorOferta.precio),
            moneda: planPorOferta.moneda || 'COP',
            tipo_pago: planPorOferta.tipo_pago || 'pago_unico',
            admite_cuotas: Boolean(planPorOferta.admite_cuotas || planPorOferta.max_cuotas > 1),
            numero_cuotas: planPorOferta.numero_cuotas || 1,
            max_cuotas: planPorOferta.max_cuotas || 1,
            pago_anticipado: Boolean(planPorOferta.pago_anticipado),
            vigente: true,
            es_oferta_especial: true,
            codigo_oferta: planPorOferta.codigo_oferta,
            institucion_empresa: planPorOferta.institucion_empresa,
            caracteristicas: planPorOferta.caracteristicas || 'Convenio preferencial exclusivo',
          }

          return NextResponse.json(
            {
              success: true,
              tipo: 'oferta_especial_directa',
              codigo: code,
              planes: [planFormat],
            },
            { status: 200 }
          )
        }
      } catch {
        // Continuar si falla
      }

      // 3. Fallback de retrocompatibilidad con obtener_oferta_publica (si aún existían ofertas en la tabla antigua)
      try {
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
            admite_cuotas: off.tipo_pago === 'cuotas' || (off.numero_cuotas && off.numero_cuotas > 1),
            numero_cuotas: off.numero_cuotas || 1,
            max_cuotas: off.numero_cuotas || 1,
            pago_anticipado: Boolean(off.pago_anticipado),
            vigente: true,
            es_oferta_especial: true,
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
      } catch {}
    }

    // 4. Catálogo Abierto Estándar: Consultar planes regulares de platzi.planes
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_planes_platzi_activos')
    const rawPlans = !rpcError && Array.isArray(rpcData) && rpcData.length > 0 ? rpcData : DEFAULT_PLANS

    // Filtrar para mostrar en catálogo público los planes estándar (no ofertas de convenio cerradas)
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
