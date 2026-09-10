"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Sparkles,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  Building,
  User,
  Clock,
  X,
  Save,
  CheckCircle2,
} from "lucide-react"
import { AfiliadoData } from "./resellers-module"

export interface SpecialOffer {
  id: string
  codigo_oferta: string
  titulo: string
  descripcion: string
  institucion_empresa: string
  precio_cop: number
  precio_usd: number
  meses_cubrimiento: number
  caracteristicas: string[]
  afiliado_id: string | null
  afiliado_nombre: string | null
  afiliado_email: string | null
  codigo_referido: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  cupos_maximos: number | null
  cupos_usados: number
  activo: boolean
  tipo_pago?: string
  numero_cuotas?: number
  pago_anticipado?: boolean
  creado_en: string
  actualizado_en: string
}

interface SpecialOffersTabProps {
  afiliados: AfiliadoData[]
  onOffersCountChange?: (count: number) => void
}

export function SpecialOffersTab({ afiliados, onOffersCountChange }: SpecialOffersTabProps) {
  const [ofertas, setOfertas] = useState<SpecialOffer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [successToast, setSuccessToast] = useState("")

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<SpecialOffer | null>(null)

  // Campos formulario
  const [formCodigo, setFormCodigo] = useState("")
  const [formTitulo, setFormTitulo] = useState("")
  const [formDescripcion, setFormDescripcion] = useState("")
  const [formInstitucion, setFormInstitucion] = useState("")
  const [formPrecioCop, setFormPrecioCop] = useState("95000")
  const [formPrecioUsd, setFormPrecioUsd] = useState("24")
  const [formMeses, setFormMeses] = useState("12")
  const [formTipoPago, setFormTipoPago] = useState<"pago_unico" | "cuotas">("pago_unico")
  const [formNumeroCuotas, setFormNumeroCuotas] = useState<number>(1)
  const [formPagoAnticipado, setFormPagoAnticipado] = useState(false)
  const [formAfiliadoId, setFormAfiliadoId] = useState<string>("")
  const [formFechaFin, setFormFechaFin] = useState("")
  const [formCupos, setFormCupos] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")

  // Estados de copiado
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Cargar ofertas
  const loadOfertas = async () => {
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/admin/ofertas")
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "No se pudo cargar la lista de ofertas especiales.")
        return
      }
      const list = data.ofertas || []
      setOfertas(list)
      if (onOffersCountChange) onOffersCountChange(list.length)
    } catch {
      setErrorMsg("Error de conexión al cargar ofertas especiales.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOfertas()
  }, [])

  useEffect(() => {
    if (successToast) {
      const t = setTimeout(() => setSuccessToast(""), 3500)
      return () => clearTimeout(t)
    }
  }, [successToast])

  // KPIs
  const kpis = useMemo(() => {
    const total = ofertas.length
    const activas = ofertas.filter((o) => o.activo).length
    const cuposTotalesUsados = ofertas.reduce((acc, o) => acc + (Number(o.cupos_usados) || 0), 0)
    const conAfiliado = ofertas.filter((o) => o.afiliado_id).length
    return { total, activas, cuposTotalesUsados, conAfiliado }
  }, [ofertas])

  // Filtrado
  const filteredOfertas = useMemo(() => {
    return ofertas.filter((o) => {
      const matchSearch =
        o.codigo_oferta.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.institucion_empresa && o.institucion_empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.afiliado_nombre && o.afiliado_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchStatus =
        statusFilter === "all" ? true : statusFilter === "active" ? o.activo : !o.activo
      return matchSearch && matchStatus
    })
  }, [ofertas, searchTerm, statusFilter])

  // Copiar link directo
  const handleCopyLink = (oferta: SpecialOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const targetUrl = `https://smartcontacts.cloud/beneficios?oferta=${encodeURIComponent(oferta.codigo_oferta)}`
    navigator.clipboard.writeText(targetUrl)
    setCopiedId(oferta.id)
    setSuccessToast(`Enlace copiado: ${targetUrl}`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Toggle activo / pausado
  const handleToggleActivo = async (oferta: SpecialOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nuevoEstado = !oferta.activo
    try {
      const res = await fetch(`/api/admin/ofertas/${oferta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: nuevoEstado }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOfertas((prev) =>
          prev.map((o) => (o.id === oferta.id ? { ...o, activo: nuevoEstado } : o))
        )
        setSuccessToast(
          nuevoEstado
            ? `Oferta "${oferta.codigo_oferta}" activada`
            : `Oferta "${oferta.codigo_oferta}" pausada`
        )
      } else {
        alert(data.error || "Error al actualizar oferta")
      }
    } catch {
      alert("Error de conexión")
    }
  }

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setEditingOffer(null)
    setFormCodigo("")
    setFormTitulo("")
    setFormDescripcion("")
    setFormInstitucion("")
    setFormPrecioCop("95000")
    setFormPrecioUsd("24")
    setFormMeses("12")
    setFormTipoPago("pago_unico")
    setFormNumeroCuotas(1)
    setFormPagoAnticipado(false)
    setFormAfiliadoId("")
    setFormFechaFin("")
    setFormCupos("")
    setModalError("")
    setIsModalOpen(true)
  }

  // Abrir modal de edición
  const handleOpenEdit = (oferta: SpecialOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingOffer(oferta)
    setFormCodigo(oferta.codigo_oferta)
    setFormTitulo(oferta.titulo)
    setFormDescripcion(oferta.descripcion || "")
    setFormInstitucion(oferta.institucion_empresa || "")
    setFormPrecioCop(String(oferta.precio_cop || "95000"))
    setFormPrecioUsd(String(oferta.precio_usd || "24"))
    setFormMeses(String(oferta.meses_cubrimiento || "12"))
    setFormTipoPago((oferta.tipo_pago as any) === "cuotas" ? "cuotas" : "pago_unico")
    setFormNumeroCuotas(oferta.numero_cuotas || 1)
    setFormPagoAnticipado(Boolean(oferta.pago_anticipado))
    setFormAfiliadoId(oferta.afiliado_id || "")
    setFormFechaFin(oferta.fecha_fin ? oferta.fecha_fin.split("T")[0] : "")
    setFormCupos(oferta.cupos_maximos ? String(oferta.cupos_maximos) : "")
    setModalError("")
    setIsModalOpen(true)
  }

  // Eliminar oferta
  const handleDeleteOffer = async (oferta: SpecialOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar permanentemente la oferta "${oferta.codigo_oferta}"?`
    )
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/admin/ofertas/${oferta.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOfertas((prev) => prev.filter((o) => o.id !== oferta.id))
        setSuccessToast(`Oferta "${oferta.codigo_oferta}" eliminada con éxito.`)
        if (onOffersCountChange) onOffersCountChange(ofertas.length - 1)
      } else {
        alert(data.error || "Error al eliminar oferta")
      }
    } catch {
      alert("Error de conexión al eliminar oferta")
    }
  }

  // Guardar formulario
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError("")

    if (!formCodigo.trim() || !formTitulo.trim()) {
      setModalError("El código y título de la oferta son obligatorios.")
      return
    }

    const cop = Number(formPrecioCop)
    const usd = Number(formPrecioUsd)
    if (isNaN(cop) || cop <= 0 || isNaN(usd) || usd <= 0) {
      setModalError("Los precios en COP y USD deben ser números válidos mayores a 0.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        codigo_oferta: formCodigo.trim().toUpperCase(),
        titulo: formTitulo.trim(),
        descripcion: formDescripcion.trim() || "",
        institucion_empresa: formInstitucion.trim() || "",
        precio_cop: cop,
        precio_usd: usd,
        meses_cubrimiento: Number(formMeses) || 12,
        tipo_pago: formTipoPago,
        numero_cuotas: formTipoPago === "cuotas" ? Number(formNumeroCuotas) : 1,
        pago_anticipado: formPagoAnticipado,
        afiliado_id: formAfiliadoId || null,
        fecha_fin: formFechaFin ? new Date(formFechaFin).toISOString() : null,
        cupos_maximos: formCupos ? Number(formCupos) : null,
      }

      if (editingOffer) {
        // Actualizar
        const res = await fetch(`/api/admin/ofertas/${editingOffer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setModalError(data.error || "Error al actualizar oferta")
          return
        }
        setSuccessToast(`Oferta "${payload.codigo_oferta}" actualizada exitosamente.`)
      } else {
        // Crear
        const res = await fetch("/api/admin/ofertas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok || !data.success) {
          setModalError(data.error || "Error al registrar nueva oferta")
          return
        }
        setSuccessToast(`Oferta "${payload.codigo_oferta}" creada exitosamente.`)
      }

      setIsModalOpen(false)
      loadOfertas()
    } catch {
      setModalError("Error de conexión al procesar la solicitud.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast de Éxito */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#111] text-white text-xs font-mono shadow-2xl animate-slideIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={loadOfertas}
            className="text-xs font-bold underline hover:no-underline cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── 1. METRICAS / KPIS DE OFERTAS ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              TOTAL OFERTAS
            </span>
            <Sparkles className="w-4 h-4 text-amber-500/70" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.total}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Campañas registradas
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              OFERTAS ACTIVAS
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600/70" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-emerald-700">
              {kpis.activas}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Disponibles para venta
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              ACTIVACIONES REALIZADAS
            </span>
            <Clock className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.cuposTotalesUsados}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Cupos redimidos
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              CON REVENDEDOR
            </span>
            <User className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.conAfiliado}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Atribuidas a aliados
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. CONTROLES Y FILTROS ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold shrink-0">
            ESTADO:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] font-medium outline-none focus:border-black/30 cursor-pointer transition-colors"
          >
            <option value="all">Todas ({ofertas.length})</option>
            <option value="active">Solo Activas</option>
            <option value="inactive">Solo Pausadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Código, Título o Aliado..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
            />
          </div>

          <button
            onClick={loadOfertas}
            title="Refrescar Ofertas"
            className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#111]" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-2xs shrink-0 font-mono tracking-wider uppercase font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Oferta</span>
          </button>
        </div>
      </div>

      {/* ── 3. TABLA DE OFERTAS ESPECIALES ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                <th className="py-3 px-3.5 font-bold">Código / Enlace</th>
                <th className="py-3 px-3.5 font-bold">Campaña / Convenio</th>
                <th className="py-3 px-3.5 font-bold text-center">Precios Especiales</th>
                <th className="py-3 px-3.5 font-bold">Revendedor Atribuido</th>
                <th className="py-3 px-3.5 font-bold text-center">Cupos / Usados</th>
                <th className="py-3 px-3.5 font-bold text-center">Estado (Toggle)</th>
                <th className="py-3 px-3.5 font-bold text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/[0.05]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                    <span>Cargando ofertas especiales...</span>
                  </td>
                </tr>
              ) : filteredOfertas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                    No hay ofertas especiales registradas. Crea una con el botón superior.
                  </td>
                </tr>
              ) : (
                filteredOfertas.map((oferta) => {
                  return (
                    <tr key={oferta.id} className="hover:bg-black/[0.02] transition-colors">
                      {/* Código y Botón Copiar URL */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleCopyLink(oferta, e)}
                            title="Copiar URL directa de la oferta"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F4F0] hover:bg-black/[0.08] border border-black/[0.08] text-xs font-mono font-bold text-[#111] tracking-wider transition-colors cursor-pointer"
                          >
                            <span>{oferta.codigo_oferta}</span>
                            {copiedId === oferta.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-black/30" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-black/40 block mt-0.5">
                          /beneficios?oferta={oferta.codigo_oferta}
                        </span>
                      </td>

                      {/* Título e Institución */}
                      <td className="py-3 px-3.5">
                        <span className="text-xs font-semibold text-[#111] block">
                          {oferta.titulo}
                        </span>
                        {oferta.institucion_empresa && (
                          <span className="text-[11px] text-amber-900/80 font-mono flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-amber-600" />
                            {oferta.institucion_empresa}
                          </span>
                        )}
                      </td>

                      {/* Precios Especiales */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="font-mono text-xs font-bold text-[#111]">
                          ${Number(oferta.precio_cop).toLocaleString("es-CO")} COP
                        </div>
                        <span className="text-[10px] font-mono text-black/50 block">
                          ${oferta.precio_usd} USD ({oferta.meses_cubrimiento} meses)
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-0.5">
                          {oferta.tipo_pago === "cuotas" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/60 text-[10px] font-mono font-bold">
                              {oferta.numero_cuotas || 2} Cuotas de ${Math.round(Number(oferta.precio_cop) / (oferta.numero_cuotas || 2)).toLocaleString("es-CO")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-mono font-medium">
                              Pago Único
                            </span>
                          )}

                          {oferta.pago_anticipado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold">
                              ⚡ Pago Anticipado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-medium">
                              ✓ Activación Inmediata
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Revendedor Atribuido */}
                      <td className="py-3 px-3.5">
                        {oferta.afiliado_nombre ? (
                          <div>
                            <span className="text-xs font-medium text-[#111] flex items-center gap-1">
                              <User className="w-3 h-3 text-emerald-600" />
                              {oferta.afiliado_nombre}
                            </span>
                            {oferta.codigo_referido && (
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 block w-fit mt-0.5">
                                Ref: {oferta.codigo_referido}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-black/40 italic">
                            SmartContacts (Directo)
                          </span>
                        )}
                      </td>

                      {/* Cupos y Usados */}
                      <td className="py-3 px-3.5 text-center font-mono text-xs">
                        <span className="font-bold text-[#111]">
                          {oferta.cupos_usados}
                        </span>
                        <span className="text-black/40">
                          {oferta.cupos_maximos ? ` / ${oferta.cupos_maximos}` : " (ilimitado)"}
                        </span>
                      </td>

                      {/* Toggle Activo / Pausado */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={oferta.activo}
                            onClick={(e) => handleToggleActivo(oferta, e)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              oferta.activo ? "bg-emerald-500" : "bg-black/20"
                            }`}
                            title={oferta.activo ? "Clic para Pausar Oferta" : "Clic para Activar Oferta"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                oferta.activo ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-[11px] font-mono text-black/70 w-14 text-left">
                            {oferta.activo ? "Activa" : "Pausada"}
                          </span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Abrir enlace en nueva pestaña */}
                          <a
                            href={`/beneficios?oferta=${encodeURIComponent(oferta.codigo_oferta)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Probar Oferta en Navegador"
                            className="p-1.5 rounded-lg text-black/40 hover:text-[#111] hover:bg-black/[0.05] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Editar */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(oferta, e)}
                            title="Editar Oferta"
                            className="p-1.5 rounded-lg text-black/40 hover:text-[#111] hover:bg-black/[0.05] transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOffer(oferta, e)}
                            title="Eliminar Oferta"
                            className="p-1.5 rounded-lg text-black/30 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. MODAL CREAR / EDITAR OFERTA ESPECIAL ───────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold block">
                  {editingOffer ? "ACTUALIZAR OFERTA" : "NUEVA OFERTA ESPECIAL"}
                </span>
                <h3 className="text-xl font-medium text-[#111] tracking-tight">
                  {editingOffer ? `Editar: ${editingOffer.codigo_oferta}` : "Crear Convenio / Oferta Especial"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-600">
                  {modalError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Código de Acceso / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingOffer}
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                    placeholder="Ej. UNAL-2026"
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono font-bold uppercase disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Institución / Empresa Aliada
                  </label>
                  <input
                    type="text"
                    value={formInstitucion}
                    onChange={(e) => setFormInstitucion(e.target.value)}
                    placeholder="Ej. Universidad Nacional"
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Título de la Oferta *
                </label>
                <input
                  type="text"
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ej. Plan 12 Meses Convenio Universitario"
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Descripción o Condiciones
                </label>
                <input
                  type="text"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Ej. Tarifa preferencial exclusiva para estudiantes y docentes"
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
                />
              </div>

              {/* Precios y Meses */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Precio COP *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={formPrecioCop}
                    onChange={(e) => setFormPrecioCop(e.target.value)}
                    placeholder="95000"
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Precio USD *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrecioUsd}
                    onChange={(e) => setFormPrecioUsd(e.target.value)}
                    placeholder="24"
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Duración (Meses) *
                  </label>
                  <select
                    value={formMeses}
                    onChange={(e) => setFormMeses(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono cursor-pointer"
                  >
                    <option value="1">1 Mes</option>
                    <option value="3">3 Meses</option>
                    <option value="6">6 Meses</option>
                    <option value="12">12 Meses</option>
                    <option value="24">24 Meses</option>
                  </select>
                </div>
              </div>

              {/* Modalidad de Pago y Cuotas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Modalidad de Pago *
                  </label>
                  <select
                    value={formTipoPago}
                    onChange={(e) => setFormTipoPago(e.target.value as "pago_unico" | "cuotas")}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono cursor-pointer"
                  >
                    <option value="pago_unico">Pago Único (1 cuota)</option>
                    <option value="cuotas">Diferido en Cuotas</option>
                  </select>
                </div>

                {formTipoPago === "cuotas" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-mono text-black/70 font-semibold">
                      Número de Cuotas *
                    </label>
                    <select
                      value={formNumeroCuotas}
                      onChange={(e) => setFormNumeroCuotas(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono font-bold cursor-pointer"
                    >
                      <option value={2}>2 Cuotas (${Math.round((Number(formPrecioCop) || 0) / 2).toLocaleString("es-CO")} c/u)</option>
                      <option value={3}>3 Cuotas (${Math.round((Number(formPrecioCop) || 0) / 3).toLocaleString("es-CO")} c/u)</option>
                      <option value={6}>6 Cuotas (${Math.round((Number(formPrecioCop) || 0) / 6).toLocaleString("es-CO")} c/u)</option>
                      <option value={12}>12 Cuotas (${Math.round((Number(formPrecioCop) || 0) / 12).toLocaleString("es-CO")} c/u)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Revendedor Asignado */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Revendedor Atribuido (Opcional)
                </label>
                <select
                  value={formAfiliadoId}
                  onChange={(e) => setFormAfiliadoId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors cursor-pointer"
                >
                  <option value="">Ninguno (Venta Directa SmartContacts)</option>
                  {afiliados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre} — Ref: {a.codigo_referido || a.email}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-mono text-black/40">
                  Si asignas un revendedor, todas las compras desde este enlace se registrarán a su favor.
                </p>
              </div>

              {/* Checkbox Pago Anticipado */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="offerPagoAnticipadoCheck"
                  checked={formPagoAnticipado}
                  onChange={(e) => setFormPagoAnticipado(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="offerPagoAnticipadoCheck"
                  className="text-xs font-sans text-amber-900 font-medium cursor-pointer flex items-center gap-1"
                >
                  <span>⚡ Requiere Pago Anticipado (Cobrar antes de activar cuenta)</span>
                </label>
              </div>

              {/* Vigencia y Cupos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Fecha Límite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={formFechaFin}
                    onChange={(e) => setFormFechaFin(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-black/70 font-semibold">
                    Límite de Cupos (Opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCupos}
                    onChange={(e) => setFormCupos(e.target.value)}
                    placeholder="Ej. 50 (vacío = ilimitado)"
                    className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-black/60 hover:text-[#111] hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-wider font-bold hover:bg-black/90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingOffer ? "Actualizar Oferta" : "Crear Oferta"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
