"use client"

import React, { useState, useEffect } from "react"
import {
  Send,
  Mail,
  ShieldCheck,
  Zap,
  Play,
  CheckCircle2,
  Clock,
  RefreshCw,
  Terminal,
  Upload,
  Layers,
  FileText,
  Save,
  Check,
  Ban,
  UserCheck,
  SlidersHorizontal,
} from "lucide-react"

export function EmailAutomationModule() {
  const [activeTab, setActiveTab] = useState<"templates" | "contacts" | "roundrobin" | "dispatch">("dispatch")
  
  // State for Templates
  const [templates, setTemplates] = useState<any[]>([])
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  
  // State for Contact Upload & Campaign Tagging
  const [campaignName, setCampaignName] = useState("Campaña Q3 - Consultoría IA Agéntica")
  const [rawContactsInput, setRawContactsInput] = useState("carlos@empresa1.com\nmaria@empresa2.com\njuan@empresa3.com")
  const [contactInventory, setContactInventory] = useState<any[]>([])
  const [uploadMessage, setUploadMessage] = useState("")

  // State for Dispatch & Round-Robin
  const [senderEmail, setSenderEmail] = useState("jesus.carmona966@pascualbravo.edu.co")
  const [senderMask, setSenderMask] = useState("Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>")
  const [dripMin, setDripMin] = useState(3.0)
  const [dripMax, setDripMax] = useState(5.0)

  const [isSending, setIsSending] = useState(false)
  const [logs, setLogs] = useState<Array<{ timestamp: string; email: string; delay: string; status: "success" | "pending" | "error" }>>([])
  const [sentToday, setSentToday] = useState(0)

  const dailyQuota = senderEmail.endsWith("@pascualbravo.edu.co") ? 2000 : 500

  // Fetch Templates
  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/email/templates")
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates)
        if (data.templates.length > 0 && !editingTemplate) {
          setEditingTemplate(data.templates[0])
        }
      }
    } catch (err) {
      console.error("Error loading templates:", err)
    }
  }

  // Fetch Contact Inventory
  const loadContacts = async () => {
    try {
      const res = await fetch(`/api/email/contacts?campana_nombre=${encodeURIComponent(campaignName)}`)
      const data = await res.json()
      if (data.success) {
        setContactInventory(data.contacts)
      }
    } catch (err) {
      console.error("Error loading contacts:", err)
    }
  }

  useEffect(() => {
    loadTemplates()
    loadContacts()
  }, [campaignName])

  // Save Template Action (PUT)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return
    try {
      const res = await fetch(`/api/email/templates`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTemplate),
      })
      const data = await res.json()
      if (data.success) {
        alert("Plantilla predeterminada actualizada y guardada correctamente.")
        loadTemplates()
      } else {
        alert("Error: " + data.error)
      }
    } catch (err) {
      console.error("Error saving template:", err)
    }
  }

  // Upload Contacts Action (POST)
  const handleUploadContacts = async (e: React.FormEvent) => {
    e.preventDefault()
    const emails = rawContactsInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.includes("@"))

    if (emails.length === 0) {
      alert("Ingresa al menos un correo válido.")
      return
    }

    try {
      const res = await fetch("/api/email/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campana_nombre: campaignName,
          contactos: emails.map((e) => ({ email: e })),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setUploadMessage(data.message)
        loadContacts()
      } else {
        alert("Error: " + data.error)
      }
    } catch (err) {
      console.error("Error uploading contacts:", err)
    }
  }

  // Start Campaign Dispatch Action (POST)
  const handleStartDispatch = async () => {
    setIsSending(true)
    setLogs([])
    try {
      const res = await fetch("/api/email/dispatch-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campana_nombre: campaignName,
          remitente: senderEmail,
          mascara_remitente: senderMask,
          drip_min: dripMin,
          drip_max: dripMax,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSentToday(data.sentToday)
        alert(`Campaña procesada: ${data.enviados} enviados. ${data.motivo_corte ? `Corte: ${data.motivo_corte}` : ""}`)
        loadContacts()
      } else {
        alert("Error: " + (data.error || data.message))
      }
    } catch (err) {
      console.error("Error starting dispatch:", err)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="w-full space-y-6 font-sans text-[#111]">
      
      {/* ── TOP HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
            Motor de Automatización de Correos & Control de Cuota por Dominio
          </h1>
          <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
            Gestor de envíos por goteo (3-5s), rotación Round-Robin anti-spam y aprendizaje dinámico de cuotas de Gmail API.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-left font-mono">
            <span className="text-[10px] text-black/40 uppercase block font-bold">REMITENTE VERIFICADO</span>
            <span className="text-xs text-emerald-700 font-bold">{sentToday} / {dailyQuota} CORREOS HOY</span>
          </div>
        </div>
      </div>

      {/* ── TABS DE NAVEGACIÓN LIMPIAS SEGÚN DESIGN.MD ────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs text-xs font-medium">
        <button
          onClick={() => setActiveTab("dispatch")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "dispatch" ? "bg-[#111] text-white shadow-xs" : "text-black/60 hover:bg-black/5 hover:text-[#111]"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Despacho & Goteo en Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "templates" ? "bg-[#111] text-white shadow-xs" : "text-black/60 hover:bg-black/5 hover:text-[#111]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Plantillas Predeterminadas (3 Tipos)</span>
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "contacts" ? "bg-[#111] text-white shadow-xs" : "text-black/60 hover:bg-black/5 hover:text-[#111]"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Fuente de Contactos & Campaña</span>
        </button>

        <button
          onClick={() => setActiveTab("roundrobin")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "roundrobin" ? "bg-[#111] text-white shadow-xs" : "text-black/60 hover:bg-black/5 hover:text-[#111]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Pool Round-Robin Anti-Spam</span>
        </button>
      </div>

      {/* ── TAB 1: DESPACHO & GOTEO EN VIVO ───────────────────────────────────── */}
      {activeTab === "dispatch" && (
        <div className="space-y-6">
          
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block">
                CUOTA DIARIA GMAIL API
              </span>
              <div className="text-2xl font-bold text-[#111] tracking-tight">{sentToday} / {dailyQuota}</div>
              <p className="text-[11px] text-black/60 font-sans">
                Dominio: <span className="font-mono font-semibold text-[#111]">{senderEmail.split('@')[1]}</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                RANGO DE GOTEO ALEATORIO
              </span>
              <div className="text-2xl font-bold text-[#111] tracking-tight">{dripMin}s — {dripMax}s</div>
              <p className="text-[11px] text-black/60 font-sans">Velocidad segura: ~12–20 correos/minuto</p>
            </div>

            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-1">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                CONTACTOS PENDIENTES
              </span>
              <div className="text-2xl font-bold text-emerald-700 tracking-tight">
                {contactInventory.filter((c) => c.estado === 'pendiente').length} Pendientes
              </div>
              <p className="text-[11px] text-black/60 font-sans">Campaña: {campaignName}</p>
            </div>
          </div>

          {/* DESPACHADOR & CONTROLES */}
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
            <div className="border-b border-black/[0.06] pb-3 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#111]">Despacho de Campaña por Goteo (Round-Robin)</h3>
              <button
                onClick={handleStartDispatch}
                disabled={isSending}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Ejecutando Goteo...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Iniciar Despacho por Goteo ({dripMin}s–{dripMax}s)</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Máscara de Remitente *
                </label>
                <input
                  type="text"
                  value={senderMask}
                  onChange={(e) => setSenderMask(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Rango de Goteo Aleatorio (Segundos)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={dripMin}
                    onChange={(e) => setDripMin(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-center"
                  />
                  <span className="text-black/40 font-mono">a</span>
                  <input
                    type="number"
                    step="0.5"
                    value={dripMax}
                    onChange={(e) => setDripMax(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: PLANTILLAS PREDETERMINADAS ─────────────────────────────────── */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2 font-sans">
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block mb-2">
              SELECCIONAR TIPO DE PLANTILLA
            </span>
            {templates.map((tpl) => (
              <div
                key={tpl.tipo}
                onClick={() => setEditingTemplate(tpl)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  editingTemplate?.tipo === tpl.tipo
                    ? "bg-[#111] text-white border-[#111] shadow-xs"
                    : "bg-white text-[#111] border-black/[0.08] hover:bg-black/[0.02]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold capitalize">{tpl.tipo.replace("_", " ")}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </div>
                <p className="text-[11px] opacity-70 truncate mt-1">{tpl.asunto}</p>
              </div>
            ))}
          </div>

          {editingTemplate && (
            <form onSubmit={handleSaveTemplate} className="lg:col-span-8 p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
                <h3 className="text-sm font-semibold text-[#111] capitalize">
                  Editar Plantilla Predeterminada: <span className="font-mono text-purple-700">{editingTemplate.tipo}</span>
                </h3>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-colors shadow-2xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Plantilla</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Máscara del Remitente *
                </label>
                <input
                  type="text"
                  value={editingTemplate.mascara_remitente || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, mascara_remitente: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Asunto del Correo *
                </label>
                <input
                  type="text"
                  value={editingTemplate.asunto || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, asunto: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-medium text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Cuerpo del Mensaje (HTML & Variables Dinámicas: &#123;&#123;nombre&#125;&#125;, &#123;&#123;fecha&#125;&#125;, &#123;&#123;hora&#125;&#125;, &#123;&#123;meetLink&#125;&#125;)
                </label>
                <textarea
                  rows={8}
                  value={editingTemplate.cuerpo_html || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, cuerpo_html: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30 resize-none"
                />
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── TAB 3: FUENTE DE CONTACTOS & CAMPAÑA ──────────────────────────────── */}
      {activeTab === "contacts" && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4 font-sans text-xs">
            <div className="border-b border-black/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-[#111]">Herramienta de Carga de Contactos & Etiquetado por Campaña</h3>
            </div>

            <form onSubmit={handleUploadContacts} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Nombre de la Campaña (Etiqueta Única) *
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-semibold text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Lista de Correos Electrónicos (Un correo por línea) *
                </label>
                <textarea
                  rows={5}
                  value={rawContactsInput}
                  onChange={(e) => setRawContactsInput(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30 resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-1">
                {uploadMessage && (
                  <span className="text-xs font-mono text-emerald-700 font-bold">{uploadMessage}</span>
                )}
                <button
                  type="submit"
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-colors shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Contactos & Excluir Duplicados</span>
                </button>
              </div>
            </form>
          </div>

          {/* TABLA DE INVENTARIO DE CONTACTOS */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs font-sans">
            <div className="p-4 border-b border-black/[0.07] bg-[#F5F4F0] flex justify-between items-center text-xs font-mono">
              <span className="font-bold uppercase text-black/50">INVENTARIO CARGADO: {campaignName}</span>
              <span className="text-black/70 font-bold">{contactInventory.length} Contactos Registrados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                    <th className="py-3 px-3.5">Correo Electrónico</th>
                    <th className="py-3 px-3.5">Nombre</th>
                    <th className="py-3 px-3.5">Campaña</th>
                    <th className="py-3 px-3.5">Estado</th>
                    <th className="py-3 px-3.5 text-right">Último Envío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {contactInventory.length > 0 ? (
                    contactInventory.map((c) => (
                      <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-3 px-3.5 font-mono font-medium text-[#111]">{c.email}</td>
                        <td className="py-3 px-3.5 text-black/70">{c.nombre}</td>
                        <td className="py-3 px-3.5 font-mono text-black/50">{c.campana_nombre}</td>
                        <td className="py-3 px-3.5 font-mono">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.estado === 'enviado' ? 'bg-emerald-500/10 text-emerald-800' : 'bg-purple-500/10 text-purple-800'
                          }`}>
                            {c.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono text-black/40">
                          {c.fecha_ultimo_envio ? new Date(c.fecha_ultimo_envio).toLocaleString('es-CO') : 'Sin envíos'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-black/40 font-mono">
                        No hay contactos cargados para esta campaña.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: POOL ROUND-ROBIN ANTI-SPAM ───────────────────────────────── */}
      {activeTab === "roundrobin" && (
        <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4 font-sans text-xs">
          <div className="border-b border-black/[0.06] pb-3">
            <h3 className="text-sm font-semibold text-[#111]">Gestor de Rotación Round-Robin Anti-Spam</h3>
            <p className="text-xs text-black/60 mt-0.5">
              Rotación secuencial de **Pool de Asuntos** y **Pool de Cuerpos** para romper patrones repetitivos y garantizar 0% Spam Score.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-2">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block">
                POOL DE ASUNTOS ALTERNATIVOS
              </span>
              <ul className="space-y-1.5 text-xs text-black/80 font-mono">
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">1. Asesoría Consultiva en IA Agéntica — Smartcontacts</li>
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">2. Nueva Unidad Agéntica de Crecimiento Comercial</li>
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">3. Estrategia de Prospección y Automatizaciones 45M</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-2">
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block">
                POOL DE CUERPOS HTML ALTERNATIVOS
              </span>
              <ul className="space-y-1.5 text-xs text-black/80 font-mono">
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">1. Variación A: Énfasis en Consultoría e IA</li>
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">2. Variación B: Énfasis en Automatización n8n</li>
                <li className="p-2 rounded-lg bg-white border border-black/[0.04]">3. Variación C: Invitación Directa a Reserva</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
