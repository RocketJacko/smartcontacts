export interface CalendarEventParams {
  summary: string
  description?: string
  date: string // YYYY-MM-DD
  time: string // HH:mm or "02:00 PM"
  attendeeEmail: string
  attendeeName?: string
}

export interface CalendarEventResult {
  success: boolean
  eventId?: string
  meetLink?: string
  htmlLink?: string
  error?: string
}

async function getCalendarAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID || 'your-google-client-id'
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || 'your-google-client-secret'
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || 'your-google-refresh-token'

  const res = await fetch('https://oauth2.googleapis.com/token', {
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

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Error al renovar token OAuth2 para Google Calendar: ${errorText}`)
  }

  const data = await res.json()
  return data.access_token
}

function parseDateTimeISO(dateStr: string, timeStr: string): { startISO: string; endISO: string } {
  let cleanDate = dateStr

  // Parse Spanish date format (e.g. "Jue, 20 de Agosto 2026" or "20 de Agosto 2026")
  if (cleanDate && !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    const spanishMatch = cleanDate.match(/(\d{1,2})\s+de\s+([A-Za-z]+)\s+(\d{4})/)
    if (spanishMatch) {
      const day = String(spanishMatch[1]).padStart(2, '0')
      const monthName = spanishMatch[2].toLowerCase()
      const year = spanishMatch[3]

      const monthsMap: Record<string, string> = {
        enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
        julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
      }

      const month = monthsMap[monthName] || '08'
      cleanDate = `${year}-${month}-${day}`
    }
  }

  if (!cleanDate || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    cleanDate = new Date().toISOString().split('T')[0]
  }

  // Parse time (e.g. "02:00 PM" or "14:00")
  let hours = 14
  let minutes = 0

  if (timeStr) {
    const isPM = timeStr.toUpperCase().includes('PM')
    const isAM = timeStr.toUpperCase().includes('AM')
    const match = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (match) {
      hours = parseInt(match[1], 10)
      minutes = parseInt(match[2], 10)
      if (isPM && hours < 12) hours += 12
      if (isAM && hours === 12) hours = 0
    }
  }

  const hoursStr = String(hours).padStart(2, '0')
  const minutesStr = String(minutes).padStart(2, '0')

  // Construct Colombia time string (UTC-5)
  const startISO = `${cleanDate}T${hoursStr}:${minutesStr}:00-05:00`

  // End time 1 hour later
  const startObj = new Date(startISO)
  const endObj = new Date(startObj.getTime() + 60 * 60 * 1000)
  
  // Format endObj back to Colombia ISO string
  const endHours = String(endObj.getHours()).padStart(2, '0')
  const endMinutes = String(endObj.getMinutes()).padStart(2, '0')
  const endDateStr = endObj.toISOString().split('T')[0]
  const endISO = `${endDateStr}T${endHours}:${endMinutes}:00-05:00`

  return { startISO, endISO }
}

export async function createGoogleCalendarEvent(params: CalendarEventParams): Promise<CalendarEventResult> {
  try {
    const accessToken = await getCalendarAccessToken()
    const { startISO, endISO } = parseDateTimeISO(params.date, params.time)

    const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    const eventPayload = {
      summary: params.summary,
      description: params.description || 'Asesoría Comercial Agendada a través de Smartcontacts',
      start: {
        dateTime: startISO,
        timeZone: 'America/Bogota',
      },
      end: {
        dateTime: endISO,
        timeZone: 'America/Bogota',
      },
      attendees: [
        { email: 'jesus.carmona966@pascualbravo.edu.co', responseStatus: 'accepted' },
        { email: params.attendeeEmail, displayName: params.attendeeName || params.attendeeEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: requestId,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    }

    const calendarRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    })

    if (!calendarRes.ok) {
      const errText = await calendarRes.text()
      console.error('[GOOGLE CALENDAR API ERROR]', calendarRes.status, errText)
      return { success: false, error: errText }
    }

    const eventData = await calendarRes.json()

    // Extract Google Meet link
    const meetLink = eventData.hangoutLink ||
                     eventData.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri ||
                     'https://meet.google.com'

    return {
      success: true,
      eventId: eventData.id,
      meetLink: meetLink,
      htmlLink: eventData.htmlLink,
    }

  } catch (error: any) {
    console.error('[GOOGLE CALENDAR SERVICE EXCEPTION]', error)
    return { success: false, error: error.message || 'Error al agendar en Google Calendar' }
  }
}
