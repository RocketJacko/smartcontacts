import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const directorioNombre = searchParams.get('directorio_nombre') || searchParams.get('campana_nombre')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const q = searchParams.get('q') || ''

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    // 1. Obtener ID del directorio si se proporciona el nombre
    let directorioId: string | null = null
    if (directorioNombre) {
      const dirRes = await fetch(`${url}/rest/v1/directorios?nombre=eq.${encodeURIComponent(directorioNombre.trim())}&select=id`, {
        headers,
        cache: 'no-store',
      })
      if (dirRes.ok) {
        const rows = await dirRes.json()
        if (rows.length > 0) directorioId = rows[0].id
      }
    }

    // 2. Construir consulta canónica
    let query = `${url}/rest/v1/directorio_contactos?select=contacto_id,contactos(id,email,nombre,estado,creado_en)&order=creado_en.desc`
    if (directorioId) {
      query += `&directorio_id=eq.${directorioId}`
    }

    const res = await fetch(query, { headers, cache: 'no-store' })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const rawRows = await res.json()
    let contacts = rawRows
      .map((r: any) => r.contactos)
      .filter((c: any) => c != null)

    if (q) {
      const searchLower = q.toLowerCase()
      contacts = contacts.filter((c: any) => 
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.nombre && c.nombre.toLowerCase().includes(searchLower))
      )
    }

    const totalCount = contacts.length
    const offset = (page - 1) * pageSize
    const paginatedContacts = contacts.slice(offset, offset + pageSize)

    return NextResponse.json({
      success: true,
      contacts: paginatedContacts,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()

    // Sostener compatibilidad multi-formato (directorio_nombre, campana_nombre, categoryName)
    const targetDirectory = body.directorio_nombre || body.campana_nombre || body.categoryName

    if (!targetDirectory || !targetDirectory.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del directorio (o campana_nombre) es requerido' }, { status: 400 })
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
    }

    const cleanDirectory = targetDirectory.trim()

    // CASO A: Envío de arreglo de contactos ({ contactos: [...] })
    if (body.contactos && Array.isArray(body.contactos)) {
      let count = 0
      for (const item of body.contactos) {
        if (!item || !item.email) continue
        await fetch(`${url}/rest/v1/rpc/ingestar_contacto`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_email: item.email,
            p_nombre: item.nombre || null,
            p_directorio_nombre: cleanDirectory,
          }),
        })
        count++
      }
      return NextResponse.json({ success: true, count, insertedCount: count, totalCount: count })
    }

    // CASO B: Envío de contacto único ({ email, nombre, directorio_nombre })
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'email y directorio_nombre son requeridos' }, { status: 400 })
    }

    const res = await fetch(`${url}/rest/v1/rpc/ingestar_contacto`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        p_email: body.email,
        p_nombre: body.nombre || null,
        p_directorio_nombre: cleanDirectory,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const contactoId = await res.json()
    return NextResponse.json({ success: true, contacto_id: contactoId })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de contacto requerido' }, { status: 400 })
    }

    const res = await fetch(`${url}/rest/v1/contactos?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Accept-Profile': 'emailmarketing',
        'Content-Profile': 'emailmarketing',
      },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
