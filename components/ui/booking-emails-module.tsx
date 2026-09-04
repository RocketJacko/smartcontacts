"use client"

import React, { useState, useEffect } from "react"
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Send,
  Eye,
  Code2,
  Save,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Check,
  MessageSquare,
  Sparkles,
} from "lucide-react"

export interface TemplateItem {
  tipo: "solicitud_informacion" | "confirmacion" | "recordatorio_8am" | "recordatorio_30m"
  asunto: string
  cuerpo_html: string
  mascara_remitente: string
  actualizado_en?: string
}

export const OFFICIAL_DESIGN_TEMPLATES: Record<string, TemplateItem> = {
  solicitud_informacion: {
    tipo: "solicitud_informacion",
    asunto: "Hemos recibido tu solicitud de información — Smartcontacts",
    mascara_remitente: "Smartcontacts Comercial <jesus.carmona966@pascualbravo.edu.co>",
    cuerpo_html: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F5F4F0; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Geist', 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 20px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.04); text-align: left;">
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
        <tr>
          <td style="padding: 32px;">
            <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #111111;">
              Hola <strong>{{nombre}}</strong>,
            </p>
            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #555555;">
              Confirmamos que tus datos han sido registrados correctamente. Nuestro equipo comercial analizará la estructura de <strong>{{empresa}}</strong> y te contactará en breve vía WhatsApp al <strong>{{telefono}}</strong> o respondiendo a este correo.
            </p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border-radius: 14px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 28px;">
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CONTACTO REGISTRADO</span>
                  <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{nombre}} &bull; {{telefono}}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CORREO ELECTRÓNICO</span>
                  <span style="font-size: 13px; font-weight: 600; color: #111111; margin-top: 4px; display: block;">{{email}}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 18px;">
                  <span style="font-size: 10px; font-family: monospace; color: #888888; text-transform: uppercase; letter-spacing: 1px; display: block; font-weight: 600;">CONSULTA / REQUERIMIENTO</span>
                  <span style="font-size: 12px; color: #444444; margin-top: 4px; display: block; line-height: 1.5;">{{mensaje}}</span>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; width: 100%;">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #111111;">
                  <a href="https://wa.me/573127529629?text=Hola%20Smartcontacts,%20acabo%20de%20solicitar%20informaci%C3%B3n%20y%20deseo%20atenci%C3%B3n%20inmediata" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 12px; display: block; font-weight: 600; text-align: center;">
                    Chatear Ahora por WhatsApp con un Asesor &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; width: 100%;">
              <tr>
                <td align="center">
                  <a href="https://smartcontacts.cloud/propuesta" target="_blank" style="font-size: 12px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; color: #111111; text-decoration: underline; font-weight: 600;">
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
  confirmacion: {
    tipo: "confirmacion",
    asunto: "¡Asesoría Estratégica Confirmada! — Smartcontacts",
    mascara_remitente: "Smartcontacts Agendamiento <jesus.carmona966@pascualbravo.edu.co>",
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
    tipo: "recordatorio_8am",
    asunto: "⏰ Recordatorio para Hoy: {{titulo}} a las {{hora}} — Smartcontacts",
    mascara_remitente: "Smartcontacts Recordatorios <jesus.carmona966@pascualbravo.edu.co>",
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
    tipo: "recordatorio_30m",
    asunto: "🚨 Tu asesoría inicia en 30 minutos: {{titulo}}",
    mascara_remitente: "Smartcontacts Alertas <jesus.carmona966@pascualbravo.edu.co>",
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

export function BookingEmailsModule() {
  const [activePhase, setActivePhase] = useState<"solicitud_informacion" | "confirmacion" | "recordatorio_8am" | "recordatorio_30m">("solicitud_informacion")
  const [templates, setTemplates] = useState<Record<string, TemplateItem>>(OFFICIAL_DESIGN_TEMPLATES)
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [restoredNotice, setRestoredNotice] = useState(false)

  // Estado de Prueba de Envío
  const [testEmail, setTestEmail] = useState("jesus.carmona966@pascualbravo.edu.co")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Cargar plantillas desde API
  useEffect(() => {
    setIsLoading(true)
    fetch("/api/email/templates")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.templates && data.templates.length > 0) {
          const map: Record<string, TemplateItem> = { ...OFFICIAL_DESIGN_TEMPLATES }
          data.templates.forEach((t: TemplateItem) => {
            if (map[t.tipo]) map[t.tipo] = t
          })
          setTemplates(map)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // Guardar plantilla
  const handleSaveTemplate = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const current = templates[activePhase]
      const res = await fetch("/api/email/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current),
      })
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      // Mantener local
    } finally {
      setIsSaving(false)
    }
  }

  // Restaurar plantilla oficial de DESIGN.md
  const handleRestoreOfficial = () => {
    const official = OFFICIAL_DESIGN_TEMPLATES[activePhase]
    setTemplates({
      ...templates,
      [activePhase]: { ...official },
    })
    setRestoredNotice(true)
    setTimeout(() => setRestoredNotice(false), 3000)
  }

  // Generar HTML con datos simulados para Preview
  const getRenderedHtml = () => {
    const current = templates[activePhase] || OFFICIAL_DESIGN_TEMPLATES[activePhase]
    return current.cuerpo_html
      .replace(/\{\{nombre\}\}/g, "Carlos Mendoza")
      .replace(/\{\{empresa\}\}/g, "InnovaTech Colombia S.A.S.")
      .replace(/\{\{telefono\}\}/g, "+57 312 752 9629")
      .replace(/\{\{email\}\}/g, testEmail)
      .replace(/\{\{mensaje\}\}/g, "Deseamos implementar un canal agéntico de prospección con IA y consultar la base de datos de 200k contactos.")
      .replace(/\{\{titulo\}\}/g, "Asesoría Comercial 45M")
      .replace(/\{\{fecha\}\}/g, "Viernes 5 de Septiembre")
      .replace(/\{\{hora\}\}/g, "10:00 AM")
      .replace(/\{\{meetLink\}\}/g, "https://meet.google.com/sc-demo-test")
  }

  // Disparar prueba de envío real
  const handleTriggerTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestResult({ success: false, message: "Por favor ingresa un correo válido para la prueba." })
      return
    }

    setIsSendingTest(true)
    setTestResult(null)

    try {
      const current = templates[activePhase]
      const sampleSubject = current.asunto
        .replace(/\{\{nombre\}\}/g, "Carlos Mendoza")
        .replace(/\{\{empresa\}\}/g, "InnovaTech Colombia")
        .replace(/\{\{titulo\}\}/g, "Asesoría Comercial 45M")
        .replace(/\{\{hora\}\}/g, "10:00 AM")

      const sampleBody = getRenderedHtml()

      const res = await fetch("/api/email/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ email: testEmail, name: "Carlos Mendoza", company: "InnovaTech Colombia" }],
          subject: sampleSubject,
          message: sampleBody,
          dripSeconds: 0,
        }),
      })

      const data = await res.json()
      if (data.success && data.summary.sent > 0) {
        setTestResult({
          success: true,
          message: `✓ Correo de "${activePhase.replace("_", " ").toUpperCase()}" entregado con éxito a ${testEmail}.`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.results?.[0]?.detail || "No se pudo entregar el correo de prueba.",
        })
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Error al conectar con el servidor." })
    } finally {
      setIsSendingTest(false)
    }
  }

  const currentTemplate = templates[activePhase] || OFFICIAL_DESIGN_TEMPLATES[activePhase]

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 font-sans">
      {/* Encabezado Bento Card */}
      <div className="p-6 rounded-2xl border border-black/[0.07] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-black/[0.03] border border-black/[0.08] flex items-center justify-center text-[#111]">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-light text-[#111] tracking-tight">
                  Gestión de Plantillas: Solicitudes & Ciclo de Citas
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider border border-black/10 bg-black/[0.03] text-black/70 uppercase">
                  Bento Design
                </span>
              </div>
              <p className="text-xs text-black/50 font-light mt-0.5">
                Plantillas para personas que <strong>solicitan información</strong> (con acceso directo a WhatsApp y propuesta) y ciclo de <strong>citas agendadas</strong> (Google Meet y recordatorios).
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de Estado Cron */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-[11px] font-mono text-black/60 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CRON // /api/cron/reminders</span>
        </div>
      </div>

      {/* Selector de las 4 Plantillas (Bento Cards Interactivas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: "solicitud_informacion",
            tag: "WEB LEAD",
            title: "Solicitud de Información",
            desc: "Acuse de recibo para quienes solicitan datos en la web. Botón directo a WhatsApp.",
            icon: MessageSquare,
          },
          {
            id: "confirmacion",
            tag: "CITA MEET",
            title: "Confirmación de Cita",
            desc: "Disparo al fijar fecha/hora de la reunión de 45M con Google Meet.",
            icon: CheckCircle2,
          },
          {
            id: "recordatorio_8am",
            tag: "8:00 AM",
            title: "Recordatorio Matutino",
            desc: "Disparo diario a primera hora para las citas programadas hoy.",
            icon: Calendar,
          },
          {
            id: "recordatorio_30m",
            tag: "EN 30 MIN",
            title: "Alerta de 30 Minutos",
            desc: "Aviso previo a la sesión con botón destacado para ingresar a Meet.",
            icon: AlertTriangle,
          },
        ].map((phase) => {
          const isSelected = activePhase === phase.id
          return (
            <div
              key={phase.id}
              onClick={() => setActivePhase(phase.id as any)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border select-none relative overflow-hidden ${
                isSelected
                  ? "bg-white border-black/30 shadow-md ring-1 ring-black/10"
                  : "bg-white hover:bg-[#FAFAF8] border-black/[0.07] hover:border-black/15 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium tracking-widest text-black/40 uppercase">
                  {phase.tag}
                </span>
                <phase.icon className={`w-4 h-4 ${isSelected ? "text-[#111]" : "text-black/30"}`} />
              </div>
              <h3 className="text-xs font-medium text-[#111] mb-1 tracking-tight">{phase.title}</h3>
              <p className="text-[11px] text-black/50 font-light leading-relaxed">{phase.desc}</p>

              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#111]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Contenedor Principal: Editor/Preview Bento + Panel de Prueba */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor & Live Preview (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-black/[0.07] shadow-xs space-y-5">
          {/* Barra de Control de la Plantilla */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#111] uppercase tracking-wider">
                  {activePhase.replace("_", " ")}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-black/40 font-mono mt-0.5">
                Variables: &#123;&#123;nombre&#125;&#125;, &#123;&#123;empresa&#125;&#125;, &#123;&#123;telefono&#125;&#125;, &#123;&#123;email&#125;&#125;, &#123;&#123;mensaje&#125;&#125;, &#123;&#123;meetLink&#125;&#125;
              </p>
            </div>

            {/* Alternador Vista Previa / Código + Acciones */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#F5F4F0] p-1 rounded-xl border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    viewMode === "preview"
                      ? "bg-white text-[#111] shadow-xs font-medium"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("code")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    viewMode === "code"
                      ? "bg-white text-[#111] shadow-xs font-medium"
                      : "text-black/50 hover:text-black"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Código HTML</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleRestoreOfficial}
                title="Restablecer plantilla oficial de DESIGN.md"
                className="p-2 rounded-xl border border-black/[0.08] hover:bg-black/[0.04] text-black/60 hover:text-[#111] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#111] hover:bg-black text-white text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-xs disabled:bg-black/30"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaving ? "Guardando" : "Guardar"}</span>
              </button>
            </div>
          </div>

          {/* Avisos de Confirmación */}
          {saveSuccess && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-xs text-emerald-900">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-light">Plantilla actualizada y sincronizada en la base de datos con éxito.</span>
            </div>
          )}

          {restoredNotice && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.04] border border-black/10 text-xs text-[#111]">
              <Sparkles className="w-4 h-4 text-black/70 shrink-0" />
              <span className="font-light">Plantilla oficial de DESIGN.md restablecida en el editor local. Haz clic en Guardar para persistir.</span>
            </div>
          )}

          {/* Metadatos de la Plantilla (Remitente y Asunto) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-black/50 block mb-1.5">
                Máscara del Remitente
              </label>
              <input
                type="text"
                value={currentTemplate.mascara_remitente}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, mascara_remitente: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] focus:outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-black/50 block mb-1.5">
                Asunto del Correo
              </label>
              <input
                type="text"
                value={currentTemplate.asunto}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, asunto: e.target.value },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] focus:outline-none focus:border-black/30"
              />
            </div>
          </div>

          {/* Área de Visualización: Live Preview vs Editor HTML */}
          {viewMode === "preview" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-black/40 font-mono">
                <span>VISTA PREVIA EN VIVO (LIENZO #F5F4F0 + BENTO CARD)</span>
                <span>DATOS SIMULADOS</span>
              </div>
              <div className="w-full rounded-2xl border border-black/[0.08] overflow-hidden bg-[#F5F4F0] p-4 flex justify-center shadow-inner min-h-[480px]">
                <div
                  className="w-full max-w-[580px] bg-white rounded-[20px] shadow-sm overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: getRenderedHtml() }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-black/40 font-mono">
                <span>EDITOR DE CÓDIGO HTML RESPONSIVO</span>
                <span>SINTAXIS HTML / ENLACES</span>
              </div>
              <textarea
                rows={16}
                value={currentTemplate.cuerpo_html}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, cuerpo_html: e.target.value },
                  })
                }
                className="w-full p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] leading-relaxed resize-y focus:outline-none focus:border-black/30"
              />
            </div>
          )}
        </div>

        {/* Panel Lateral: Disparo de Prueba & Normas de Sistema (1 Col) */}
        <div className="space-y-6">
          {/* Tarjeta Bento: Disparo de Prueba Real en Gmail */}
          <div className="bg-white rounded-2xl p-6 border border-black/[0.07] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-black/[0.04] flex items-center justify-center text-[#111]">
                <Send className="w-3.5 h-3.5" />
              </span>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#111]">
                  Probar Envío en Vivo
                </h3>
                <span className="text-[10px] text-black/40 font-mono">GMAIL REST API V1</span>
              </div>
            </div>

            <p className="text-xs text-black/60 font-light leading-relaxed">
              Despacha de inmediato una simulación real de la plantilla activa a tu cuenta para verificar su diseño en Gmail.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-black/50 block mb-1">DESTINATARIO DE PRUEBA</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu_correo@dominio.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] focus:outline-none focus:border-black/30"
                />
              </div>

              <button
                type="button"
                disabled={isSendingTest}
                onClick={handleTriggerTest}
                className="w-full py-2.5 px-4 bg-[#111] hover:bg-black text-white text-xs font-mono uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:bg-black/30"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Despachando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Prueba ({activePhase.replace("_", " ")})</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  testResult.success
                    ? "bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-900"
                    : "bg-red-500/[0.08] border-red-500/20 text-red-900"
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Tarjeta Bento: Reglas de Disparo Automático */}
          <div className="bg-white rounded-2xl p-6 border border-black/[0.07] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-[#111]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-mono uppercase tracking-wider font-medium">
                Reglas del Sistema
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group">
                <span className="text-[10px] text-black/25 font-mono min-w-[20px]">01</span>
                <span className="text-[11px] text-black/60 font-light flex-1">
                  <strong>Solicitud Web:</strong> Disparo inmediato. Conecta directo a WhatsApp y Propuesta.
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group">
                <span className="text-[10px] text-black/25 font-mono min-w-[20px]">02</span>
                <span className="text-[11px] text-black/60 font-light flex-1">
                  <strong>Confirmación Cita:</strong> Al pactar fecha/hora con sala Google Meet.
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group">
                <span className="text-[10px] text-black/25 font-mono min-w-[20px]">03</span>
                <span className="text-[11px] text-black/60 font-light flex-1">
                  <strong>Recordatorio 8:00 AM:</strong> Cron diario matutino para citas del día.
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
              </div>

              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group">
                <span className="text-[10px] text-black/25 font-mono min-w-[20px]">04</span>
                <span className="text-[11px] text-black/60 font-light flex-1">
                  <strong>Alerta 30 Minutos:</strong> 30 min antes de la hora de la sesión.
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
