import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const directorioNombre = searchParams.get('directorio_nombre')

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    let endpoint = `${url}/rest/v1/campanas?select=id,nombre,descripcion,estado,directorio_id,remitente,mascara_remitente,drip_min,drip_max,creado_en&order=creado_en.desc`
    
    if (directorioNombre) {
      const dirRes = await fetch(`${url}/rest/v1/directorios?nombre=eq.${encodeURIComponent(directorioNombre.trim())}&select=id`, {
        headers,
        cache: 'no-store',
      })
      if (dirRes.ok) {
        const rows = await dirRes.json()
        if (rows.length > 0) {
          endpoint += `&directorio_id=eq.${rows[0].id}`
        }
      }
    }

    const res = await fetch(endpoint, { headers, cache: 'no-store' })
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const campanas = await res.json()
    return NextResponse.json({ success: true, campanas })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { nombre, descripcion = '', directorio_nombre, remitente, mascara_remitente, drip_min, drip_max } = body

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre de la campaña es obligatorio' }, { status: 400 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
      Prefer: 'return=representation',
    }

    // 1. Resolver ID del directorio si existe
    let directorioId: string | null = null
    if (directorio_nombre) {
      const dirRes = await fetch(`${url}/rest/v1/directorios?nombre=eq.${encodeURIComponent(directorio_nombre.trim())}&select=id`, {
        headers,
        cache: 'no-store',
      })
      if (dirRes.ok) {
        const rows = await dirRes.json()
        if (rows.length > 0) directorioId = rows[0].id
      }
    }

    // 2. Insertar campaña
    const res = await fetch(`${url}/rest/v1/campanas`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        directorio_id: directorioId,
        remitente: remitente || 'jesus.carmona966@pascualbravo.edu.co',
        mascara_remitente: mascara_remitente || 'Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>',
        drip_min: drip_min || 3.0,
        drip_max: drip_max || 5.0,
        estado: 'borrador',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ success: false, error: err }, { status: res.status })
    }

    const created = await res.json()
    const campana = created[0]

    // 3. Sincronizar destinatarios congelados para la campaña
    if (campana && campana.id) {
      await fetch(`${url}/rest/v1/rpc/sincronizar_destinatarios_campana`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_campana_id: campana.id }),
      })
    }

    return NextResponse.json({ success: true, campana })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
