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
 * Genera la plantilla HTML adaptable alineada al sistema de diseño.
 */
function buildHtmlBody(params: BookingEmailParams): string {
  const meetUrl = params.meetLink || 'https://meet.google.com/smartcontacts-asesoria'

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Agendamiento</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; background-color: #111111; color: #ffffff;">
        <span style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); font-weight: 600;">SMARTCONTACTS</span>
        <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">¡Asesoría Agendada con Éxito!</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
          Hola <strong>${params.toName}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
          Te confirmamos que tu sesión estratégica ha sido programada exitosamente con nuestro equipo consultor. A continuación encontrarás el resumen de tu reserva:
        </p>

        <!-- Details Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border-radius: 12px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; tracking: 1px; display: block; font-weight: 600;">ÁREA DE CONSULTORÍA</span>
              <span style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.topicTitle}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; tracking: 1px; display: block; font-weight: 600;">FECHA Y HORA</span>
              <span style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.date} — ${params.time} (Hora Colombia)</span>
            </td>
          </tr>
          ${params.company ? `
          <tr>
            <td style="padding: 16px 20px; border-bottom: 1px solid rgba(0,0,0,0.05);">
              <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; tracking: 1px; display: block; font-weight: 600;">EMPRESA</span>
              <span style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">${params.company}</span>
            </td>
          </tr>
          ` : ''}
        </table>

        <!-- CTA Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #111111;">
              <a href="${meetUrl}" target="_blank" style="font-size: 13px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; font-weight: 600;">
                Unirse a la Reunión &rarr;
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #777777;">
          Nuestro equipo se pondrá en contacto muy pronto para afinar los detalles de la sesión. Si necesitas reprogramar, por favor responde directamente a este correo.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
        <span style="font-size: 11px; color: #999999; font-family: monospace;">Smartcontacts &copy; 2026 — Nueva unidad de crecimiento comercial.</span>
      </td>
    </tr>
  </table>
</body>
</html>
  `
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
export async function sendBookingConfirmationEmail(params: BookingEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
      console.error('[GMAIL SEND ERROR]', res.status, errText)
      return { success: false, error: errText }
    }

    const data = await res.json()
    console.log('[GMAIL SEND SUCCESS] Mensaje enviado con éxito. ID:', data.id)
    return { success: true, messageId: data.id }

  } catch (error: any) {
    console.error('[GMAIL SEND EXCEPTION]', error)
    return { success: false, error: error.message || 'Error inesperado enviando correo' }
  }
}

/**
 * Envía el correo de recordatorio personalizado 30 minutos antes.
 */
export async function send30MinReminderEmail(params: {
  toEmail: string
  toName: string
  title: string
  timeStr: string
  meetLink: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { senderEmail, senderName } = getGmailCredentials()
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return { success: false, error: 'Credenciales de Gmail no configuradas' }
  }

  try {
    const subject = `⏰ Recordatorio: Tu Asesoría Inicia en 30 Minutos — Smartcontacts`
    const meetUrl = params.meetLink || 'https://meet.google.com/smartcontacts-asesoria'

    const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Asesoría</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f7f8; margin: 0; padding: 24px; color: #111111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <!-- Header Alerta -->
    <tr>
      <td style="padding: 32px; background-color: #111111; color: #ffffff;">
        <span style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: #10b981; font-weight: 700;">RECORDATORIO DE SESIÓN</span>
        <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">¡Tu Asesoría Inicia en 30 Minutos!</h1>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
          Hola <strong>${params.toName}</strong>,
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
          Te recordamos que tu sesión de consultoría comercial <strong>"${params.title}"</strong> está programada para iniciar en 30 minutos (a las <strong>${params.timeStr}</strong>).
        </p>

        <!-- CTA Button -->
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0; width: 100%;">
          <tr>
            <td align="center">
              <a href="${meetUrl}" target="_blank" style="display: block; width: 100%; text-align: center; background-color: #10b981; color: #ffffff; padding: 16px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; text-decoration: none; box-sizing: border-box;">
                🎥 Unirse Ahora a la Reunión de Google Meet
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0; font-size: 12px; color: #888888; text-align: center; line-height: 1.5;">
          Si necesitas hacer algún ajuste previo, responde a este correo. ¡Nos vemos en breve!
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `

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
      console.error('[GMAIL REMINDER SEND ERROR]', res.status, errText)
      return { success: false, error: errText }
    }

    const data = await res.json()
    console.log('[GMAIL REMINDER SUCCESS] Recordatorio 30m enviado a:', params.toEmail, 'ID:', data.id)
    return { success: true, messageId: data.id }

  } catch (error: any) {
    console.error('[GMAIL REMINDER EXCEPTION]', error)
    return { success: false, error: error.message || 'Error enviando recordatorio' }
  }
}

/**
 * Envía el correo de recordatorio matutino a primera hora (8:00 AM).
 */
export async function send8AMMorningReminderEmail(params: {
  toEmail: string
  toName: string
  title: string
  timeStr: string
  meetLink: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return send30MinReminderEmail(params)
}
