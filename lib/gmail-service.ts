/**
 * Servicio de envío de correos transaccionales usando Gmail REST API v1 (OAuth2).
 * 
 * Cumplimiento de Regla 6 (AGENTS.md):
 * Las credenciales se consumen exclusivamente desde variables de entorno.
 */

function getGmailCredentials() {
  const clientId = process.env.GMAIL_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || ''
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN || ''
  const senderEmail = process.env.GMAIL_SENDER_EMAIL || 'jesus.carmona966@pascualbravo.edu.co'
  const senderName = process.env.GMAIL_SENDER_NAME || 'Agendamiento Smartcontacts'

  return { clientId, clientSecret, refreshToken, senderEmail, senderName }
}

interface BookingEmailParams {
  toEmail: string
  toName: string
  date: string
  time: string
  topicTitle: string
  company?: string
  meetLink?: string
}

/**
 * Obtiene un access_token fresco desde el servidor OAuth2 de Google usando el refresh_token.
 */
async function getAccessToken(): Promise<string | null> {
  const { clientId, clientSecret, refreshToken } = getGmailCredentials()

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('[GMAIL OAUTH2 TOKEN ERROR]', res.status, await res.text())
      return null
    }

    const data = await res.json()
    return data.access_token || null
  } catch (err) {
    console.error('[GMAIL OAUTH2 TOKEN EXCEPTION]', err)
    return null
  }
}

/**
 * Genera la plantilla HTML adaptable alineada estrictamente al sistema de diseño DESIGN.md
 * (Lienzo #F5F4F0, tarjeta Bento #FFFFFF con bordes rgba(0,0,0,0.07), header #111111 y lema de CONTEXT.md)
 */
