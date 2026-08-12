/**
 * Servicio Independiente para Monitoreo de APIs de Google Workspace & Google Cloud.
 *
 * Muestra las métricas operacionales de:
 * 1. Gmail API (gmail.googleapis.com)
 * 2. Google Meet API (meet / calendar conferenceData)
 * 3. Google Calendar API (calendar.googleapis.com)
 * 4. Google Sheets API (sheets.googleapis.com)
 */

export interface GoogleApiMetric {
  service: string
  name: string
  requestCount: number
  quotaLimit: number
  quotaUsedPercentage: number
  status: 'OPERACIONAL' | 'DEGRADADO'
}

export interface GoogleMetricsResponse {
  success: boolean
  timestamp: string
  projectId: string
  apis: {
    gmail: GoogleApiMetric
    meet: GoogleApiMetric
    calendar: GoogleApiMetric
    sheets: GoogleApiMetric
  }
  recentEvents: Array<{
    time: string
    title: string
    service: string
    meetLink?: string
  }>
}

export async function fetchGoogleMetrics(): Promise<GoogleMetricsResponse> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'auto-n8n-123456-a1'
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN

  let gmailSent = 0
  let calendarEventsCount = 0
  let meetLinksCount = 0
  let sheetsRequestsCount = 0
  let status: 'OPERACIONAL' | 'DEGRADADO' = 'OPERACIONAL'
  const recentEvents: Array<{ time: string; title: string; service: string; meetLink?: string }> = []

  if (clientId && clientSecret && refreshToken) {
    try {
      // Refresh Access Token
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
        const now = new Date()

        // 1. Gmail API sent count
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayQuery = `after:${year}/${month}/${day} label:SENT`

        const gmailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(todayQuery)}`,
          {
            headers: { Authorization: `Bearer ${access_token}` },
            cache: 'no-store',
          }
        )

        if (gmailRes.ok) {
          const gmailData = await gmailRes.json()
          gmailSent = gmailData.messages ? gmailData.messages.length : (gmailData.resultSizeEstimate ?? 0)
        }

        // 2. Google Calendar API events & Meet links count
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        const timeMin = todayStart.toISOString()

        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true`,
          {
            headers: { Authorization: `Bearer ${access_token}` },
            cache: 'no-store',
          }
        )

        if (calRes.ok) {
          const calData = await calRes.json()
          const items = calData.items || []
          calendarEventsCount = items.length
          meetLinksCount = items.filter((item: any) => item.hangoutLink || item.conferenceData).length

          items.forEach((item: any) => {
            const timeStr = item.created ? new Date(item.created).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'
            recentEvents.push({
              time: timeStr,
              title: item.summary || 'Cita Agendada',
              service: 'Google Calendar API',
              meetLink: item.hangoutLink || undefined,
            })
          })
        }

        // 3. Google Cloud Monitoring API for Sheets request_count
        try {
          const startTimeIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          const sheetsFilter = 'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.labels.service="sheets.googleapis.com"'
          const monitoringSheetsUrl = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?filter=${encodeURIComponent(sheetsFilter)}&interval.startTime=${encodeURIComponent(startTimeIso)}&interval.endTime=${encodeURIComponent(now.toISOString())}`

          const sheetsMonitoringRes = await fetch(monitoringSheetsUrl, {
            headers: { Authorization: `Bearer ${access_token}` },
            cache: 'no-store',
          })

          if (sheetsMonitoringRes.ok) {
            const mData = await sheetsMonitoringRes.json()
            if (mData.timeSeries && Array.isArray(mData.timeSeries)) {
              mData.timeSeries.forEach((series: any) => {
                if (series.points) {
                  series.points.forEach((pt: any) => {
                    sheetsRequestsCount += parseInt(pt.value?.int64Value || 0, 10)
                  })
                }
              })
            }
          }
        } catch (mErr) {
          console.warn('[SHEETS CLOUD MONITORING WARN]', mErr)
        }
      }
    } catch (err) {
      console.error('[FETCH GOOGLE METRICS ERROR]', err)
      status = 'DEGRADADO'
    }
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    projectId,
    apis: {
      gmail: {
        service: 'gmail.googleapis.com',
        name: 'Gmail API',
        requestCount: gmailSent,
        quotaLimit: 2000,
        quotaUsedPercentage: Math.min(100, Number(((gmailSent / 2000) * 100).toFixed(1))),
        status,
      },
      meet: {
        service: 'meet.googleapis.com',
        name: 'Google Meet API',
        requestCount: meetLinksCount,
        quotaLimit: 500,
        quotaUsedPercentage: Math.min(100, Number(((meetLinksCount / 500) * 100).toFixed(1))),
        status,
      },
      calendar: {
        service: 'calendar.googleapis.com',
        name: 'Google Calendar API',
        requestCount: calendarEventsCount,
        quotaLimit: 1000,
        quotaUsedPercentage: Math.min(100, Number(((calendarEventsCount / 1000) * 100).toFixed(1))),
        status,
      },
      sheets: {
        service: 'sheets.googleapis.com',
        name: 'Google Sheets API',
        requestCount: sheetsRequestsCount,
        quotaLimit: 500,
        quotaUsedPercentage: Math.min(100, Number(((sheetsRequestsCount / 500) * 100).toFixed(1))),
        status,
      },
    },
    recentEvents: recentEvents.slice(0, 10),
  }
}
