import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export interface ContactInput {
  email: string
  nombre?: string
  empresa?: string
  telefono?: string
}

// POST: Carga masiva de contactos con asignación de campaña y exclusión de duplicados
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { contactos, campana_nombre } = body

    if (!campana_nombre || !contactos || !Array.isArray(contactos) || contactos.length === 0) {
      return NextResponse.json({ success: false, error: 'campana_nombre y contactos (array) son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // Filter valid emails
    const validContacts: ContactInput[] = contactos.filter(
      (c: any) => c.email && typeof c.email === 'string' && c.email.includes('@')
    )

    if (validContacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron correos electrónicos válidos' }, { status: 400 })
    }

    // Insert contacts with campaign tag. PostgREST ignore duplicates via ON CONFLICT (email, campana_nombre) DO NOTHING
    const payload = validContacts.map((c) => ({
      email: c.email.trim().toLowerCase(),
      nombre: c.nombre || c.email.split('@')[0],
      empresa: c.empresa || 'Empresa Privada',
      telefono: c.telefono || '',
      campana_nombre: campana_nombre.trim(),
      estado: 'pendiente',
    }))

    const insertRes = await fetch(`${url}/rest/v1/inventario_contactos`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation, resolution=ignore-duplicates',
      },
      body: JSON.stringify(payload),
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      console.error('[POST CONTACTS ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error guardando contactos en Supabase' }, { status: 500 })
    }

    const insertedRows = await insertRes.json()
    const insertedCount = insertedRows.length
    const duplicateCount = validContacts.length - insertedCount

    return NextResponse.json({
      success: true,
      campana_nombre,
      processedTotal: validContacts.length,
      insertedCount,
      duplicateCount,
      message: `Carga completada: ${insertedCount} contactos agregados, ${duplicateCount} omitidos por duplicidad en la campaña.`,
    })
  } catch (error: any) {
    console.error('[API CONTACTS POST ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET: Consultar inventario de contactos por campaña
export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const campana = searchParams.get('campana_nombre')

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let queryUrl = `${url}/rest/v1/inventario_contactos?select=*&order=creado_en.desc`
    if (campana) {
      queryUrl += `&campana_nombre=eq.${encodeURIComponent(campana)}`
    }

    const res = await fetch(queryUrl, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ success: true, count: 0, contacts: [] })
    }

    const contacts = await res.json()
    return NextResponse.json({ success: true, count: contacts.length, contacts })
  } catch (error: any) {
    console.error('[API CONTACTS GET ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
