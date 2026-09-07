import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
]

async function checkAuthPage() {
  const redirectUri = 'http://localhost:3000/api/auth/callback/google'
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`
  
  console.log('Fetching Google Auth URL...')
  const res = await fetch(url, { redirect: 'manual' })
  console.log('Status:', res.status)
  console.log('Location header:', res.headers.get('location'))
  
  if (res.headers.get('location')) {
    const locRes = await fetch(res.headers.get('location')!, { redirect: 'manual' })
    console.log('Follow status:', locRes.status)
    const text = await locRes.text()
    console.log('Body preview:', text.substring(0, 300))
  }
}

checkAuthPage().catch(console.error)
