import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener lista de campañas activas
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let res = await fetch(`${url}/rest/v1/campanas?select=*&order=creado_en.desc`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Fallback a vista publica
      res = await fetch(`${url}/rest/v1/campanas?select=*&order=creado_en.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
    }

    if (!res.ok) {
      return NextResponse.json({ success: true, campaigns: [{ id: 'default', nombre: 'Campaña Q3 - Consultoría IA Agéntica' }] })
    }

    const campaigns = await res.json()
    return NextResponse.json({ success: true, campaigns })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Crear una nueva campaña dinámicamente
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la campaña es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : 'Campaña creada desde el panel de automatizaciones',
      estado: 'activa',
    }

    let insertRes = await fetch(`${url}/rest/v1/campanas`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
        Prefer: 'return=representation, resolution=ignore-duplicates',
      },
      body: JSON.stringify(payload),
    })

    if (!insertRes.ok) {
      // Fallback a esquema public
      insertRes = await fetch(`${url}/rest/v1/campanas`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation, resolution=ignore-duplicates',
        },
        body: JSON.stringify(payload),
      })
    }

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      let userError = 'No se pudo registrar la campaña.'
      if (errText.includes('23505') || errText.includes('campanas_nombre_key') || insertRes.status === 409) {
        userError = `Ya existe una campaña registrada con el nombre "${nombre.trim()}".`
      }
      return NextResponse.json({ success: false, error: userError }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    return NextResponse.json({
      success: true,
      campaign: insertedRows[0] || { nombre: nombre.trim() },
      message: `Campaña "${nombre.trim()}" registrada exitosamente.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
