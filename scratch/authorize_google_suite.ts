import http from 'http'
import url from 'url'
import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

if (!clientId || !clientSecret) {
  console.error('Faltan GMAIL_CLIENT_ID o GMAIL_CLIENT_SECRET en .env.local')
  process.exit(1)
}

const PORT = 8080
const REDIRECT_URI = `http://localhost:${PORT}/callback`

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
]

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`

console.log('==================================================================')
console.log('AUTORIZACIÓN INTEGRADA DE GOOGLE WORKSPACE (CALENDAR + GMAIL + SHEETS)')
console.log('==================================================================')
console.log('Iniciando servidor local de autenticación en puerto', PORT)
console.log('Redirect URI:', REDIRECT_URI)

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url || '', true)
  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.query.code as string
    const error = reqUrl.query.error as string

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<h1>Error en la autorización</h1><p>${error}</p>`)
      console.error('Error de autorización recibido:', error)
      server.close()
      return
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>No se recibió el código de autorización</h1>')
      return
    }

    try {
      console.log('Código recibido. Intercambiando por tokens...')
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      })

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text()
        console.error('Error al intercambiar token:', tokenRes.status, errBody)
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`<h1>Error al obtener tokens</h1><pre>${errBody}</pre>`)
        server.close()
        return
      }

      const tokenData = await tokenRes.json()
      const newRefreshToken = tokenData.refresh_token
      const newAccessToken = tokenData.access_token

      console.log('¡Tokens obtenidos exitosamente!')
      console.log('Access token:', newAccessToken.substring(0, 15) + '...')
      console.log('Refresh token obtenido:', newRefreshToken ? 'SÍ' : 'NO (conservando anterior si no vino)')

      if (newRefreshToken) {
        // Actualizar .env.local
        const envPath = path.resolve(process.cwd(), '.env.local')
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8')
          if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
            envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${newRefreshToken}`)
          } else {
            envContent += `\nGMAIL_REFRESH_TOKEN=${newRefreshToken}\n`
          }
          fs.writeFileSync(envPath, envContent, 'utf8')
          console.log('Archivo .env.local actualizado con el nuevo GMAIL_REFRESH_TOKEN.')
        }
        process.env.GMAIL_REFRESH_TOKEN = newRefreshToken
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #16a34a;">✅ Autorización Exitosa</h1>
          <p>Los permisos para <strong>Google Calendar</strong>, <strong>Gmail</strong> y <strong>Google Sheets</strong> han sido autorizados correctamente.</p>
          <p>Ya puedes cerrar esta pestaña y volver a la terminal/consola.</p>
        </div>
      `)

      setTimeout(() => {
        server.close()
        console.log('Servidor de autenticación cerrado. Proceso completado con éxito.')
        process.exit(0)
      }, 1000)

    } catch (err: any) {
      console.error('Excepción procesando token:', err)
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<h1>Error interno</h1><p>${err.message}</p>`)
      server.close()
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(PORT, () => {
  console.log(`Abriendo navegador para autorización de Google...`)
  console.log(`Si no se abre automáticamente, visita esta URL:`)
  console.log(authUrl)

  // Ejecutar comando para abrir navegador en Windows
  exec(`start "" "${authUrl}"`, (err) => {
    if (err) {
      console.log('No se pudo abrir el navegador automáticamente. Por favor abre la URL manualmente.')
    }
  })
})
