import { NextResponse } from 'next/server'
import { getEmailSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function POST(request: Request) {
  try {
    const { url, anonKey } = getEmailSupabaseConfig()
    const body = await request.json()
    const { contacts, categoryName } = body

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0 || !categoryName) {
      return NextResponse.json({ success: false, error: 'Lista de contactos y directorio requeridos' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const cleanDirectory = categoryName.trim()
    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    // Ingestar contactos usando rpc o transacciones por lotes
    let processedCount = 0
    const chunkSize = 100

    for (let i = 0; i < contacts.length; i += chunkSize) {
      const chunk = contacts.slice(i, i + chunkSize)
      await Promise.all(
        chunk.map((item: any) =>
          fetch(`${url}/rest/v1/rpc/ingestar_contacto`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              p_email: item.email,
              p_nombre: item.nombre || null,
              p_directorio_nombre: cleanDirectory,
            }),
          })
        )
      )
      processedCount += chunk.length
    }

    return NextResponse.json({
      success: true,
      insertedCount: processedCount,
      duplicateCount: 0,
      totalCount: contacts.length,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
