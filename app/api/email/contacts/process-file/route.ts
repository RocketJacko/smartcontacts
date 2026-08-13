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

    const lines = textContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
    if (lines.length === 0) {
      return NextResponse.json({ success: false, error: 'El archivo está vacío' }, { status: 400 })
    }

    let startIndex = 0
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
      startIndex = 1
    } else {
      emailIdx = 0
    }

    const parsedContacts: any[] = []
    const cleanCategory = campana_nombre.trim()

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
          campana_nombre: cleanCategory,
          estado: 'pendiente',
        })
      }
    }

    if (parsedContacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron registros de correos electrónicos válidos en el archivo' }, { status: 400 })
    }

    // Auto-registrar la categoría en public.campanas
    try {
      await fetch(`${url}/rest/v1/campanas`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          nombre: cleanCategory,
          descripcion: 'Categoría auto-registrada desde archivo masivo',
          estado: 'activa',
        }),
      })
    } catch {
      // Silencioso
    }

    const BATCH_SIZE = 2000
    let totalInserted = 0
    let totalDuplicates = 0
    const duplicateEmailList: string[] = []
    let finalTotalDirectory = 0

    for (let i = 0; i < parsedContacts.length; i += BATCH_SIZE) {
      const batch = parsedContacts.slice(i, i + BATCH_SIZE)
      
      const rpcRes = await fetch(`${url}/rest/v1/rpc/insertar_contactos_masivos`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_campana_nombre: cleanCategory,
          p_contactos: batch,
        }),
      })

      if (rpcRes.ok) {
        const result = await rpcRes.json()
        totalInserted += result.insertados || 0
        totalDuplicates += result.omitidos || 0
        if (result.duplicados && Array.isArray(result.duplicados)) {
          duplicateEmailList.push(...result.duplicados)
        }
        if (result.total_directorio) {
          finalTotalDirectory = result.total_directorio
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedTotal: parsedContacts.length,
      insertedCount: totalInserted,
      duplicateCount: totalDuplicates,
      totalDirectoryCount: finalTotalDirectory,
      duplicateEmails: duplicateEmailList,
      message: `Procesamiento en servidor completado: ${totalInserted} nuevos contactos registrados, ${totalDuplicates} omitidos por ya existir en la categoría.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error en servidor' }, { status: 500 })
  }
}
