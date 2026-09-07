import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testSheetsAuth() {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN

  console.log('1. Verificando credenciales...')
  console.log('Client ID existe:', !!clientId)
  console.log('Client Secret existe:', !!clientSecret)
  console.log('Refresh Token existe:', !!refreshToken)

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

  if (!tokenRes.ok) {
    console.error('Error al obtener access token:', await tokenRes.text())
    return
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token
  console.log('Access token obtenido con éxito:', accessToken.substring(0, 15) + '...')

  // Probar crear o consultar Google Sheets
  console.log('2. Probando Google Sheets API v4 (creando una hoja de cálculo para Citas)...')
  const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Smartcontacts — Registro Oficial de Citas & Leads',
      },
      sheets: [
        {
          properties: {
            title: 'Citas',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  })

  if (!createSheetRes.ok) {
    console.error('Error al crear Google Sheet:', createSheetRes.status, await createSheetRes.text())
  } else {
    const sheetData = await createSheetRes.json()
    console.log('¡Google Sheet creado exitosamente!')
    console.log('Spreadsheet ID:', sheetData.spreadsheetId)
    console.log('Spreadsheet URL:', sheetData.spreadsheetUrl)
  }
}

testSheetsAuth().catch(console.error)
