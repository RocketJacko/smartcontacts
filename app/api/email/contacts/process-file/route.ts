import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export const maxDuration = 300 // 5 minutos de tiempo de ejecución para cargas masivas en servidor

// POST: Procesar archivo de contactos en servidor por lotes de 2,000 registros
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { fileUrl, rawContent, campana_nombre } = body

    if (!campana_nombre) {
      return NextResponse.json({ success: false, error: 'campana_nombre es obligatorio' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let textContent = ''

    if (fileUrl) {
      // Descargar el archivo almacenado en Supabase Storage
      const fetchFileRes = await fetch(fileUrl)
      if (!fetchFileRes.ok) {
        return NextResponse.json({ success: false, error: 'No se pudo descargar el archivo desde Supabase Storage' }, { status: 400 })
      }
      textContent = await fetchFileRes.text()
    } else if (rawContent) {
      textContent = rawContent
    } else {
      return NextResponse.json({ success: false, error: 'Se requiere fileUrl o rawContent' }, { status: 400 })
    }

    // Dividir en líneas
    const lines = textContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
    if (lines.length === 0) {
      return NextResponse.json({ success: false, error: 'El archivo está vacío' }, { status: 400 })
    }

    // Detección de encabezados (Fuzzy matching)
    let startIndex = 0
    const firstLineLower = lines[0].toLowerCase()
    let delimiter = ','
    if (lines[0].includes(';')) delimiter = ';'
    else if (lines[0].includes('\t')) delimiter = '\t'

    const headerParts = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ''))
    
    let emailIdx = -1
    let nombreIdx = -1
    let empresaIdx = -1
    let telefonoIdx = -1

    headerParts.forEach((part, idx) => {
      if (['email', 'correo', 'e-mail', 'mail', 'contacto'].includes(part)) emailIdx = idx
      else if (['nombre', 'name', 'full_name', 'prospecto'].includes(part)) nombreIdx = idx
      else if (['empresa', 'company', 'compañia', 'compañía', 'organization'].includes(part)) empresaIdx = idx
      else if (['telefono', 'teléfono', 'phone', 'celular', 'whatsapp', 'mobile'].includes(part)) telefonoIdx = idx
    })

    if (emailIdx !== -1) {
      startIndex = 1 // Hay encabezado
    } else {
      emailIdx = 0 // Asumir primera columna es email
    }

    const parsedContacts: any[] = []

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map((col) => col.trim().replace(/^["']|["']$/g, ''))
      const email = row[emailIdx]
      if (email && email.includes('@')) {
        const cleanEmail = email.toLowerCase()
        const nombre = nombreIdx !== -1 && row[nombreIdx] ? row[nombreIdx] : cleanEmail.split('@')[0]
        const empresa = empresaIdx !== -1 && row[empresaIdx] ? row[empresaIdx] : 'Empresa Privada'
        const telefono = telefonoIdx !== -1 && row[telefonoIdx] ? row[telefonoIdx] : ''

        parsedContacts.push({
          email: cleanEmail,
          nombre,
          empresa,
          telefono,
          campana_nombre: campana_nombre.trim(),
          estado: 'pendiente',
        })
      }
    }

    if (parsedContacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron registros de correos electrónicos válidos en el archivo' }, { status: 400 })
    }

    // Inserción en servidor en bloques de 2,000
    const BATCH_SIZE = 2000
    let totalInserted = 0

    for (let i = 0; i < parsedContacts.length; i += BATCH_SIZE) {
      const batch = parsedContacts.slice(i, i + BATCH_SIZE)
      
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
        body: JSON.stringify(batch),
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
          body: JSON.stringify(batch),
        })
      }

      if (insertRes.ok) {
        const insertedRows = await insertRes.json()
        totalInserted += insertedRows.length
      }
    }

    const duplicates = parsedContacts.length - totalInserted

    return NextResponse.json({
      success: true,
      processedTotal: parsedContacts.length,
      insertedCount: totalInserted,
      duplicateCount: duplicates,
      message: `Procesamiento en servidor completado: ${totalInserted} contactos procesados, ${duplicates} omitidos por duplicidad en la campaña.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
