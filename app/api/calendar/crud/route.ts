import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

/**
 * API Segura de Operaciones CRUD para el Esquema `calendario` en Supabase PostgreSQL.
 * Cumple con la Regla 5 (Nomenclatura por Esquemas: `calendario.eventos` / `calendario.prospectos`)
 * y Regla 6 (Zero Hardcoded Secrets).
 */

export async function GET(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)

    const estadoFilter = searchParams.get('estado')
    const searchFilter = searchParams.get('search')

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // Query eventos from Supabase PostgreSQL
    let queryUrl = `${url}/rest/v1/eventos?select=id,titulo,descripcion,meet_link,estado,resultado_comercial,recordatorio_30m_enviado,creado_en,prospecto_id,fecha_cita,hora_cita,prospectos(id,name,email,company,phone,topic,acepta_tratamiento_datos,created_at)&order=creado_en.desc`

    if (estadoFilter && estadoFilter !== 'todos') {
      queryUrl += `&estado=eq.${encodeURIComponent(estadoFilter)}`
    }

    const res = await fetch(queryUrl, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[CALENDAR CRUD GET ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error al consultar agendamientos de la base de datos' }, { status: 500 })
    }

    const eventos = await res.json()

    // Map and normalize records
    const records = eventos.map((evt: any) => ({
      id: evt.id,
      titulo: evt.titulo || 'Cita Consultiva 45M',
      descripcion: evt.descripcion || 'Sesión de asesoría sobre IA agéntica y prospección',
      meetLink: evt.meet_link || 'https://meet.google.com/new',
      estado: evt.estado || 'agendado', // 'agendado', 'cumplida', 'no_asistio', 'cancelada'
      resultadoComercial: evt.resultado_comercial || 'pendiente',
      recordatorioEnviado: !!evt.recordatorio_30m_enviado,
      creadoEn: evt.creado_en,
      fechaCita: evt.fecha_cita || new Date(evt.creado_en).toISOString().split('T')[0],
      horaCita: evt.hora_cita || new Date(evt.creado_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      prospecto: {
        id: evt.prospectos?.id || 'n/a',
        nombre: evt.prospectos?.name || 'Cliente Potencial',
        email: evt.prospectos?.email || 'contacto@empresa.com',
        empresa: evt.prospectos?.company || 'Empresa Privada',
        telefono: evt.prospectos?.phone || '+57 300 000 0000',
        tema: evt.prospectos?.topic || 'Unidad Agéntica de Crecimiento',
        aceptaTratamientoDatos: evt.prospectos?.acepta_tratamiento_datos ?? true,
      },
    }))

    // Apply client-side search filter if present
    const filteredRecords = searchFilter
      ? records.filter(
          (r: any) =>
            r.prospecto.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
            r.prospecto.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
            r.prospecto.empresa.toLowerCase().includes(searchFilter.toLowerCase()) ||
            r.titulo.toLowerCase().includes(searchFilter.toLowerCase())
        )
      : records

    return NextResponse.json({ success: true, count: filteredRecords.length, records: filteredRecords }, { status: 200 })
  } catch (error: any) {
    console.error('[CALENDAR CRUD GET EXCEPTION]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}

// POST: Crear nuevo agendamiento en el esquema `calendario`
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()

    const { nombre, email, empresa, telefono, tema, fecha, hora } = body

    if (!nombre || !email) {
      return NextResponse.json({ success: false, error: 'Nombre y Email son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // 1. Insert prospecto in `calendario.prospectos`
    const prospectoRes = await fetch(`${url}/rest/v1/prospectos`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        name: nombre,
        email,
        company: empresa || 'Empresa Privada',
        phone: telefono || '',
        topic: tema || 'Consultoría Agéntica 45M',
        acepta_tratamiento_datos: true,
      }),
    })

    if (!prospectoRes.ok) {
      const errText = await prospectoRes.text()
      console.error('[CREATE PROSPECTO ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error al registrar prospecto en Supabase' }, { status: 500 })
    }

    const prospectoData = await prospectoRes.json()
    const prospectoId = prospectoData[0]?.id

    // 2. Generate Google Meet link or mock link
    const meetLink = `https://meet.google.com/smart-${Math.random().toString(36).substring(2, 7)}`

    // 3. Insert evento in `calendario.eventos`
    const eventoRes = await fetch(`${url}/rest/v1/eventos`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        titulo: `Cita 45M: ${tema || 'Consultoría IA'} - ${nombre}`,
        descripcion: `Sesión de agendamiento para la empresa ${empresa || 'Cliente'}`,
        meet_link: meetLink,
        estado: 'agendado',
        prospecto_id: prospectoId,
        fecha_cita: fecha || new Date().toISOString().split('T')[0],
        hora_cita: hora || '10:00 AM',
      }),
    })

    if (!eventoRes.ok) {
      const errText = await eventoRes.text()
      console.error('[CREATE EVENTO ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error al registrar cita en Supabase' }, { status: 500 })
    }

    const eventoData = await eventoRes.json()

    return NextResponse.json({ success: true, message: 'Agendamiento registrado exitosamente', record: eventoData[0] }, { status: 201 })
  } catch (error: any) {
    console.error('[CALENDAR CRUD POST EXCEPTION]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error interno al crear agendamiento' }, { status: 500 })
  }
}

// PUT: Actualizar estado de cita (cumplida, no_asistio, cancelada, etc.)
export async function PUT(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()

    const { id, estado, resultadoComercial } = body

    if (!id || !estado) {
      return NextResponse.json({ success: false, error: 'ID y estado son obligatorios' }, { status: 400 })
    }

    const res = await fetch(`${url}/rest/v1/eventos?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        estado,
        resultado_comercial: resultadoComercial || 'procesado',
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[CALENDAR CRUD PUT ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error actualizando estado en Supabase' }, { status: 500 })
    }

    const updated = await res.json()
    return NextResponse.json({ success: true, message: 'Estado actualizado correctamente', record: updated[0] }, { status: 200 })
  } catch (error: any) {
    console.error('[CALENDAR CRUD PUT EXCEPTION]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error al actualizar cita' }, { status: 500 })
  }
}

// DELETE: Eliminar o cancelar cita
export async function DELETE(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es obligatorio' }, { status: 400 })
    }

    const res = await fetch(`${url}/rest/v1/eventos?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Error al eliminar cita de la base de datos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Agendamiento eliminado correctamente' }, { status: 200 })
  } catch (error: any) {
    console.error('[CALENDAR CRUD DELETE EXCEPTION]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error al eliminar agendamiento' }, { status: 500 })
  }
}
