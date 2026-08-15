import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export interface ContactInput {
  email: string
  nombre?: string
}

// POST: Carga masiva de contactos (1 o 2 columnas) asignados a un directorio
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { contactos, campana_nombre, directorio_nombre } = body

    const cleanDirectory = (directorio_nombre || campana_nombre || '').trim()

    if (!cleanDirectory || !contactos || !Array.isArray(contactos) || contactos.length === 0) {
      return NextResponse.json({ success: false, error: 'El nombre del directorio y la lista de contactos son obligatorios' }, { status: 400 })
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

    // 1. Auto-registrar el directorio en emailmarketing.campanas
    try {
      await fetch(`${url}/rest/v1/campanas`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          nombre: cleanDirectory,
          descripcion: 'Directorio auto-registrado',
          estado: 'activa',
        }),
      })
    } catch {
      // Silencioso
    }

    // 2. Invocar la función RPC atómica emailmarketing.insertar_contactos_masivos
    const rpcRes = await fetch(`${url}/rest/v1/rpc/insertar_contactos_masivos`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_campana_nombre: cleanDirectory,
        p_contactos: validContacts,
      }),
    })

    if (rpcRes.ok) {
      const result = await rpcRes.json()
      return NextResponse.json({
        success: true,
        directorio_nombre: cleanDirectory,
        processedTotal: result.procesados !== undefined ? result.procesados : validContacts.length,
        insertedCount: result.insertados !== undefined ? result.insertados : 0,
        duplicateCount: result.omitidos !== undefined ? result.omitidos : 0,
        totalDirectoryCount: result.total_directorio !== undefined ? result.total_directorio : 0,
        duplicateEmails: result.duplicados || [],
        message: `Procesamiento completado: ${result.insertados} nuevos contactos registrados en el directorio.`,
      })
    }

    // Fallback de inserción directa PostgREST a emailmarketing.email
    const payload = validContacts.map((c) => ({
      email: c.email.trim().toLowerCase(),
      nombre: c.nombre ? c.nombre.trim() : null,
      directorio_nombre: cleanDirectory,
      estado: 'pendiente',
    }))

    const insertRes = await fetch(`${url}/rest/v1/email?on_conflict=email,directorio_nombre`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    })

    let insertedRows: any[] = []
    if (insertRes.ok) {
      try {
        insertedRows = await insertRes.json()
      } catch {
        insertedRows = []
      }
    }

    const insertedCount = Array.isArray(insertedRows) ? insertedRows.length : 0
    const insertedEmails = new Set(
      Array.isArray(insertedRows) ? insertedRows.map((r: any) => r.email?.toLowerCase()).filter(Boolean) : []
    )
    const duplicateEmails = validContacts
      .filter((c: any) => !insertedEmails.has(c.email.toLowerCase()))
      .map((c: any) => c.email)

    return NextResponse.json({
      success: true,
      directorio_nombre: cleanDirectory,
      processedTotal: validContacts.length,
      insertedCount,
      duplicateCount: duplicateEmails.length,
      duplicateEmails,
      message: `Procesamiento completado: ${insertedCount} nuevos contactos registrados.`,
    })
  } catch (error: any) {
    console.error('[API CONTACTS POST ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}

// GET: Consultar inventario de contactos por directorio con paginación y búsqueda
export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const directorio = searchParams.get('directorio_nombre') || searchParams.get('campana_nombre')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.max(1, Math.min(500, parseInt(searchParams.get('pageSize') || '50', 10)))
    const search = searchParams.get('search')?.trim()

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const offset = (page - 1) * pageSize
    let queryUrl = `${url}/rest/v1/email?select=*&order=creado_en.desc&limit=${pageSize}&offset=${offset}`
    
    if (directorio && directorio.trim() && directorio.trim() !== 'Todas' && directorio.trim() !== 'Todos los Directorios') {
      const cleanDir = directorio.trim()
      queryUrl += `&directorio_nombre=eq.${encodeURIComponent(cleanDir)}`
    }

    if (search) {
      queryUrl += `&or=(email.ilike.*${encodeURIComponent(search)}*,nombre.ilike.*${encodeURIComponent(search)}*)`
    }

    const res = await fetch(queryUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        Prefer: 'count=exact',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[API CONTACTS GET FAIL]', res.status, errText)
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

// PUT: Editar un contacto existente (Email, Nombre, Estado)
export async function PUT(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { id, email, nombre, estado } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'El ID del contacto es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const updatePayload: any = {}
    if (email) updatePayload.email = email.trim().toLowerCase()
    if (nombre !== undefined) updatePayload.nombre = nombre ? nombre.trim() : null
    if (estado) updatePayload.estado = estado

    const res = await fetch(`${url}/rest/v1/email?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updatePayload),
    })

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

// DELETE: Eliminar un contacto individual, selección masiva o vaciar directorio
export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')
    let ids: string[] = []
    let removeAll = searchParams.get('removeAll') === 'true'
    let directorioNombre = searchParams.get('directorio_nombre') || searchParams.get('campana_nombre')

    try {
      const body = await request.json()
      if (body.id) id = body.id
      if (body.ids && Array.isArray(body.ids)) ids = body.ids
      if (body.removeAll) removeAll = true
      if (body.directorio_nombre || body.campana_nombre) {
        directorioNombre = body.directorio_nombre || body.campana_nombre
      }
    } catch {
      // Query params únicamente
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // Vaciar todo el directorio o un directorio específico
    if (removeAll || directorioNombre) {
      const rpcRes = await fetch(`${url}/rest/v1/rpc/vaciar_directorio_contactos`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_campana_nombre: removeAll ? '__ALL__' : (directorioNombre || '__ALL__'),
        }),
      })

      if (rpcRes.ok) {
        const result = await rpcRes.json()
        return NextResponse.json({
          success: true,
          deletedCount: result.eliminados || 0,
          message: result.mensaje || 'Directorio vaciado exitosamente.',
        })
      }
    }

    if (!id && ids.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe especificar el ID, lista de IDs o directorio a vaciar' }, { status: 400 })
    }

    let deleteFilter = ''
    if (ids.length > 0) {
      deleteFilter = `id=in.(${ids.join(',')})`
    } else {
      deleteFilter = `id=eq.${id}`
    }

    const res = await fetch(`${url}/rest/v1/email?${deleteFilter}`, {
      method: 'DELETE',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ success: false, error: `No se pudo eliminar el contacto: ${errText}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Contacto(s) eliminado(s) exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
