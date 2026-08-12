const path = require('path')
const fs = require('fs')

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      const key = match[1]
      let value = match[2] || ''
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
      process.env[key] = value
    }
  })
}

async function run() {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN

  console.log("Checking OAuth Server Env Vars:")
  console.log("GMAIL_CLIENT_ID:", clientId ? "PRESENT" : "MISSING")
  console.log("GMAIL_CLIENT_SECRET:", clientSecret ? "PRESENT" : "MISSING")
  console.log("GMAIL_REFRESH_TOKEN:", refreshToken ? "PRESENT (" + refreshToken.substring(0, 10) + "...)" : "MISSING")

  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Google OAuth credentials in environment!")
    return
  }

  // Get OAuth token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!tokenRes.ok) {
    const errText = await tokenRes.text()
    console.error("Failed to refresh token:", errText)
    return
  }

  const { access_token } = await tokenRes.json()
  console.log("Access Token Obtained Successfully!")

  // Query Gmail API sent emails today
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayQuery = `after:${year}/${month}/${day} label:SENT`

  console.log(`Querying Gmail API: q="${todayQuery}"...`)
  const gmailRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(todayQuery)}`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )

  if (gmailRes.ok) {
    const gmailData = await gmailRes.json()
    console.log("Gmail API Result:", JSON.stringify(gmailData, null, 2))
  } else {
    console.error("Gmail API Error:", await gmailRes.text())
  }

  // Query Google Calendar API events today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const timeMin = todayStart.toISOString()

  console.log(`Querying Google Calendar API: timeMin="${timeMin}"...`)
  const calendarRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true`,
    { headers: { Authorization: `Bearer ${access_token}` } }
  )

  if (calendarRes.ok) {
    const calData = await calendarRes.json()
    console.log(`Google Calendar Events Count Today: ${calData.items ? calData.items.length : 0}`)
    if (calData.items) {
      calData.items.forEach(item => {
        console.log(`- Event: "${item.summary}" (Created: ${item.created}, Meet: ${item.hangoutLink || 'No Meet'})`)
      })
    }
  } else {
    console.error("Calendar API Error:", await calendarRes.text())
  }
}

run()
