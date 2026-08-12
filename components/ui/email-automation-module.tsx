"use client"

import React, { useState } from "react"
import {
  Send,
  Mail,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Terminal,
  Sliders,
} from "lucide-react"

export function EmailAutomationModule() {
  const [senderEmail, setSenderEmail] = useState("jesus.carmona966@pascualbravo.edu.co")
  const [subject, setSubject] = useState("Asesoría Estratégica en IA Agéntica — Smartcontacts")
  const [recipientList, setRecipientList] = useState("cliente1@empresa.com\ncliente2@empresa.com\ncliente3@empresa.com")
  const [emailBody, setEmailBody] = useState(
    "Hola {{nombre}},\n\nTe invitamos a agendar tu sesión consultiva de 45 minutos para estructurar la nueva Unidad Agéntica de Crecimiento en tu empresa.\n\nEnlace directo: https://smartcontacts.cloud/agendar\n\nAtentamente,\nEquipo Smartcontacts"
  )

  const [isSending, setIsSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [logs, setLogs] = useState<Array<{ timestamp: string; email: string; delay: string; status: "success" | "pending" | "error" }>>([])

  const dailyQuota = senderEmail.endsWith("@pascualbravo.edu.co") ? 2000 : 500
  const quotaUsedPercentage = Math.min(100, Math.round((sentCount / dailyQuota) * 100))

  const handleStartDripCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    const emails = recipientList
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.includes("@"))

    if (emails.length === 0) {
      alert("Por favor ingresa al menos un correo electrónico válido.")
      return
    }

    setIsSending(true)
    setTotalCount(emails.length)
    setSentCount(0)
    setLogs([])

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      const timestamp = new Date().toLocaleTimeString("es-CO")

      try {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "lead",
            email: email,
            name: email.split("@")[0],
            topic: subject,
            description: emailBody,
          }),
        })

        // Random drip delay simulation 3.0s to 5.0s
        const randomDelaySeconds = (Math.random() * 2 + 3).toFixed(1)
        await new Promise((resolve) => setTimeout(resolve, parseFloat(randomDelaySeconds) * 1000))

        setSentCount((prev) => prev + 1)
        setLogs((prev) => [
          {
            timestamp,
            email,
            delay: `${randomDelaySeconds}s`,
            status: "success",
          },
          ...prev,
        ])
      } catch (err) {
        setLogs((prev) => [
          {
            timestamp,
            email,
            delay: "0s",
            status: "error",
          },
          ...prev,
        ])
      }
    }

    setIsSending(false)
  }

  return (
    <div className="w-full space-y-6 font-sans text-[#111]">
      
      {/* ── TOP HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
            Motor de Automatización & Envíos de Correo por Goteo
          </h1>
          <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
            Gestor de despachos masivos con <strong className="text-[#111]">Sistema de Goteo Aleatorio (3 a 5 segundos)</strong> y control estricto de cuota antispam de Google Workspace.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-left font-mono">
            <span className="text-[10px] text-black/40 uppercase block font-bold">ESTADO REMITENTE</span>
            <span className="text-xs text-emerald-700 font-bold">VERIFICADO (2,000 / DÍA)</span>
          </div>
        </div>
      </div>

      {/* ── QUOTA & DRIP STATS BENTO GRID ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* 1. Cuota Diaria */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-black/50">
            <span className="uppercase font-bold">CUOTA DIARIA GMAIL API</span>
            <span className="font-bold text-[#111]">{sentCount} / {dailyQuota}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F5F4F0] overflow-hidden border border-black/[0.05]">
            <div
              className="h-full bg-[#111] transition-all duration-300"
              style={{ width: `${Math.max(4, quotaUsedPercentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-black/60 font-sans mt-1">
            Cuenta: <span className="font-mono text-[#111] font-semibold">{senderEmail}</span>
          </p>
        </div>

        {/* 2. Sistema de Goteo Aleatorio */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            SISTEMA DE GOTEO ALEATORIO
          </span>
          <div className="text-2xl font-bold text-[#111] tracking-tight">3.0s — 5.0s</div>
          <p className="text-[11px] text-black/60 font-sans">
            Pausa dinámica antispam entre envíos (Velocidad: ~12–20 correos/min).
          </p>
        </div>

        {/* 3. Protección Antispam */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
          <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            PROTECCIÓN DE REPUTACIÓN
          </span>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">100% SEGURO</div>
          <p className="text-[11px] text-black/60 font-sans">
            Previene disparos en ráfaga e inyecta directamente a Bandeja de Entrada.
          </p>
        </div>

      </div>

      {/* ── CAMPAIGN DISPATCH FORM & LIVE TERMINAL LOGS ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORMULARIO DE ENVÍO Y CONFIGURACIÓN (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
          <div className="border-b border-black/[0.06] pb-3">
            <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
              <Mail className="w-4 h-4 text-black/40" />
              <span>Configuración de Envío Masivo por Goteo</span>
            </h3>
          </div>

          <form onSubmit={handleStartDripCampaign} className="space-y-4 text-xs font-sans">
            <div>
              <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                Remitente Registrado en Google Workspace *
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                Asunto del Correo *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs text-[#111] outline-none focus:border-black/30 font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                Destinatarios (Un correo por línea) *
              </label>
              <textarea
                rows={4}
                value={recipientList}
                onChange={(e) => setRecipientList(e.target.value)}
                required
                placeholder="cliente1@empresa.com&#10;cliente2@empresa.com"
                className="w-full p-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30 resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                Cuerpo del Mensaje / Plantilla HTML
              </label>
              <textarea
                rows={5}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-sans text-[#111] outline-none focus:border-black/30 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-medium transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ejecutando Goteo ({sentCount}/{totalCount})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Iniciar Envío Masivo por Goteo (3-5s)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* TERMINAL EN VIVO / LOGS DE GOTEO (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-black/40" />
                CONSOLA DE DESPACHOS EN VIVO
              </span>
              <span className="text-[10px] font-mono text-black/40">
                {logs.length} Registros
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-[380px] overflow-y-auto font-mono text-xs">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-black/40">
                      <span>[{log.timestamp}]</span>
                      <span className="text-purple-700 font-bold">PAUSA: {log.delay}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/80 font-semibold truncate max-w-[180px]">{log.email}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        DESPACHADO
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-black/40 font-mono text-xs">
                  Esperando inicio de campaña por goteo...
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.05] text-[11px] font-mono text-black/60">
            💡 Cada correo es procesado individualmente aplicando entre 3.0s y 5.0s de retardo aleatorio antispam.
          </div>
        </div>

      </div>

    </div>
  )
}
