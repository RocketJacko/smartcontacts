"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Users,
  Share2,
  Calendar,
  CreditCard,
  Search,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Tag,
  ShieldCheck,
  Ban,
  DollarSign,
  ChevronRight,
  Send,
  Building,
  User,
  Clock,
  ArrowUpRight,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export interface AfiliadoData {
  id: string
  nombre: string
  email: string
  telefono: string | null
  estado: "activo" | "suspendido" | "en_revision"
  saldo_pendiente: number | string
  saldo_liquidado: number | string
  total_referidos_agendados: number
  total_referidos_cerrados: number
  creado_en: string
  enlace_id: string | null
  codigo_referido: string | null
  url_destino: string | null
  clics_totales: number
  enlace_activo: boolean
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  titular_cuenta: string | null
}

export function ResellersModule() {
  const { t, language } = useLanguage()
  const isEs = language === "es"
  const resT = (t.dashboard as any)?.resellers || {}

  const [afiliados, setAfiliados] = useState<AfiliadoData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState("")
  const [successToast, setSuccessToast] = useState("")

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "activo" | "suspendido">("all")
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLiquidarOpen, setIsLiquidarOpen] = useState(false)
  const [selectedAfiliado, setSelectedAfiliado] = useState<AfiliadoData | null>(null)

  // Formulario creación
  const [formNombre, setFormNombre] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formTelefono, setFormTelefono] = useState("")
  const [formCodigo, setFormCodigo] = useState("")
  const [formBanco, setFormBanco] = useState("Bancolombia")
  const [formTipoCuenta, setFormTipoCuenta] = useState("ahorros")
  const [formNumeroCuenta, setFormNumeroCuenta] = useState("")
  const [formTitularCuenta, setFormTitularCuenta] = useState("")
  const [formNumeroDocumento, setFormNumeroDocumento] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulario liquidación
  const [liqMonto, setLiqMonto] = useState("")
  const [liqMetodo, setLiqMetodo] = useState("Transferencia Bancaria")
  const [liqReferencia, setLiqReferencia] = useState("")
  const [liqNotas, setLiqNotas] = useState("")
  const [isLiquidating, setIsLiquidating] = useState(false)

  // Estados de copiado
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  const toggleRow = (id: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Cargar lista de afiliados
  const loadAfiliados = async () => {
    setIsLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch("/api/admin/referidos")
      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || (isEs ? "No se pudo cargar la lista de revendedores." : "Failed to load resellers."))
        return
      }
      setAfiliados(data.afiliados || [])
    } catch {
      setErrorMsg(isEs ? "Error de conexión al obtener revendedores." : "Connection error loading resellers.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAfiliados()
  }, [])

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 3500)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // KPIs
  const kpis = useMemo(() => {
    const total = afiliados.length
    const clics = afiliados.reduce((acc, a) => acc + (Number(a.clics_totales) || 0), 0)
    const ventas = afiliados.reduce((acc, a) => acc + (Number(a.total_referidos_cerrados) || 0), 0)
    const saldoPendiente = afiliados.reduce((acc, a) => acc + (Number(a.saldo_pendiente) || 0), 0)
    return { total, clics, ventas, saldoPendiente }
  }, [afiliados])

  // Filtrado
  const filteredAfiliados = useMemo(() => {
    return afiliados.filter((a) => {
      const matchSearch =
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.codigo_referido && a.codigo_referido.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchStatus = statusFilter === "all" ? true : a.estado === statusFilter
      return matchSearch && matchStatus
    })
  }, [afiliados, searchTerm, statusFilter])

  // Copiar Enlace con mensaje WhatsApp
  const handleCopyWhatsAppLink = (afiliado: AfiliadoData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const code = afiliado.codigo_referido || ""
    const targetUrl = `https://smartcontacts.cloud/beneficios?ref=${encodeURIComponent(code)}`
    const defaultMsg = resT.whatsappText || "¡Hola! Te comparto nuestro enlace oficial para acceder a los beneficios y agendar consultoría: "
    const fullText = `${defaultMsg}${targetUrl}`

    navigator.clipboard.writeText(fullText)
    setCopiedId(afiliado.id)
    setSuccessToast(isEs ? `Enlace de WhatsApp copiado para ${afiliado.nombre}` : `WhatsApp link copied for ${afiliado.nombre}`)
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Copiar solo URL limpia
  const handleCopyCleanLink = (afiliado: AfiliadoData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const code = afiliado.codigo_referido || ""
    const targetUrl = `https://smartcontacts.cloud/beneficios?ref=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(targetUrl)
    setCopiedLink(afiliado.id)
    setSuccessToast(isEs ? `URL copiada: ${targetUrl}` : `URL copied: ${targetUrl}`)
    setTimeout(() => setCopiedLink(null), 2500)
  }

  // Cambiar estado
  const handleToggleEstado = async (afiliado: AfiliadoData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nuevoEstado = afiliado.estado === "activo" ? "suspendido" : "activo"
    try {
      const res = await fetch(`/api/admin/referidos/${afiliado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAfiliados((prev) =>
          prev.map((item) => (item.id === afiliado.id ? { ...item, estado: nuevoEstado, enlace_activo: nuevoEstado === "activo" } : item))
        )
        setSuccessToast(isEs ? `Estado actualizado a "${nuevoEstado}"` : `Status updated to "${nuevoEstado}"`)
      } else {
        alert(data.error || "Error al actualizar estado")
      }
    } catch {
      alert("Error de conexión")
    }
  }

  // Abrir Modal Liquidación
  const handleOpenLiquidar = (afiliado: AfiliadoData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedAfiliado(afiliado)
    setLiqMonto(String(afiliado.saldo_pendiente || ""))
    setLiqReferencia("")
    setLiqNotas("")
    setIsLiquidarOpen(true)
  }

  // Enviar Liquidación
  const handleLiquidarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAfiliado) return

    const montoNum = parseFloat(liqMonto)
    if (isNaN(montoNum) || montoNum <= 0) {
      alert(isEs ? "Ingresa un monto válido mayor a 0." : "Enter a valid amount greater than 0.")
      return
    }

    setIsLiquidating(true)
    try {
      const res = await fetch("/api/admin/referidos/liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afiliadoId: selectedAfiliado.id,
          monto: montoNum,
          metodo: liqMetodo,
          referencia: liqReferencia.trim() || null,
          notas: liqNotas.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessToast(
          isEs
            ? `Se liquidaron $${montoNum.toLocaleString("es-CO")} COP a ${selectedAfiliado.nombre}`
            : `Settled $${montoNum.toLocaleString("es-CO")} COP to ${selectedAfiliado.nombre}`
        )
        setIsLiquidarOpen(false)
        loadAfiliados()
      } else {
        alert(data.error || "Error al liquidar comisiones")
      }
    } catch {
      alert("Error de conexión al liquidar comisiones")
    } finally {
      setIsLiquidating(false)
    }
  }

  // Crear nuevo revendedor
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/referidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formNombre.trim(),
          email: formEmail.trim().toLowerCase(),
          telefono: formTelefono.trim() || null,
          codigo_deseado: formCodigo.trim() ? formCodigo.trim().toUpperCase() : null,
          banco: formBanco,
          tipo_cuenta: formTipoCuenta,
          numero_cuenta: formNumeroCuenta.trim() || null,
          titular_cuenta: formTitularCuenta.trim() || null,
          numero_documento: formNumeroDocumento.trim() || null,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessToast(
          isEs
            ? `Revendedor creado con código: ${data.data?.codigo || formCodigo}`
            : `Reseller created with code: ${data.data?.codigo || formCodigo}`
        )
        setIsCreateOpen(false)
        setFormNombre("")
        setFormEmail("")
        setFormTelefono("")
        setFormCodigo("")
        setFormNumeroCuenta("")
        setFormTitularCuenta("")
        setFormNumeroDocumento("")
        loadAfiliados()
      } else {
        alert(data.error || "Error al crear revendedor")
      }
    } catch {
      alert("Error de conexión al crear revendedor")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#111] text-white text-xs font-mono shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* ── TOP TITLE BANNER ─────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.08]">
        <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
          {resT.title || "Programa de Revendedores & Afiliados"}
        </h1>
        <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
          {resT.subtitle || "Control de aliados comerciales, enlaces de atribución, seguimiento de clics y liquidación de comisiones."}
        </p>
      </div>

      {/* ── BENTO GRID KPIS (LIMPIO Y PROFESIONAL) ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Revendedores */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              {resT.kpiTotal || "TOTAL REVENDEDORES"}
            </span>
            <Users className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.total}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Aliados registrados
            </span>
          </div>
        </div>

        {/* Card 2: Clics Acumulados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              {resT.kpiClicks || "CLICS ACUMULADOS"}
            </span>
            <Share2 className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.clics}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Tráfico atribuido por enlaces
            </span>
          </div>
        </div>

        {/* Card 3: Ventas Cerradas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              VENTAS CERRADAS
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {kpis.ventas}
            </span>
            <span className="text-xs text-emerald-600 font-medium block mt-0.5">
              Sincronizadas desde Platzi
            </span>
          </div>
        </div>

        {/* Card 4: Saldo Pendiente */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              {resT.kpiPendingBalance || "SALDO PENDIENTE"}
            </span>
            <DollarSign className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              ${Number(kpis.saldoPendiente).toLocaleString("es-CO")}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Comisiones por liquidar
            </span>
          </div>
        </div>
      </div>

      {/* ── TOP BAR & CONTROLES DE FILTRO (ESTILO CALENDARDATATABLE4) ──────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
        {/* Selector de Estado */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold shrink-0">
            FILTRAR ESTADO:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] font-medium outline-none focus:border-black/30 cursor-pointer transition-colors"
          >
            <option value="all">Todos los Aliados ({afiliados.length})</option>
            <option value="activo">Solo Activos</option>
            <option value="suspendido">Solo Suspendidos</option>
          </select>
        </div>

        {/* Buscador y Botón Crear */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, Código o Correo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
            />
          </div>

          <button
            onClick={loadAfiliados}
            title="Refrescar Lista"
            className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#111]" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{resT.createButton || "Nuevo Revendedor"}</span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE CORPORATIVA (IDÉNTICA A CALENDAR DATA TABLE 4) ─────────── */}
      <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                <th className="py-3 px-3.5 w-8 text-center"></th>
                <th className="py-3 px-3.5 font-bold">Revendedor / Aliado</th>
                <th className="py-3 px-3.5 font-bold">Código de Referido</th>
                <th className="py-3 px-3.5 font-bold">Contacto</th>
                <th className="py-3 px-3.5 font-bold text-center">Clics</th>
                <th className="py-3 px-3.5 font-bold text-center">Ventas Cerradas</th>
                <th className="py-3 px-3.5 font-bold text-right">Saldo Pendiente</th>
                <th className="py-3 px-3.5 font-bold text-center">Estado</th>
                <th className="py-3 px-3.5 font-bold text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/[0.05]">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs font-mono text-black/40">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                    <span>Cargando lista de revendedores...</span>
                  </td>
                </tr>
              ) : filteredAfiliados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs font-mono text-black/40">
                    No se encontraron revendedores registrados con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredAfiliados.map((afiliado) => {
                  const isExpanded = !!expandedRowIds[afiliado.id]
                  const code = afiliado.codigo_referido || "SIN-CODIGO"

                  return (
                    <React.Fragment key={afiliado.id}>
                      {/* FILA PRINCIPAL */}
                      <tr
                        onClick={() => toggleRow(afiliado.id)}
                        className={`group cursor-pointer transition-colors ${
                          isExpanded ? "bg-[#F5F4F0]/60" : "hover:bg-black/[0.02]"
                        }`}
                      >
                        {/* Chevron expandible */}
                        <td className="py-3 px-3.5 text-center">
                          <ChevronRight
                            className={`w-4 h-4 text-black/30 group-hover:text-[#111] transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-[#111]" : ""
                            }`}
                          />
                        </td>

                        {/* Nombre */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#111]">
                              {afiliado.nombre}
                            </span>
                          </div>
                          <span className="text-[11px] text-black/50 font-normal flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-black/30" />
                            {afiliado.email}
                          </span>
                        </td>

                        {/* Código con botón de copia rápida */}
                        <td className="py-3 px-3.5">
                          <button
                            onClick={(e) => handleCopyCleanLink(afiliado, e)}
                            title="Copiar URL directa"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F4F0] hover:bg-black/[0.08] border border-black/[0.08] text-xs font-mono font-bold text-[#111] tracking-wider transition-colors cursor-pointer"
                          >
                            <span>{code}</span>
                            {copiedLink === afiliado.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-black/30" />
                            )}
                          </button>
                        </td>

                        {/* Contacto */}
                        <td className="py-3 px-3.5">
                          <span className="text-xs text-black/80 font-mono flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-black/30 shrink-0" />
                            {afiliado.telefono || "No registrado"}
                          </span>
                        </td>

                        {/* Clics */}
                        <td className="py-3 px-3.5 text-center font-mono text-xs font-semibold text-black/70">
                          {afiliado.clics_totales || 0}
                        </td>

                        {/* Ventas Cerradas */}
                        <td className="py-3 px-3.5 text-center font-mono text-xs font-bold text-emerald-700">
                          {afiliado.total_referidos_cerrados || 0}
                        </td>

                        {/* Saldo Pendiente */}
                        <td className="py-3 px-3.5 text-right font-mono text-xs font-bold text-[#111]">
                          ${Number(afiliado.saldo_pendiente || 0).toLocaleString("es-CO")}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-black/70">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                afiliado.estado === "activo" ? "bg-emerald-500" : "bg-black/30"
                              }`}
                            />
                            {afiliado.estado === "activo" ? "Activo" : "Suspendido"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Botón WhatsApp */}
                            <button
                              onClick={(e) => handleCopyWhatsAppLink(afiliado, e)}
                              title="Copiar texto para WhatsApp"
                              className="px-2.5 py-1 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer border border-[#25D366]/30"
                            >
                              <Send className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </button>

                            {/* Botón Liquidar (si tiene saldo) */}
                            {Number(afiliado.saldo_pendiente) > 0 && (
                              <button
                                onClick={(e) => handleOpenLiquidar(afiliado, e)}
                                className="px-2.5 py-1 rounded-lg bg-[#111] hover:bg-black text-white text-[11px] font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              >
                                <DollarSign className="w-3 h-3 text-emerald-400" />
                                <span>Liquidar</span>
                              </button>
                            )}

                            {/* Botón Toggle Estado */}
                            <button
                              onClick={(e) => handleToggleEstado(afiliado, e)}
                              title={afiliado.estado === "activo" ? "Suspender aliado" : "Reactivar aliado"}
                              className="p-1 rounded-lg text-black/40 hover:text-[#111] hover:bg-black/[0.05] transition-colors cursor-pointer"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* PANEL DESPLEGABLE EN SITIO (EXPANDIBLE AL CLIC) */}
                      {isExpanded && (
                        <tr className="bg-[#F5F4F0]/40 border-b border-black/[0.08]">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl p-4 sm:p-5 border border-black/[0.07] space-y-4 shadow-2xs">
                              {/* Fila 1: Datos Bancarios */}
                              <div>
                                <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-black/50 mb-2.5 flex items-center gap-2">
                                  <CreditCard className="w-3.5 h-3.5 text-black/40" />
                                  <span>Información de Pago & Cuentas Bancarias</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="p-3 rounded-lg bg-[#F5F4F0] border border-black/[0.05]">
                                    <span className="text-[10px] font-mono text-black/40 block uppercase">Banco</span>
                                    <span className="text-xs font-medium text-[#111] mt-0.5 block">
                                      {afiliado.banco || "No registrado"}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-lg bg-[#F5F4F0] border border-black/[0.05]">
                                    <span className="text-[10px] font-mono text-black/40 block uppercase">Tipo de Cuenta</span>
                                    <span className="text-xs font-medium text-[#111] mt-0.5 block capitalize">
                                      {afiliado.tipo_cuenta || "Ahorros"}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-lg bg-[#F5F4F0] border border-black/[0.05]">
                                    <span className="text-[10px] font-mono text-black/40 block uppercase">Número de Cuenta</span>
                                    <span className="text-xs font-mono font-bold text-[#111] mt-0.5 block">
                                      {afiliado.numero_cuenta || "No registrado"}
                                    </span>
                                  </div>
                                  <div className="p-3 rounded-lg bg-[#F5F4F0] border border-black/[0.05]">
                                    <span className="text-[10px] font-mono text-black/40 block uppercase">Titular / Documento</span>
                                    <span className="text-xs font-medium text-[#111] mt-0.5 block">
                                      {afiliado.titular_cuenta || afiliado.nombre}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Fila 2: Enlace de Atribución */}
                              <div className="pt-2 border-t border-black/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-xs font-mono text-black/60">
                                  <Tag className="w-3.5 h-3.5 text-black/40" />
                                  <span>URL de Atribución Oficial:</span>
                                  <span className="px-2 py-0.5 rounded bg-black/[0.04] text-[#111] font-bold select-all">
                                    https://smartcontacts.cloud/beneficios?ref={code}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <a
                                    href={`https://smartcontacts.cloud/beneficios?ref=${code}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1.5 rounded-lg border border-black/[0.08] text-xs font-mono text-black/70 hover:text-black flex items-center gap-1.5 transition-colors"
                                  >
                                    <span>Visitar Enlace</span>
                                    <ExternalLink className="w-3 h-3 text-black/40" />
                                  </a>

                                  <button
                                    onClick={() => handleCopyCleanLink(afiliado)}
                                    className="px-3 py-1.5 rounded-lg bg-[#F5F4F0] hover:bg-black/[0.08] border border-black/[0.08] text-xs font-mono text-[#111] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3 text-black/40" />
                                    <span>Copiar Enlace</span>
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
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL NUEVO REVENDEDOR ────────────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#111] tracking-tight">
                  {resT.modalTitle || "Registrar Nuevo Revendedor"}
                </h3>
                <p className="text-xs text-black/50 font-normal mt-0.5">
                  {resT.modalDesc || "Genera un código único y enlace de atribución para un aliado comercial."}
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    NOMBRE COMPLETO *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Juan Daniel Mejía"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    CORREO ELECTRÓNICO *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    TELÉFONO / WHATSAPP
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="+573001234567"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] outline-none focus:border-black/30 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    CÓDIGO DESEADO (OPCIONAL)
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                    placeholder="Ej. IMPULSODIGITAL"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-bold text-[#111] uppercase outline-none focus:border-black/30 transition-colors"
                  />
                </div>
              </div>

              {/* Datos Bancarios Opcionales */}
              <div className="pt-2 border-t border-black/[0.06] space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-black/50 block">
                  Información Bancaria para Liquidaciones (Opcional)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-black/60 uppercase">Banco</label>
                    <select
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 cursor-pointer"
                    >
                      <option value="Bancolombia">Bancolombia</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Davivienda">Davivienda</option>
                      <option value="Banco de Bogotá">Banco de Bogotá</option>
                      <option value="BBVA">BBVA</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-black/60 uppercase">Tipo Cuenta</label>
                    <select
                      value={formTipoCuenta}
                      onChange={(e) => setFormTipoCuenta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 cursor-pointer"
                    >
                      <option value="ahorros">Ahorros</option>
                      <option value="corriente">Corriente</option>
                      <option value="billetera_digital">Billetera Digital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-black/60 uppercase">Número de Cuenta</label>
                    <input
                      type="text"
                      value={formNumeroCuenta}
                      onChange={(e) => setFormNumeroCuenta(e.target.value)}
                      placeholder="Ej. 123456789"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] outline-none focus:border-black/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-black/60 uppercase">Titular / Cédula</label>
                    <input
                      type="text"
                      value={formTitularCuenta}
                      onChange={(e) => setFormTitularCuenta(e.target.value)}
                      placeholder="Titular y Cédula"
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-sans text-black/60 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] hover:bg-black text-white text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Creando..." : "Crear Revendedor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL LIQUIDAR COMISIONES ─────────────────────────────────────────── */}
      {isLiquidarOpen && selectedAfiliado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#111] tracking-tight">
                  Liquidar Comisiones
                </h3>
                <p className="text-xs text-black/50 font-normal mt-0.5">
                  {selectedAfiliado.nombre} — Saldo pendiente:{" "}
                  <strong className="text-emerald-700 font-mono">
                    ${Number(selectedAfiliado.saldo_pendiente).toLocaleString("es-CO")} COP
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setIsLiquidarOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLiquidarSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  MONTO A LIQUIDAR (COP) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={Number(selectedAfiliado.saldo_pendiente)}
                  value={liqMonto}
                  onChange={(e) => setLiqMonto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-bold text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  NÚMERO DE COMPROBANTE / REFERENCIA
                </label>
                <input
                  type="text"
                  value={liqReferencia}
                  onChange={(e) => setLiqReferencia(e.target.value)}
                  placeholder="Ej. REF-TRANSAC-889922"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  NOTAS / OBSERVACIONES
                </label>
                <textarea
                  rows={2}
                  value={liqNotas}
                  onChange={(e) => setLiqNotas(e.target.value)}
                  placeholder="Ej. Pago por transferencia bancaria de comisiones Platzi..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsLiquidarOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-sans text-black/60 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLiquidating}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] hover:bg-black text-white text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isLiquidating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isLiquidating ? "Procesando..." : "Confirmar Liquidación"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
