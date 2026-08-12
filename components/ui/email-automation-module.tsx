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
  Trash2,
  Plus,
  UserCheck,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  X,
  FolderPlus,
  FileUp,
  FileSpreadsheet,
  Pause,
  Database,
  Cpu,
  Check,
} from "lucide-react"

export function EmailAutomationModule() {
  const [activeTab, setActiveTab] = useState<"templates" | "contacts" | "roundrobin" | "dispatch">("dispatch")
  
  // State for Templates
  const [templates, setTemplates] = useState<any[]>([])
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  
  // State for Contact Upload & Directory Category Tagging
  const [campaignName, setCampaignName] = useState("Directorio - Universidades & Educación")
  const [campaignsList, setCampaignsList] = useState<any[]>([])
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false)
  const [newCampaignNameInput, setNewCampaignNameInput] = useState("")

  // State for Import Metrics Summary Report Modal
  const [importSummaryReport, setImportSummaryReport] = useState<{
    isOpen: boolean
    categoryName: string
    totalProcessed: number
    insertedCount: number
    duplicateCount: number
    duplicateEmails: string[]
  } | null>(null)

  // Mode & File Upload States
  const [uploadMode, setUploadMode] = useState<"file" | "textarea">("file")
  const [rawContactsInput, setRawContactsInput] = useState("carlos@empresa1.com\nmaria@empresa2.com\njuan@empresa3.com")
  const [contactInventory, setContactInventory] = useState<any[]>([])
  const [uploadMessage, setUploadMessage] = useState("")
  const [isTextareaConfirmOpen, setIsTextareaConfirmOpen] = useState(false)

  // Progress Bar State for Multi-Tier Upload
  const [uploadProgress, setUploadProgress] = useState<{
    isProcessing: boolean
    currentChunk: number
    totalChunks: number
    percentage: number
    processedCount: number
    duplicateCount: number
    levelText: string
    isCancelled: boolean
  }>({
    isProcessing: false,
    currentChunk: 0,
    totalChunks: 0,
    percentage: 0,
    processedCount: 0,
    duplicateCount: 0,
    levelText: "",
    isCancelled: false,
  })

  // State for Round-Robin Pool Management
  const [poolAsuntos, setPoolAsuntos] = useState<any[]>([])
  const [poolCuerpos, setPoolCuerpos] = useState<any[]>([])
  const [newAsuntoText, setNewAsuntoText] = useState("")
  const [newCuerpoText, setNewCuerpoText] = useState("")

  // Limpiador y Formateador de Errores de Base de Datos para la UI
  const formatFriendlyErrorMessage = (rawError: string | any): string => {
    if (!rawError) return "Ocurrió un inconveniente procesando la solicitud."
    
    const errStr = typeof rawError === "string" ? rawError : JSON.stringify(rawError)

    // Si es un error de duplicado (23505) o clave única
    if (errStr.includes("23505") || errStr.includes("unique_email_campana") || errStr.includes("already exists")) {
      const emailMatch = errStr.match(/Key \(email, campana_nombre\)=\(([^,]+),/i) || errStr.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
      const duplicateEmail = emailMatch ? emailMatch[1].trim() : ""
      return duplicateEmail
        ? `El correo ${duplicateEmail} ya se encuentra registrado en esta campaña.`
        : "El correo electrónico ya se encuentra registrado en esta campaña."
    }

    if (errStr.includes("campanas_nombre_key")) {
      return "Ya existe una campaña registrada con ese mismo nombre."
    }
    if (errStr.includes("PGRST106") || errStr.includes("Invalid schema")) {
      return "No se pudo comunicar con el esquema de base de datos de automatización."
    }

    try {
      const jsonMatch = errStr.match(/\{"code":.*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (parsed.message) {
          if (parsed.code === "23505") {
            const emailMatch = parsed.details?.match(/Key \(email, campana_nombre\)=\(([^,]+),/i) || parsed.details?.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
            const duplicateEmail = emailMatch ? emailMatch[1].trim() : ""
            return duplicateEmail
              ? `El correo ${duplicateEmail} ya se encuentra registrado en esta campaña.`
              : "El correo ya existe en esta campaña."
          }
          return parsed.message
        }
      }
    } catch {
      // Ignorar
    }

    return errStr
      .replace(/^Error:\s*/i, "")
      .replace(/^Error en Supabase \(\d+\):\s*/i, "")
      .replace(/\{"code":.*/i, "")
      .trim() || "Ocurrió un error al procesar la operación."
  }

  // State for Notifications
  const [uiNotification, setUiNotification] = useState<{
    type: "success" | "error" | "warning"
    title: string
    message: string
  } | null>(null)

  const showFeedback = (type: "success" | "error" | "warning", title: string, message: string) => {
    const cleanMessage = type === "error" ? formatFriendlyErrorMessage(message) : message
    setUiNotification({ type, title, message: cleanMessage })
  }

  // State for Dispatch & Round-Robin
  const [senderEmail, setSenderEmail] = useState("jesus.carmona966@pascualbravo.edu.co")
  const [senderMask, setSenderMask] = useState("Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>")
  const [dripMin, setDripMin] = useState(3.0)
  const [dripMax, setDripMax] = useState(5.0)

  const [isSending, setIsSending] = useState(false)
  const [sentToday, setSentToday] = useState(0)

  const dailyQuota = senderEmail.endsWith("@pascualbravo.edu.co") ? 2000 : 500

  // Fetch Campaigns List
  const loadCampaigns = async () => {
    try {
      const res = await fetch("/api/email/campaigns")
      const data = await res.json()
      if (data.success && data.campaigns) {
        setCampaignsList(data.campaigns)
      }
    } catch (err) {
      // Silencioso
    }
  }

  // Create New Campaign Action
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCampaignNameInput.trim()) return

    try {
      const res = await fetch("/api/email/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newCampaignNameInput.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setCampaignName(newCampaignNameInput.trim())
        setNewCampaignNameInput("")
        setIsCreateCampaignModalOpen(false)
        showFeedback("success", "Campaña Creada", `La campaña "${data.campaign.nombre}" fue registrada e inscrita.`)
        loadCampaigns()
      } else {
        showFeedback("error", "Error al Crear Campaña", data.error || "No se pudo registrar la campaña.")
      }
    } catch (err) {
      showFeedback("error", "Error de Servidor", "Fallo de conexión al registrar la nueva campaña.")
    }
  }

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
      } else {
        showFeedback("error", "Error al Cargar Plantillas", data.error || "No se pudieron obtener las plantillas predeterminadas de Supabase.")
      }
    } catch (err) {
      showFeedback("error", "Conexión Supabase", "Error de red al consultar las plantillas predeterminadas.")
    }
  }

  // Fetch Contact Inventory
  const loadContacts = async () => {
    try {
      const res = await fetch(`/api/email/contacts?campana_nombre=${encodeURIComponent(campaignName)}`)
      const data = await res.json()
      if (data.success) {
        setContactInventory(data.contacts)
      } else {
        showFeedback("warning", "Consulta de Contactos", "No se pudo cargar el inventario de contactos.")
      }
    } catch (err) {
      showFeedback("error", "Conexión Supabase", "Error de red al consultar el inventario de contactos.")
    }
  }

  // Fetch Round-Robin Pools
  const loadRoundRobinPools = async () => {
    try {
      const res = await fetch("/api/email/roundrobin")
      const data = await res.json()
      if (data.success) {
        setPoolAsuntos(data.asuntos)
        setPoolCuerpos(data.cuerpos)
      }
    } catch (err) {
      // Silencioso
    }
  }

  useEffect(() => {
    loadTemplates()
    loadContacts()
    loadRoundRobinPools()
    loadCampaigns()
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
        showFeedback("success", "Plantilla Actualizada", "La plantilla predeterminada se ha guardado exitosamente en Supabase.")
        loadTemplates()
      } else {
        showFeedback("error", "Error al Guardar Plantilla", data.error || "No se pudo actualizar la plantilla en Supabase.")
      }
    } catch (err) {
      showFeedback("error", "Error de Servidor", "Fallo de conexión al enviar actualización de plantilla.")
    }
  }

  // Helper Parser de Texto o CSV (Fuzzy Header Matcher)
  const parseRawContentToContacts = (textContent: string) => {
    const lines = textContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0)
    if (lines.length === 0) return []

    let delimiter = ","
    if (lines[0].includes(";")) delimiter = ";"
    else if (lines[0].includes("\t")) delimiter = "\t"

    const headerParts = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ""))
    let emailIdx = -1
    let nombreIdx = -1
    let empresaIdx = -1
    let telefonoIdx = -1

    headerParts.forEach((part, idx) => {
      if (["email", "correo", "e-mail", "mail", "contacto"].includes(part)) emailIdx = idx
      else if (["nombre", "name", "full_name", "prospecto"].includes(part)) nombreIdx = idx
      else if (["empresa", "company", "compañia", "compañía", "organization"].includes(part)) empresaIdx = idx
      else if (["telefono", "teléfono", "phone", "celular", "whatsapp", "mobile"].includes(part)) telefonoIdx = idx
    })

    let startIndex = 0
    if (emailIdx !== -1) {
      startIndex = 1
    } else {
      emailIdx = 0
    }

    const contacts: any[] = []
    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(delimiter).map((col) => col.trim().replace(/^["']|["']$/g, ""))
      const email = row[emailIdx]
      if (email && email.includes("@")) {
        const cleanEmail = email.toLowerCase()
        const nombre = nombreIdx !== -1 && row[nombreIdx] ? row[nombreIdx] : cleanEmail.split("@")[0]
        const empresa = empresaIdx !== -1 && row[empresaIdx] ? row[empresaIdx] : "Empresa Privada"
        const telefono = telefonoIdx !== -1 && row[telefonoIdx] ? row[telefonoIdx] : ""

        contacts.push({ email: cleanEmail, nombre, empresa, telefono })
      }
    }
    return contacts
  }

  // Multi-Tier Process Handler (Nivel 1, Nivel 2, Nivel 3/4)
  const processContactsInTiers = async (contacts: any[], rawText?: string) => {
    const count = contacts.length
    if (count === 0) {
      showFeedback("warning", "Validación de Correos", "No se encontraron correos válidos en la entrada.")
      return
    }

    // NIVEL 1: 1 a 1,000 correos (Single insert)
    if (count <= 1000 && !rawText) {
      setUploadProgress({
        isProcessing: true,
        currentChunk: 1,
        totalChunks: 1,
        percentage: 50,
        processedCount: 0,
        duplicateCount: 0,
        levelText: "🟢 Nivel 1: Procesando directamente en el navegador (1 lote único)",
        isCancelled: false,
      })

      try {
        const res = await fetch("/api/email/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campana_nombre: campaignName, contactos: contacts }),
        })
        const data = await res.json()
        if (data.success) {
          showFeedback("success", "Carga Completada", data.message)
          setImportSummaryReport({
            isOpen: true,
            categoryName: campaignName,
            totalProcessed: data.processedTotal || count,
            insertedCount: data.insertedCount || 0,
            duplicateCount: data.duplicateCount || 0,
            duplicateEmails: data.duplicateEmails || [],
          })
          loadContacts()
        } else {
          showFeedback("error", "Error en Carga", data.error || "Fallo en la inserción de contactos.")
        }
      } catch (err) {
        showFeedback("error", "Error de Servidor", "No se pudo enviar la solicitud de inserción.")
      } finally {
        setUploadProgress((prev) => ({ ...prev, isProcessing: false, percentage: 100 }))
      }
      return
    }

    // NIVEL 2: 1,001 a 10,000 correos (Chunked Loop de 1,000 en 1,000)
    if (count <= 10000 && !rawText) {
      const chunkSize = 1000
      const totalChunks = Math.ceil(count / chunkSize)

      setUploadProgress({
        isProcessing: true,
        currentChunk: 0,
        totalChunks,
        percentage: 0,
        processedCount: 0,
        duplicateCount: 0,
        levelText: `🟡 Nivel 2: Carga por lotes en navegador (${totalChunks} lotes de ${chunkSize})`,
        isCancelled: false,
      })

      let totalInserted = 0
      let totalDuplicates = 0
      const accumulatedDuplicateEmails: string[] = []

      for (let i = 0; i < totalChunks; i++) {
        const chunk = contacts.slice(i * chunkSize, (i + 1) * chunkSize)
        try {
          const res = await fetch("/api/email/contacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ campana_nombre: campaignName, contactos: chunk }),
          })
          const data = await res.json()
          if (data.success) {
            totalInserted += data.insertedCount || 0
            totalDuplicates += data.duplicateCount || 0
            if (data.duplicateEmails && Array.isArray(data.duplicateEmails)) {
              accumulatedDuplicateEmails.push(...data.duplicateEmails)
            }
          }
        } catch (err) {
          // Continuar con el siguiente lote sin abortar
        }

        const pct = Math.round(((i + 1) / totalChunks) * 100)
        setUploadProgress((prev) => ({
          ...prev,
          currentChunk: i + 1,
          percentage: pct,
          processedCount: totalInserted,
          duplicateCount: totalDuplicates,
        }))
      }

      setImportSummaryReport({
        isOpen: true,
        categoryName: campaignName,
        totalProcessed: count,
        insertedCount: totalInserted,
        duplicateCount: totalDuplicates,
        duplicateEmails: accumulatedDuplicateEmails,
      })
      showFeedback(
        "success",
        "Carga Completada por Lotes (Nivel 2)",
        `Se procesaron ${count} contactos. ${totalInserted} registrados, ${totalDuplicates} omitidos por ya existir.`
      )
      loadContacts()
      setUploadProgress((prev) => ({ ...prev, isProcessing: false }))
      return
    }

    // NIVEL 3 & 4: Más de 10,000 correos o Streaming Servidor
    setUploadProgress({
      isProcessing: true,
      currentChunk: 1,
      totalChunks: 1,
      percentage: 25,
      processedCount: 0,
      duplicateCount: 0,
      levelText: "🟣 Nivel 3 & 4: Carga masiva servidor streaming (Cero consumo de RAM cliente)",
      isCancelled: false,
    })

    try {
      const res = await fetch("/api/email/contacts/process-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campana_nombre: campaignName, rawContent: rawText }),
      })
      const data = await res.json()
      if (data.success) {
        showFeedback("success", "Carga Servidor Completada", data.message)
        setImportSummaryReport({
          isOpen: true,
          categoryName: campaignName,
          totalProcessed: data.processedTotal || 0,
          insertedCount: data.insertedCount || 0,
          duplicateCount: data.duplicateCount || 0,
          duplicateEmails: data.duplicateEmails || [],
        })
        loadContacts()
      } else {
        showFeedback("error", "Error en Servidor", data.error || "Fallo durante el procesamiento en servidor.")
      }
    } catch (err) {
      showFeedback("error", "Error de Red", "Ocurrió una interrupción al enviar el archivo masivo.")
    } finally {
      setUploadProgress((prev) => ({ ...prev, isProcessing: false, percentage: 100 }))
    }
  }

  // Upload Action para Textarea (Manual)
  const handleUploadTextarea = (e: React.FormEvent) => {
    e.preventDefault()
    const contacts = parseRawContentToContacts(rawContactsInput)

    if (contacts.length === 0) {
      showFeedback("warning", "Validación de Correos", "Ingresa al menos un correo electrónico válido.")
      return
    }

    // Si supera los 50 correos, pedir confirmación antes de continuar
    if (contacts.length > 50) {
      setIsTextareaConfirmOpen(true)
      return
    }

    processContactsInTiers(contacts)
  }

  // Carga de Archivo (.CSV o .TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isLargeFile = file.size > 1024 * 1024 // > 1 MB

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) return

      const parsed = parseRawContentToContacts(content)
      if (parsed.length > 10000 || isLargeFile) {
        processContactsInTiers(parsed, content)
      } else {
        processContactsInTiers(parsed)
      }
    }
    reader.readAsText(file)
  }

  // Add Item to Round-Robin Pool (POST)
  const handleAddPoolItem = async (tipo: "asunto" | "cuerpo") => {
    const text = tipo === "asunto" ? newAsuntoText : newCuerpoText
    if (!text.trim()) return

    try {
      const res = await fetch("/api/email/roundrobin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, texto: text }),
      })
      const data = await res.json()
      if (data.success) {
        if (tipo === "asunto") setNewAsuntoText("")
        else setNewCuerpoText("")
        showFeedback("success", "Elemento Agregado", `Se agregó una nueva variación de ${tipo} al pool Round-Robin.`)
        loadRoundRobinPools()
      } else {
        showFeedback("error", "Error en Pool", data.error || "No se pudo registrar la variación.")
      }
    } catch (err) {
      showFeedback("error", "Error de Servidor", "Error de red al agregar elemento al pool Round-Robin.")
    }
  }

  // Delete Item from Round-Robin Pool (DELETE)
  const handleDeletePoolItem = async (id: string, tipo: "asunto" | "cuerpo") => {
    try {
      const res = await fetch(`/api/email/roundrobin?id=${encodeURIComponent(id)}&tipo=${tipo}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        showFeedback("success", "Elemento Eliminado", `Se removió el elemento del pool Round-Robin.`)
        loadRoundRobinPools()
      } else {
        showFeedback("error", "Error al Eliminar", data.error || "No se pudo eliminar el elemento del pool.")
      }
    } catch (err) {
      showFeedback("error", "Error de Servidor", "Fallo de conexión al eliminar elemento del pool.")
    }
  }

  // Start Campaign Dispatch Action (POST)
  const handleStartDispatch = async () => {
    setIsSending(true)
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
        if (data.enviados > 0) {
          showFeedback("success", "Despacho Completado", `Campaña procesada exitosamente: ${data.enviados} correos enviados por goteo. ${data.motivo_corte ? `(Corte: ${data.motivo_corte})` : ""}`)
        } else {
          showFeedback("warning", "Sin Pendientes", data.message || "No hay contactos pendientes por procesar en esta campaña.")
        }
        loadContacts()
      } else {
        showFeedback("error", "Error en Despacho", data.error || data.message || "Fallo durante la ejecución de la campaña.")
      }
    } catch (err) {
      showFeedback("error", "Error de Ejecución", "Ocurrió una interrupción de red durante el goteo de envíos.")
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

      {/* ── BANNER DE NOTIFICACIÓN & FEEDBACK UI (REGLA 1 & DESIGN.MD) ──────────── */}
      {uiNotification && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-2xs font-sans transition-all ${
          uiNotification.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-950"
            : uiNotification.type === "warning"
            ? "bg-amber-500/10 border-amber-500/20 text-amber-950"
            : "bg-red-500/10 border-red-500/20 text-red-950"
        }`}>
          <div className="flex items-start gap-3">
            {uiNotification.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {uiNotification.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {uiNotification.type === "error" && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            <div>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">{uiNotification.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{uiNotification.message}</p>
            </div>
          </div>
          <button
            onClick={() => setUiNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 opacity-50" />
          </button>
        </div>
      )}

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
          <span>Pool Round-Robin Configurable</span>
        </button>
      </div>

      {/* ── TAB 1: DESPACHO & GOTEO EN VIVO ───────────────────────────────────── */}
      {activeTab === "dispatch" && (
        <div className="space-y-6">
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
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-colors shadow-2xs cursor-pointer"
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
                  Cuerpo del Mensaje (HTML & Variables: &#123;&#123;nombre&#125;&#125;, &#123;&#123;fecha&#125;&#125;, &#123;&#123;hora&#125;&#125;, &#123;&#123;meetLink&#125;&#125;)
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

      {/* ── TAB 3: FUENTE DE CONTACTOS & CATEGORÍAS DEL DIRECTORIO ───────────── */}
      {activeTab === "contacts" && (
        <div className="space-y-6 font-sans">
          
          {/* MODAL 0: INFORME FINAL DE MÉTRICAS DE IMPORTACIÓN */}
          {importSummaryReport && importSummaryReport.isOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-black/10 shadow-2xl max-w-lg w-full p-6 space-y-5 font-sans text-xs">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#111]">Informe Final de Importación de Contactos</h3>
                      <p className="text-[11px] text-black/50 font-mono">Categoría del Directorio: <span className="font-bold text-purple-800">{importSummaryReport.categoryName}</span></p>
                    </div>
                  </div>
                  <button
                    onClick={() => setImportSummaryReport(null)}
                    className="p-1 rounded-lg hover:bg-black/5 text-black/50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* TARJETAS DE MÉTRICAS OPERATIVAS */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-black/40 block">TOTAL ANALIZADOS</span>
                    <span className="text-base font-mono font-bold text-[#111]">{importSummaryReport.totalProcessed}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-emerald-800 block">NUEVOS REGISTRADOS</span>
                    <span className="text-base font-mono font-bold text-emerald-900">{importSummaryReport.insertedCount}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-800 block">OMITIDOS (DUPLICADOS)</span>
                    <span className="text-base font-mono font-bold text-amber-900">{importSummaryReport.duplicateCount}</span>
                  </div>
                </div>

                {/* LISTA DESPLEGABLE DE CORREOS OMITIDOS POR DUPLICIDAD */}
                {importSummaryReport.duplicateEmails && importSummaryReport.duplicateEmails.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold uppercase text-black/50">
                        CORREOS DUPLICADOS OMITIDOS ({importSummaryReport.duplicateEmails.length})
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono font-medium">Subida atómica sin interrupción</span>
                    </div>

                    <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-1.5 font-mono text-[11px]">
                      {importSummaryReport.duplicateEmails.map((email, idx) => (
                        <div key={idx} className="flex items-center justify-between text-black/70 py-0.5 border-b border-black/[0.03] last:border-0">
                          <span>{email}</span>
                          <span className="text-[9px] bg-amber-200/60 text-amber-900 px-1.5 py-0.2 rounded font-semibold">Ya Registrado</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center font-mono text-emerald-800 text-[11px]">
                    ✓ El 100% de los contactos ingresados fueron nuevos y se registraron exitosamente.
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-black/[0.06]">
                  <button
                    onClick={() => setImportSummaryReport(null)}
                    className="px-4 py-2 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 cursor-pointer shadow-xs"
                  >
                    Entendido & Ver Inventario
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 1: CREAR NUEVA CATEGORÍA DEL DIRECTORIO */}
          {isCreateCampaignModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-black/10 shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-black/[0.08] pb-3">
                  <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-purple-600" />
                    <span>Crear Nueva Categoría del Directorio</span>
                  </h3>
                  <button
                    onClick={() => setIsCreateCampaignModalOpen(false)}
                    className="p-1 rounded-lg hover:bg-black/5 text-black/50 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCampaign} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                      Nombre Único de la Categoría *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Universidades, Docentes, Directivos Tech"
                      value={newCampaignNameInput}
                      onChange={(e) => setNewCampaignNameInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-semibold text-[#111] outline-none focus:border-black/30"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreateCampaignModalOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-black/10 text-xs font-medium hover:bg-black/5 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 cursor-pointer shadow-xs"
                    >
                      Crear & Seleccionar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: CONFIRMACIÓN PARA TEXTAREA > 50 CORREOS */}
          {isTextareaConfirmOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-black/10 shadow-xl max-w-md w-full p-6 space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#111]">Advertencia de Rendimiento (&gt; 50 Correos)</h3>
                    <p className="text-black/70 mt-1">
                      Has ingresado más de 50 correos manualmente. Para listas medianas o masivas, se recomienda usar la opción de **Carga por Archivo (.CSV / .TXT)** para evitar congelamientos de interfaz.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
                  <button
                    onClick={() => {
                      setIsTextareaConfirmOpen(false)
                      setUploadMode("file")
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-medium hover:bg-purple-100 cursor-pointer"
                  >
                    Cambiar a Subir Archivo
                  </button>
                  <button
                    onClick={() => {
                      setIsTextareaConfirmOpen(false)
                      const contacts = parseRawContentToContacts(rawContactsInput)
                      processContactsInTiers(contacts)
                    }}
                    className="px-4 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 cursor-pointer shadow-xs"
                  >
                    Continuar Inserción Manual
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TARJETA DE CONTROL DE CARGA & SELECCIÓN DE CATEGORÍA */}
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-5 text-xs">
            <div className="border-b border-black/[0.06] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#111]">Motor de Carga Masiva al Directorio por Categorías</h3>
                <p className="text-xs text-black/60 mt-0.5">
                  Importa listas de contactos clasificadas por categoría (.CSV / .TXT) con filtrado automático de duplicados.
                </p>
              </div>

              {/* SELECCIÓN Y CREACIÓN DE CATEGORÍA */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <label className="text-[9px] font-mono font-bold text-black/40 uppercase">CATEGORÍA ACTIVA *</label>
                  <select
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-semibold text-[#111] outline-none focus:border-black/30"
                  >
                    {campaignsList.map((c) => (
                      <option key={c.id || c.nombre} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                    {!campaignsList.some((c) => c.nombre === campaignName) && (
                      <option value={campaignName}>{campaignName}</option>
                    )}
                  </select>
                </div>

                <button
                  onClick={() => setIsCreateCampaignModalOpen(true)}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  title="Crear nueva categoría del directorio"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Categoría</span>
                </button>
              </div>
            </div>

            {/* BARRA DE NAVEGACIÓN DE MODO (ARCHIVO VS TEXTAREA) */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#F5F4F0] border border-black/[0.06] w-fit">
              <button
                type="button"
                onClick={() => setUploadMode("file")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  uploadMode === "file" ? "bg-white text-[#111] shadow-2xs" : "text-black/60 hover:text-[#111]"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                <span>Cargar Archivo (.CSV / .TXT)</span>
              </button>
              <button
                type="button"
                onClick={() => setUploadMode("textarea")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  uploadMode === "textarea" ? "bg-white text-[#111] shadow-2xs" : "text-black/60 hover:text-[#111]"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Entrada Manual (Textarea)</span>
              </button>
            </div>

            {/* MODO 1: CARGA POR ARCHIVO (CSV / TXT) */}
            {uploadMode === "file" && (
              <div className="space-y-3">
                <div className="p-6 rounded-2xl border-2 border-dashed border-black/15 bg-[#F5F4F0]/50 hover:bg-[#F5F4F0] transition-colors text-center space-y-3">
                  <FileUp className="w-8 h-8 text-purple-600 mx-auto" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#111]">Arrastra o selecciona un archivo .CSV o .TXT</h4>
                    <p className="text-[11px] text-black/50 mt-0.5">
                      Soporta mapeo inteligente de columnas: <code className="font-mono bg-black/5 px-1 py-0.5 rounded">email</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">nombre</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">empresa</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">telefono</code>
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Seleccionar Archivo</span>
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadProgress.isProcessing}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* MODO 2: ENTRADA MANUAL EN TEXTAREA */}
            {uploadMode === "textarea" && (
              <form onSubmit={handleUploadTextarea} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                    Lista de Correos Electrónicos (Un correo o CSV por línea) *
                  </label>
                  <textarea
                    rows={5}
                    placeholder={"juan@empresa.com\ncarlos@tecnolabs.co, Carlos Mendoza, TecnoLabs SAS\nmaria@innovacion.org"}
                    value={rawContactsInput}
                    onChange={(e) => setRawContactsInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono text-[#111] outline-none focus:border-black/30 resize-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-black/50 font-mono">
                    {parseRawContentToContacts(rawContactsInput).length} correos detectados
                  </span>
                  <button
                    type="submit"
                    disabled={uploadProgress.isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Procesar e Insertar Contactos</span>
                  </button>
                </div>
              </form>
            )}

            {/* BARRA DE PROGRESO MULTINIVEL DE CARGA EN TIEMPO REAL (REGLA DE ORO) */}
            {uploadProgress.isProcessing && (
              <div className="p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.08] space-y-2.5 font-mono animate-in fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#111] flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                    <span>{uploadProgress.levelText}</span>
                  </span>
                  <span className="font-bold text-purple-700">{uploadProgress.percentage}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] text-black/60 pt-0.5">
                  <span>
                    Lote <span className="font-bold text-[#111]">{uploadProgress.currentChunk}</span> de{" "}
                    <span className="font-bold text-[#111]">{uploadProgress.totalChunks}</span>
                  </span>
                  <span>
                    Agregados: <span className="font-bold text-emerald-700">{uploadProgress.processedCount}</span> | Omitidos:{" "}
                    <span className="font-bold text-amber-700">{uploadProgress.duplicateCount}</span>
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* TABLA DE INVENTARIO DE CONTACTOS (ESTILOS DESIGN.MD) */}
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
                    <th className="py-3 px-3.5">Empresa</th>
                    <th className="py-3 px-3.5">Teléfono</th>
                    <th className="py-3 px-3.5">Estado</th>
                    <th className="py-3 px-3.5 text-right">Último Envío</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {contactInventory.length > 0 ? (
                    contactInventory.map((c) => (
                      <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-3 px-3.5 font-mono font-medium text-[#111]">{c.email}</td>
                        <td className="py-3 px-3.5 text-black/80 font-medium">{c.nombre}</td>
                        <td className="py-3 px-3.5 text-black/60">{c.empresa}</td>
                        <td className="py-3 px-3.5 font-mono text-black/50">{c.telefono || "—"}</td>
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
                      <td colSpan={6} className="py-8 text-center text-black/40 font-mono">
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

      {/* ── TAB 4: POOL ROUND-ROBIN ANTI-SPAM (CONFIGURABLE FULL CRUD) ───────── */}
      {activeTab === "roundrobin" && (
        <div className="space-y-6 font-sans text-xs">
          
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
            <div className="border-b border-black/[0.06] pb-3">
              <h3 className="text-sm font-semibold text-[#111]">Administrador de Pool Round-Robin Anti-Spam (100% Configurable)</h3>
              <p className="text-xs text-black/60 mt-0.5">
                Agrega y elimina variaciones de Asuntos y Cuerpos HTML. El motor rotará secuencialmente cada par para garantizar 0% Spam Score.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. POOL DE ASUNTOS CONFIGURABLE */}
              <div className="space-y-3 p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.06]">
                <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block">
                  POOL DE ASUNTOS CONFIGURABLES ({poolAsuntos.length})
                </span>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAsuntoText}
                    onChange={(e) => setNewAsuntoText(e.target.value)}
                    placeholder="Escribir nuevo asunto de prueba..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs outline-none focus:border-black/30 font-medium"
                  />
                  <button
                    onClick={() => handleAddPoolItem("asunto")}
                    className="px-3 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {poolAsuntos.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-black/[0.04]">
                      <span className="font-mono text-black/80">{item.asunto}</span>
                      <button
                        onClick={() => handleDeletePoolItem(item.id, "asunto")}
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. POOL DE CUERPOS HTML CONFIGURABLE */}
              <div className="space-y-3 p-4 rounded-xl bg-[#F5F4F0] border border-black/[0.06]">
                <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold block">
                  POOL DE CUERPOS HTML CONFIGURABLES ({poolCuerpos.length})
                </span>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newCuerpoText}
                    onChange={(e) => setNewCuerpoText(e.target.value)}
                    placeholder="Escribir nueva variación HTML..."
                    className="flex-1 p-2 rounded-xl bg-white border border-black/10 text-xs font-mono outline-none focus:border-black/30 resize-none"
                  />
                  <button
                    onClick={() => handleAddPoolItem("cuerpo")}
                    className="px-3 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 flex items-center gap-1 cursor-pointer h-fit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {poolCuerpos.map((item) => (
                    <div key={item.id} className="flex items-start justify-between p-2.5 rounded-xl bg-white border border-black/[0.04]">
                      <span className="font-mono text-black/70 text-[11px] line-clamp-2">{item.cuerpo_html}</span>
                      <button
                        onClick={() => handleDeletePoolItem(item.id, "cuerpo")}
                        className="p-1 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer shrink-0 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
