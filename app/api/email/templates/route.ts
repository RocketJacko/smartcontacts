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
    mascara_remitente: 'Agendamiento Smartcontacts <asesoria@smartcontacts.cloud>',
    asunto: '¡Asesoría Estratégica Agendada con Éxito! — Smartcontacts',
    cuerpo_html: `<div style="font-family: sans-serif; padding: 20px;">
  <h2>¡Hola {{nombre}}!</h2>
  <p>Tu asesoría consultiva de 45M para la empresa <strong>{{empresa}}</strong> ha sido agendada con éxito.</p>
  <p><strong>Fecha:</strong> {{fecha}}<br><strong>Hora:</strong> {{hora}}</p>
  <p><a href="{{meetLink}}" style="background:#111; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none;">Unirse a Google Meet</a></p>
</div>`,
  },
  recordatorio_8am: {
    tipo: 'recordatorio_8am',
    mascara_remitente: 'Smartcontacts Recordatorios <recordatorios@smartcontacts.cloud>',
    asunto: '⏰ Recordatorio de Cita para Hoy: {{titulo}} ({{hora}})',
    cuerpo_html: `<div style="font-family: sans-serif; padding: 20px;">
  <h2>Hola {{nombre}},</h2>
  <p>Te recordamos que el día de hoy tienes agendada tu sesión consultiva de 45M.</p>
  <p><strong>Hora:</strong> {{hora}}<br><strong>Google Meet:</strong> <a href="{{meetLink}}">{{meetLink}}</a></p>
</div>`,
  },
  recordatorio_30m: {
    tipo: 'recordatorio_30m',
    mascara_remitente: 'Smartcontacts Alertas <alertas@smartcontacts.cloud>',
    asunto: '🚀 Tu asesoría inicia en 30 minutos: {{titulo}}',
    cuerpo_html: `<div style="font-family: sans-serif; padding: 20px;">
  <h2>¡Hola {{nombre}}!</h2>
  <p>Tu sesión consultiva inicia en 30 minutos.</p>
  <p><a href="{{meetLink}}" style="background:#10b981; color:#fff; padding:10px 16px; border-radius:8px; text-decoration:none;">Ingresar a la Sala Google Meet</a></p>
</div>`,
  },
}

// GET: Obtener plantillas predeterminadas
export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()
    let templatesMap: Record<string, EmailTemplateItem> = { ...DEFAULT_TEMPLATES }

    if (url && anonKey) {
      const res = await fetch(`${url}/rest/v1/plantillas_predeterminadas?select=*`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const rows = await res.json()
        rows.forEach((r: EmailTemplateItem) => {
          templatesMap[r.tipo] = r
        })
      }
    }

    return NextResponse.json({ success: true, templates: Object.values(templatesMap) })
  } catch (error: any) {
    console.error('[API TEMPLATES GET ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
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

    const upsertRes = await fetch(`${url}/rest/v1/plantillas_predeterminadas`, {
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

    if (!upsertRes.ok) {
      const errText = await upsertRes.text()
      console.error('[UPSERT TEMPLATE ERROR]', errText)
      return NextResponse.json({ success: false, error: 'Error guardando plantilla en Supabase' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Plantilla actualizada exitosamente' })
  } catch (error: any) {
    console.error('[API TEMPLATES PUT ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
