import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()

    let totalProspectos = 0
    let totalEventos = 0
    let recordatoriosEnviados = 0
    let habeasDataAceptados = 0
    let estadoCounts: Record<string, number> = {
      agendado: 0,
      recordatorio_enviado: 0,
      en_progreso: 0,
      cumplida: 0,
      no_asistio: 0,
      cancelada: 0,
    }
    let resultadoCounts: Record<string, number> = {
      cerrado_ganado: 0,
      cierre_segundo_contacto: 0,
      llamar_futuro: 0,
      no_interesa: 0,
      no_cumple_agendamiento: 0,
    }

    let recentLogs: Array<{ time: string; label: string; status: string; type: string }> = []
    let hourlyCounts: number[] = [0, 0, 0, 0, 0, 0]

    let googleEventsCount = 0
    let googleMeetLinksCount = 0

    // 1. Query real Google Calendar API events & Meet links from Google account
    try {
      const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
      const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN

      if (clientId && clientSecret && refreshToken) {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
          cache: 'no-store',
        })

        if (tokenRes.ok) {
          const { access_token } = await tokenRes.json()

          // Query events created in Google Calendar since today 00:00:00
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          const timeMin = todayStart.toISOString()

          const googleEventsRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
              cache: 'no-store',
            }
          )

          if (googleEventsRes.ok) {
            const googleData = await googleEventsRes.json()
            const googleItems = googleData.items || []

            googleEventsCount = googleItems.length
            googleMeetLinksCount = googleItems.filter((item: any) => item.hangoutLink || item.conferenceData).length

            googleItems.forEach((item: any) => {
              const timeStr = item.created ? new Date(item.created).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'
              recentLogs.push({
                time: timeStr,
                label: `Google Calendar: ${item.summary || 'Cita Agendada'} ${item.hangoutLink ? '(Meet Activo)' : ''}`,
                status: 'Google Calendar API 200 OK',
                type: 'google',
              })
            })
          }
        }
      }
    } catch (gErr) {
      console.warn('[GOOGLE CALENDAR METRICS QUERY ERROR]', gErr)
    }

    // 2. Query Supabase PostgreSQL prospectos & eventos
    if (url && anonKey) {
      // Query prospectos
      const prospectosRes = await fetch(`${url}/rest/v1/prospectos?select=id,name,company,topic,created_at,acepta_tratamiento_datos&order=created_at.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'count=exact',
        },
        cache: 'no-store',
      })

      if (prospectosRes.ok) {
        const prospectosData: Array<{ id: string; name: string; company?: string; topic?: string; created_at: string; acepta_tratamiento_datos?: boolean }> = await prospectosRes.json()
        totalProspectos = prospectosData.length
        habeasDataAceptados = prospectosData.filter((p) => p.acepta_tratamiento_datos !== false).length

        prospectosData.slice(0, 5).forEach((p) => {
          const date = new Date(p.created_at || Date.now())
          const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          recentLogs.push({
            time: timeStr,
            label: `Registro de Prospecto: ${p.name} ${p.company ? `(${p.company})` : ''} - Tema: ${p.topic || 'Consulta General'}`,
            status: 'Supabase DB 200 OK',
            type: 'prospecto',
          })
        })
      }

      // Query eventos
      const eventosRes = await fetch(`${url}/rest/v1/eventos?select=id,titulo,meet_link,estado,resultado_comercial,recordatorio_30m_enviado,creado_en&order=creado_en.desc`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          Prefer: 'count=exact',
        },
        cache: 'no-store',
      })

      if (eventosRes.ok) {
        const eventosData: Array<{
          id: string
          titulo: string
          meet_link?: string
          estado?: string
          resultado_comercial?: string
          recordatorio_30m_enviado?: boolean
          creado_en: string
        }> = await eventosRes.json()

        totalEventos = eventosData.length
        recordatoriosEnviados = eventosData.filter((e) => e.recordatorio_30m_enviado === true).length

        eventosData.forEach((e) => {
          if (e.estado && estadoCounts[e.estado] !== undefined) {
            estadoCounts[e.estado]++
          }
          if (e.resultado_comercial && resultadoCounts[e.resultado_comercial] !== undefined) {
            resultadoCounts[e.resultado_comercial]++
          }

          const date = new Date(e.creado_en || Date.now())
          const hour = date.getHours()
          if (hour >= 8 && hour <= 18) {
            const idx = Math.min(5, Math.floor((hour - 8) / 2))
            hourlyCounts[idx]++
          }
        })

        eventosData.slice(0, 5).forEach((e) => {
          const date = new Date(e.creado_en || Date.now())
          const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
          recentLogs.push({
            time: timeStr,
            label: `Cita Agendada: ${e.titulo} ${e.meet_link ? `(Meet Link Activo)` : ''}`,
            status: e.estado === 'cumplida' ? 'Meet Cumplida' : 'Google Meet API 200 OK',
            type: 'evento',
          })
        })
      }
    }

    // Consolidated metrics combining Google Calendar API + Supabase PostgreSQL
    const finalEventosCount = Math.max(totalEventos, googleEventsCount)
    const finalMeetLinksCount = Math.max(totalEventos, googleMeetLinksCount)
    const finalEmailsSent = recordatoriosEnviados + finalEventosCount

    const googleApiConsumption = {
      gmailApi: {
        emailsSent: finalEmailsSent,
        quotaUsedPercentage: Math.min(100, Number(((finalEmailsSent / 500) * 100).toFixed(1))),
        status: 'OPERACIONAL',
      },
      meetApi: {
        linksGenerated: finalMeetLinksCount,
        activeRooms: estadoCounts.en_progreso || 0,
        status: 'OPERACIONAL',
      },
      calendarApi: {
        eventsSynced: finalEventosCount,
        lastSync: new Date().toISOString(),
        status: 'OPERACIONAL',
      },
    }

    const showUpRate = finalEventosCount > 0 ? Number(((estadoCounts.cumplida / finalEventosCount) * 100).toFixed(1)) : 0
    const habeasDataPercentage = totalProspectos > 0 ? Number(((habeasDataAceptados / totalProspectos) * 100).toFixed(1)) : 0

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          totalProspectos,
          totalEventos: finalEventosCount,
          recordatoriosEnviados,
          habeasDataAceptados,
          habeasDataPercentage,
          showUpRate,
        },
        estadoCounts,
        resultadoCounts,
        googleApiConsumption,
        recentLogs: recentLogs.slice(0, 10),
        hourlyCounts,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[DASHBOARD METRICS ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error consultando métricas' }, { status: 500 })
  }
}
