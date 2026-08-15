import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener lista de campañas y categorías activas (Esquema emailmarketing)
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // 1. Consultar tabla campanas en esquema emailmarketing
    let campaigns: any[] = []
    try {
      const res = await fetch(`${url}/rest/v1/campanas?select=*&order=creado_en.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
        },
        cache: 'no-store',
      })
      if (res.ok) {
        campaigns = await res.json()
      }
    } catch {
      campaigns = []
    }

    // 2. Consultar categorías distintas presentes en emailmarketing.email
    let contactRows: any[] = []
    try {
      const contactsRes = await fetch(`${url}/rest/v1/email?select=campana_nombre`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
        },
        cache: 'no-store',
      })
      if (contactsRes.ok) {
        contactRows = await contactsRes.json()
      }
    } catch {
      contactRows = []
    }

    const categorySet = new Set<string>()
    if (Array.isArray(campaigns)) {
      campaigns.forEach((c: any) => {
        if (c.nombre) categorySet.add(c.nombre.trim())
      })
    }

    if (Array.isArray(contactRows)) {
      contactRows.forEach((r: any) => {
        if (r.campana_nombre) categorySet.add(r.campana_nombre.trim())
      })
    }

    if (categorySet.size === 0) {
      categorySet.add('Directorio - Universidades & Educación')
    }

    const mergedCampaigns = Array.from(categorySet).map((nombre, index) => {
      const existing = campaigns.find((c: any) => c.nombre?.trim() === nombre)
      return existing || { id: `cat-${index}`, nombre, estado: 'activa' }
    })

    return NextResponse.json({ success: true, campaigns: mergedCampaigns })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Crear una nueva campaña dinámicamente en esquema emailmarketing
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

    const cleanName = nombre.trim()
    const payload = {
      nombre: cleanName,
      descripcion: descripcion ? descripcion.trim() : 'Campaña creada desde el panel de automatizaciones',
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
      if (errText.includes('23505') || errText.includes('campanas_nombre_key') || insertRes.status === 409) {
        userError = `Ya existe una campaña registrada con el nombre "${cleanName}".`
      }
      return NextResponse.json({ success: false, error: userError }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    return NextResponse.json({
      success: true,
      campaign: insertedRows[0] || { nombre: cleanName },
      message: `Campaña "${cleanName}" registrada exitosamente.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
