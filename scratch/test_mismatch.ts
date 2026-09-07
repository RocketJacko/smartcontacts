import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID

async function checkRedirectUriValid(redirectUri: string) {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email&access_type=offline`
  const res = await fetch(url, { redirect: 'manual' })
  const location = res.headers.get('location') || ''
  
  if (location) {
    const locRes = await fetch(location, { redirect: 'manual' })
    const locLocation = locRes.headers.get('location') || ''
    const text = await locRes.text()
    const isMismatch = text.includes('redirect_uri_mismatch') || location.includes('redirect_uri_mismatch') || locLocation.includes('redirect_uri_mismatch')
    console.log(`URI: ${redirectUri} -> locRes.status: ${locRes.status}, isMismatch: ${isMismatch}`)
    if (isMismatch) {
      console.log('Mismatch detected!')
    }
  }
}

async function run() {
  console.log('--- Probando URI falsa ---')
  await checkRedirectUriValid('http://localhost:3000/falsa-uri-invalida')
  console.log('--- Probando http://localhost:3000/api/auth/callback/google ---')
  await checkRedirectUriValid('http://localhost:3000/api/auth/callback/google')
  console.log('--- Probando http://localhost:8080 ---')
  await checkRedirectUriValid('http://localhost:8080')
}

run().catch(console.error)
