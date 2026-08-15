import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const res = await fetch(`${url}/rest/v1/directorios?select=id,nombre,descripcion,creado_en&order=creado_en.asc`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const directorios = await res.json()
    return NextResponse.json({ success: true, directorios })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { nombre, descripcion = '' } = body

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del directorio es obligatorio' }, { status: 400 })
    }

    const res = await fetch(`${url}/rest/v1/directorios`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const created = await res.json()
    return NextResponse.json({ success: true, directorio: created[0] })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
