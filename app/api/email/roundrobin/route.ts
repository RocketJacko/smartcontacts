import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener pools de asuntos y cuerpos para Round-Robin
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const resAsuntos = await fetch(`${url}/rest/v1/pool_asuntos?select=*&order=creado_en.asc`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Accept-Profile': 'automatizacion' },
      cache: 'no-store',
    })
    const asuntos = resAsuntos.ok ? await resAsuntos.json() : []

    const resCuerpos = await fetch(`${url}/rest/v1/pool_cuerpos?select=*&order=creado_en.asc`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Accept-Profile': 'automatizacion' },
      cache: 'no-store',
    })
    const cuerpos = resCuerpos.ok ? await resCuerpos.json() : []

    return NextResponse.json({ success: true, asuntos, cuerpos })
  } catch (error: any) {
    console.error('[API ROUNDROBIN GET ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Crear nuevo asunto o cuerpo en el pool Round-Robin
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { tipo, texto } = body // tipo: 'asunto' | 'cuerpo'

    if (!tipo || !texto) {
      return NextResponse.json({ success: false, error: 'tipo y texto son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const targetTable = tipo === 'asunto' ? 'pool_asuntos' : 'pool_cuerpos'
    const payload = tipo === 'asunto' ? { asunto: texto, activo: true } : { cuerpo_html: texto, activo: true }

    const res = await fetch(`${url}/rest/v1/${targetTable}`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[ROUNDROBIN ERROR]', res.status, errText)
      return NextResponse.json({ success: false, error: 'No se pudo guardar el elemento en el pool Round-Robin.' }, { status: 400 })
    }

    const inserted = await res.json()
    return NextResponse.json({ success: true, item: inserted[0] })
  } catch (error: any) {
    console.error('[API ROUNDROBIN POST ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: Eliminar un asunto o cuerpo del pool
export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const tipo = searchParams.get('tipo')

    if (!id || !tipo) {
      return NextResponse.json({ success: false, error: 'id y tipo son obligatorios' }, { status: 400 })
    }

    const targetTable = tipo === 'asunto' ? 'pool_asuntos' : 'pool_cuerpos'

    await fetch(`${url}/rest/v1/${targetTable}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
      },
    })

    return NextResponse.json({ success: true, message: 'Elemento eliminado del pool Round-Robin' })
  } catch (error: any) {
    console.error('[API ROUNDROBIN DELETE ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