function buildHtmlBody(params: BookingEmailParams): string {
  const meetUrl = params.meetLink || 'https://meet.google.com/smartcontacts-asesoria'
  const companyStr = params.company || 'su empresa'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Asesoría — Smartcontacts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
          <!-- Header Bento Institucional -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #111111; color: #ffffff;">
              <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 6px;">
                SMARTCONTACTS // 01 CONFIRMACIÓN DE ASESORÍA
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">
                ¡Sesión Estratégica Confirmada!
              </h1>
            </td>
          </tr>
          <!-- Content Bento -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
                Hola <strong>${params.toName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
                Hemos confirmado con éxito tu asesoría consultiva de 45 minutos para estructurar la nueva capacidad comercial de <strong>${companyStr}</strong>.
              </p>

              <!-- Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">ÁREA DE CONSULTORÍA</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.topicTitle}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">FECHA Y HORA (COLOMBIA)</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.date} — ${params.time}</span>
                  </td>
                </tr>
                ${params.company ? `
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">EMPRESA / PROYECTO</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.company}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 14px 18px;">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">MODALIDAD</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">Google Meet (Sesión Consultiva 1 a 1)</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button Bento -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #111111;">
                    <a href="${meetUrl}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
                      Unirse a la Reunión en Google Meet &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888888;">
                Si necesitas reprogramar la sesión, responde directamente a este correo.
              </p>
            </td>
          </tr>
          <!-- Footer Institucional CONTEXT.md -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAF8; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #555555; font-style: italic;">
                "No reemplazamos tu departamento comercial. Creamos una nueva unidad de crecimiento para tu empresa."
              </p>
              <span style="font-size: 10px; color: #999999; font-family: monospace;">
                Smartcontacts Cloud &copy; 2026 — Inteligencia de Datos & Agentes de IA.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Crea el mensaje RFC 822 en formato raw Base64 URL-Safe requerido por la API de Gmail.
 */
function createRawMimeMessage(
  fromName: string,
  fromEmail: string,
  toEmail: string,
  subject: string,
  htmlContent: string
): string {
  const mimeLines = [
    `From: =?UTF-8?B?${Buffer.from(fromName).toString('base64')}?= <${fromEmail}>`,
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(htmlContent).toString('base64'),
  ]

  const mimeString = mimeLines.join('\r\n')
  return Buffer.from(mimeString)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Envía el correo de confirmación usando la API REST v1 de Gmail.
 */
export async function sendBookingConfirmationEmail(params: BookingEmailParams): Promise<{ success: boolean; messageId?: string; error?: string; dripDelaySeconds?: string }> {
  const { senderEmail, senderName } = getGmailCredentials()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    console.warn('[GMAIL SEND SKIPPED] No se obtuvo access_token (Faltan credenciales GMAIL_CLIENT_ID / GMAIL_REFRESH_TOKEN en el entorno).')
    return { success: false, error: 'Credenciales de Gmail no configuradas' }
  }

  try {
    const subject = `Confirmación de tu Agendamiento — Smartcontacts`
    const htmlBody = buildHtmlBody(params)
    const rawMessage = createRawMimeMessage(
      senderName,
      senderEmail,
      params.toEmail,
      subject,
      htmlBody
    )

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: errText }
    }

    const data = await res.json()

    // Sistema de Goteo Aleatorio (Drip Rate-Limiting: 3 a 5 segundos)
    const dripDelay = Math.floor(Math.random() * 2000) + 3000
    await new Promise((resolve) => setTimeout(resolve, dripDelay))

    return { success: true, messageId: data.id, dripDelaySeconds: (dripDelay / 1000).toFixed(1) }

  } catch (error: any) {
    return { success: false, error: error?.message || 'Error inesperado enviando correo' }
  }
}

/**
 * Envía el correo de recordatorio personalizado 30 minutos antes con diseño Bento estricto de DESIGN.md.
 */
export async function send30MinReminderEmail(params: {
  toEmail: string
  toName: string
  title: string
  timeStr: string
  meetLink: string
  company?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { senderEmail, senderName } = getGmailCredentials()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: 'Credenciales de Gmail no configuradas' }
  }

  try {
    const subject = `🚨 Tu asesoría inicia en 30 minutos: ${params.title}`
    const meetUrl = params.meetLink || 'https://meet.google.com/smartcontacts-asesoria'
    const companyStr = params.company || 'tu empresa'

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta: Tu Asesoría Inicia en 30 Minutos — Smartcontacts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
          <!-- Header Bento -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #111111; color: #ffffff;">
              <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 6px;">
                SMARTCONTACTS // 03 ALERTA EN VIVO: EN 30 MINUTOS
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">
                Tu Asesoría Inicia en Breve
              </h1>
            </td>
          </tr>
          <!-- Content Bento -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
                ¡Hola <strong>${params.toName}</strong>!
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
                Tu sesión consultiva para <strong>${companyStr}</strong> está programada para dar inicio en 30 minutos (a las <strong>${params.timeStr}</strong>).
              </p>

              <!-- Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">SALA EN VIVO DE GOOGLE MEET</span>
                    <span style="font-size: 13px; font-family: monospace; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${meetUrl}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button Bento -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #111111;">
                    <a href="${meetUrl}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 16px 28px; border-radius: 12px; display: block; font-weight: 700; text-align: center;">
                      Ingresar a Google Meet &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888888;">
                Te recomendamos ingresar 2 minutos antes para comprobar tu cámara y micrófono. ¡Nos vemos en la sala!
              </p>
            </td>
          </tr>
          <!-- Footer Institucional CONTEXT.md -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAF8; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #555555; font-style: italic;">
                "No reemplazamos tu departamento comercial. Creamos una nueva unidad de crecimiento para tu empresa."
              </p>
              <span style="font-size: 10px; color: #999999; font-family: monospace;">
                Smartcontacts Cloud &copy; 2026 — Inteligencia de Datos & Agentes de IA.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const rawMessage = createRawMimeMessage(
      senderName,
      senderEmail,
      params.toEmail,
      subject,
      htmlBody
    )

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: errText }
    }

    const data = await res.json()
    return { success: true, messageId: data.id }

  } catch (error: any) {
    return { success: false, error: error?.message || 'Error enviando recordatorio' }
  }
}

/**
 * Envía el correo de recordatorio matutino a primera hora (8:00 AM) con diseño Bento estricto de DESIGN.md.
 */
export async function send8AMMorningReminderEmail(params: {
  toEmail: string
  toName: string
  title: string
  timeStr: string
  meetLink: string
  company?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { senderEmail, senderName } = getGmailCredentials()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: 'Credenciales de Gmail no configuradas' }
  }

  try {
    const subject = `⏰ Recordatorio para Hoy: ${params.title} a las ${params.timeStr} — Smartcontacts`
    const meetUrl = params.meetLink || 'https://meet.google.com/smartcontacts-asesoria'
    const companyStr = params.company || 'tu empresa'

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio Matutino — Smartcontacts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
          <!-- Header Bento -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #111111; color: #ffffff;">
              <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 6px;">
                SMARTCONTACTS // 02 RECORDATORIO MATUTINO (8:00 AM)
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">
                Hoy es tu Asesoría Estratégica
              </h1>
            </td>
          </tr>
          <!-- Content Bento -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
                Buenos días, <strong>${params.toName}</strong>.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
                Te recordamos que el día de hoy tienes programada tu sesión consultiva de 45 minutos para el proyecto de <strong>${companyStr}</strong>.
              </p>

              <!-- Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">HORA DE INICIO</span>
                    <span style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.timeStr} (Hora Colombia)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px;">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">ENLACE DE ACCESO DIRECTO</span>
                    <span style="font-size: 13px; font-family: monospace; color: #111111; margin-top: 4px; display: block;">${meetUrl}</span>
                  </td>
                </tr>
              </table>

              <!-- CTA Button Bento -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #111111;">
                    <a href="${meetUrl}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
                      Acceder a la Sala Google Meet &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888888;">
                Nos vemos en la sesión para analizar tus metas comerciales y los modelos agénticos aplicables.
              </p>
            </td>
          </tr>
          <!-- Footer Institucional CONTEXT.md -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAF8; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #555555; font-style: italic;">
                "No reemplazamos tu departamento comercial. Creamos una nueva unidad de crecimiento para tu empresa."
              </p>
              <span style="font-size: 10px; color: #999999; font-family: monospace;">
                Smartcontacts Cloud &copy; 2026 — Inteligencia de Datos & Agentes de IA.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const rawMessage = createRawMimeMessage(
      senderName,
      senderEmail,
      params.toEmail,
      subject,
      htmlBody
    )

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: errText }
    }

    const data = await res.json()
    return { success: true, messageId: data.id }

  } catch (error: any) {
    return { success: false, error: error?.message || 'Error enviando recordatorio matutino' }
  }
}

import { GmailAccountsManager } from './gmail-accounts-manager'

/**
 * Envía un correo electrónico personalizado con soporte para máscara de remitente,
 * rotación multi-cuenta y cuerpo HTML dinámico.
 */
export async function sendGmailCustomEmail(params: {
  toEmail: string
  toName?: string
  subject: string
  body?: string
  htmlBody?: string
  fromMask?: string
  senderEmail?: string
  senderMask?: string
}): Promise<{ success: boolean; messageId?: string; error?: string; senderUsed?: string }> {
  // Intentar obtener cuenta y token del administrador multi-cuenta
  const selection = await GmailAccountsManager.selectAvailableAccount(params.senderEmail)
  
  let accessToken: string | null = null
  let effectiveSender = params.senderEmail || 'jesus.carmona966@pascualbravo.edu.co'
  let effectiveMask = params.senderMask || params.fromMask || 'Agendamiento Smartcontacts'

  if (selection) {
    accessToken = selection.accessToken
    effectiveSender = selection.account.email
    effectiveMask = params.senderMask || `${selection.account.name} <${selection.account.email}>`
  } else {
    // Fallback a las credenciales de entorno estándar
    const { senderEmail, senderName } = getGmailCredentials()
    accessToken = await getAccessToken()
    effectiveSender = params.senderEmail || senderEmail
    effectiveMask = params.senderMask || params.fromMask || senderName
  }

  if (!accessToken) {
    return { success: false, error: 'Credenciales de Gmail no configuradas o token no obtenido' }
  }

  try {
    const effectiveBody = params.htmlBody || params.body || ''

    const rawMessage = createRawMimeMessage(
      effectiveMask.includes('<') ? effectiveMask.split('<')[0].trim() : effectiveMask,
      effectiveSender,
      params.toEmail,
      params.subject,
      effectiveBody
    )

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: errText }
    }

    const data = await res.json()
    return { success: true, messageId: data.id, senderUsed: effectiveSender }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error en envío de correo' }
  }
}

/**
 * Envía el correo de acuse de recibo a las personas que SOLICITAN INFORMACIÓN en la web.
 * (NUNCA redirige al formulario de captura; ofrece atención directa en WhatsApp y acceso a la Propuesta Comercial).
 */
export async function sendInformationRequestReceiptEmail(params: {
  toEmail: string
  toName: string
  phone?: string
  company?: string
  message?: string
  topic?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { senderEmail, senderName } = getGmailCredentials()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: 'Credenciales de Gmail no configuradas' }
  }

  try {
    const subject = `Hemos recibido tu solicitud de información — Smartcontacts`
    const companyStr = params.company || 'su empresa'
    const phoneStr = params.phone || 'No especificado'
    const messageStr = params.message || 'Consulta sobre soluciones de IA agéntica y crecimiento comercial.'
    const whatsappUrl = `https://wa.me/573127529629?text=${encodeURIComponent(`Hola Smartcontacts, acabo de solicitar información para ${companyStr} a nombre de ${params.toName}. Deseo coordinar con un asesor comercial.`)}`
    const proposalUrl = 'https://smartcontacts.cloud/propuesta'

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Información Recibida — Smartcontacts</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
          <!-- Header Bento Institucional -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #111111; color: #ffffff;">
              <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 6px;">
                SMARTCONTACTS // SOLICITUD DE INFORMACIÓN RECIBIDA
              </span>
              <h1 style="margin: 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">
                Hemos Recibido tu Solicitud
              </h1>
            </td>
          </tr>
          <!-- Content Bento -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
                Hola <strong>${params.toName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
                Confirmamos que tus datos han sido registrados en nuestro sistema. Nuestro equipo comercial revisará los requerimientos de <strong>${companyStr}</strong> y se comunicará contigo vía WhatsApp al <strong>${phoneStr}</strong> o respondiendo a este correo.
              </p>

              <!-- Resumen de Datos Recibidos -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CONTACTO REGISTRADO</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.toName} &bull; ${phoneStr}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CORREO ELECTRÓNICO</span>
                    <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.toEmail}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 18px;">
                    <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CONSULTA / REQUERIMIENTO</span>
                    <span style="font-size: 12px; color: #444444; margin-top: 4px; display: block; line-height: 1.5;">${messageStr}</span>
                  </td>
                </tr>
              </table>

              <!-- Botones de Acción Directa (WhatsApp y Propuesta) -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; width: 100%;">
                <tr>
                  <td align="center" style="border-radius: 12px; background-color: #111111;">
                    <a href="${whatsappUrl}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
                      Chatear Ahora por WhatsApp con un Asesor &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${proposalUrl}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #111111; text-decoration: underline; font-weight: 600;">
                      Explorar Nuestra Propuesta Comercial y Modalidades &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #888888;">
                Si deseas agregar detalles o documentos a tu solicitud, responde directamente a este mensaje.
              </p>
            </td>
          </tr>
          <!-- Footer Institucional CONTEXT.md -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAF8; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #555555; font-style: italic;">
                "No reemplazamos tu departamento comercial. Creamos una nueva unidad de crecimiento para tu empresa."
              </p>
              <span style="font-size: 10px; color: #999999; font-family: monospace;">
                Smartcontacts Cloud &copy; 2026 — Inteligencia de Datos & Agentes de IA.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const rawMessage = createRawMimeMessage(
      senderName,
      senderEmail,
      params.toEmail,
      subject,
      htmlBody
    )

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: rawMessage }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const errText = await res.text()
      return { success: false, error: errText }
    }

    const data = await res.json()
    return { success: true, messageId: data.id }

  } catch (error: any) {
    return { success: false, error: error?.message || 'Error enviando confirmación de solicitud de información' }
  }
}
