import fs from 'fs'
import path from 'path'

export interface GoogleSheetBookingRow {
  id?: string
  fecha: string
  hora: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  servicio?: string
  meetLink?: string
  googleEventId?: string
  estado?: string
  fechaRegistro?: string
}

export interface AppendSheetResult {
  success: boolean
  spreadsheetId?: string
  spreadsheetUrl?: string
  updatedRange?: string
  error?: string
}

const SHEET_TITLE = 'Citas'
const SPREADSHEET_NAME = 'Smartcontacts — Registro Oficial de Citas & Leads'
const HEADERS = [
  'ID Cita',
  'Fecha Cita',
  'Hora Cita',
  'Nombre Prospecto',
  'Email',
  'Teléfono',
  'Empresa',
  'Servicio / Tema',
  'Enlace Google Meet',
  'Google Calendar Event ID',
  'Estado',
  'Fecha de Registro',
]

/**
 * Obtiene el access_token OAuth2 renovado usando las credenciales de Google Workspace
 */
async function getGoogleSheetsAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || ''
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN || ''

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Credenciales de Google incompletas en variables de entorno (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).')
  }

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
    throw new Error(`Error al renovar token OAuth2 para Google Sheets: ${errorText}`)
  }

  const data = await res.json()
  return data.access_token
}

/**
 * Crea una nueva hoja de cálculo en Google Sheets con la estructura y encabezados requeridos
 */
async function createBookingsSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_NAME,
      },
      sheets: [
        {
          properties: {
            title: SHEET_TITLE,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Error al crear hoja de cálculo en Google Sheets: ${errText}`)
  }

  const data = await res.json()
  const spreadsheetId = data.spreadsheetId
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`

  // Insertar encabezados en la primera fila
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TITLE}!A1:L1`)}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [HEADERS],
    }),
  })

  // Persistir en .env.local si estamos en desarrollo
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8')
      if (envContent.includes('GOOGLE_SPREADSHEET_ID=')) {
        envContent = envContent.replace(/GOOGLE_SPREADSHEET_ID=.*/, `GOOGLE_SPREADSHEET_ID=${spreadsheetId}`)
      } else {
        envContent += `\nGOOGLE_SPREADSHEET_ID=${spreadsheetId}\n`
      }
      fs.writeFileSync(envPath, envContent, 'utf8')
    }
    process.env.GOOGLE_SPREADSHEET_ID = spreadsheetId
  } catch (err) {
    console.warn('[GOOGLE SHEETS ENV PERSISTENCE WARN]', err)
  }

  return { id: spreadsheetId, url: spreadsheetUrl }
}

/**
 * Obtiene el ID del Google Spreadsheet configurado o lo inicializa automáticamente
 */
export async function getOrInitSpreadsheetId(accessToken: string): Promise<{ id: string; url: string }> {
  let spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (spreadsheetId) {
    // Validar si es accesible
    const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })

    if (checkRes.ok) {
      return {
        id: spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      }
    } else {
      console.warn(`[GOOGLE SHEETS] Spreadsheet ID configurado (${spreadsheetId}) no es accesible. Creando uno nuevo...`)
    }
  }

  return await createBookingsSpreadsheet(accessToken)
}

/**
 * Agrega un registro de cita o lead al Google Sheet oficial
 */
export async function appendBookingToGoogleSheet(booking: GoogleSheetBookingRow): Promise<AppendSheetResult> {
  try {
    const accessToken = await getGoogleSheetsAccessToken()
    const { id: spreadsheetId, url: spreadsheetUrl } = await getOrInitSpreadsheetId(accessToken)

    const rowValues = [
      booking.id || `CITA-${Date.now().toString().slice(-6)}`,
      booking.fecha,
      booking.hora,
      booking.nombre,
      booking.email,
      booking.telefono || 'Sin registrar',
      booking.empresa || 'Empresa privada',
      booking.servicio || 'Asesoría Estratégica Smartcontacts',
      booking.meetLink || 'N/A',
      booking.googleEventId || 'N/A',
      booking.estado || 'Confirmada',
      booking.fechaRegistro || new Date().toISOString(),
    ]

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(`${SHEET_TITLE}!A:L`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    )

    if (!appendRes.ok) {
      const errText = await appendRes.text()
      // Si la pestaña 'Citas' no existe en esa hoja, intentar agregar al rango general A:L
      if (errText.includes('Unable to parse range')) {
        const fallbackRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:L:append?valueInputOption=USER_ENTERED`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [rowValues],
            }),
          }
        )
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          return {
            success: true,
            spreadsheetId,
            spreadsheetUrl,
            updatedRange: fallbackData.updates?.updatedRange,
          }
        }
      }

      console.error('[GOOGLE SHEETS APPEND ERROR]', appendRes.status, errText)
      return {
        success: false,
        error: `Error al registrar en Google Sheets: ${errText}`,
        spreadsheetId,
        spreadsheetUrl,
      }
    }

    const appendData = await appendRes.json()

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      updatedRange: appendData.updates?.updatedRange,
    }

  } catch (error: any) {
    console.error('[GOOGLE SHEETS SERVICE EXCEPTION]', error)
    return {
      success: false,
      error: error.message || 'Error inesperado en servicio de Google Sheets',
    }
  }
}
