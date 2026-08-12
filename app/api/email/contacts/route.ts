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

    // Invocar la función almacenada PL/pgSQL en Supabase para procesamiento 100% atómico en DB
    let rpcRes = await fetch(`${url}/rest/v1/rpc/insertar_contactos_masivos`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
      },
      body: JSON.stringify({
        p_campana_nombre: campana_nombre.trim(),
        p_contactos: validContacts,
      }),
    })

    if (!rpcRes.ok) {
      // Fallback a esquema public
      rpcRes = await fetch(`${url}/rest/v1/rpc/insertar_contactos_masivos`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_campana_nombre: campana_nombre.trim(),
          p_contactos: validContacts,
        }),
      })
    }

    if (rpcRes.ok) {
      const result = await rpcRes.json()
      return NextResponse.json({
        success: true,
        campana_nombre,
        processedTotal: result.procesados || validContacts.length,
        insertedCount: result.insertados || 0,
        duplicateCount: result.omitidos || 0,
        duplicateEmails: result.duplicados || [],
        message: `Procesamiento en base de datos completado: ${result.insertados} nuevos contactos registrados, ${result.omitidos} omitidos por ya existir en la categoría.`,
      })
    }

    // Fallback de inserción directa PostgREST
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
          ? `El correo ${duplicateEmail} ya se encuentra registrado en esta categoría.`
          : 'El correo electrónico ya se encuentra registrado en esta categoría.'
      }

      return NextResponse.json({ success: false, error: userError, code: insertRes.status }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    const insertedCount = Array.isArray(insertedRows) ? insertedRows.length : 0
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

// GET: Consultar inventario de contactos con paginación server-side y búsqueda
export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const campana = searchParams.get('campana_nombre')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(500, parseInt(searchParams.get('pageSize') || '50', 10)))
    const search = searchParams.get('search')?.trim()

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const offset = (page - 1) * pageSize
    let queryUrl = `${url}/rest/v1/inventario_contactos?select=*&order=creado_en.desc&limit=${pageSize}&offset=${offset}`
    
    if (campana) {
      queryUrl += `&campana_nombre=eq.${encodeURIComponent(campana)}`
    }

    if (search) {
      // Filtrar por email, nombre o empresa
      queryUrl += `&or=(email.ilike.*${encodeURIComponent(search)}*,nombre.ilike.*${encodeURIComponent(search)}*,empresa.ilike.*${encodeURIComponent(search)}*)`
    }

    let res = await fetch(queryUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      // Fallback a vista publica
      res = await fetch(queryUrl, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'count=exact',
        },
        cache: 'no-store',
      })
    }

    if (!res.ok) {
      return NextResponse.json({ success: true, count: 0, totalCount: 0, page, pageSize, totalPages: 0, contacts: [] })
    }

    const contentRange = res.headers.get('content-range')
    let totalCount = 0
    if (contentRange) {
      const parts = contentRange.split('/')
      if (parts.length > 1) {
        totalCount = parseInt(parts[1], 10) || 0
      }
    }

    const contacts = await res.json()
    const totalPages = Math.ceil(totalCount / pageSize) || 1

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
      totalCount: totalCount || contacts.length,
      page,
      pageSize,
      totalPages,
    })
  } catch (error: any) {
    console.error('[API CONTACTS GET ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT: Editar un contacto existente (Nombre, Empresa, Teléfono, Estado, etc.)
export async function PUT(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { id, email, nombre, empresa, telefono, estado } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'El ID del contacto es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const updatePayload: any = {}
    if (email) updatePayload.email = email.trim().toLowerCase()
    if (nombre !== undefined) updatePayload.nombre = nombre.trim()
    if (empresa !== undefined) updatePayload.empresa = empresa.trim()
    if (telefono !== undefined) updatePayload.telefono = telefono.trim()
    if (estado) updatePayload.estado = estado

    let res = await fetch(`${url}/rest/v1/inventario_contactos?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    })

    if (!res.ok) {
      res = await fetch(`${url}/rest/v1/inventario_contactos?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(updatePayload),
      })
    }

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: `No se pudo actualizar el contacto: ${errText}` }, { status: 400 })
    }

    const updatedRows = await res.json()
    return NextResponse.json({ success: true, contact: updatedRows[0] || updatePayload })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE: Eliminar un contacto individual o eliminación masiva por IDs
export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')
    let ids: string[] = []

    try {
      const body = await request.json()
      if (body.id) id = body.id
      if (body.ids && Array.isArray(body.ids)) ids = body.ids
    } catch {
      // Petición query param únicamente
    }

    if (!id && ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe especificar el ID o lista de IDs a eliminar' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let deleteFilter = ''
    if (ids.length > 0) {
      deleteFilter = `id=in.(${ids.join(',')})`
    } else {
      deleteFilter = `id=eq.${id}`
    }

    let res = await fetch(`${url}/rest/v1/inventario_contactos?${deleteFilter}`, {
      method: 'DELETE',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
      },
    })

    if (!res.ok) {
      res = await fetch(`${url}/rest/v1/inventario_contactos?${deleteFilter}`, {
        method: 'DELETE',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      })
    }

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: `No se pudo eliminar el contacto: ${errText}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Contacto(s) eliminado(s) exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
