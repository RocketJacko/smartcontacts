import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID

const testUris = [
  'http://localhost:3000',
  'http://localhost:3000/api/auth/callback/google',
  'http://localhost:8080',
  'http://localhost:8080/callback',
  'http://localhost',
  'http://127.0.0.1:8080',
  'http://127.0.0.1',
  'https://smartcontacts.cloud',
  'https://smartcontacts.cloud/api/auth/callback/google',
  'urn:ietf:wg:oauth:2.0:oob'
]

async function testRedirects() {
  for (const uri of testUris) {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(uri)}&response_type=code&scope=email&access_type=offline`
    const res = await fetch(url, { redirect: 'manual' })
    const text = await res.text()
    const isMismatch = text.includes('redirect_uri_mismatch') || text.includes('Error 400')
    console.log(`URI: ${uri} -> Status: ${res.status}, Mismatch: ${isMismatch}`)
  }
}

testRedirects().catch(console.error)
