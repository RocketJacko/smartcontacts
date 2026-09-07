import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function normalizeSheetStatusesToLowerCase() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1wrjZ4OGByOuopahIuCBQj6WbMUS3A4v67Ykcp6HXiIo'

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId || '',
      client_secret: clientSecret || '',
      refresh_token: refreshToken || '',
      grant_type: 'refresh_token',
    }),
  })
  const { access_token } = await tokenRes.json()

  // Actualizar columnas K y L (Estado Cita y Resultado Comercial) a minúsculas estrictas
  // Fila 2: Sofía Restrepo
  // Fila 3: Carlos Mendoza
  // Fila 4: Valeria Duque
  // Fila 5: Mauricio Gómez
  const lowercaseStatuses = [
    ['agendado', 'pendiente'],
    ['agendado', 'en_negociacion'],
    ['cumplida', 'adquirido'],
    ['agendado', 'en_negociacion'],
  ]

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!K2:L5?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: lowercaseStatuses,
      }),
    }
  )

  console.log('Update K2:L5 status:', updateRes.status)

  // Verificar la hoja
  const checkRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A1:M5`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  )
  const checkData = await checkRes.json()
  console.log('\nFilas normalizadas en Google Sheets (Estricto minúsculas):')
  checkData.values?.forEach((row: any[], i: number) => {
    if (i > 0) {
      console.log(`Fila ${i + 1}: ${row[3]} | Estado: '${row[10]}' | Resultado Comercial: '${row[11]}'`)
    }
  })
}

normalizeSheetStatusesToLowerCase().catch(console.error)
