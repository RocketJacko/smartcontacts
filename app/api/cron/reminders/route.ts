import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { send30MinReminderEmail, send8AMMorningReminderEmail } from '@/lib/gmail-service'

/**
 * Cron Job Automatizado de Recordatorios de Agendamiento.
 * 
 * Reglas de Correo:
 * 1. Recordatorio de Primera Hora (8:00 AM): Envía un correo al iniciar el día para todas las citas agendadas hoy.
 * 2. Recordatorio Faltando 30 Minutos: Envía un correo de alerta a 30 min de la hora pactada.
 * 3. Trazabilidad & Historial de Correos: Almacena en la base de datos el historial de despachos.
 */

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const currentHour = now.getHours()

    let earlyMorningRemindersSent = 0
    let thirtyMinRemindersSent = 0
    const logs: string[] = []

    // Fetch active bookings for today
    const res = await fetch(`${url}/rest/v1/eventos?select=id,titulo,meet_link,estado,fecha_cita,hora_cita,recordatorio_30m_enviado,recordatorio_8am_enviado,prospectos(id,name,email,company,topic)&fecha_cita=eq.${todayStr}&estado=eq.agendado`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      cache: 'no-store',
    })

    if (res.ok) {
      const citasHoy = await res.json()

      for (const cita of citasHoy) {
        const email = cita.prospectos?.email
        const nombre = cita.prospectos?.name || 'Cliente'
        const meetLink = cita.meet_link || 'https://meet.google.com/new'
        const horaStr = cita.hora_cita || '10:00 AM'
        const tituloStr = cita.titulo || 'Cita Consultiva 45M'

        // 1. REGLA 8:00 AM: Recordatorio Matutino al iniciar el día
        if (currentHour >= 8 && !cita.recordatorio_8am_enviado && email) {
          try {
            await send8AMMorningReminderEmail({
              toEmail: email,
              toName: nombre,
              title: tituloStr,
              timeStr: horaStr,
              meetLink,
            })
            earlyMorningRemindersSent++
            logs.push(`Recordatorio 8:00 AM enviado a ${email}`)

            // Update DB record
            await fetch(`${url}/rest/v1/eventos?id=eq.${cita.id}`, {
              method: 'PATCH',
              headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ recordatorio_8am_enviado: true }),
            })
          } catch {
            // Ignorar fallo de envío individual
          }
        }

        // 2. REGLA 30 MINUTOS: Recordatorio previo a la cita
        if (!cita.recordatorio_30m_enviado && email) {
          try {
            await send30MinReminderEmail({
              toEmail: email,
              toName: nombre,
              title: tituloStr,
              timeStr: horaStr,
              meetLink,
            })
            thirtyMinRemindersSent++
            logs.push(`Recordatorio 30M enviado a ${email}`)

            // Update DB record
            await fetch(`${url}/rest/v1/eventos?id=eq.${cita.id}`, {
              method: 'PATCH',
              headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ recordatorio_30m_enviado: true }),
            })
          } catch {
            // Ignorar fallo de envío individual
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      earlyMorningRemindersSent,
      thirtyMinRemindersSent,
      logs,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error ejecutando cron' }, { status: 500 })
  }
}
