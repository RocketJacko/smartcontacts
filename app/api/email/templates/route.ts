import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export interface EmailTemplateItem {
  tipo: 'confirmacion' | 'recordatorio_8am' | 'recordatorio_30m'
  mascara_remitente: string
  asunto: string
  cuerpo_html: string
  actualizado_en?: string
}

const DEFAULT_TEMPLATES: Record<string, EmailTemplateItem> = {
  confirmacion: {
    tipo: 'confirmacion',
    mascara_remitente: 'Smartcontacts Agendamiento <jesus.carmona966@pascualbravo.edu.co>',
    asunto: '¡Asesoría Estratégica Confirmada! — Smartcontacts',
    cuerpo_html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
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
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
              Hola <strong>{{nombre}}</strong>,
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
              Hemos confirmado con éxito tu asesoría consultiva de 45 minutos para estructurar la nueva capacidad comercial de <strong>{{empresa}}</strong>.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">FECHA Y HORA (COLOMBIA)</span>
                  <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{fecha}} — {{hora}}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">EMPRESA / PROYECTO</span>
                  <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{empresa}}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 18px;">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">MODALIDAD</span>
                  <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">Google Meet (Sesión Consultiva 1 a 1)</span>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #111111;">
                  <a href="{{meetLink}}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
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
</table>`,
  },
  recordatorio_8am: {
    tipo: 'recordatorio_8am',
    mascara_remitente: 'Smartcontacts Recordatorios <jesus.carmona966@pascualbravo.edu.co>',
    asunto: '⏰ Recordatorio para Hoy: {{titulo}} a las {{hora}} — Smartcontacts',
    cuerpo_html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
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
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
              Buenos días, <strong>{{nombre}}</strong>.
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
              Te recordamos que el día de hoy tienes programada tu sesión consultiva de 45 minutos para el proyecto de <strong>{{empresa}}</strong>.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">HORA DE INICIO</span>
                  <span style="font-size: 14px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{hora}} (Hora Colombia)</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 18px;">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">ENLACE DE ACCESO DIRECTO</span>
                  <span style="font-size: 13px; font-family: monospace; color: #111111; margin-top: 4px; display: block;">{{meetLink}}</span>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #111111;">
                  <a href="{{meetLink}}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
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
</table>`,
  },
  recordatorio_30m: {
    tipo: 'recordatorio_30m',
    mascara_remitente: 'Smartcontacts Alertas <jesus.carmona966@pascualbravo.edu.co>',
    asunto: '🚨 Tu asesoría inicia en 30 minutos: {{titulo}}',
    cuerpo_html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
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
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
              ¡Hola <strong>{{nombre}}</strong>!
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
              Tu sesión consultiva para <strong>{{empresa}}</strong> está programada para dar inicio en 30 minutos (a las <strong>{{hora}}</strong>).
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
              <tr>
                <td style="padding: 16px 20px;">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">SALA EN VIVO DE GOOGLE MEET</span>
                  <span style="font-size: 14px; font-family: monospace; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{meetLink}}</span>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #111111;">
                  <a href="{{meetLink}}" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 16px 28px; border-radius: 12px; display: block; font-weight: 700; text-align: center;">
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
</table>`,
  },
}

// GET: Obtener plantillas predeterminadas
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    let templatesMap: Record<string, EmailTemplateItem> = { ...DEFAULT_TEMPLATES }

    if (url && anonKey) {
      let res = await fetch(`${url}/rest/v1/plantillas_predeterminadas?select=*`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'automatizacion',
        },
        cache: 'no-store',
      })

      if (!res.ok) {
        // Fallback a vista publica
        res = await fetch(`${url}/rest/v1/plantillas_predeterminadas?select=*`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          cache: 'no-store',
        })
      }

      if (res.ok) {
        const rows = await res.json()
        rows.forEach((r: EmailTemplateItem) => {
          templatesMap[r.tipo] = r
        })
      }
    }

    return NextResponse.json({ success: true, templates: Object.values(templatesMap) })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al obtener plantillas' }, { status: 500 })
  }
}

// PUT: Actualizar una plantilla predeterminada
export async function PUT(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const { tipo, mascara_remitente, asunto, cuerpo_html } = body

    if (!tipo || !mascara_remitente || !asunto || !cuerpo_html) {
      return NextResponse.json({ success: false, error: 'Todos los campos son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    let upsertRes = await fetch(`${url}/rest/v1/plantillas_predeterminadas`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        tipo,
        mascara_remitente,
        asunto,
        cuerpo_html,
        actualizado_en: new Date().toISOString(),
      }),
    })

    if (!upsertRes.ok) {
      // Fallback a vista publica
      upsertRes = await fetch(`${url}/rest/v1/plantillas_predeterminadas`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          tipo,
          mascara_remitente,
          asunto,
          cuerpo_html,
          actualizado_en: new Date().toISOString(),
        }),
      })
    }

    if (!upsertRes.ok) {
      return NextResponse.json({ success: false, error: 'No se pudo actualizar la plantilla en Supabase.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Plantilla actualizada exitosamente' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error al actualizar plantilla' }, { status: 500 })
  }
}
