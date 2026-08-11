import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { send30MinReminderEmail } from '@/lib/gmail-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secretParam = searchParams.get('secret')
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.CRON_SECRET || 'smartcontacts-cron-secret-2026'

    const isAuthValid =
      secretParam === expectedSecret ||
      authHeader === `Bearer ${expectedSecret}` ||
      process.env.NODE_ENV === 'development'

    if (!isAuthValid) {
      return NextResponse.json({ error: 'Acceso no autorizado al servicio de recordatorios' }, { status: 401 })
    }

    const { url, anonKey } = getSupabaseConfig()
    const rpcUrl = `${url}/rest/v1/rpc/obtener_eventos_pendientes_recordatorio`

    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!rpcRes.ok) {
      const errText = await rpcRes.text()
      console.error('[CRON REMINDERS RPC ERROR]', rpcRes.status, errText)
      return NextResponse.json({ error: 'Error consultando eventos pendientes' }, { status: 500 })
    }

    const pendingEvents: Array<{
      evento_id: string
      prospecto_id: string
      titulo: string
      inicio: string
      meet_link: string
      email: string
      nombre: string
      empresa: string
    }> = await rpcRes.json()

    if (!Array.isArray(pendingEvents) || pendingEvents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay eventos pendientes de recordatorio en los próximos 30 minutos',
        processedCount: 0,
      }, { status: 200 })
    }

    const results = []

    for (const evt of pendingEvents) {
      const dateObj = new Date(evt.inicio)
      const hoursStr = String(dateObj.getHours()).padStart(2, '0')
      const minutesStr = String(dateObj.getMinutes()).padStart(2, '0')
      const timeStr = `${hoursStr}:${minutesStr} (Hora Colombia)`

      const sendRes = await send30MinReminderEmail({
        toEmail: evt.email,
        toName: evt.nombre || 'Cliente',
        title: evt.titulo || 'Asesoría Estratégica Smartcontacts',
        timeStr,
        meetLink: evt.meet_link || 'https://meet.google.com/smartcontacts-asesoria',
      })

      if (sendRes.success) {
        // Mark as sent in Supabase PostgreSQL
        const markRpcUrl = `${url}/rest/v1/rpc/marcar_recordatorio_enviado`
        await fetch(markRpcUrl, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_evento_id: evt.evento_id }),
          cache: 'no-store',
        })

        results.push({ evento_id: evt.evento_id, email: evt.email, status: 'enviado' })
      } else {
        results.push({ evento_id: evt.evento_id, email: evt.email, status: 'fallido', error: sendRes.error })
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      results,
    }, { status: 200 })

  } catch (error: any) {
    console.error('[CRON REMINDERS EXCEPTION]', error)
    return NextResponse.json({ error: error.message || 'Error inesperado procesando recordatorios' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return GET(request)
}
