"use client"

import React, { useState, useEffect } from "react"
import {
  Send,
  Mail,
  Play,
  Pause,
  RefreshCw,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  Trash2,
  Plus,
} from "lucide-react"

interface CampaignItem {
  id: string
  nombre: string
  descripcion?: string
  estado: string
  directorio_id?: string
  remitente?: string
  drip_min?: number
  drip_max?: number
  creado_en?: string
}

interface DirectoryItem {
  id: string
  nombre: string
}

interface GmailAccount {
  id: string
  email: string
  name: string
  dailyLimit: number
  sentToday: number
  active: boolean
}

export function MarketingCampaignsModule() {
  // 1. Datos del Servidor
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [directories, setDirectories] = useState<DirectoryItem[]>([])
  const [accounts, setAccounts] = useState<GmailAccount[]>([])
  const [selectedDirectory, setSelectedDirectory] = useState<string>("")
  const [selectedAccount, setSelectedAccount] = useState<string>("auto")
  const [isLoading, setIsLoading] = useState(true)

  // 2. Variantes de Asunto y Mensaje (Round-Robin Anti-Spam)
  const [subjects, setSubjects] = useState<string[]>([
    "Nueva unidad de crecimiento comercial para {{empresa}}",
    "{{nombre}}, consulta estratégica sobre prospección con IA",
    "Optimización de ventas y calificación agéntica para {{empresa}}",
  ])
  const [newSubjectInput, setNewSubjectInput] = useState("")
  const [campaignMessage, setCampaignMessage] = useState(
    "Hola {{nombre}},\n\nAnalizamos la estructura de {{empresa}} y diseñamos una solución agéntica para generar citas comerciales sin aumentar tu equipo operativo.\n\nPuedes conocer nuestra propuesta completa y casos de éxito aquí: https://smartcontacts.cloud/propuesta o chatear directamente con nosotros por WhatsApp: https://wa.me/573127529629\n\nSaludos,\nEquipo Smartcontacts"
  )

  // 3. Controles de Despacho & Goteo
  const [dripSeconds, setDripSeconds] = useState(4)
  const [isDispatching, setIsDispatching] = useState(false)
  const [dispatchProgress, setDispatchProgress] = useState<{
    sent: number
    total: number
    blockedAntiSpam: number
    failed: number
    percentage: number
  } | null>(null)
  const [dispatchLogs, setDispatchLogs] = useState<Array<{ email: string; status: string; detail?: string }>>([])
  const [alertFeedback, setAlertFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Cargar Directorios y Cuentas
  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      fetch("/api/email/directories").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/email/accounts").then((r) => r.json()).catch(() => ({ success: false })),
    ])
      .then(([dirData, accData]) => {
        if (dirData.success && dirData.directories) {
          setDirectories(dirData.directories)
          if (dirData.directories.length > 0) {
            setSelectedDirectory(dirData.directories[0].nombre)
          }
        }
        if (accData.success && accData.accounts) {
          setAccounts(accData.accounts)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  // Agregar Variante de Asunto
  const handleAddSubject = () => {
    if (newSubjectInput.trim() && !subjects.includes(newSubjectInput.trim())) {
      setSubjects([...subjects, newSubjectInput.trim()])
      setNewSubjectInput("")
    }
  }

  // Eliminar Variante
  const handleRemoveSubject = (index: number) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((_, i) => i !== index))
    }
  }

  // Iniciar Despacho de Campaña
  const handleStartCampaign = async () => {
    if (!selectedDirectory) {
      setAlertFeedback({ type: "error", text: "Debes seleccionar un directorio de audiencia." })
      return
    }
    if (subjects.length === 0) {
      setAlertFeedback({ type: "error", text: "Debes configurar al menos una variante de asunto." })
      return
    }

    setIsDispatching(true)
    setAlertFeedback(null)
    setDispatchLogs([])
    setDispatchProgress({ sent: 0, total: 10, blockedAntiSpam: 0, failed: 0, percentage: 5 })

    try {
      // 1. Obtener los contactos pendientes de ese directorio
      const contactsRes = await fetch(
        `/api/email/contacts?directorio_nombre=${encodeURIComponent(selectedDirectory)}&pageSize=50`
      )
      const contactsData = await contactsRes.json()
      const contactList = contactsData.contacts || []

      if (contactList.length === 0) {
        setAlertFeedback({
          type: "error",
          text: `El directorio "${selectedDirectory}" no tiene contactos activos. Carga contactos en la sección Audiencias.`,
        })
        setIsDispatching(false)
        setDispatchProgress(null)
        return
      }

      setDispatchProgress({
        sent: 0,
        total: contactList.length,
        blockedAntiSpam: 0,
        failed: 0,
        percentage: 10,
      })

      // 2. Disparar despacho con el endpoint quick-send
      const chosenAccount = accounts.find((a) => a.id === selectedAccount)
      const payload = {
        recipients: contactList.map((c: any) => ({
          email: c.email,
          name: c.nombre,
          company: selectedDirectory,
        })),
        subjects,
        message: campaignMessage,
        senderEmail: chosenAccount?.email,
        senderName: chosenAccount?.name,
        dripSeconds,
      }

      const res = await fetch("/api/email/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error en el despacho")
      }

      setDispatchProgress({
        sent: data.summary.sent,
        total: data.summary.total,
        blockedAntiSpam: data.summary.blockedAntiSpam,
        failed: data.summary.failed,
        percentage: 100,
      })

      setDispatchLogs(data.results || [])
      setAlertFeedback({
        type: "success",
        text: `✓ Campaña despachada: ${data.summary.sent} enviados, ${data.summary.blockedAntiSpam} protegidos por Anti-Spam.`,
      })
    } catch (err: any) {
      setAlertFeedback({ type: "error", text: err.message || "Error despachando campaña." })
    } finally {
      setIsDispatching(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Encabezado Principal */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-700">
              <Send className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-[#111] tracking-tight">
              Campañas & Despacho Automatizado
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-700 border border-purple-500/20">
              Prospección Masiva
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/60 font-normal mt-1">
            Orquestación de envíos por lotes con goteo progresivo, rotación de asuntos (Round-Robin) y auditoría en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-black/60">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Filtro de 119k dominios activo</span>
        </div>
      </div>

      {alertFeedback && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
            alertFeedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-900"
              : "bg-red-500/10 border-red-500/20 text-red-900"
          }`}
        >
          <span>{alertFeedback.text}</span>
          <button onClick={() => setAlertFeedback(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Grid de Configuración: Audiencia + Remitente + Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Parámetros de la Campaña (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Selección de Audiencia y Remitente */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-700" />
              <span>1. Configuración de Destino y Remitente</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Directorio Objetivo */}
              <div>
                <label className="font-medium text-black/70 block mb-1">Directorio / Lista de Contactos</label>
                <div className="relative">
                  <select
                    value={selectedDirectory}
                    onChange={(e) => setSelectedDirectory(e.target.value)}
                    className="w-full appearance-none bg-[#F5F4F0] border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#111] font-medium pr-8 focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    {directories.length === 0 ? (
                      <option value="">No hay directorios creados</option>
                    ) : (
                      directories.map((d) => (
                        <option key={d.id} value={d.nombre}>
                          📂 {d.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-black/40 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Cuenta Remitente de Gmail */}
              <div>
                <label className="font-medium text-black/70 block mb-1">Cuenta Remitente (Gmail)</label>
                <div className="relative">
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full appearance-none bg-[#F5F4F0] border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#111] font-medium pr-8 focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="auto">🔄 Rotación Automática entre Cuentas</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        ✉️ {acc.email} ({acc.dailyLimit} envíos/día)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-black/40 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Variantes de Asunto (Round-Robin Anti-Spam) */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>2. Variantes de Asunto (Rotación Round-Robin Anti-Spam)</span>
              </h3>
              <span className="text-[11px] text-purple-700 font-semibold">{subjects.length} variantes activas</span>
            </div>

            <p className="text-xs text-black/50">
              El sistema alternará estos asuntos secuencialmente en cada envío para evitar que los filtros de Google identifiquen envíos idénticos masivos.
            </p>

            <div className="space-y-2">
              {subjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/[0.02] border border-black/[0.04] text-xs text-[#111]"
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <span className="w-4 h-4 rounded-full bg-black/10 text-black/60 flex items-center justify-center text-[10px] font-mono shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{sub}</span>
                  </div>
                  {subjects.length > 1 && (
                    <button
                      onClick={() => handleRemoveSubject(idx)}
                      className="text-black/30 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="Escribe una nueva variante de asunto con {{nombre}} o {{empresa}}..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-3.5 py-2 bg-[#111] hover:bg-black text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje de la Campaña */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-[#111]">3. Contenido del Mensaje</h3>
            <textarea
              rows={7}
              value={campaignMessage}
              onChange={(e) => setCampaignMessage(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] font-sans leading-relaxed focus:outline-none focus:border-purple-600 resize-y"
            />
          </div>
        </div>

        {/* Columna Derecha: Panel de Despacho & Goteo (1 Col) */}
        <div className="space-y-5">
          {/* Tarjeta de Control de Goteo y Despacho */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-700" />
              <span>Control de Despacho</span>
            </h3>

            {/* Slider de Goteo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-black/70">Pausa entre correos (Goteo):</span>
                <span className="font-mono font-bold text-purple-700">{dripSeconds} seg</span>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                value={dripSeconds}
                onChange={(e) => setDripSeconds(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-black/40">
                El goteo progresivo emula el envío humano y previene alertas en Google.
              </p>
            </div>

            {/* Botón de Iniciar Campaña */}
            <div className="pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                disabled={isDispatching || !selectedDirectory}
                onClick={handleStartCampaign}
                className="w-full py-3 px-4 rounded-xl bg-[#111] hover:bg-black disabled:bg-black/20 text-white font-medium text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group"
              >
                {isDispatching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Despachando por Goteo...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    <span>Iniciar Despacho de Campaña</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progreso del Despacho */}
          {dispatchProgress && (
            <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-[#111]">
                <span>Progreso de Entrega</span>
                <span className="font-mono text-purple-700">{dispatchProgress.percentage}%</span>
              </div>

              <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${dispatchProgress.percentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-800">
                  <div className="font-bold text-sm">{dispatchProgress.sent}</div>
                  <div className="text-[9px]">Enviados</div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800">
                  <div className="font-bold text-sm">{dispatchProgress.blockedAntiSpam}</div>
                  <div className="text-[9px]">Anti-Spam</div>
                </div>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-800">
                  <div className="font-bold text-sm">{dispatchProgress.failed}</div>
                  <div className="text-[9px]">Errores</div>
                </div>
              </div>
            </div>
          )}

          {/* Registro de Auditoría en Vivo */}
          {dispatchLogs.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[#111] block">Detalle de Envíos:</span>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {dispatchLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] border border-black/[0.04] text-[11px]"
                  >
                    <span className="truncate max-w-[140px] text-[#111]">{log.email}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                        log.status === "enviado"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : log.status === "bloqueado_antispam"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-red-500/15 text-red-700"
                      }`}
                    >
                      {log.status === "enviado" ? "Entregado" : log.status === "bloqueado_antispam" ? "Anti-Spam" : "Fallo"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
