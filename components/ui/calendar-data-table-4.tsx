"use client"

import React, { useState, useEffect } from "react"
import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  RefreshCw,
  Video,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Trash2,
  Edit,
  ExternalLink,
  Mail,
  Calendar as CalendarIcon,
  User,
  Building,
  Phone,
  AlertTriangle,
  X,
} from "lucide-react"

export interface CalendarBookingRecord {
  id: string
  titulo: string
  descripcion: string
  meetLink: string
  estado: "agendado" | "cumplida" | "no_asistio" | "cancelada"
  resultadoComercial: string
  recordatorioEnviado: boolean
  creadoEn: string
  fechaCita: string
  horaCita: string
  prospecto: {
    id: string
    nombre: string
    email: string
    empresa: string
    telefono: string
    tema: string
    aceptaTratamientoDatos: boolean
  }
}

export function CalendarDataTable4() {
  const [records, setRecords] = useState<CalendarBookingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [selectedEstado, setSelectedEstado] = useState<string>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State for New Booking
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    empresa: "",
    telefono: "",
    tema: "Consultoría Agéntica 45M",
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
      }
    } catch (err) {
      console.error("Error loading calendar records:", err)
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

  // Update Status Action (PUT)
  const handleUpdateStatus = async (id: string, newEstado: "cumplida" | "no_asistio" | "cancelada" | "agendado") => {
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
    } catch (err) {
      console.error("Error updating status:", err)
    }
  }

  // Delete Record Action (DELETE)
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este agendamiento de la base de datos?")) return
    try {
      const res = await fetch(`/api/calendar/crud?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        loadRecords()
      }
    } catch (err) {
      console.error("Error deleting record:", err)
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
          fecha: new Date().toISOString().split("T")[0],
          hora: "10:00 AM",
        })
        loadRecords()
      } else {
        alert("Error: " + data.error)
      }
    } catch (err) {
      console.error("Error creating booking:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Status Badge
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "cumplida":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            CUMPLIDA
          </span>
        )
      case "no_asistio":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-rose-800 bg-rose-500/10 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            NO ASISTIÓ
          </span>
        )
      case "cancelada":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-black/50 bg-black/5 border border-black/10">
            <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
            CANCELADA
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold text-purple-800 bg-purple-500/10 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            AGENDADA
          </span>
        )
    }
  }

  return (
    <div className="w-full space-y-5 font-sans">
      
      {/* ── TOP FILTER BAR & HEADER CONTROLS ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.08] shadow-2xs">
        
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {[
            { id: "todos", label: "TODOS" },
            { id: "agendado", label: "AGENDADOS" },
            { id: "cumplida", label: "CUMPLIDOS" },
            { id: "no_asistio", label: "NO ASISTIÓ" },
            { id: "cancelada", label: "CANCELADOS" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedEstado(tab.id)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedEstado === tab.id
                  ? "bg-[#111] text-white shadow-xs"
                  : "bg-black/[0.03] text-black/60 hover:bg-black/[0.06] hover:text-[#111]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar prospecto o empresa..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/10 text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
            />
          </div>

          <button
            onClick={loadRecords}
            title="Refrescar agendamientos"
            className="p-2 rounded-xl border border-black/10 bg-black/[0.02] text-black/60 hover:bg-black/[0.06] hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111] text-white text-xs font-medium shadow-xs hover:bg-black/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Agendamiento</span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE 4 (EXPANDABLE ROW DETAIL PANELS IN PLACE) ──────────────── */}
      <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/[0.08] bg-black/[0.02] text-[10px] font-mono text-black/40 uppercase tracking-widest">
                <th className="py-3.5 px-4 w-10 text-center"></th>
                <th className="py-3.5 px-4 font-bold">Prospecto / Empresa</th>
                <th className="py-3.5 px-4 font-bold">Contacto</th>
                <th className="py-3.5 px-4 font-bold">Tema / Modalidad</th>
                <th className="py-3.5 px-4 font-bold">Estado Cita</th>
                <th className="py-3.5 px-4 font-bold">Fecha / Hora</th>
                <th className="py-3.5 px-4 font-bold text-right">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/[0.06]">
              {records.length > 0 ? (
                records.map((rec) => {
                  const isExpanded = !!expandedRowIds[rec.id]
                  return (
                    <React.Fragment key={rec.id}>
                      
                      {/* MAIN ROW */}
                      <tr
                        onClick={() => toggleRow(rec.id)}
                        className={`group cursor-pointer transition-colors ${
                          isExpanded ? "bg-purple-50/40" : "hover:bg-black/[0.02]"
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRow(rec.id)
                            }}
                            className="p-1 rounded-lg text-black/40 group-hover:text-[#111] hover:bg-black/5 transition-transform"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-90 text-purple-600" : ""}`} />
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#111] group-hover:text-purple-900 transition-colors">
                              {rec.prospecto.nombre}
                            </span>
                            <span className="text-[11px] text-black/50 font-light flex items-center gap-1 mt-0.5">
                              <Building className="w-3 h-3 text-black/30" />
                              {rec.prospecto.empresa}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-black/80 font-mono flex items-center gap-1">
                              <Mail className="w-3 h-3 text-black/30" />
                              {rec.prospecto.email}
                            </span>
                            {rec.prospecto.telefono && (
                              <span className="text-[10px] text-black/40 font-mono mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-black/30" />
                                {rec.prospecto.telefono}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs text-black/70 font-sans font-medium line-clamp-1">
                            {rec.prospecto.tema}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">{getStatusBadge(rec.estado)}</td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col text-xs font-mono">
                            <span className="text-[#111] font-semibold">{rec.fechaCita}</span>
                            <span className="text-black/40 text-[10px]">{rec.horaCita}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRow(rec.id)
                            }}
                            className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-lg bg-black/[0.04] hover:bg-black/10 text-black/80 transition-colors"
                          >
                            {isExpanded ? "Ocultar" : "Ver Detalle"}
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDABLE ROW DETAIL PANEL REVEALED IN PLACE (DATA TABLE 4 PATTERN) */}
                      {isExpanded && (
                        <tr className="bg-purple-50/30 border-b border-purple-100">
                          <td colSpan={7} className="p-4 sm:p-6">
                            <div className="bg-white rounded-xl p-5 border border-purple-200/60 shadow-xs space-y-4 font-sans animate-in fade-in duration-150">
                              
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#111] flex items-center gap-2">
                                    <span>{rec.titulo}</span>
                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded font-bold">
                                      ID: {rec.id.substring(0, 8)}...
                                    </span>
                                  </h4>
                                  <p className="text-xs text-black/60 mt-0.5 font-light">{rec.descripcion}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <a
                                    href={rec.meetLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs transition-colors"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>Unirse a Google Meet</span>
                                    <ExternalLink className="w-3 h-3 text-white/70" />
                                  </a>
                                </div>
                              </div>

                              {/* Detailed Info Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                                <div className="p-3 rounded-lg bg-black/[0.02] border border-black/[0.04]">
                                  <span className="text-[10px] text-black/40 uppercase block mb-1 font-bold">TRATAMIENTO HABEAS DATA</span>
                                  <div className="flex items-center gap-1.5 font-semibold text-emerald-700">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{rec.prospecto.aceptaTratamientoDatos ? "Aceptado & Auditado con IP" : "No Registrado"}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg bg-black/[0.02] border border-black/[0.04]">
                                  <span className="text-[10px] text-black/40 uppercase block mb-1 font-bold">RECORDATORIO 30M GMAIL</span>
                                  <div className="flex items-center gap-1.5 font-semibold text-purple-700">
                                    <Mail className="w-4 h-4" />
                                    <span>{rec.recordatorioEnviado ? "Despachado a Gmail" : "Programado"}</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-lg bg-black/[0.02] border border-black/[0.04]">
                                  <span className="text-[10px] text-black/40 uppercase block mb-1 font-bold">CREADO EN SUPABASE</span>
                                  <div className="flex items-center gap-1.5 text-black/70 font-semibold">
                                    <Clock className="w-4 h-4 text-black/40" />
                                    <span>{new Date(rec.creadoEn).toLocaleString("es-CO")}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Action Controls */}
                              <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span className="font-mono text-black/40 text-[10px] uppercase font-bold">CAMBIAR ESTADO OPERACIONAL:</span>
                                
                                <div className="flex items-center gap-2">
                                  {rec.estado !== "cumplida" && (
                                    <button
                                      onClick={() => handleUpdateStatus(rec.id, "cumplida")}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-500/20 transition-colors"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Marcar Cumplida
                                    </button>
                                  )}

                                  {rec.estado !== "no_asistio" && (
                                    <button
                                      onClick={() => handleUpdateStatus(rec.id, "no_asistio")}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 font-mono font-bold text-[11px] border border-rose-500/20 transition-colors"
                                    >
                                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                      Marcar No Asistió
                                    </button>
                                  )}

                                  {rec.estado !== "cancelada" && (
                                    <button
                                      onClick={() => handleUpdateStatus(rec.id, "cancelada")}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 text-black/70 font-mono font-bold text-[11px] border border-black/10 transition-colors"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 text-black/50" />
                                      Cancelar Cita
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteRecord(rec.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-mono font-bold text-[11px] border border-red-200 transition-colors ml-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    Eliminar
                                  </button>
                                </div>
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
                  <td colSpan={7} className="py-12 text-center text-black/40">
                    <p className="text-xs font-mono">No se encontraron agendamientos en la base de datos.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CREAR NUEVO AGENDAMIENTO ───────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-black/15 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-black/[0.08]">
              <h3 className="text-base font-semibold text-[#111]">Nuevo Agendamiento (Esquema Calendario)</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Carlos Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Correo Electrónico *</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carlos@empresa.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Ej. Soluciones S.A.S."
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Tema / Modalidad</label>
                <input
                  type="text"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono font-bold text-black/60 uppercase block mb-1">Hora</label>
                  <input
                    type="text"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    placeholder="10:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-black/[0.03] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-medium text-black/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#111] hover:bg-black/90 text-xs font-medium text-white shadow-xs"
                >
                  {isSubmitting ? "Guardando..." : "Guardar Agendamiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
