"use client"

import React, { useState, useEffect } from "react"
import {
  ChevronRight,
  Search,
  Plus,
  RefreshCw,
  Video,
  ExternalLink,
  Mail,
  User,
  Building,
  Phone,
  MessageSquare,
  Trash2,
  X,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  History,
  Save,
  Share2,
  DollarSign,
  Tag,
} from "lucide-react"

export interface ConversationalNote {
  fecha: string
  autor: string
  texto: string
}

export interface CalendarBookingRecord {
  id: string
  titulo: string
  descripcion: string
  comentarioAdicional?: string
  meetLink: string
  estado: "agendado" | "cumplida" | "no_asistio" | "cancelada"
  resultadoComercial: string
  recordatorioEnviado: boolean
  recordatorio8amEnviado: boolean
  fechaCita: string
  horaCita: string
  historialConversacional?: ConversationalNote[]
  referidoInfo?: {
    id: string
    afiliadoId: string
    afiliadoNombre: string
    afiliadoEmail?: string
    tipoAtribucion: string
    estadoLiquidacion: string
    montoTransaccion?: number
    valorComisionCalculado: number
    motivoAtribucionManual?: string
  }
  prospecto: {
    id: string
    nombre: string
    email: string
    empresa: string
    telefono: string
    tema: string
    comentario?: string
  }
}

