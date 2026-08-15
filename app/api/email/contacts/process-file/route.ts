import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export const maxDuration = 300 // 5 minutos de tiempo de ejecución para cargas masivas en servidor

// POST: Procesar archivo de contactos (1 o 2 columnas) por lotes de 1,000 registros
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { campana_nombre, directorio_nombre, fileUrl, rawContent, emailColumnIndex } = body

    const cleanDirectory = (directorio_nombre || campana_nombre || '').trim()

    if (!cleanDirectory) {
      return NextResponse.json({ success: false, error: 'El nombre del directorio es obligatorio' }, { status: 400 })
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
    
    let emailIdx = typeof emailColumnIndex === 'number' ? emailColumnIndex : -1
    let nombreIdx = -1

    headerParts.forEach((part, idx) => {
      if (emailIdx === -1 && ['email', 'correo', 'e-mail', 'mail', 'contacto'].includes(part)) emailIdx = idx
      else if (['nombre', 'name', 'full_name', 'prospecto', 'contacto_nombre'].includes(part)) nombreIdx = idx
    })

    if (emailIdx !== -1) {
      startIndex = 1
    }

    const parsedContacts: any[] = []

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map((col) => col.trim().replace(/^["']|["']$/g, ''))
      
      // Buscar el correo en el índice especificado o en la celda con '@'
      let email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : row.find((cell) => cell.includes('@'))
      
      if (email && email.includes('@')) {
        const cleanEmail = email.toLowerCase()
        let nombreVal: string | null = null

        // Si hay 2 columnas o se detectó la columna nombre
        if (nombreIdx !== -1 && row[nombreIdx]) {
          nombreVal = row[nombreIdx]
        } else if (row.length === 2) {
          // Formato 2 columnas: (nombre, email) o (email, nombre)
          const otherCol = row[0].includes('@') ? row[1] : row[0]
          if (otherCol && !otherCol.includes('@')) {
            nombreVal = otherCol
          }
        }

        parsedContacts.push({
          email: cleanEmail,
          nombre: nombreVal ? nombreVal.trim() : null,
          campana_nombre: cleanDirectory,
          estado: 'pendiente',
        })
      }
    }

    if (parsedContacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No se encontraron correos electrónicos válidos en el archivo.' }, { status: 400 })
    }

    // Auto-registrar el directorio en emailmarketing.directorios
    try {
      await fetch(`${url}/rest/v1/directorios`, {
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
          descripcion: 'Directorio auto-registrado desde archivo masivo',
        }),
      })
    } catch {
      // Silencioso
    }

    const BATCH_SIZE = 1000
    let totalInserted = 0
    let totalDuplicates = 0
    const duplicateEmailList: string[] = []

    for (let i = 0; i < parsedContacts.length; i += BATCH_SIZE) {
      const batch = parsedContacts.slice(i, i + BATCH_SIZE)
      
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
        body: JSON.stringify(batch),
      })

      if (insertRes.ok) {
        const insertedData = await insertRes.json()
        const insertedRows = Array.isArray(insertedData) ? insertedData : []
        const numInserted = insertedRows.length
        totalInserted += numInserted
        const numDuplicates = batch.length - numInserted
        totalDuplicates += numDuplicates
        
        if (numDuplicates > 0) {
          const insertedEmailsSet = new Set(insertedRows.map((r: any) => r.email))
          batch.forEach((item: any) => {
            if (!insertedEmailsSet.has(item.email)) {
              duplicateEmailList.push(item.email)
            }
          })
        }
      } else {
        // Fallback RPC
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
        }
      }
    }

    // Obtener total exacto acumulado en el directorio
    let finalTotalDirectory = totalInserted
    try {
      const countRes = await fetch(`${url}/rest/v1/email?select=id&directorio_nombre=eq.${encodeURIComponent(cleanDirectory)}`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing',
          Prefer: 'count=exact',
        },
      })
      if (countRes.ok) {
        const contentRange = countRes.headers.get('content-range')
        if (contentRange) {
          const total = parseInt(contentRange.split('/')[1] || '0', 10)
          if (!isNaN(total) && total > 0) {
            finalTotalDirectory = total
          }
        }
      }
    } catch {
      // Silencioso
    }

    return NextResponse.json({
      success: true,
      processedTotal: parsedContacts.length,
      insertedCount: totalInserted,
      duplicateCount: totalDuplicates,
      totalDirectoryCount: finalTotalDirectory,
      duplicateEmails: duplicateEmailList,
      message: `Procesamiento en servidor completado: ${totalInserted} nuevos contactos registrados en el directorio, ${totalDuplicates} omitidos por ya existir.`,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Error en servidor' }, { status: 500 })
  }
}
