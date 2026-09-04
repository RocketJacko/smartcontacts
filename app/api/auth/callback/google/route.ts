import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return new NextResponse(`
      <html>
        <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: #fff;">
          <div style="padding: 2rem; border-radius: 12px; border: 1px solid #ef4444; background: rgba(239, 68, 68, 0.1); max-width: 500px; text-align: center;">
            <h2 style="color: #ef4444; margin-bottom: 0.5rem;">Error de Autorización</h2>
            <p style="color: #a1a1aa; font-size: 0.875rem;">${error}</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 })
  }

  if (!code) {
    return new NextResponse('Código no encontrado', { status: 400 })
  }

  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  const origin = request.nextUrl.origin
  const redirectUri = `${origin}/api/auth/callback/google`

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId || '',
        client_secret: clientSecret || '',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      return new NextResponse(`Error al canjear código por token: ${errText}`, { status: 500 })
    }

    const tokenData = await tokenRes.json()
    const newRefreshToken = tokenData.refresh_token

    if (newRefreshToken) {
      // Si estamos en entorno local, actualizar el archivo .env.local
      const envPath = path.resolve(process.cwd(), '.env.local')
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8')
        if (envContent.includes('GMAIL_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${newRefreshToken}`)
        } else {
          envContent += `\nGMAIL_REFRESH_TOKEN=${newRefreshToken}\n`
        }
        fs.writeFileSync(envPath, envContent, 'utf8')
      }
      process.env.GMAIL_REFRESH_TOKEN = newRefreshToken
    }

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <title>Google Workspace Autorizado — Smartcontacts</title>
          <meta charset="utf-8" />
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #000; color: #fff; margin: 0; padding: 20px;">
          <div style="max-width: 520px; width: 100%; padding: 32px; border-radius: 16px; background: #111; border: 1px solid rgba(255, 255, 255, 0.1); text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: #fff;">Google Workspace Sincronizado</h1>
            <p style="font-size: 14px; color: #888; line-height: 1.5; margin: 0 0 24px 0;">
              Las APIs de Google Cloud y Google Workspace han sido autorizadas correctamente con permisos para:
            </p>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 14px; margin-bottom: 24px; text-align: left; font-size: 13px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: #22c55e;">●</span> <span><strong>Google Calendar:</strong> Agendamiento y salas Meet</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: #22c55e;">●</span> <span><strong>Gmail API:</strong> Confirmaciones y notificaciones</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #22c55e;">●</span> <span><strong>Google Sheets API:</strong> Registro de citas en hojas de cálculo</span>
              </div>
            </div>
            <p style="font-size: 12px; color: #555; margin: 0;">Ya puedes cerrar esta ventana y regresar a tu consola o aplicación.</p>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 })

  } catch (err: any) {
    return new NextResponse(`Error en la solicitud: ${err.message}`, { status: 500 })
  }
}
