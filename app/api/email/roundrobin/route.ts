import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const campanaId = searchParams.get('campana_id')

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    let asuntosUrl = `${url}/rest/v1/campana_asuntos?select=*&order=creado_en.asc`
    let cuerposUrl = `${url}/rest/v1/campana_cuerpos?select=*&order=creado_en.asc`

    if (campanaId) {
      asuntosUrl += `&campana_id=eq.${campanaId}`
      cuerposUrl += `&campana_id=eq.${campanaId}`
    }

    const resAsuntos = await fetch(asuntosUrl, { headers, cache: 'no-store' })
    const asuntos = resAsuntos.ok ? await resAsuntos.json() : []

    const resCuerpos = await fetch(cuerposUrl, { headers, cache: 'no-store' })
    const cuerpos = resCuerpos.ok ? await resCuerpos.json() : []

    return NextResponse.json({ success: true, asuntos, cuerpos })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { tipo, texto, campana_id } = body

    if (!tipo || !texto) {
      return NextResponse.json({ success: false, error: 'tipo y texto son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
      Prefer: 'return=representation',
    }

    const targetTable = tipo === 'asunto' ? 'campana_asuntos' : 'campana_cuerpos'
    const payload = tipo === 'asunto' 
      ? { asunto: texto, activo: true, campana_id: campana_id || null } 
      : { cuerpo_html: texto, activo: true, campana_id: campana_id || null }

    const res = await fetch(`${url}/rest/v1/${targetTable}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: errText }, { status: 400 })
    }

    const inserted = await res.json()
    return NextResponse.json({ success: true, item: inserted[0] })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const tipo = searchParams.get('tipo')

    if (!id || !tipo) {
      return NextResponse.json({ success: false, error: 'id y tipo son obligatorios' }, { status: 400 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    const targetTable = tipo === 'asunto' ? 'campana_asuntos' : 'campana_cuerpos'

    await fetch(`${url}/rest/v1/${targetTable}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers,
    })

    return NextResponse.json({ success: true, message: 'Elemento eliminado del pool Round-Robin' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
