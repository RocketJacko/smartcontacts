import { NextResponse } from 'next/server'
import { getEmailSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET(request: Request) {
  try {
    const { url, anonKey } = getEmailSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const directorioNombre = searchParams.get('directorio_nombre') || searchParams.get('campana_nombre')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
    const q = searchParams.get('q') || searchParams.get('search') || ''

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    let contacts: any[] = []

    // 1. Intentar consulta canónica por directorio_id
    if (directorioNombre) {
      const cleanDirName = directorioNombre.trim()
      const dirRes = await fetch(`${url}/rest/v1/directorios?nombre=eq.${encodeURIComponent(cleanDirName)}&select=id`, {
        headers,
        cache: 'no-store',
      })

      if (dirRes.ok) {
        const dirRows = await dirRes.json()
        if (dirRows.length > 0) {
          const directorioId = dirRows[0].id
          const dcRes = await fetch(
            `${url}/rest/v1/directorio_contactos?select=contacto_id,contactos(id,email,nombre,estado,creado_en)&directorio_id=eq.${directorioId}`,
            { headers, cache: 'no-store' }
          )
          if (dcRes.ok) {
            const dcRows = await dcRes.json()
            contacts = dcRows.map((r: any) => r.contactos).filter((c: any) => c != null)
          }
        }
      }

      // 2. Fallback de respaldo: si directorio_contactos aún no devuelve filas, consultar emailmarketing.email
      if (contacts.length === 0) {
        const legacyRes = await fetch(
          `${url}/rest/v1/email?directorio_nombre=eq.${encodeURIComponent(cleanDirName)}&select=*&order=creado_en.desc`,
          { headers, cache: 'no-store' }
        )
        if (legacyRes.ok) {
          const legacyRows = await legacyRes.json()
          contacts = legacyRows.map((r: any) => ({
            id: r.id,
            email: r.email,
            nombre: r.nombre,
            estado: r.estado,
            ultimo_envio: r.ultimo_envio,
            creado_en: r.creado_en,
          }))
        }
      }
    } else {
      // Sin filtro de directorio: obtener todos los contactos canónicos
      const resAll = await fetch(`${url}/rest/v1/contactos?select=*&order=creado_en.desc`, {
        headers,
        cache: 'no-store',
      })
      if (resAll.ok) {
        contacts = await resAll.json()
      }
    }

    // Filtrar por término de búsqueda si existe
    if (q.trim()) {
      const searchLower = q.trim().toLowerCase()
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
    const { url, anonKey } = getEmailSupabaseConfig()
    const body = await request.json()

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
        
        // 1. Ingestar en modelo canónico (emailmarketing.contactos y directorio_contactos)
        await fetch(`${url}/rest/v1/rpc/ingestar_contacto`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_email: item.email,
            p_nombre: item.nombre || null,
            p_directorio_nombre: cleanDirectory,
          }),
        })

        // 2. Inserción paralela en tabla de respaldo (emailmarketing.email) para asegurar disponibilidad inmediata
        await fetch(`${url}/rest/v1/email`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
          body: JSON.stringify({
            email: item.email.trim(),
            nombre: item.nombre || null,
            directorio_nombre: cleanDirectory,
            estado: 'pendiente',
          }),
        })

        count++
      }
      return NextResponse.json({
        success: true,
        count,
        insertedCount: count,
        totalCount: count,
        message: `${count} contactos agregados exitosamente al directorio "${cleanDirectory}".`,
      })
    }

    // CASO B: Envío de contacto único ({ email, nombre })
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

    await fetch(`${url}/rest/v1/email`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify({
        email: body.email.trim(),
        nombre: body.nombre || null,
        directorio_nombre: cleanDirectory,
        estado: 'pendiente',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const contactoId = await res.json()
    return NextResponse.json({ success: true, contacto_id: contactoId, message: 'Contacto agregado exitosamente' })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getEmailSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de contacto requerido' }, { status: 400 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    await fetch(`${url}/rest/v1/contactos?id=eq.${id}`, { method: 'DELETE', headers })
    await fetch(`${url}/rest/v1/email?id=eq.${id}`, { method: 'DELETE', headers })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
