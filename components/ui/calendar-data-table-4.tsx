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
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  X,
} from "lucide-react"

export interface CalendarBookingRecord {
  id: string
  titulo: string
  descripcion: string
  comentarioAdicional?: string
  meetLink: string
  estado: "agendado" | "cumplida" | "no_asistio" | "cancelada"
  resultadoComercial: string
  fechaCita: string
  horaCita: string
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

  // Update Status Action (PUT) via clean Select Dropdown
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
    } catch (err) {
      console.error("Error updating status:", err)
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
          comentario: "",
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
        return "AGENDADA"
    }
  }

  return (
    <div className="w-full space-y-4 font-sans text-[#111]">
      
      {/* ── TOP BAR & FILTER DROPDOWN MENU ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
        
        {/* Dropdown Filter (Lista Desplegable en lugar de botones de colores) */}
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

      {/* ── DATA TABLE (STRICT ADHERENCE TO DESIGN.md PATTERN) ────────────────── */}
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
                          <span className="text-xs font-semibold text-[#111] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-black/30 shrink-0" />
                            {rec.prospecto.nombre}
                          </span>
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
                              
                              {/* Descriptive Header */}
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

                              {/* Form Comment / Additional Message */}
                              <div className="p-3.5 rounded-lg bg-[#F5F4F0] border border-black/[0.05] space-y-1">
                                <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 text-black/30" />
                                  COMENTARIO Y MENSAJE ADICIONAL CAPTURADO EN FORMULARIO
                                </span>
                                <p className="text-xs text-black/80 font-sans italic leading-relaxed">
                                  "{rec.prospecto.comentario || rec.descripcion || "Sin comentarios adicionales registrados en la reserva."}"
                                </p>
                              </div>

                              {/* Appointment History & Control Selector */}
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.06] text-xs">
                                
                                {/* Desplegable para Cambiar Estado (Sin botones inventados) */}
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-black/40 uppercase font-bold">
                                    CAMBIAR ESTADO DE CITA:
                                  </span>
                                  <select
                                    value={rec.estado}
                                    onChange={(e) => handleUpdateStatus(rec.id, e.target.value)}
                                    className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-semibold text-[#111] outline-none focus:border-black/30 cursor-pointer"
                                  >
                                    <option value="agendado">Agendada (Pendiente)</option>
                                    <option value="cumplida">Cumplida (Asistió a la Sesión)</option>
                                    <option value="no_asistio">No Asistió (Abandono)</option>
                                    <option value="cancelada">Cancelada</option>
                                  </select>
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

    </div>
  )
}
