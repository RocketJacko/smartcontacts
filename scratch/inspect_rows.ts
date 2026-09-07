import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function inspectRows() {
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

  const getRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A1:M10?valueRenderOption=FORMULA`,
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  )

  const data = await getRes.json()
  console.log('Filas con valueRenderOption=FORMULA:')
  console.log(JSON.stringify(data.values, null, 2))
}

inspectRows().catch(console.error)
