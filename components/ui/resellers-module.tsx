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

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLiquidarOpen, setIsLiquidarOpen] = useState(false)
  const [selectedAfiliado, setSelectedAfiliado] = useState<AfiliadoData | null>(null)

  // Estado del formulario de creación
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

  // Estado del formulario de liquidación
  const [liqMonto, setLiqMonto] = useState("")
  const [liqMetodo, setLiqMetodo] = useState("Transferencia Bancaria")
  const [liqReferencia, setLiqReferencia] = useState("")
  const [liqNotas, setLiqNotas] = useState("")
  const [isLiquidating, setIsLiquidating] = useState(false)

  // Estado de copiado
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  // Limpiar toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(""), 4000)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // KPIs agregados
  const kpis = useMemo(() => {
    const totalAfiliados = afiliados.length
    const clicsTotales = afiliados.reduce((acc, a) => acc + (Number(a.clics_totales) || 0), 0)
    const totalAgendados = afiliados.reduce((acc, a) => acc + (Number(a.total_referidos_agendados) || 0), 0)
    const saldoPendienteTotal = afiliados.reduce((acc, a) => acc + (Number(a.saldo_pendiente) || 0), 0)

    return {
      totalAfiliados,
      clicsTotales,
      totalAgendados,
      saldoPendienteTotal,
    }
  }, [afiliados])

  // Filtrado de lista
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

  // Copiar enlace de WhatsApp
  const handleCopyWhatsAppLink = (afiliado: AfiliadoData) => {
    const code = afiliado.codigo_referido || ""
    const targetUrl = `https://smartcontacts.cloud/beneficios?ref=${encodeURIComponent(code)}`
    const defaultMsg = resT.whatsappText || "¡Hola! Te comparto nuestro enlace oficial para acceder a los beneficios y agendar consultoría estratégica: "
    const fullText = `${defaultMsg}${targetUrl}`

    navigator.clipboard.writeText(fullText)
    setCopiedId(afiliado.id)
    setSuccessToast(
      isEs
        ? `Enlace de WhatsApp copiado para ${afiliado.nombre}`
        : `WhatsApp link copied for ${afiliado.nombre}`
    )
    setTimeout(() => setCopiedId(null), 2500)
  }

  // Cambiar estado de afiliado
  const handleToggleEstado = async (afiliado: AfiliadoData) => {
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
        setSuccessToast(
          isEs
            ? `Estado actualizado a "${nuevoEstado}" para ${afiliado.nombre}`
            : `Status updated to "${nuevoEstado}" for ${afiliado.nombre}`
        )
      } else {
        alert(data.error || "Error al actualizar estado")
      }
    } catch {
      alert("Error de conexión")
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
          email: formEmail.trim(),
          telefono: formTelefono.trim() || undefined,
          codigo_deseado: formCodigo.trim() || undefined,
          banco: formBanco.trim(),
          tipo_cuenta: formTipoCuenta,
          numero_cuenta: formNumeroCuenta.trim() || undefined,
          titular_cuenta: formTitularCuenta.trim() || formNombre.trim(),
          numero_documento: formNumeroDocumento.trim() || "0",
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || (isEs ? "Error al crear el revendedor." : "Failed to create reseller."))
        return
      }

      setSuccessToast(isEs ? "¡Revendedor creado exitosamente!" : "Reseller created successfully!")
      setIsCreateOpen(false)
      // Reset form
      setFormNombre("")
      setFormEmail("")
      setFormTelefono("")
      setFormCodigo("")
      setFormNumeroCuenta("")
      setFormTitularCuenta("")
      setFormNumeroDocumento("")
      loadAfiliados()
    } catch {
      alert(isEs ? "Error de conexión con el servidor." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Abrir modal de liquidación
  const handleOpenLiquidar = (afiliado: AfiliadoData) => {
    setSelectedAfiliado(afiliado)
    setLiqMonto(String(afiliado.saldo_pendiente || ""))
    setLiqMetodo("Transferencia Bancaria")
    setLiqReferencia("")
    setLiqNotas("")
    setIsLiquidarOpen(true)
  }

  // Liquidar comisiones
  const handleLiquidarSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAfiliado) return

    const numMonto = parseFloat(liqMonto)
    if (isNaN(numMonto) || numMonto <= 0) {
      alert(isEs ? "Por favor ingresa un monto válido mayor a cero." : "Enter a valid amount greater than zero.")
      return
    }

    setIsLiquidating(true)
    try {
      const res = await fetch("/api/admin/referidos/liquidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afiliado_id: selectedAfiliado.id,
          monto: numMonto,
          metodo: liqMetodo,
          referencia: liqReferencia.trim() || undefined,
          notas: liqNotas.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || (isEs ? "No se pudo registrar la liquidación." : "Failed to settle commissions."))
        return
      }

      setSuccessToast(
        isEs
          ? `Liquidación de $${numMonto.toLocaleString("es-CO")} registrada con éxito.`
          : `Settlement of $${numMonto.toLocaleString("en-US")} recorded successfully.`
      )
      setIsLiquidarOpen(false)
      setSelectedAfiliado(null)
      loadAfiliados()
    } catch {
      alert(isEs ? "Error de conexión." : "Connection error.")
    } finally {
      setIsLiquidating(false)
    }
  }

  const formatCOP = (val: number | string) => {
    const n = Number(val) || 0
    return `$ ${n.toLocaleString("es-CO")}`
  }

  return (
    <div className="space-y-6">
      
      {/* ── HEADER BANNER ────────────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
            {resT.title || "Administración de Revendedores & Afiliados"}
          </h1>
          <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
            {resT.subtitle || "Control de revendedores autorizados, atribución de enlaces, clics y liquidación de comisiones."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAfiliados}
            disabled={isLoading}
            aria-label="Recargar revendedores"
            className="p-2 rounded-xl text-black/60 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer border border-black/10 bg-white shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{resT.createButton || "NUEVO REVENDEDOR"}</span>
          </button>
        </div>
      </div>

      {/* ── ALERTA DE TOAST ────────────────────────────────────────────────────── */}
      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast("")} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── BENTO GRID DE 4 KPIS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Total Revendedores */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
              {resT.kpiTotal || "TOTAL REVENDEDORES"}
            </span>
            <div className="text-3xl font-bold text-[#111] tracking-tight mt-2">
              {kpis.totalAfiliados}
            </div>
            <p className="text-xs text-black/70 mt-1 font-sans font-medium">Aliados Activos en Plataforma</p>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
            <span>ESQUEMA</span>
            <span className="font-bold text-[#111]">referidos.afiliados</span>
          </div>
        </div>

        {/* KPI 2: Clics Acumulados */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
              {resT.kpiClicks || "CLICS ACUMULADOS"}
            </span>
            <div className="text-3xl font-bold text-[#111] tracking-tight mt-2">
              {kpis.clicsTotales.toLocaleString()}
            </div>
            <p className="text-xs text-black/70 mt-1 font-sans font-medium">Tráfico Atribuido por Enlace</p>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
            <span>VIGENCIA COOKIE</span>
            <span className="text-emerald-700 font-bold">45 DÍAS</span>
          </div>
        </div>

        {/* KPI 3: Referidos Agendados */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
              {resT.kpiBooked || "LEADS AGENDADOS"}
            </span>
            <div className="text-3xl font-bold text-[#111] tracking-tight mt-2">
              {kpis.totalAgendados}
            </div>
            <p className="text-xs text-black/70 mt-1 font-sans font-medium">Citas & Activaciones Generadas</p>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
            <span>MÓDULOS</span>
            <span className="text-purple-700 font-bold">Platzi / Calendario</span>
          </div>
        </div>

        {/* KPI 4: Saldo Pendiente por Liquidar */}
        <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
              {resT.kpiPendingBalance || "SALDO PENDIENTE"}
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#111] tracking-tight mt-2 truncate">
              {formatCOP(kpis.saldoPendienteTotal)}
            </div>
            <p className="text-xs text-black/70 mt-1 font-sans font-medium">Comisiones Pendientes de Pago</p>
          </div>
          <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
            <span>LIQUIDACIÓN</span>
            <span className="text-amber-700 font-bold">Transferencia Bancaria</span>
          </div>
        </div>

      </div>

      {/* ── BARRA DE BÚSQUEDA Y FILTROS ─────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={resT.searchPlaceholder || "Buscar por nombre, código o correo..."}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F5F4F0] border border-black/10 focus:border-black/30 rounded-xl text-[#111] placeholder:text-black/40 outline-none transition-all font-sans"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-xl border border-black/[0.06]">
          {(["all", "activo", "suspendido"] as const).map((filtro) => (
            <button
              key={filtro}
              onClick={() => setStatusFilter(filtro)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                statusFilter === filtro ? "bg-white text-[#111] font-bold shadow-2xs" : "text-black/50 hover:text-[#111]"
              }`}
            >
              {filtro === "all" ? resT.filterAll || "Todos" : filtro === "activo" ? resT.filterActive || "Activos" : resT.filterSuspended || "Suspendidos"}
            </button>
          ))}
        </div>
      </div>

      {/* ── LISTADO DE REVENDEDORES ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 rounded-2xl border border-black/[0.08] bg-white shadow-2xs flex flex-col items-center justify-center space-y-2 text-black/50">
            <Loader2 className="w-6 h-6 animate-spin text-[#111]" />
            <span className="text-xs font-mono">{isEs ? "Cargando revendedores..." : "Loading resellers..."}</span>
          </div>
        ) : filteredAfiliados.length === 0 ? (
          <div className="p-12 rounded-2xl border border-black/[0.08] bg-white shadow-2xs text-center space-y-2 text-black/40">
            <Users className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-mono">{resT.emptyState || "No se encontraron revendedores registrados."}</p>
          </div>
        ) : (
          filteredAfiliados.map((afiliado) => {
            const isActivo = afiliado.estado === "activo"
            const saldoNum = Number(afiliado.saldo_pendiente) || 0

            return (
              <div
                key={afiliado.id}
                className="p-4 sm:p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:border-black/20 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Info Principal */}
                <div className="space-y-1.5 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[#111] tracking-tight">{afiliado.nombre}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        isActivo
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActivo ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {isActivo ? resT.statusActive || "Activo" : resT.statusSuspended || "Suspendido"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-black/60 font-mono">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-black/40" />
                      {afiliado.email}
                    </span>
                    {afiliado.telefono && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-black/40" />
                        {afiliado.telefono}
                      </span>
                    )}
                  </div>
                </div>

                {/* Código de Enlace y Clics */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 flex items-center gap-2 font-mono text-xs">
                    <Tag className="w-3.5 h-3.5 text-black/40" />
                    <span className="font-bold text-[#111]">{afiliado.codigo_referido || "SIN_CODIGO"}</span>
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs font-mono text-black/60">
                    <span className="font-bold text-[#111]">{afiliado.clics_totales || 0}</span> clics
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs font-mono text-black/60">
                    <span className="font-bold text-[#111]">{afiliado.total_referidos_agendados || 0}</span> agendados
                  </div>
                </div>

                {/* Saldo y Acciones */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-black/[0.06]">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-black/40 uppercase block">Saldo Pendiente</span>
                    <span className="text-sm font-mono font-bold text-[#111]">{formatCOP(saldoNum)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón WhatsApp */}
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppLink(afiliado)}
                      title={resT.whatsappShare || "Copiar Enlace WhatsApp"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-mono text-xs font-bold transition-colors cursor-pointer border border-[#25D366]/30"
                    >
                      {copiedId === afiliado.id ? <Check className="w-3.5 h-3.5 text-[#128C7E]" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Botón Liquidar */}
                    {saldoNum > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenLiquidar(afiliado)}
                        title={resT.liquidateButton || "Liquidar Saldo"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-black text-white hover:bg-black/80 font-mono text-xs font-bold transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{resT.liquidateButton || "Liquidar"}</span>
                      </button>
                    )}

                    {/* Botón Activar / Suspender */}
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(afiliado)}
                      title={isActivo ? resT.suspendButton || "Suspender" : resT.activateButton || "Activar"}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isActivo
                          ? "border-black/10 text-black/40 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                          : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                      }`}
                    >
                      {isActivo ? <Ban className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── MODAL: CREAR NUEVO REVENDEDOR ───────────────────────────────────────── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-5 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-medium text-[#111] tracking-tight">
                  {resT.modalTitle || "Registrar Nuevo Revendedor"}
                </h3>
                <p className="text-xs text-black/60 font-light mt-0.5">
                  {resT.modalDesc || "Genera un código único y enlace de atribución para un aliado comercial."}
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                  {resT.nameLabel || "NOMBRE COMPLETO *"}
                </label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Orley Arturo Pérez"
                  className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none focus:border-black/40 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                    {resT.emailLabel || "CORREO ELECTRÓNICO *"}
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="orley@empresa.com"
                    className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none focus:border-black/40 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                    {resT.phoneLabel || "CELULAR / WHATSAPP"}
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none focus:border-black/40 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                  {resT.codeLabel || "CÓDIGO DESEADO (OPCIONAL)"}
                </label>
                <input
                  type="text"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej. ORLEY2026 (Auto-generado si se deja vacío)"
                  className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none focus:border-black/40 font-mono uppercase font-bold"
                />
              </div>

              {/* Datos Bancarios Opcionales */}
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-black/[0.06] space-y-3">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase tracking-wider block">
                  INFORMACIÓN DE PAGO (OPCIONAL)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-black/60 mb-1">{resT.bankLabel || "BANCO"}</label>
                    <input
                      type="text"
                      value={formBanco}
                      onChange={(e) => setFormBanco(e.target.value)}
                      placeholder="Bancolombia, Nequi, etc."
                      className="w-full px-3 py-2 text-xs bg-white border border-black/10 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-black/60 mb-1">{resT.accountTypeLabel || "TIPO DE CUENTA"}</label>
                    <select
                      value={formTipoCuenta}
                      onChange={(e) => setFormTipoCuenta(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-black/10 rounded-xl outline-none font-mono"
                    >
                      <option value="ahorros">Ahorros</option>
                      <option value="corriente">Corriente</option>
                      <option value="billetera_digital">Billetera Digital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-black/60 mb-1">{resT.accountNumberLabel || "NÚMERO DE CUENTA"}</label>
                    <input
                      type="text"
                      value={formNumeroCuenta}
                      onChange={(e) => setFormNumeroCuenta(e.target.value)}
                      placeholder="123-456-7890"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/10 rounded-xl outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-black/60 mb-1">{resT.documentLabel || "DOCUMENTO DE IDENTIDAD"}</label>
                    <input
                      type="text"
                      value={formNumeroDocumento}
                      onChange={(e) => setFormNumeroDocumento(e.target.value)}
                      placeholder="C.C. 10203040"
                      className="w-full px-3 py-2 text-xs bg-white border border-black/10 rounded-xl outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:bg-black/5"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{resT.saving || "CREANDO..."}</span>
                    </>
                  ) : (
                    <span>{resT.saveButton || "CREAR REVENDEDOR"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LIQUIDAR COMISIONES ─────────────────────────────────────────── */}
      {isLiquidarOpen && selectedAfiliado && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-5 my-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-medium text-[#111] tracking-tight">
                  {resT.liquidateModalTitle || "Liquidar Comisiones"}
                </h3>
                <p className="text-xs text-black/60 font-light mt-0.5">
                  Revendedor: <span className="font-bold text-[#111]">{selectedAfiliado.nombre}</span>
                </p>
              </div>
              <button
                onClick={() => setIsLiquidarOpen(false)}
                className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLiquidarSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-900">
                <span className="block text-[10px] text-amber-800 uppercase font-bold">Saldo Disponible para Pago</span>
                <span className="text-xl font-bold text-[#111] block mt-1">
                  {formatCOP(selectedAfiliado.saldo_pendiente)}
                </span>
                {selectedAfiliado.banco && selectedAfiliado.numero_cuenta && (
                  <span className="text-[11px] text-black/60 block mt-1 border-t border-amber-500/20 pt-1">
                    Cuenta: {selectedAfiliado.banco} - {selectedAfiliado.tipo_cuenta} {selectedAfiliado.numero_cuenta}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                  {resT.liquidateAmountLabel || "MONTO A LIQUIDAR (COP) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={liqMonto}
                  onChange={(e) => setLiqMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm bg-[#F5F4F0] border border-black/10 rounded-xl outline-none focus:border-black/40 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                    {resT.liquidateMethodLabel || "MÉTODO DE PAGO"}
                  </label>
                  <input
                    type="text"
                    value={liqMetodo}
                    onChange={(e) => setLiqMetodo(e.target.value)}
                    placeholder="Transferencia, Nequi..."
                    className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                    {resT.liquidateRefLabel || "COMPROBANTE / REF"}
                  </label>
                  <input
                    type="text"
                    value={liqReferencia}
                    onChange={(e) => setLiqReferencia(e.target.value)}
                    placeholder="Ej. TR-89240"
                    className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-black/60 uppercase mb-1">
                  {resT.liquidateNotesLabel || "NOTAS / OBSERVACIONES"}
                </label>
                <textarea
                  rows={2}
                  value={liqNotas}
                  onChange={(e) => setLiqNotas(e.target.value)}
                  placeholder="Detalles adicionales del pago..."
                  className="w-full px-3 py-2 text-xs bg-[#F5F4F0] border border-black/10 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLiquidarOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:bg-black/5"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isLiquidating}
                  className="px-5 py-2.5 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  {isLiquidating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{resT.processing || "PROCESANDO..."}</span>
                    </>
                  ) : (
                    <span>{resT.confirmLiquidate || "CONFIRMAR LIQUIDACIÓN"}</span>
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
