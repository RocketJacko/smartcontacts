import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

async function check() {
  for (let i = 0; i < 10; i++) {
    // Recargar .env.local
    const envPath = path.resolve(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.match(/GMAIL_REFRESH_TOKEN=(.+)/)
    const refreshToken = match ? match[1].trim() : ''

    const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

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

    if (tokenRes.ok) {
      const data = await tokenRes.json()
      const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${data.access_token}`)
      const info = await infoRes.json()
      if (info.scope && info.scope.includes('spreadsheets')) {
        console.log('¡Scope spreadsheets DETECTADO Y ACTIVO!')
        console.log('Scopes actuales:', info.scope)
        return true
      }
    }

    console.log(`[Intento ${i + 1}/10] Esperando autorización en el navegador...`)
    await new Promise(r => setTimeout(r, 2000))
  }
  return false
}

check().catch(console.error)
