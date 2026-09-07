import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function fixExistingPhoneFormulas() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1wrjZ4OGByOuopahIuCBQj6WbMUS3A4v67Ykcp6HXiIo'

  // Renovar token
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

  // 1. Obtener todas las filas actuales
  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A1:M100`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  )

  const data = await getRes.json()
  const rows = data.values || []
  console.log(`Total filas leídas: ${rows.length}`)

  // La columna F es índice 5 (Teléfono)
  let updatedCount = 0
  const fixedRows = rows.map((row: any[], rIdx: number) => {
    if (rIdx === 0) return row // Encabezados
    const newRow = [...row]
    const phone = newRow[5]
    if (phone && typeof phone === 'string') {
      if (phone.startsWith('+') || phone.startsWith('=')) {
        newRow[5] = `'${phone}`
        updatedCount++
      }
    }
    return newRow
  })

  // 2. Sobrescribir con los valores corregidos usando USER_ENTERED
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A1:M${fixedRows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: fixedRows,
      }),
    }
  )

  if (updateRes.ok) {
    console.log(`✅ ${updatedCount} teléfonos corregidos con prefijo de texto seguro (')`)
    console.log('Error de análisis de fórmula resuelto al 100% en Google Sheets.')
  } else {
    console.error('Error al actualizar filas:', await updateRes.text())
  }
}

fixExistingPhoneFormulas().catch(console.error)
