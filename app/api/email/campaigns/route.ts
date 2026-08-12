import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener lista de campañas y categorías activas (Unificando campanas e inventario_contactos)
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // 1. Consultar tabla campanas
    let res = await fetch(`${url}/rest/v1/campanas?select=*&order=creado_en.desc`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      res = await fetch(`${url}/rest/v1/campanas?select=*&order=creado_en.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
    }

    let campaigns: any[] = []
    if (res.ok) {
      campaigns = await res.json()
    }

    // 2. Consultar categorías distintas presentes en inventario_contactos
    let contactsRes = await fetch(`${url}/rest/v1/inventario_contactos?select=campana_nombre`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
      },
      cache: 'no-store',
    })

    if (!contactsRes.ok) {
      contactsRes = await fetch(`${url}/rest/v1/inventario_contactos?select=campana_nombre`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
    }

    const categorySet = new Set<string>()
    // Añadir campañas oficiales de la tabla campanas
    campaigns.forEach((c: any) => {
      if (c.nombre) categorySet.add(c.nombre.trim())
    })

    // Añadir categorías encontradas en inventario_contactos
    if (contactsRes.ok) {
      const contactRows = await contactsRes.json()
      if (Array.isArray(contactRows)) {
        contactRows.forEach((r: any) => {
          if (r.campana_nombre) categorySet.add(r.campana_nombre.trim())
        })
      }
    }

    // Si no hay nada, asegurar valor por defecto
    if (categorySet.size === 0) {
      categorySet.add('Directorio - Universidades & Educación')
    }

    // Convertir a lista de objetos unificados
    const mergedCampaigns = Array.from(categorySet).map((nombre, index) => {
      const existing = campaigns.find((c: any) => c.nombre?.trim() === nombre)
      return existing || { id: `cat-${index}`, nombre, estado: 'activa' }
    })

    return NextResponse.json({ success: true, campaigns: mergedCampaigns })
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
