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

    // Filtrar correos válidos
    const validContacts: ContactInput[] = contactos.filter(
      (c: any) => c.email && typeof c.email === 'string' && c.email.includes('@')
    )

    if (validContacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron correos electrónicos válidos' }, { status: 400 })
    }

    const payload = validContacts.map((c) => ({
      email: c.email.trim().toLowerCase(),
      nombre: c.nombre || c.email.split('@')[0],
      empresa: c.empresa || 'Empresa Privada',
      telefono: c.telefono || '',
      campana_nombre: campana_nombre.trim(),
      estado: 'pendiente',
    }))

    // PostgREST exige Accept-Profile y Content-Profile para esquemas personalizados (automatizacion)
    let insertRes = await fetch(`${url}/rest/v1/inventario_contactos`, {
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
      // Fallback a vista publica
      insertRes = await fetch(`${url}/rest/v1/inventario_contactos`, {
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
      console.error('[POST CONTACTS ERROR]', insertRes.status, errText)

      let userError = 'No se pudo completar la carga de contactos.'
      if (errText.includes('23505') || errText.includes('unique_email_campana') || insertRes.status === 409) {
        const emailMatch = errText.match(/Key \(email, campana_nombre\)=\(([^,]+),/i) || errText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
        const duplicateEmail = emailMatch ? emailMatch[1].trim() : ''
        userError = duplicateEmail 
          ? `El correo ${duplicateEmail} ya se encuentra registrado en esta campaña.`
          : 'El correo electrónico ya se encuentra registrado en esta campaña.'
      } else if (errText.includes('PGRST106')) {
        userError = 'Error de esquema de base de datos en Supabase.'
      }

      return NextResponse.json({ success: false, error: userError, code: insertRes.status }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    const insertedCount = Array.isArray(insertedRows) ? insertedRows.length : 0
    
    // Identificar correos insertados vs omitidos por duplicidad
    const insertedEmails = new Set(
      Array.isArray(insertedRows) ? insertedRows.map((r: any) => r.email.toLowerCase()) : []
    )
    const duplicateEmails = validContacts
      .filter((c: any) => !insertedEmails.has(c.email.toLowerCase()))
      .map((c: any) => c.email)

    const duplicateCount = duplicateEmails.length

    return NextResponse.json({
      success: true,
      campana_nombre,
      processedTotal: validContacts.length,
      insertedCount,
      duplicateCount,
      duplicateEmails,
      message: `Procesamiento completado: ${insertedCount} nuevos contactos registrados, ${duplicateCount} omitidos por ya existir en la categoría.`,
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

    let res = await fetch(queryUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Fallback a vista publica
      res = await fetch(queryUrl, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })
    }

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
