"use client"

import React, { useState, useEffect } from "react"
import {
  Mail,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Play,
  Send,
  Eye,
  Save,
  RefreshCw,
  Video,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
} from "lucide-react"

interface TemplateItem {
  tipo: "confirmacion" | "recordatorio_8am" | "recordatorio_30m"
  asunto: string
  cuerpo_html: string
  mascara_remitente: string
  actualizado_en?: string
}

const DEFAULT_TEMPLATES: Record<string, TemplateItem> = {
  confirmacion: {
    tipo: "confirmacion",
    asunto: "¡Asesoría Estratégica Agendada con Éxito! — Smartcontacts",
    mascara_remitente: "Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>",
    cuerpo_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111;">
  <h2 style="margin-top:0; color:#111;">¡Hola {{nombre}}!</h2>
  <p>Tu sesión estratégica consultiva de 45 minutos para la empresa <strong>{{empresa}}</strong> ha sido confirmada con éxito.</p>
  <div style="background: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0;"><strong>📅 Fecha:</strong> {{fecha}}</p>
    <p style="margin: 4px 0;"><strong>⏰ Hora:</strong> {{hora}} (Hora Colombia)</p>
    <p style="margin: 4px 0;"><strong>🎯 Tema:</strong> {{titulo}}</p>
  </div>
  <p style="margin: 24px 0;">
    <a href="{{meetLink}}" style="background: #111; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Ingresar a la Sala Google Meet
    </a>
  </p>
  <p style="font-size: 12px; color: #777;">Si requieres reprogramar o tienes dudas previas, responde directamente a este correo.</p>
</div>`,
  },
  recordatorio_8am: {
    tipo: "recordatorio_8am",
    asunto: "⏰ Recordatorio para Hoy: {{titulo}} a las {{hora}} — Smartcontacts",
    mascara_remitente: "Smartcontacts Recordatorios <jesus.carmona966@pascualbravo.edu.co>",
    cuerpo_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111;">
  <h2 style="margin-top:0;">Buenos días, {{nombre}}</h2>
  <p>Te recordamos que el día de hoy tienes agendada tu sesión consultiva de 45 minutos.</p>
  <div style="background: #fafafa; border: 1px solid #eaeaea; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <p style="margin: 4px 0;"><strong>⏰ Hora:</strong> {{hora}} (Hora Colombia)</p>
    <p style="margin: 4px 0;"><strong>🏢 Empresa:</strong> {{empresa}}</p>
    <p style="margin: 4px 0;"><strong>🎥 Sala Meet:</strong> <a href="{{meetLink}}">{{meetLink}}</a></p>
  </div>
  <p>Nos vemos hoy para estructurar tu nueva unidad de crecimiento con Inteligencia Artificial.</p>
</div>`,
  },
  recordatorio_30m: {
    tipo: "recordatorio_30m",
    asunto: "🚨 Tu asesoría inicia en 30 minutos: {{titulo}}",
    mascara_remitente: "Smartcontacts Alertas <jesus.carmona966@pascualbravo.edu.co>",
    cuerpo_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #111;">
  <h2 style="margin-top:0; color:#10b981;">¡Tu sesión inicia en 30 minutos!</h2>
  <p>Hola <strong>{{nombre}}</strong>, nuestro equipo consultor está listo para la reunión de las <strong>{{hora}}</strong>.</p>
  <p style="margin: 24px 0;">
    <a href="{{meetLink}}" style="background: #10b981; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">
      🎥 Entrar Ahora a Google Meet
    </a>
  </p>
  <p style="font-size: 12px; color: #888;">Te recomendamos ingresar 2 minutos antes para verificar tu micrófono y cámara.</p>
</div>`,
  },
}

export function BookingEmailsModule() {
  const [activePhase, setActivePhase] = useState<"confirmacion" | "recordatorio_8am" | "recordatorio_30m">("confirmacion")
  const [templates, setTemplates] = useState<Record<string, TemplateItem>>(DEFAULT_TEMPLATES)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Estado de Prueba de Envío
  const [testEmail, setTestEmail] = useState("jesus.carmona966@pascualbravo.edu.co")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  // Cargar plantillas desde API si existen
  useEffect(() => {
    setIsLoading(true)
    fetch("/api/email/templates")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.templates && data.templates.length > 0) {
          const map: Record<string, TemplateItem> = { ...DEFAULT_TEMPLATES }
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
      // Ignorar error de red y mantener local
    } finally {
      setIsSaving(false)
    }
  }

  // Disparar prueba de las 3 fases
  const handleTriggerTest = async () => {
    if (!testEmail || !testEmail.includes("@")) {
      setTestResult({ success: false, message: "Por favor ingresa un correo válido para la prueba." })
      return
    }

    setIsSendingTest(true)
    setTestResult(null)

    try {
      // Usar quick-send para simular el envío de la fase actual a la dirección ingresada
      const current = templates[activePhase]
      const sampleSubject = current.asunto
        .replace(/\{\{nombre\}\}/g, "Carlos Mendoza")
        .replace(/\{\{empresa\}\}/g, "InnovaTech")
        .replace(/\{\{titulo\}\}/g, "Asesoría Comercial 45M")
        .replace(/\{\{hora\}\}/g, "10:00 AM")

      const sampleBody = current.cuerpo_html
        .replace(/\{\{nombre\}\}/g, "Carlos Mendoza")
        .replace(/\{\{empresa\}\}/g, "InnovaTech Colombia")
        .replace(/\{\{titulo\}\}/g, "Asesoría Comercial 45M")
        .replace(/\{\{fecha\}\}/g, "Viernes 5 de Septiembre")
        .replace(/\{\{hora\}\}/g, "10:00 AM")
        .replace(/\{\{meetLink\}\}/g, "https://meet.google.com/sc-demo-test")

      const res = await fetch("/api/email/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: [{ email: testEmail, name: "Carlos Mendoza", company: "InnovaTech" }],
          subject: sampleSubject,
          message: sampleBody,
          dripSeconds: 0,
        }),
      })

      const data = await res.json()
      if (data.success && data.summary.sent > 0) {
        setTestResult({
          success: true,
          message: `✓ Correo de la ${activePhase.replace("_", " ").toUpperCase()} entregado con éxito a ${testEmail}.`,
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

  const currentTemplate = templates[activePhase]

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Encabezado */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-700">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-[#111] tracking-tight">
              Correos del Ciclo de Agendamiento (3 Fases)
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Transaccional Automático
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/60 font-normal mt-1">
            Envíos automáticos por evento: confirmación inmediata tras la reserva, recordatorio a las 8:00 AM y alerta 30 minutos antes.
          </p>
        </div>

        {/* Badge Cron */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs text-black/60 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cron Job Activo (`/api/cron/reminders`)</span>
        </div>
      </div>

      {/* Selector de las 3 Fases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            id: "confirmacion",
            num: "1",
            title: "Fase 1: Confirmación Inmediata",
            desc: "Se dispara al instante en que el prospecto confirma su asesoría de 45M.",
            icon: CheckCircle2,
            color: "text-purple-700",
          },
          {
            id: "recordatorio_8am",
            num: "2",
            title: "Fase 2: Recordatorio Matutino (8:00 AM)",
            desc: "Se dispara a primera hora del día fijado para recordar la reunión.",
            icon: Calendar,
            color: "text-blue-700",
          },
          {
            id: "recordatorio_30m",
            num: "3",
            title: "Fase 3: Alerta de 30 Minutos",
            desc: "Aviso de última hora con botón destacado para ingresar a Google Meet.",
            icon: AlertTriangle,
            color: "text-emerald-700",
          },
        ].map((phase) => {
          const isSelected = activePhase === phase.id
          return (
            <div
              key={phase.id}
              onClick={() => setActivePhase(phase.id as any)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border select-none ${
                isSelected
                  ? "bg-white border-purple-600/50 shadow-md ring-1 ring-purple-600/20"
                  : "bg-white/80 hover:bg-white border-black/[0.08] hover:border-black/20 shadow-xs"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-full bg-black/5 text-[#111] flex items-center justify-center text-xs font-bold font-mono">
                  {phase.num}
                </span>
                <phase.icon className={`w-4 h-4 ${phase.color}`} />
              </div>
              <h3 className="text-xs font-semibold text-[#111] mb-1">{phase.title}</h3>
              <p className="text-[11px] text-black/50 leading-relaxed">{phase.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Contenedor Principal: Editor de Plantilla + Panel de Prueba */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor de la Fase Activa (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
            <div>
              <h3 className="text-sm font-semibold text-[#111]">
                Plantilla: {activePhase.replace("_", " ").toUpperCase()}
              </h3>
              <p className="text-[11px] text-black/50">
                Variables disponibles: <code className="text-purple-700">&#123;&#123;nombre&#125;&#125;</code>,{" "}
                <code className="text-purple-700">&#123;&#123;empresa&#125;&#125;</code>,{" "}
                <code className="text-purple-700">&#123;&#123;fecha&#125;&#125;</code>,{" "}
                <code className="text-purple-700">&#123;&#123;hora&#125;&#125;</code>,{" "}
                <code className="text-purple-700">&#123;&#123;meetLink&#125;&#125;</code>.
              </p>
            </div>

            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-xs disabled:bg-black/30"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Plantilla actualizada correctamente en la base de datos.</span>
            </div>
          )}

          {/* Máscara y Asunto */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-black/70 block mb-1">Máscara del Remitente</label>
              <input
                type="text"
                value={currentTemplate.mascara_remitente}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, mascara_remitente: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-black/70 block mb-1">Asunto del Correo</label>
              <input
                type="text"
                value={currentTemplate.asunto}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, asunto: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-medium text-[#111]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-black/70 block mb-1">Cuerpo HTML del Correo</label>
              <textarea
                rows={10}
                value={currentTemplate.cuerpo_html}
                onChange={(e) =>
                  setTemplates({
                    ...templates,
                    [activePhase]: { ...currentTemplate, cuerpo_html: e.target.value },
                  })
                }
                className="w-full p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] leading-relaxed resize-y focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>
        </div>

        {/* Panel Lateral: Simulación y Prueba en Vivo (1 Col) */}
        <div className="space-y-5">
          {/* Tarjeta de Disparo de Prueba */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#111]">
              <Send className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-semibold">Probar Envío en Vivo</h3>
            </div>

            <p className="text-xs text-black/60">
              Envía una simulación real de la fase seleccionada a tu bandeja de correo para verificar el diseño en Gmail.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-black/70 block">Enviar prueba a:</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="tu_correo@empresa.com"
                className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111]"
              />

              <button
                type="button"
                disabled={isSendingTest}
                onClick={handleTriggerTest}
                className="w-full py-2.5 px-4 bg-[#111] hover:bg-black text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs disabled:bg-black/30"
              >
                {isSendingTest ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Disparando en Gmail API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar Prueba ({activePhase.replace("_", " ")})</span>
                  </>
                )}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  testResult.success
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900"
                    : "bg-red-500/10 border-red-500/20 text-red-900"
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Tarjeta de Trazabilidad del Cron */}
          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-xs text-black/60 space-y-2.5">
            <span className="font-semibold text-[#111] block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Reglas de Ejecución Automática</span>
            </span>
            <ul className="space-y-2 text-[11px] text-black/70">
              <li className="flex items-start gap-2">
                <span className="text-purple-700 font-bold font-mono">1.</span>
                <span><strong>Confirmación:</strong> Inmediata en el endpoint <code>/api/booking</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-700 font-bold font-mono">2.</span>
                <span><strong>Recordatorio 8:00 AM:</strong> Cron diario programado en Dokploy a las 08:00 AM Colombia.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-700 font-bold font-mono">3.</span>
                <span><strong>Alerta 30M:</strong> Disparo cuando <code>hora_cita - now() &lt;= 30 min</code>.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
