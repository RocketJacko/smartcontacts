import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener lista de campañas asignadas a un directorio o todas
export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const directorio = searchParams.get('directorio_nombre')

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let endpoint = `${url}/rest/v1/campanas?select=*&order=creado_en.desc`
    if (directorio && directorio.trim()) {
      endpoint += `&directorio_nombre=eq.${encodeURIComponent(directorio.trim())}`
    }

    const res = await fetch(endpoint, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
      },
      cache: 'no-store',
    })

    let campaigns: any[] = []
    if (res.ok) {
      campaigns = await res.json()
    }

    return NextResponse.json({ success: true, campaigns })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Asignar/Crear una nueva campaña para un directorio específico
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { nombre, directorio_nombre, descripcion } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la campaña es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const cleanName = nombre.trim()
    const cleanDir = directorio_nombre ? directorio_nombre.trim() : null

    const payload = {
      nombre: cleanName,
      directorio_nombre: cleanDir,
      descripcion: descripcion ? descripcion.trim() : 'Campaña asignada al directorio',
      estado: 'activa',
    }

    const insertRes = await fetch(`${url}/rest/v1/campanas`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        'Content-Type': 'application/json',
        Prefer: 'return=representation, resolution=ignore-duplicates',
      },
      body: JSON.stringify(payload),
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      let userError = 'No se pudo registrar la campaña.'
      if (errText.includes('23505') || errText.includes('unique_campana_nombre') || insertRes.status === 409) {
        userError = `Ya existe una campaña registrada con el nombre "${cleanName}".`
      }
      return NextResponse.json({ success: false, error: userError }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    return NextResponse.json({
      success: true,
      campaign: insertedRows[0] || { nombre: cleanName, directorio_nombre: cleanDir },
      message: `Campaña "${cleanName}" asignada exitosamente al directorio.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
