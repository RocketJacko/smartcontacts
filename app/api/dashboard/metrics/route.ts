import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()

    let gmailSentToday = 0
    let googleEventsToday = 0
    let googleMeetLinksToday = 0
    let googleStatus = 'OPERACIONAL'

    let recentLogs: Array<{ time: string; label: string; status: string; type: string }> = []
    let hourlyCounts: number[] = [0, 0, 0, 0, 0, 0]

    let totalProspectos = 0
    let habeasDataAceptados = 0

    // ─── 1. PURE DIRECT GOOGLE APIS QUERY (EXCLUSIVELY FROM GOOGLE CLOUD) ─────
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

          // A) Query Gmail API directly for emails sent today
          const now = new Date()
          const todayUnixSeconds = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000)
          const todayQuery = `after:${todayUnixSeconds} in:sent`

          const gmailRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(todayQuery)}`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
              cache: 'no-store',
            }
          )

          if (gmailRes.ok) {
            const gmailData = await gmailRes.json()
            gmailSentToday = gmailData.messages ? gmailData.messages.length : (gmailData.resultSizeEstimate ?? 0)
          }

          // A.2) Query Google Cloud Monitoring API v3 (serviceruntime.googleapis.com/api/request_count)
          try {
            const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'auto-n8n-123456-a1'
            const nowIso = now.toISOString()
            const startTimeIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

            const gmailFilter = 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.labels.service="gmail.googleapis.com"'
            const monitoringUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?filter=${encodeURIComponent(gmailFilter)}&interval.startTime=${encodeURIComponent(startTimeIso)}&interval.endTime=${encodeURIComponent(nowIso)}`

            const monitoringRes = await fetch(monitoringUrl, {
              headers: { Authorization: `Bearer ${access_token}` },
              cache: 'no-store',
            })

            if (monitoringRes.ok) {
              const monitoringData = await monitoringRes.json()
              if (monitoringData.timeSeries && Array.isArray(monitoringData.timeSeries)) {
                let totalReqs = 0
                monitoringData.timeSeries.forEach((series: any) => {
                  if (series.points && Array.isArray(series.points)) {
                    series.points.forEach((pt: any) => {
                      totalReqs += parseInt(pt.value?.int64Value || pt.value?.doubleValue || 0, 10)
                    })
                  }
                })
                if (totalReqs > 0) gmailSentToday = totalReqs
              }
            }
          } catch (mErr) {
            console.warn('[CLOUD MONITORING API FETCH WARN]', mErr)
          }

          // B) Query Google Calendar API directly for events created today
          const todayStart = new Date()
          todayStart.setHours(0, 0, 0, 0)
          const timeMin = todayStart.toISOString()

          const calendarRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true`,
            {
              headers: { Authorization: `Bearer ${access_token}` },
              cache: 'no-store',
            }
          )

          if (calendarRes.ok) {
            const calendarData = await calendarRes.json()
            const items = calendarData.items || []

            googleEventsToday = items.length
            googleMeetLinksToday = items.filter((i: any) => i.hangoutLink || i.conferenceData).length

            items.forEach((item: any) => {
              const date = item.created ? new Date(item.created) : new Date()
              const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
              const hour = date.getHours()
              if (hour >= 8 && hour <= 18) {
                const idx = Math.min(5, Math.floor((hour - 8) / 2))
                hourlyCounts[idx]++
              }

              recentLogs.push({
                time: timeStr,
                label: `Google Calendar: ${item.summary || 'Cita Estudiantil / Comercial'} ${item.hangoutLink ? '(Enlace Meet Generado)' : ''}`,
                status: 'Google API 200 OK',
                type: 'google',
              })
            })
          }
        }
      }
    } catch (googleErr) {
      console.error('[DIRECT GOOGLE API ERROR]', googleErr)
      googleStatus = 'DEGRADADO'
    }

    // ─── 2. SEPARATE SUPABASE DB QUERY FOR HABEAS DATA & PROSPECTOS ONLY ──────
    if (url && anonKey) {
      try {
        const prospectosRes = await fetch(`${url}/rest/v1/prospectos?select=id,acepta_tratamiento_datos`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          cache: 'no-store',
        })

        if (prospectosRes.ok) {
          const prospectosData: Array<{ id: string; acepta_tratamiento_datos?: boolean }> = await prospectosRes.json()
          totalProspectos = prospectosData.length
          habeasDataAceptados = prospectosData.filter((p) => p.acepta_tratamiento_datos !== false).length
        }
      } catch (dbErr) {
        console.warn('[SUPABASE METRICS QUERY WARN]', dbErr)
      }
    }

    // Pure Google Cloud Metrics
    const googleApiConsumption = {
      gmailApi: {
        emailsSent: gmailSentToday,
        quotaUsedPercentage: Math.min(100, Number(((gmailSentToday / 2000) * 100).toFixed(1))),
        status: googleStatus,
      },
      meetApi: {
        linksGenerated: googleMeetLinksToday,
        activeRooms: 0,
        status: googleStatus,
      },
      calendarApi: {
        eventsSynced: googleEventsToday,
        lastSync: new Date().toISOString(),
        status: googleStatus,
      },
    }

    const habeasDataPercentage = totalProspectos > 0 ? Number(((habeasDataAceptados / totalProspectos) * 100).toFixed(1)) : 0

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          totalProspectos,
          totalEventos: googleEventsToday,
          recordatoriosEnviados: gmailSentToday,
          habeasDataAceptados,
          habeasDataPercentage,
          showUpRate: googleEventsToday > 0 ? 100 : 0,
        },
        googleApiConsumption,
        recentLogs: recentLogs.slice(0, 10),
        hourlyCounts,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[DASHBOARD METRICS ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error consultando métricas de Google' }, { status: 500 })
  }
}
