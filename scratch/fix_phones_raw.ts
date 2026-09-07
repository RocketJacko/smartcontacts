import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function fixPhones() {
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

  // Actualizar F2:F5 con RAW para que Google Sheets no ejecute como fórmula
  const phones = [
    ['+57 310 445 8821'],
    ['+57 320 612 9944'],
    ['+57 301 773 1155'],
    ['+57 315 889 2200'],
  ]

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!F2:F5?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: phones,
      }),
    }
  )

  console.log('Update F2:F5 status:', updateRes.status)

  // También actualizar las filas 2, 3, 4 para que tengan la columna Resultado Comercial
  const resultsL = [
    ['Pendiente de Diagnóstico'],
    ['En Negociación / Propuesta'],
    ['Adquirido / Cerrado Ganado'],
  ]

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!L2:L4?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: resultsL,
      }),
    }
  )

  // Verificar cómo quedaron los valores
  const checkRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A1:M5`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  )
  const checkData = await checkRes.json()
  console.log('Filas resultantes en Google Sheets:')
  checkData.values?.forEach((row: any[], i: number) => {
    console.log(`Fila ${i + 1}: ${row[3] || 'HEADER'} | Teléfono: ${row[5]} | Resultado: ${row[11]}`)
  })
}

fixPhones().catch(console.error)
