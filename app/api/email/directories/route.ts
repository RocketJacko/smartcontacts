import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET: Obtener lista de directorios registrados y activos (Esquema emailmarketing)
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // 1. Consultar tabla directorios en esquema emailmarketing
    let directories: any[] = []
    try {
      const res = await fetch(`${url}/rest/v1/directorios?select=*&order=creado_en.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
        },
        cache: 'no-store',
      })
      if (res.ok) {
        directories = await res.json()
      }
    } catch {
      directories = []
    }

    // 2. Consultar directorios distintos presentes en emailmarketing.email
    let contactRows: any[] = []
    try {
      const contactsRes = await fetch(`${url}/rest/v1/email?select=directorio_nombre`, {
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

    const directorySet = new Set<string>()
    if (Array.isArray(directories)) {
      directories.forEach((d: any) => {
        if (d.nombre) directorySet.add(d.nombre.trim())
      })
    }

    if (Array.isArray(contactRows)) {
      contactRows.forEach((r: any) => {
        if (r.directorio_nombre) directorySet.add(r.directorio_nombre.trim())
      })
    }

    if (directorySet.size === 0) {
      directorySet.add('Universidad Pascual Bravo')
      directorySet.add('Policía Nacional')
    }

    const mergedDirectories = Array.from(directorySet).map((nombre, index) => {
      const existing = directories.find((d: any) => d.nombre?.trim() === nombre)
      return existing || { id: `dir-${index}`, nombre }
    })

    return NextResponse.json({ success: true, directories: mergedDirectories })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Crear un nuevo directorio dinámicamente en esquema emailmarketing
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { nombre, descripcion } = body

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre del directorio es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const cleanName = nombre.trim()
    const payload = {
      nombre: cleanName,
      descripcion: descripcion ? descripcion.trim() : 'Directorio de contactos empresarial',
    }

    const insertRes = await fetch(`${url}/rest/v1/directorios`, {
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
      let userError = 'No se pudo registrar el directorio.'
      if (errText.includes('23505') || errText.includes('unique_directorio_nombre') || insertRes.status === 409) {
        userError = `Ya existe un directorio registrado con el nombre "${cleanName}".`
      }
      return NextResponse.json({ success: false, error: userError }, { status: 400 })
    }

    const insertedRows = await insertRes.json()
    return NextResponse.json({
      success: true,
      directory: insertedRows[0] || { nombre: cleanName },
      message: `Directorio "${cleanName}" registrado exitosamente.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
