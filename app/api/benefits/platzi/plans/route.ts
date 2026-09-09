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

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Intentar llamar a la función RPC pública optimizada
    const { data: rpcData, error: rpcError } = await supabase.rpc('obtener_planes_platzi_activos')

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return NextResponse.json(
        {
          success: true,
          planes: rpcData,
        },
        { status: 200 }
      )
    }

    // 2. Fallback de consulta directa a la tabla platzi.planes
    const { data: tableData, error: tableError } = await supabase
      .schema('platzi')
      .from('planes')
      .select('id, nombre_plan, meses_cubrimiento, precio, moneda, vigente, caracteristicas, total_disponibles')
      .eq('vigente', true)
      .order('meses_cubrimiento', { ascending: true })

    if (!tableError && Array.isArray(tableData) && tableData.length > 0) {
      return NextResponse.json(
        {
          success: true,
          planes: tableData,
        },
        { status: 200 }
      )
    }

    // 3. Fallback a catálogo base garantizado
    return NextResponse.json(
      {
        success: true,
        planes: DEFAULT_PLANS,
      },
      { status: 200 }
    )
  } catch (err: any) {
    return NextResponse.json(
      {
        success: true,
        planes: DEFAULT_PLANS,
        warning: 'Fallback aplicado debido a error de conexión con la base de datos',
      },
      { status: 200 }
    )
  }
}
