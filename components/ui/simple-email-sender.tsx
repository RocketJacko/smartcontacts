"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Send,
  Mail,
  ShieldCheck,
  Zap,
  Users,
  Key,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  ChevronDown,
  Layers,
  Check,
} from "lucide-react"

interface GmailAccount {
  id: string
  email: string
  name: string
  dailyLimit: number
  sentToday: number
  active: boolean
  hasCredentials: boolean
}

interface RecipientItem {
  email: string
  name?: string
  company?: string
}

export function SimpleEmailSender({ onSwitchToAdvanced }: { onSwitchToAdvanced?: () => void }) {
  // 1. Estado de Cuentas de Gmail
  const [accounts, setAccounts] = useState<GmailAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("auto")
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false)

  // 2. Destinatarios
  const [inputMode, setInputMode] = useState<"text" | "file">("text")
  const [rawEmailsInput, setRawEmailsInput] = useState("")
  const [parsedRecipients, setParsedRecipients] = useState<RecipientItem[]>([])
  const [fileFeedback, setFileFeedback] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 3. Contenido del Correo
  const [subject, setSubject] = useState("Oportunidad de crecimiento comercial para {{nombre}}")
  const [altSubjects, setAltSubjects] = useState<string[]>([])
  const [newAltSubject, setNewAltSubject] = useState("")
  const [isAddingAltSubject, setIsAddingAltSubject] = useState(false)
  const [message, setMessage] = useState(
    "Hola {{nombre}},\n\nEsperamos que todo vaya excelente en {{empresa}}.\n\nNos ponemos en contacto para compartirte cómo podemos estructurar una nueva unidad de crecimiento para tu empresa con agentes de Inteligencia Artificial.\n\nPuedes agendar una asesoría de 45 minutos aquí: https://smartcontacts.cloud/agendar\n\nSaludos cordiales,\nEquipo Smartcontacts"
  )

  // 4. Configuración Anti-Spam
  const [antiSpamEnabled, setAntiSpamEnabled] = useState(true)
  const [dripSeconds, setDripSeconds] = useState(3)

  // 5. Estado del Envío
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{ current: number; total: number; percentage: number } | null>(null)
  const [sendResults, setSendResults] = useState<{
    summary: { total: number; sent: number; blockedAntiSpam: number; failed: number }
    results: Array<{ email: string; name?: string; status: string; detail?: string; senderUsed?: string }>
  } | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 6. Modal de Agregar Cuenta
  const [newAccountForm, setNewAccountForm] = useState({
    email: "",
    name: "",
    clientId: "",
    clientSecret: "",
    refreshToken: "",
  })
  const [accountSaveSuccess, setAccountSaveSuccess] = useState(false)

  // Cargar Cuentas al Iniciar
  const fetchAccounts = async () => {
    setIsLoadingAccounts(true)
    try {
      const res = await fetch("/api/email/accounts")
      const data = await res.json()
      if (data.success && data.accounts) {
        setAccounts(data.accounts)
        if (data.accounts.length > 0 && selectedAccountId === "auto") {
          // Mantener "auto" o la primera
        }
      }
    } catch (e) {
      console.error("Error al cargar cuentas:", e)
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  // Parsear correos del input de texto
  useEffect(() => {
    if (inputMode === "text") {
      const lines = rawEmailsInput
        .split(/[\n,;]+/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      const parsed: RecipientItem[] = []
      for (const line of lines) {
        // Soporta formatos: "nombre <correo@dominio.com>" o "correo@dominio.com" o "correo@dominio.com, Juan, Empresa"
        const angleMatch = line.match(/(.*?)\s*<(.+?)>/)
        if (angleMatch) {
          parsed.push({
            name: angleMatch[1].trim() || undefined,
            email: angleMatch[2].trim(),
          })
        } else if (line.includes("@")) {
          const parts = line.split(/[|\t]+/)
          parsed.push({
            email: parts[0].trim(),
            name: parts[1]?.trim() || undefined,
            company: parts[2]?.trim() || undefined,
          })
        }
      }
      setParsedRecipients(parsed)
    }
  }, [rawEmailsInput, inputMode])

  // Procesar archivo CSV / TXT simple
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileFeedback("Leyendo archivo...")
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
        
        if (lines.length === 0) {
          setFileFeedback("El archivo está vacío.")
          return
        }

        // Detectar si la primera línea es encabezado
        const firstLine = lines[0].toLowerCase()
        const startIndex = firstLine.includes("email") || firstLine.includes("correo") ? 1 : 0

        const parsed: RecipientItem[] = []
        for (let i = startIndex; i < lines.length; i++) {
          const row = lines[i].split(/[,;\t]+/).map((c) => c.replace(/^["']|["']$/g, "").trim())
          if (row.length > 0 && row[0].includes("@")) {
            parsed.push({
              email: row[0],
              name: row[1] || undefined,
              company: row[2] || undefined,
            })
          }
        }

        setParsedRecipients(parsed)
        setFileFeedback(`✓ Se cargaron ${parsed.length} contactos desde ${file.name}`)
      } catch (err: any) {
        setFileFeedback(`Error al procesar archivo: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  // Ejecutar Envío
  const handleSendEmails = async () => {
    if (parsedRecipients.length === 0) {
      setErrorMessage("Por favor ingresa o sube al menos un correo destinatario.")
      return
    }
    if (!subject.trim()) {
      setErrorMessage("Por favor escribe el asunto del correo.")
      return
    }
    if (!message.trim()) {
      setErrorMessage("Por favor escribe el mensaje a enviar.")
      return
    }

    setErrorMessage(null)
    setIsSending(true)
    setSendResults(null)
    setSendProgress({ current: 0, total: parsedRecipients.length, percentage: 0 })

    try {
      const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
      const allSubjects = [subject.trim(), ...altSubjects.map((s) => s.trim()).filter((s) => s.length > 0)]

      const payload = {
        recipients: parsedRecipients,
        subject: subject.trim(),
        subjects: allSubjects,
        message: message.trim(),
        senderEmail: selectedAccount ? selectedAccount.email : undefined,
        senderName: selectedAccount ? selectedAccount.name : undefined,
        dripSeconds: antiSpamEnabled ? dripSeconds : 0,
      }

      const res = await fetch("/api/email/quick-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Ocurrió un error durante el envío.")
      }

      setSendResults(data)
      setSendProgress({ current: parsedRecipients.length, total: parsedRecipients.length, percentage: 100 })
    } catch (err: any) {
      setErrorMessage(err.message || "Error al conectar con el servidor.")
    } finally {
      setIsSending(false)
    }
  }

  // Agregar variante de asunto
  const handleAddAltSubject = () => {
    if (newAltSubject.trim() && !altSubjects.includes(newAltSubject.trim())) {
      setAltSubjects([...altSubjects, newAltSubject.trim()])
      setNewAltSubject("")
      setIsAddingAltSubject(false)
    }
  }

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0]

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <Mail className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-[#111] tracking-tight">
              Envío de Correos Electrónicos
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Anti-Spam Activo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/60 font-normal mt-1">
            Redacta tu mensaje, define tus destinatarios y despacha con rotación de cuentas y protección automática.
          </p>
        </div>

        {onSwitchToAdvanced && (
          <button
            onClick={onSwitchToAdvanced}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-black/60 hover:text-[#111] bg-white hover:bg-black/[0.03] border border-black/[0.08] rounded-xl transition-colors shadow-2xs self-start sm:self-auto"
          >
            <Layers className="w-3.5 h-3.5 text-black/40" />
            <span>Modo Avanzado (BD +200k)</span>
          </button>
        )}
      </div>

      {/* Grid de Configuración del Envío */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Redacción y Destinatarios (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* PASO 1: Remitente / Cuenta de Gmail */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/5 text-black/70 flex items-center justify-center text-xs font-semibold">
                  1
                </span>
                <h3 className="text-sm font-semibold text-[#111]">Cuenta Remitente (Gmail)</h3>
              </div>

              <button
                onClick={() => setIsAddAccountModalOpen(true)}
                className="text-xs font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar otra cuenta</span>
              </button>
            </div>

            {isLoadingAccounts ? (
              <div className="flex items-center gap-2 py-3 text-xs text-black/40">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Cargando cuentas conectadas...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900">
                No se detectaron credenciales de Gmail en el entorno. Configura las variables en Dokploy o haz clic en Agregar cuenta.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full appearance-none bg-[#F5F4F0] hover:bg-black/[0.04] border border-black/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-[#111] font-medium pr-10 focus:outline-none focus:border-purple-600 transition-colors cursor-pointer"
                  >
                    <option value="auto">
                      🔄 Rotación Inteligente (Distribuir entre todas las cuentas activas)
                    </option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        ✉️ {acc.name} — {acc.email} (Límite: {acc.dailyLimit} correos/día)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-black/40 absolute right-3.5 top-3 pointer-events-none" />
                </div>

                {activeAccount && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.04] text-[11px] text-black/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Cuenta activa: <strong>{activeAccount.email}</strong></span>
                    <span className="text-black/30">•</span>
                    <span>Tokens renovados automáticamente</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PASO 2: Destinatarios */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/5 text-black/70 flex items-center justify-center text-xs font-semibold">
                  2
                </span>
                <h3 className="text-sm font-semibold text-[#111]">Destinatarios</h3>
              </div>

              {/* Selector de Modo */}
              <div className="flex items-center p-0.5 rounded-lg bg-black/[0.04] border border-black/[0.06] text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode("text")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    inputMode === "text" ? "bg-white text-[#111] shadow-2xs" : "text-black/50 hover:text-[#111]"
                  }`}
                >
                  Pegar correos
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                    inputMode === "file" ? "bg-white text-[#111] shadow-2xs" : "text-black/50 hover:text-[#111]"
                  }`}
                >
                  Subir Excel/CSV
                </button>
              </div>
            </div>

            {inputMode === "text" ? (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={rawEmailsInput}
                  onChange={(e) => setRawEmailsInput(e.target.value)}
                  placeholder="Escribe o pega aquí los correos (uno por línea):&#10;ejemplo1@empresa.com&#10;Carlos Ruiz | carlos@innovacion.co | Tech Corp"
                  className="w-full p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] font-mono focus:outline-none focus:border-purple-600 transition-colors placeholder:text-black/30 resize-y"
                />
                <div className="flex items-center justify-between text-[11px] text-black/50">
                  <span>💡 Puedes pegar: correo | nombre | empresa</span>
                  <span className="font-semibold text-purple-700">
                    {parsedRecipients.length} destinatarios detectados
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/10 hover:border-purple-600/40 hover:bg-purple-500/[0.02] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
                >
                  <FileSpreadsheet className="w-8 h-8 text-black/30 group-hover:text-purple-600 transition-colors mb-2" />
                  <p className="text-xs font-medium text-[#111]">
                    Haz clic aquí para seleccionar tu archivo CSV o de texto
                  </p>
                  <p className="text-[11px] text-black/40 mt-0.5">
                    Debe contener una columna con correos electrónicos
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {fileFeedback && (
                  <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs text-black/70 flex items-center justify-between">
                    <span>{fileFeedback}</span>
                    <span className="font-semibold text-purple-700">
                      {parsedRecipients.length} contactos listos
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de destinatarios */}
            {parsedRecipients.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>{parsedRecipients.length} destinatarios</strong> listos para validación y despacho.
                  </span>
                </div>
                <button
                  onClick={() => {
                    setRawEmailsInput("")
                    setParsedRecipients([])
                    setFileFeedback("")
                  }}
                  className="text-[11px] text-black/40 hover:text-red-600 transition-colors"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          {/* PASO 3: Redactar Mensaje */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black/5 text-black/70 flex items-center justify-center text-xs font-semibold">
                  3
                </span>
                <h3 className="text-sm font-semibold text-[#111]">Contenido del Correo</h3>
              </div>

              {/* Botones de Etiquetas Rápidas */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMessage((prev) => prev + " {{nombre}}")}
                  className="px-2 py-0.5 text-[10px] font-mono bg-black/[0.04] hover:bg-black/[0.08] text-black/70 rounded-md border border-black/[0.06]"
                  title="Insertar nombre del contacto"
                >
                  + &#123;&#123;nombre&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => setMessage((prev) => prev + " {{empresa}}")}
                  className="px-2 py-0.5 text-[10px] font-mono bg-black/[0.04] hover:bg-black/[0.08] text-black/70 rounded-md border border-black/[0.06]"
                  title="Insertar empresa del contacto"
                >
                  + &#123;&#123;empresa&#125;&#125;
                </button>
              </div>
            </div>

            {/* Asunto Principal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black/70 flex items-center justify-between">
                <span>Asunto del Correo</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAltSubject(!isAddingAltSubject)}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-normal hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>+ Agregar variante de asunto (Anti-Spam)</span>
                </button>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ejemplo: Reunión estratégica para {{nombre}}"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] font-medium focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>

            {/* Variantes de Asunto (Anti-Spam) */}
            {isAddingAltSubject && (
              <div className="p-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/20 space-y-2">
                <span className="text-[11px] font-medium text-purple-950">
                  Variante alternativa de asunto (el sistema las alternará para evitar filtros de spam):
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAltSubject}
                    onChange={(e) => setNewAltSubject(e.target.value)}
                    placeholder="Ejemplo: Nueva propuesta de innovación para {{empresa}}"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-black/[0.1] text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleAddAltSubject()}
                  />
                  <button
                    type="button"
                    onClick={handleAddAltSubject}
                    className="px-3 py-1.5 bg-[#111] text-white text-xs font-medium rounded-lg hover:bg-black"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {altSubjects.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono text-black/40 font-semibold tracking-wider">
                  Variantes activas ({altSubjects.length}):
                </span>
                {altSubjects.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/[0.02] border border-black/[0.04] text-xs text-black/70"
                  >
                    <span className="truncate flex-1">{s}</span>
                    <button
                      onClick={() => setAltSubjects(altSubjects.filter((_, i) => i !== idx))}
                      className="text-black/30 hover:text-red-500 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Mensaje */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-black/70">Mensaje / Contenido</label>
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe el cuerpo del correo aquí..."
                className="w-full p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] font-sans leading-relaxed focus:outline-none focus:border-purple-600 transition-colors resize-y"
              />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Panel de Acción Anti-Spam & Enviar (1/3) */}
        <div className="space-y-5">
          {/* Tarjeta de Protección Anti-Spam y Goteo */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#111]">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-semibold">Protección Anti-Spam</h3>
            </div>

            <div className="space-y-3 text-xs text-black/70">
              {/* Checkbox Anti-Spam */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={antiSpamEnabled}
                  onChange={(e) => setAntiSpamEnabled(e.target.checked)}
                  className="mt-0.5 rounded border-black/20 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-[#111]">Filtro de Dominios Temporales</span>
                  <p className="text-[11px] text-black/50 mt-0.5">
                    Descarta automáticamente correos de 119k dominios desechables (*yopmail, *mailinator) para cuidar tu reputación.
                  </p>
                </div>
              </label>

              {/* Control de Pausa / Goteo */}
              <div className="pt-2 border-t border-black/[0.06] space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#111]">Pausa entre correos:</span>
                  <span className="font-mono font-bold text-purple-700">{dripSeconds} seg</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={dripSeconds}
                  onChange={(e) => setDripSeconds(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <p className="text-[10px] text-black/40">
                  Emula el comportamiento humano para que Google no bloquee tu cuenta.
                </p>
              </div>
            </div>

            {/* Botón Principal de Enviar */}
            <div className="pt-3 border-t border-black/[0.06]">
              {errorMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSending || parsedRecipients.length === 0}
                onClick={handleSendEmails}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#111] hover:bg-black disabled:bg-black/20 text-white font-medium text-xs shadow-xs hover:shadow-md transition-all cursor-pointer disabled:cursor-not-allowed group"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando correos...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    <span>Enviar {parsedRecipients.length} Correo{parsedRecipients.length === 1 ? "" : "s"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Estado del Envío / Resultados en Vivo */}
          {sendProgress && (
            <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111]">Progreso del Despacho</span>
                <span className="font-mono text-purple-700 font-bold">{sendProgress.percentage}%</span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full h-2 rounded-full bg-black/5 overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${sendProgress.percentage}%` }}
                />
              </div>

              {sendResults && (
                <div className="pt-3 border-t border-black/[0.06] space-y-2">
                  <span className="text-xs font-semibold text-[#111]">Resumen Final:</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-800 font-medium">
                      <div className="text-base font-bold">{sendResults.summary.sent}</div>
                      <div className="text-[10px]">Enviados</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-800 font-medium">
                      <div className="text-base font-bold">{sendResults.summary.blockedAntiSpam}</div>
                      <div className="text-[10px]">Anti-Spam</div>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10 text-red-800 font-medium">
                      <div className="text-base font-bold">{sendResults.summary.failed}</div>
                      <div className="text-[10px]">Errores</div>
                    </div>
                  </div>

                  {/* Detalle individual */}
                  <div className="max-h-40 overflow-y-auto space-y-1 pt-2">
                    {sendResults.results.map((res, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] border border-black/[0.04] text-[11px]"
                      >
                        <span className="truncate max-w-[140px] text-[#111]">{res.email}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            res.status === "enviado"
                              ? "bg-emerald-500/15 text-emerald-700"
                              : res.status === "bloqueado_antispam"
                              ? "bg-amber-500/15 text-amber-700"
                              : "bg-red-500/15 text-red-700"
                          }`}
                        >
                          {res.status === "enviado" ? "Enviado" : res.status === "bloqueado_antispam" ? "Anti-Spam" : "Error"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mini Guía Rápida */}
          <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-xs text-black/60 space-y-2">
            <span className="font-semibold text-[#111] block">💡 Consejos para estudiantes</span>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>No envíes más de 500 correos por día desde una cuenta gratuita de Gmail.</li>
              <li>Mantén activada la pausa de 3 a 5 segundos para que los servidores no te marquen como robot.</li>
              <li>Usa variantes de asunto para que cada correo luzca único.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal Sencillo: Agregar Cuenta de Gmail */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-black/10 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-700">
                  <Key className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-semibold text-[#111]">Conectar Nueva Cuenta de Gmail</h3>
              </div>
              <button
                onClick={() => setIsAddAccountModalOpen(false)}
                className="text-black/40 hover:text-[#111] text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-black/60">
              Para enviar correos con diferentes cuentas, simplemente agrega los datos de tu nueva cuenta en las variables de entorno de tu servidor (Dokploy) o en tu archivo local.
            </p>

            <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] space-y-2 text-xs">
              <span className="font-semibold text-[#111] block">Formato en Dokploy (`GMAIL_ACCOUNTS_JSON`):</span>
              <pre className="p-2.5 rounded-lg bg-black/[0.05] text-[11px] font-mono overflow-x-auto text-black/80">
{`[
  {
    "id": "ventas",
    "email": "tu_otra_cuenta@gmail.com",
    "name": "Equipo de Ventas",
    "clientId": "600688526213-...apps.googleusercontent.com",
    "clientSecret": "GOCSPX-...",
    "refreshToken": "1//05vmYw...",
    "dailyLimit": 500
  }
]`}
              </pre>
            </div>

            <div className="text-[11px] text-black/50 space-y-1">
              <p>✓ El sistema detecta automáticamente cualquier cuenta añadida en esa lista.</p>
              <p>✓ Puedes tener 1, 2, 5 o más cuentas de Gmail rotando simultáneamente.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddAccountModalOpen(false)}
                className="px-4 py-2 bg-[#111] text-white text-xs font-medium rounded-xl hover:bg-black"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
