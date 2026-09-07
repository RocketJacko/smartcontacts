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

const redirectUris = [
  'http://localhost:3000/api/auth/callback/google',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8080/callback',
  'http://127.0.0.1:8080',
  'urn:ietf:wg:oauth:2.0:oob',
  'https://smartcontacts.cloud/api/auth/callback/google'
]

console.log('Testing auth URLs for Client ID:', clientId)

for (const uri of redirectUris) {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(uri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`
  console.log(`\nRedirect URI: ${uri}\nURL: ${url}`)
}
