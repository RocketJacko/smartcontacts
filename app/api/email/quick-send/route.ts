import { NextResponse } from 'next/server'
import { sendGmailCustomEmail } from '@/lib/gmail-service'
import { isDomainBlocked } from '@/lib/blocked-domains'
import { GmailAccountsManager } from '@/lib/gmail-accounts-manager'
import { getEmailSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export interface QuickSendRecipient {
  email: string
  name?: string
  company?: string
}

const RFC_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      recipients,
      subject,
      subjects,
      message,
      senderEmail,
      senderName,
      dripSeconds = 3,
    } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ success: false, error: 'Debes proporcionar al menos un destinatario.' }, { status: 400 })
    }

    if (!subject && (!subjects || subjects.length === 0)) {
      return NextResponse.json({ success: false, error: 'El asunto del correo es obligatorio.' }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'El mensaje del correo es obligatorio.' }, { status: 400 })
    }

    const poolSubjects: string[] = subjects && subjects.length > 0 ? subjects : [subject]

    const results: Array<{
      email: string
      name?: string
      status: 'enviado' | 'bloqueado_antispam' | 'error_sintaxis' | 'fallido'
      detail?: string
      senderUsed?: string
    }> = []

    let sentCount = 0
    let blockedCount = 0
    let failedCount = 0

    const { url, anonKey } = getEmailSupabaseConfig()
    const auditHeaders = url && anonKey ? {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    } : null

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i]
      const cleanEmail = (r.email || '').trim().toLowerCase()
      const contactName = (r.name || '').trim()
      const company = (r.company || '').trim()

      if (!cleanEmail || !RFC_EMAIL_REGEX.test(cleanEmail)) {
        results.push({ email: cleanEmail || 'desconocido', name: contactName, status: 'error_sintaxis', detail: 'Formato de correo inválido' })
        failedCount++
        continue
      }

      const isBlocked = await isDomainBlocked(cleanEmail)
      if (isBlocked) {
        results.push({ email: cleanEmail, name: contactName, status: 'bloqueado_antispam', detail: 'Dominio temporal o malicioso descartado por Anti-Spam' })
        blockedCount++
        continue
      }

      const currentSubject = poolSubjects[i % poolSubjects.length]
        .replace(/\{\{nombre\}\}/gi, contactName || 'Estimado/a')
        .replace(/\{\{empresa\}\}/gi, company || 'su empresa')

      const isRawHtml = message.trim().startsWith('<table') || message.trim().startsWith('<!DOCTYPE') || message.trim().startsWith('<html')

      const formattedBody = isRawHtml
        ? message
            .replace(/\{\{nombre\}\}/gi, contactName || 'Estimado/a')
            .replace(/\{\{empresa\}\}/gi, company || 'su empresa')
        : `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F4F0; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
          <tr>
            <td style="padding: 28px 32px; background-color: #111111; color: #ffffff;">
              <span style="font-size: 10px; font-family: monospace; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.6); display: block; margin-bottom: 4px;">
                SMARTCONTACTS // COMUNICACIÓN ESTRATÉGICA
              </span>
              <h1 style="margin: 0; font-size: 19px; font-weight: 600; color: #ffffff; letter-spacing: -0.4px;">
                ${currentSubject}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; font-size: 14px; line-height: 1.7; color: #222222;">
              ${message
                .replace(/\{\{nombre\}\}/gi, contactName || 'Estimado/a')
                .replace(/\{\{empresa\}\}/gi, company || 'su empresa')
                .replace(/\n/g, '<br/>')}
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 32px; background-color: #FAFAF8; border-top: 1px solid rgba(0,0,0,0.06); text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #555555; font-style: italic;">
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

      const sendResult = await sendGmailCustomEmail({
        toEmail: cleanEmail,
        toName: contactName,
        subject: currentSubject,
        htmlBody: formattedBody,
        senderEmail: senderEmail || undefined,
        senderMask: senderName ? `${senderName} <${senderEmail}>` : undefined,
      })

      if (sendResult.success) {
        sentCount++
        results.push({
          email: cleanEmail,
          name: contactName,
          status: 'enviado',
          senderUsed: sendResult.senderUsed || senderEmail,
        })

        if (auditHeaders && url) {
          fetch(`${url}/rest/v1/envios`, {
            method: 'POST',
            headers: auditHeaders,
            body: JSON.stringify({
              destinatario_email: cleanEmail,
              destinatario_nombre: contactName,
              remitente: sendResult.senderUsed || senderEmail,
              asunto: currentSubject,
              estado: 'entregado',
              proveedor: 'gmail_api',
              ip_despacho: 'sistema_simplificado',
            }),
          }).catch(() => {})
        }
      } else {
        failedCount++
        results.push({
          email: cleanEmail,
          name: contactName,
          status: 'fallido',
          detail: sendResult.error || 'Error al conectar con la API de Gmail',
        })
      }

      if (i < recipients.length - 1 && dripSeconds > 0) {
        await new Promise((res) => setTimeout(res, dripSeconds * 1000))
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: recipients.length,
        sent: sentCount,
        blockedAntiSpam: blockedCount,
        failed: failedCount,
      },
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error interno en el despacho' }, { status: 500 })
  }
}