export function CalendarDataTable4() {
  const [records, setRecords] = useState<CalendarBookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unconfirmedTodayCount, setUnconfirmedTodayCount] = useState(0)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [selectedEstado, setSelectedEstado] = useState<string>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // State for inline comment editing & conversational notes
  const [editingComments, setEditingComments] = useState<Record<string, string>>({})
  const [newNoteTexts, setNewNoteTexts] = useState<Record<string, string>>({})

  // Referral manual attribution states
  const [isManualReferralModalOpen, setIsManualReferralModalOpen] = useState(false)
  const [targetRecordForReferral, setTargetRecordForReferral] = useState<CalendarBookingRecord | null>(null)
  const [affiliatesList, setAffiliatesList] = useState<any[]>([])
  const [selectedAffiliateId, setSelectedAffiliateId] = useState("")
  const [manualCommissionAmount, setManualCommissionAmount] = useState(150000)
  const [manualContractAmount, setManualContractAmount] = useState(1500000)
  const [manualReason, setManualReason] = useState("Acuerdo comercial directo B2B")
  const [isSavingReferral, setIsSavingReferral] = useState(false)

  // Form State for New Booking
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    tema: "Consultoría Agéntica 45M",
    comentario: "",
    fecha: new Date().toISOString().split("T")[0],
    hora: "10:00 AM",
  })

  // Fetch Records from API
  const loadRecords = async () => {
    setIsLoading(true)
    try {
      const url = `/api/calendar/crud?estado=${encodeURIComponent(selectedEstado)}&search=${encodeURIComponent(searchQuery)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setRecords(data.records)
        setUnconfirmedTodayCount(data.unconfirmedTodayCount || 0)

        // Initialize editing comments state
        const initialComments: Record<string, string> = {}
        data.records.forEach((r: CalendarBookingRecord) => {
          initialComments[r.id] = r.comentarioAdicional || r.prospecto.comentario || r.descripcion || ""
        })
        setEditingComments(initialComments)
      }
    } catch {
      // Manejo silencioso de error de carga
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [selectedEstado, searchQuery])

  // Toggle Row Expansion
  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Save Updated Comment Action (PUT)
  const handleSaveComment = async (id: string) => {
    const updatedText = editingComments[id] || ""
    try {
      const res = await fetch("/api/calendar/crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, comentario: updatedText }),
      })
      const data = await res.json()
      if (data.success) {
        alert("Comentario actualizado y guardado correctamente.")
        loadRecords()
      }
    } catch {
      alert("No se pudo guardar el comentario.")
    }
  }

  // Post New Conversational Note Action (PUT)
  const handleAddNote = async (id: string) => {
    const text = newNoteTexts[id] || ""
    if (!text.trim()) return

    try {
      const res = await fetch("/api/calendar/crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nuevaNotaHistorial: text, autor: "Asesor Comercial" }),
      })
      const data = await res.json()
      if (data.success) {
        setNewNoteTexts((prev) => ({ ...prev, [id]: "" }))
        loadRecords()
      }
    } catch {
      alert("No se pudo agregar la nota.")
    }
  }

  // Update Status Action (PUT)
  const handleUpdateStatus = async (id: string, newEstado: string) => {
    try {
      const res = await fetch("/api/calendar/crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado: newEstado }),
      })
      const data = await res.json()
      if (data.success) {
        loadRecords()
      }
    } catch {
      alert("No se pudo actualizar el estado.")
    }
  }

  // Update Resultado Comercial Action (PUT)
  const handleUpdateResultadoComercial = async (id: string, nuevoResultado: string) => {
    let monto = 1500000
    let comision = 150000
    if (nuevoResultado === "adquirido" || nuevoResultado === "cerrado") {
      const inputMonto = prompt("Ingrese el valor total del contrato cerrado (COP):", "1500000")
      if (inputMonto) monto = parseFloat(inputMonto) || 1500000
      const inputComision = prompt("Ingrese la comisión a liquidar al aliado (COP):", String(Math.round(monto * 0.1)))
      if (inputComision) comision = parseFloat(inputComision) || 150000
    }

    try {
      const res = await fetch("/api/calendar/crud", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, resultadoComercial: nuevoResultado, montoContrato: monto, valorComision: comision }),
      })
      const data = await res.json()
      if (data.success) {
        loadRecords()
      }
    } catch {
      alert("No se pudo actualizar el resultado comercial.")
    }
  }

  // Open Manual Referral Modal
  const openManualReferralModal = async (rec: CalendarBookingRecord) => {
    setTargetRecordForReferral(rec)
    setIsManualReferralModalOpen(true)
    try {
      const res = await fetch("/api/referrals/affiliates")
      const data = await res.json()
      if (data.success) {
        setAffiliatesList(data.afiliados || [])
        if (data.afiliados?.length > 0) {
          setSelectedAffiliateId(data.afiliados[0].id)
        }
      }
    } catch {
      // Fallback silencioso
    }
  }

  // Save Manual Referral Action (POST)
  const handleSaveManualReferral = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetRecordForReferral || !selectedAffiliateId) return
    setIsSavingReferral(true)

    try {
      const res = await fetch("/api/referrals/conversions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afiliadoId: selectedAffiliateId,
          prospectoId: targetRecordForReferral.prospecto.id,
          monto: manualContractAmount,
          valorComision: manualCommissionAmount,
          motivo: manualReason,
          tipoComision: "monto_fijo",
          autor: "Asesor Comercial CRM",
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Referido y comisión vinculados exitosamente.")
        setIsManualReferralModalOpen(false)
        loadRecords()
      } else {
        alert(data.error || "No se pudo vincular el referido.")
      }
    } catch {
      alert("Error al vincular el referido.")
    } finally {
      setIsSavingReferral(false)
    }
  }

  // Delete Record Action (DELETE)
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este registro de agendamiento?")) return
    try {
      const res = await fetch(`/api/calendar/crud?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        loadRecords()
      }
    } catch {
      alert("No se pudo eliminar el registro.")
    }
  }

  // Create Booking Action (POST)
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/calendar/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setIsCreateModalOpen(false)
        setFormData({
          nombre: "",
          email: "",
          empresa: "",
          telefono: "",
          tema: "Consultoría Agéntica 45M",
          comentario: "",
          fecha: new Date().toISOString().split("T")[0],
          hora: "10:00 AM",
        })
        loadRecords()
      } else {
        alert("Error: " + data.error)
      }
    } catch {
      alert("Error de conexión al crear el agendamiento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Status Color Indicator Dot according to DESIGN.md
  const getStatusDotColor = (estado: string) => {
    switch (estado) {
      case "cumplida":
        return "bg-[#16a34a]"
      case "no_asistio":
        return "bg-[#d73a49]"
      case "cancelada":
        return "bg-black/30"
      default:
        return "bg-[#7c3aed]"
    }
  }

  const getStatusText = (estado: string) => {
    switch (estado) {
      case "cumplida":
        return "CUMPLIDA (ASISTIÓ)"
      case "no_asistio":
        return "NO ASISTIÓ (ABANDONO)"
      case "cancelada":
        return "CANCELADA"
      default:
        return "AGENDADA (PENDIENTE)"
    }
  }

  return (
    <div className="w-full space-y-4 font-sans text-[#111]">
      
      {/* ── BANNER DE ALERTA: ACTIVIDADES NO GESTIONADAS / PENDIENTES PARA HOY ── */}
      {unconfirmedTodayCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-2xs font-sans animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wide">
                ¡ALERTA DE GESTIÓN PENDIENTE PARA HOY!
              </h4>
              <p className="text-xs text-amber-800/90 mt-0.5 font-normal">
                Tienes <strong className="font-bold underline">{unconfirmedTodayCount} agendamiento(s) sin gestionar / sin confirmar</strong> programados para el día de hoy.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedEstado("agendado")}
            className="px-3.5 py-1.5 rounded-xl bg-amber-800 text-white text-xs font-medium hover:bg-amber-900 transition-colors shrink-0 shadow-xs cursor-pointer"
          >
            Filtrar Agendados Hoy
          </button>
        </div>
      )}

      {/* ── TOP BAR & FILTER DROPDOWN MENU ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
        
        {/* Dropdown Filter */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold shrink-0">
            FILTRAR ESTADO:
          </label>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] font-medium outline-none focus:border-black/30 cursor-pointer transition-colors"
          >
            <option value="todos">Todos los Agendamientos</option>
            <option value="agendado">Agendadas (Pendientes)</option>
            <option value="cumplida">Cumplidas (Asistió)</option>
            <option value="no_asistio">No Asistió (Abandono)</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        {/* Search & New Booking Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por Nombre, Empresa o Correo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
            />
          </div>

          <button
            onClick={loadRecords}
            title="Refrescar Lista"
            className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#111]" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Agendamiento</span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE 4 (EXPANDABLE ROW DETAIL PANELS IN PLACE) ──────────────── */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                <th className="py-3 px-3.5 w-8 text-center"></th>
                <th className="py-3 px-3.5 font-bold">Nombre del Cliente</th>
                <th className="py-3 px-3.5 font-bold">Empresa / Organización</th>
                <th className="py-3 px-3.5 font-bold">Celular / Teléfono</th>
                <th className="py-3 px-3.5 font-bold">Tema / Asesoría</th>
                <th className="py-3 px-3.5 font-bold">Estado</th>
                <th className="py-3 px-3.5 font-bold text-right">Fecha / Hora</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/[0.05]">
              {records.length > 0 ? (
                records.map((rec) => {
                  const isExpanded = !!expandedRowIds[rec.id]
                  return (
                    <React.Fragment key={rec.id}>
                      
                      {/* MAIN ROW PATTERN */}
                      <tr
                        onClick={() => toggleRow(rec.id)}
                        className={`group cursor-pointer transition-colors ${
                          isExpanded ? "bg-[#F5F4F0]/60" : "hover:bg-black/[0.02]"
                        }`}
                      >
                        <td className="py-3 px-3.5 text-center">
                          <ChevronRight
                            className={`w-4 h-4 text-black/30 group-hover:text-[#111] transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-[#111]" : ""
                            }`}
                          />
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-[#111] flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-black/30 shrink-0" />
                              {rec.prospecto.nombre}
                            </span>
                            {rec.referidoInfo && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 w-fit font-medium">
                                <Share2 className="w-2.5 h-2.5" />
                                Ref: {rec.referidoInfo.afiliadoNombre}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="text-xs text-black/70 font-normal flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-black/30 shrink-0" />
                            {rec.prospecto.empresa}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="text-xs text-black/80 font-mono flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-black/30 shrink-0" />
                            {rec.prospecto.telefono || "No especificado"}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="text-xs text-black/70 font-light truncate max-w-[200px] block">
                            {rec.prospecto.tema}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-black/70">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(rec.estado)}`} />
                            {getStatusText(rec.estado)}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono text-xs text-black/60">
                          <span>{rec.fechaCita}</span>
                          <span className="text-black/30 ml-1.5 text-[10px]">{rec.horaCita}</span>
                        </td>
                      </tr>

                      {/* EXPANDABLE ROW DETAIL PANEL REVEALED IN PLACE */}
                      {isExpanded && (
                        <tr className="bg-[#F5F4F0]/40 border-b border-black/[0.08]">
                          <td colSpan={7} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl p-4 sm:p-5 border border-black/[0.07] space-y-4 font-sans shadow-2xs">
                              
                              {/* Header Contact & Meet Link */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#111] flex items-center gap-2">
                                    <span>{rec.prospecto.nombre}</span>
                                    <span className="text-xs text-black/50 font-normal">({rec.prospecto.empresa})</span>
                                  </h4>
                                  <span className="text-xs font-mono text-black/50 mt-0.5 block">
                                    Correo: <span className="text-[#111]">{rec.prospecto.email}</span> | Celular: <span className="text-[#111]">{rec.prospecto.telefono}</span>
                                  </span>
                                </div>

                                <a
                                  href={rec.meetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-medium transition-colors w-fit"
                                >
                                  <Video className="w-3.5 h-3.5 text-white" />
                                  <span>Unirse a Google Meet</span>
                                  <ExternalLink className="w-3 h-3 text-white/60" />
                                </a>
                              </div>

                              {/* EDITABLE COMMENT CONTROL & REGLAS DE CORREO DISPATCH */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* 1. CAMPO DE COMENTARIO EDITABLE */}
                                <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                      <MessageSquare className="w-3.5 h-3.5 text-black/40" />
                                      COMENTARIO Y NOTAS EDITABLES DEL AGENDAMIENTO
                                    </span>
                                    <button
                                      onClick={() => handleSaveComment(rec.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#111] text-white text-[10px] font-mono font-bold hover:bg-black/90 transition-colors shadow-2xs"
                                    >
                                      <Save className="w-3 h-3" />
                                      Guardar
                                    </button>
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={editingComments[rec.id] ?? ""}
                                    onChange={(e) => setEditingComments({ ...editingComments, [rec.id]: e.target.value })}
                                    placeholder="Escribe comentarios, objetivos comerciales o requerimientos del cliente..."
                                    className="w-full p-2.5 rounded-lg bg-white border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 resize-none"
                                  />
                                </div>

                                {/* 2. REGLAS DE CORREO & TRAZABILIDAD DE DESPACHOS */}
                                <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-2.5 text-xs font-mono">
                                  <span className="text-[10px] text-black/50 uppercase tracking-widest font-bold block mb-1">
                                    REGLAS DE RECORDATORIO DE CORREO (AUTOMÁTICO)
                                  </span>

                                  {/* Regla 1: Recordatorio 8:00 AM */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                                      <span>RECORDATORIO MATUTINO (8:00 AM)</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                                      DESPACHADO
                                    </span>
                                  </div>

                                  {/* Regla 2: Recordatorio 30 Minutos Antes */}
                                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-black/[0.04]">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                                      <span>RECORDATORIO PREVIO (30 MINUTOS)</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-800 border border-purple-500/20">
                                      DESPACHADO
                                    </span>
                                  </div>
                                </div>

                              </div>

                              {/* HISTORIAL CONVERSACIONAL Y DE INTERACCIONES */}
                              <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-3">
                                <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                  <History className="w-3.5 h-3.5 text-black/40" />
                                  HISTORIAL CONVERSACIONAL Y DE ATENCIÓN DE AGENTES DE IA & ASESORES
                                </span>

                                {/* Feed de notas conversacionales previas */}
                                <div className="space-y-2 max-h-36 overflow-y-auto">
                                  {rec.historialConversacional && rec.historialConversacional.length > 0 ? (
                                    rec.historialConversacional.map((note, nIdx) => (
                                      <div
                                        key={nIdx}
                                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-black/[0.04] text-xs font-sans"
                                      >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#111] mt-1.5 shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between text-[10px] font-mono text-black/40 mb-0.5">
                                            <span className="font-bold text-[#111]">{note.autor}</span>
                                            <span>{note.fecha}</span>
                                          </div>
                                          <p className="text-black/80 font-normal">{note.texto}</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-xs text-black/40 font-mono italic block">No hay interacciones conversacionales registradas aún.</span>
                                  )}
                                </div>

                                {/* Formulario para Agregar Nueva Nota al Historial */}
                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={newNoteTexts[rec.id] || ""}
                                    onChange={(e) => setNewNoteTexts({ ...newNoteTexts, [rec.id]: e.target.value })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleAddNote(rec.id)
                                      }
                                    }}
                                    placeholder="Escribir nueva nota en el historial conversacional..."
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] text-xs outline-none focus:border-black/30"
                                  />
                                  <button
                                    onClick={() => handleAddNote(rec.id)}
                                    className="px-3 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Agregar</span>
                                  </button>
                                </div>
                              </div>

                              {/* PANEL DE REFERIDOS & ATRIBUCIÓN COMERCIAL */}
                              <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                    <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                                    TRAZABILIDAD DE AFILIADO & LIQUIDACIÓN
                                  </span>
                                  {rec.referidoInfo ? (
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                      <span className="font-semibold text-[#111]">{rec.referidoInfo.afiliadoNombre}</span>
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.05] text-black/70">
                                        Tipo: {rec.referidoInfo.tipoAtribucion === "manual_admin" ? "Manual B2B" : "Enlace Cookie"}
                                      </span>
                                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                                        Liquidación: {rec.referidoInfo.estadoLiquidacion.toUpperCase()}
                                      </span>
                                      <span className="text-[11px] font-mono font-bold text-emerald-700">
                                        Comisión: ${rec.referidoInfo.valorComisionCalculado.toLocaleString("es-CO")} COP
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-black/60 font-sans">
                                      Este prospecto llegó por canal directo. Si corresponde a una recomendación aliada, puedes vincularlo manualmente.
                                    </p>
                                  )}
                                </div>

                                <button
                                  onClick={() => openManualReferralModal(rec)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-black/5 border border-black/10 text-[#111] text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer shadow-2xs"
                                >
                                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{rec.referidoInfo ? "Modificar Afiliado" : "Vincular Afiliado Manual"}</span>
                                </button>
                              </div>

                              {/* Appointment Status & Commercial Result Control */}
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.06] text-xs">
                                <div className="flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-black/40 uppercase font-bold">
                                      ESTADO DE CITA:
                                    </span>
                                    <select
                                      value={rec.estado}
                                      onChange={(e) => handleUpdateStatus(rec.id, e.target.value)}
                                      className="px-2.5 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-semibold text-[#111] outline-none focus:border-black/30 cursor-pointer"
                                    >
                                      <option value="agendado">Agendada (Pendiente)</option>
                                      <option value="cumplida">Cumplida (Asistió a la Sesión)</option>
                                      <option value="no_asistio">No Asistió (Abandono)</option>
                                      <option value="cancelada">Cancelada</option>
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-black/40 uppercase font-bold">
                                      RESULTADO COMERCIAL:
                                    </span>
                                    <select
                                      value={rec.resultadoComercial || "pendiente"}
                                      onChange={(e) => handleUpdateResultadoComercial(rec.id, e.target.value)}
                                      className="px-2.5 py-1.5 rounded-xl bg-white border border-black/15 text-xs font-mono font-bold text-[#111] outline-none focus:border-black/40 cursor-pointer shadow-2xs"
                                    >
                                      <option value="pendiente">Pendiente de Diagnóstico</option>
                                      <option value="en_negociacion">En Negociación / Propuesta</option>
                                      <option value="adquirido">Adquirido / Cerrado Ganado (Liquidar Comisión)</option>
                                      <option value="no_interesado">No Interesado / Descartado</option>
                                    </select>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeleteRecord(rec.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors w-fit"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  Eliminar Agendamiento
                                </button>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}

                    </React.Fragment>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-black/40">
                    <p className="text-xs font-mono">No hay agendamientos registrados bajo este filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CREAR NUEVO AGENDAMIENTO ───────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-black/15 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-black/[0.08]">
              <h3 className="text-sm font-semibold text-[#111]">Nuevo Agendamiento (Esquema `calendario`)</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-5 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Carlos Gómez"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Correo Electrónico *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carlos@empresa.com"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ej. Soluciones S.A.S."
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Celular / Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Tema / Modalidad</label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Comentario Adicional</label>
                <textarea
                  rows={2}
                  value={formData.comentario}
                  onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                  placeholder="Detalles adicionales sobre los objetivos del cliente..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Hora</label>
                  <input
                    type="text"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-medium text-black/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-[#111] hover:bg-black/90 text-xs font-medium text-white shadow-xs"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Agendamiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ATRIBUCIÓN MANUAL B2B DE REFERIDOS ───────────────────────── */}
      {isManualReferralModalOpen && targetRecordForReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-black/15 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-black/[0.08]">
              <h3 className="text-sm font-semibold text-[#111] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>Vincular Afiliado / Referido Manual (B2B)</span>
              </h3>
              <button
                onClick={() => setIsManualReferralModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualReferral} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-1">
                <span className="text-[10px] font-mono text-black/50 uppercase font-bold block">Prospecto Seleccionado</span>
                <p className="font-semibold text-[#111]">{targetRecordForReferral.prospecto.nombre} ({targetRecordForReferral.prospecto.empresa})</p>
                <p className="text-[11px] text-black/60 font-mono">{targetRecordForReferral.prospecto.email}</p>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Seleccionar Afiliado / Aliado Comercial *
                </label>
                {affiliatesList.length > 0 ? (
                  <select
                    value={selectedAffiliateId}
                    onChange={(e) => setSelectedAffiliateId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono font-medium outline-none focus:border-black/30 cursor-pointer"
                  >
                    {affiliatesList.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} ({a.email}) - {a.enlacePrincipal?.codigoReferido || 'Sin Código'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No hay afiliados registrados en el sistema. Puedes crear uno desde el módulo de referidos.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                    Valor Contrato (COP)
                  </label>
                  <input
                    type="number"
                    value={manualContractAmount}
                    onChange={(e) => setManualContractAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono outline-none focus:border-black/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                    Comisión Acordada (COP)
                  </label>
                  <input
                    type="number"
                    value={manualCommissionAmount}
                    onChange={(e) => setManualCommissionAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono font-bold text-emerald-700 outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Motivo o Justificación de Auditoría *
                </label>
                <textarea
                  rows={2}
                  required
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="Ej: Aliado presentó al cliente en llamada telefónica previa..."
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30 resize-none font-sans"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualReferralModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-medium text-black/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingReferral || affiliatesList.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-[#111] hover:bg-black/90 text-xs font-medium text-white shadow-xs disabled:opacity-50"
                >
                  {isSavingReferral ? "Vinculando..." : "Confirmar Vinculación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
