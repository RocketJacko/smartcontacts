import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function testDrive() {
  const clientId = process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN

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

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token

  // Probar Drive API
  const driveRes = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=5', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  console.log('Drive API status:', driveRes.status)
  console.log('Drive API text:', await driveRes.text())
}

testDrive().catch(console.error)
