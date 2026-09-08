"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Layers,
  ShoppingBag,
  Plus,
  Search,
  Check,
  X,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  DollarSign,
  Tag,
  Clock,
  User,
  Mail,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Phone,
  ChevronRight,
  Send,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export interface PlanPlatzi {
  id: string
  nombre_plan: string
  meses_cubrimiento: number
  precio: number | string
  moneda: string
  vigente: boolean
  caracteristicas: string | null
  total_disponibles: number | null
  created_at: string
}

export interface VentaPlatzi {
  id: string
  name: string
  phone: string | null
  email: string
  platzi_account_email: string
  country_name: string
  cod_revendedor: string | null
  discount_code: string | null
  fecha_registro: string
  cod_generado: string | null
  cod_canjeado: boolean
  fecha_canje: string | null
  cuenta_activa: boolean
  created_at: string
}

export function PlatziModule() {
  const { t, language } = useLanguage()
  const isEs = language === "es"
  const pT = (t.dashboard as any)?.platzi || {}

  const [activeTab, setActiveTab] = useState<"planes" | "ventas">("planes")

  // Estados de Planes
  const [planes, setPlanes] = useState<PlanPlatzi[]>([])
  const [loadingPlanes, setLoadingPlanes] = useState(true)
  const [searchPlanes, setSearchPlanes] = useState("")

  // Estados de Ventas
  const [ventas, setVentas] = useState<VentaPlatzi[]>([])
  const [loadingVentas, setLoadingVentas] = useState(true)
  const [searchVentas, setSearchVentas] = useState("")

  // Modales
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanPlatzi | null>(null)

  // Formulario Plan
  const [planNombre, setPlanNombre] = useState("")
  const [planMeses, setPlanMeses] = useState<number>(5)
  const [planPrecio, setPlanPrecio] = useState<string>("85000")
  const [planMoneda, setPlanMoneda] = useState("COP")
  const [planVigente, setPlanVigente] = useState(true)
  const [planCaracteristicas, setPlanCaracteristicas] = useState("")
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false)

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState("")
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // Cargar Planes
  const loadPlanes = async () => {
    setLoadingPlanes(true)
    try {
      const res = await fetch("/api/admin/platzi/plans")
      const data = await res.json()
      if (res.ok && data.success) {
        setPlanes(data.planes || [])
      }
    } catch {
      // Ignorar error
    } finally {
      setLoadingPlanes(false)
    }
  }

  // Cargar Ventas
  const loadVentas = async () => {
    setLoadingVentas(true)
    try {
      const res = await fetch("/api/admin/platzi/sales")
      const data = await res.json()
      if (res.ok && data.success) {
        setVentas(data.ventas || [])
      }
    } catch {
      // Ignorar error
    } finally {
      setLoadingVentas(false)
    }
  }

  useEffect(() => {
    loadPlanes()
    loadVentas()
  }, [])

  useEffect(() => {
    if (feedbackToast) {
      const timer = setTimeout(() => setFeedbackToast(""), 3500)
      return () => clearTimeout(timer)
    }
  }, [feedbackToast])

  // Abrir modal de creación/edición de plan
  const handleOpenPlanModal = (plan?: PlanPlatzi) => {
    if (plan) {
      setEditingPlan(plan)
      setPlanNombre(plan.nombre_plan)
      setPlanMeses(plan.meses_cubrimiento)
      setPlanPrecio(String(plan.precio))
      setPlanMoneda(plan.moneda || "COP")
      setPlanVigente(plan.vigente)
      setPlanCaracteristicas(plan.caracteristicas || "")
    } else {
      setEditingPlan(null)
      setPlanNombre("")
      setPlanMeses(5)
      setPlanPrecio("85000")
      setPlanMoneda("COP")
      setPlanVigente(true)
      setPlanCaracteristicas("")
    }
    setIsPlanModalOpen(true)
  }

  // Guardar Plan
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingPlan(true)

    try {
      const payload = {
        id: editingPlan?.id,
        nombre_plan: planNombre.trim(),
        meses_cubrimiento: Number(planMeses),
        precio: Number(planPrecio),
        moneda: planMoneda.trim().toUpperCase(),
        vigente: planVigente,
        caracteristicas: planCaracteristicas.trim(),
      }

      const res = await fetch("/api/admin/platzi/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setFeedbackToast(
          isEs
            ? editingPlan ? "Plan actualizado exitosamente." : "Plan creado exitosamente."
            : editingPlan ? "Plan updated successfully." : "Plan created successfully."
        )
        setIsPlanModalOpen(false)
        loadPlanes()
      } else {
        alert(data.error || "Error al guardar plan")
      }
    } catch {
      alert("Error de red al guardar plan")
    } finally {
      setIsSubmittingPlan(false)
    }
  }

  // Alternar Vigencia de Plan
  const handleToggleVigencia = async (plan: PlanPlatzi) => {
    const nuevaVigencia = !plan.vigente
    try {
      const res = await fetch(`/api/admin/platzi/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vigente: nuevaVigencia }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPlanes((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, vigente: nuevaVigencia } : p))
        )
        setFeedbackToast(
          isEs
            ? `Plan "${plan.nombre_plan}" ${nuevaVigencia ? "activado" : "desactivado"}.`
            : `Plan "${plan.nombre_plan}" ${nuevaVigencia ? "activated" : "deactivated"}.`
        )
      }
    } catch {
      alert("Error al actualizar vigencia")
    }
  }

  // Eliminar Plan
  const handleDeletePlan = async (plan: PlanPlatzi) => {
    if (!confirm(pT.deletePlanConfirm || "¿Estás seguro de eliminar este plan?")) return

    try {
      const res = await fetch(`/api/admin/platzi/plans/${plan.id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setPlanes((prev) => prev.filter((p) => p.id !== plan.id))
        setFeedbackToast(isEs ? "Plan eliminado correctamente." : "Plan deleted successfully.")
      }
    } catch {
      alert("Error al eliminar plan")
    }
  }

  // Alternar estado de venta (cuenta activa / código canjeado)
  const handleToggleVenta = async (venta: VentaPlatzi, campo: "cuenta_activa" | "cod_canjeado") => {
    const nuevoValor = !venta[campo]
    const payload = {
      ventaId: venta.id,
      cuentaActiva: campo === "cuenta_activa" ? nuevoValor : venta.cuenta_activa,
      codCanjeado: campo === "cod_canjeado" ? nuevoValor : venta.cod_canjeado,
    }

    try {
      const res = await fetch("/api/admin/platzi/sales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setVentas((prev) =>
          prev.map((v) => (v.id === venta.id ? { ...v, [campo]: nuevoValor } : v))
        )
        setFeedbackToast(isEs ? "Estado actualizado." : "Status updated.")
      }
    } catch {
      alert("Error actualizando venta")
    }
  }

  // Copiar código de activación
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setFeedbackToast(isEs ? `Código ${code} copiado.` : `Code ${code} copied.`)
    setTimeout(() => setCopiedCodeId(null), 2500)
  }

  // Métricas agregadas
  const planesVigentesCount = useMemo(() => planes.filter((p) => p.vigente).length, [planes])
  const ventasActivasCount = useMemo(() => ventas.filter((v) => v.cuenta_activa).length, [ventas])
  const ventasCanjeadasCount = useMemo(() => ventas.filter((v) => v.cod_canjeado).length, [ventas])
  const ventasConRevendedorCount = useMemo(
    () => ventas.filter((v) => v.cod_revendedor && v.cod_revendedor.trim() !== "").length,
    [ventas]
  )

  // Filtrado de planes
  const filteredPlanes = useMemo(() => {
    return planes.filter((p) =>
      p.nombre_plan.toLowerCase().includes(searchPlanes.toLowerCase()) ||
      (p.caracteristicas && p.caracteristicas.toLowerCase().includes(searchPlanes.toLowerCase()))
    )
  }, [planes, searchPlanes])

  // Filtrado de ventas
  const filteredVentas = useMemo(() => {
    return ventas.filter((v) =>
      v.name.toLowerCase().includes(searchVentas.toLowerCase()) ||
      v.email.toLowerCase().includes(searchVentas.toLowerCase()) ||
      v.platzi_account_email.toLowerCase().includes(searchVentas.toLowerCase()) ||
      (v.cod_revendedor && v.cod_revendedor.toLowerCase().includes(searchVentas.toLowerCase())) ||
      (v.cod_generado && v.cod_generado.toLowerCase().includes(searchVentas.toLowerCase()))
    )
  }, [ventas, searchVentas])

  return (
    <div className="space-y-5 font-sans">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#111] text-white text-xs font-mono shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── TOP TITLE BANNER ─────────────────────────────────────────────────── */}
      <div className="pb-4 border-b border-black/[0.08]">
        <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
          {pT.title || "Gestión de Planes & Ventas Platzi"}
        </h1>
        <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
          {pT.subtitle || "Catálogo de planes ofertados, control de vigencias y trazabilidad de ventas sincronizadas con revendedores."}
        </p>
      </div>

      {/* ── BENTO GRID KPIS LIMPIO ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              PLANES CONFIGURADOS
            </span>
            <Layers className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {planes.length}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              {planesVigentesCount} vigentes en catálogo
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              TOTAL VENTAS REGISTRADAS
            </span>
            <ShoppingBag className="w-4 h-4 text-black/30" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {ventas.length}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              {ventasConRevendedorCount} referidas por aliados
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              CUENTAS ACTIVAS
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {ventasActivasCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium block mt-0.5">
              {ventas.length > 0 ? Math.round((ventasActivasCount / ventas.length) * 100) : 0}% efectividad
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              CÓDIGOS CANJEADOS
            </span>
            <Tag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {ventasCanjeadasCount}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              {ventas.length - ventasCanjeadasCount} pendientes de canje
            </span>
          </div>
        </div>
      </div>

      {/* ── NAVEGACIÓN POR PESTAÑAS ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1">
        <button
          onClick={() => setActiveTab("planes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-sans text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "planes"
              ? "border-black text-black bg-[#F5F4F0]"
              : "border-transparent text-black/40 hover:text-black/70"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Planes Ofertados ({planes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ventas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-sans text-xs font-semibold tracking-wide transition-all border-b-2 cursor-pointer ${
            activeTab === "ventas"
              ? "border-black text-black bg-[#F5F4F0]"
              : "border-transparent text-black/40 hover:text-black/70"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ventas & Canjes ({ventas.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: PLANES OFERTADOS (DATA TABLE CORPORATIVA) */}
      {/* ========================================================================= */}
      {activeTab === "planes" && (
        <div className="space-y-4">
          {/* Barra de Controles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={searchPlanes}
                onChange={(e) => setSearchPlanes(e.target.value)}
                placeholder="Buscar plan por nombre o características..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadPlanes}
                title="Refrescar Planes"
                className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPlanes ? "animate-spin text-[#111]" : ""}`} />
              </button>

              <button
                onClick={() => handleOpenPlanModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Plan</span>
              </button>
            </div>
          </div>

          {/* Tabla de Planes */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                    <th className="py-3 px-3.5 font-bold">Nombre del Plan</th>
                    <th className="py-3 px-3.5 font-bold text-center">Meses de Cobertura</th>
                    <th className="py-3 px-3.5 font-bold">Precio Formateado</th>
                    <th className="py-3 px-3.5 font-bold">Características</th>
                    <th className="py-3 px-3.5 font-bold text-center">Estado / Vigente</th>
                    <th className="py-3 px-3.5 font-bold text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.05]">
                  {loadingPlanes ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-mono text-black/40">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                        <span>Cargando catálogo de planes...</span>
                      </td>
                    </tr>
                  ) : filteredPlanes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-mono text-black/40">
                        No se encontraron planes registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredPlanes.map((plan) => (
                      <tr key={plan.id} className="hover:bg-black/[0.015] transition-colors">
                        {/* Nombre */}
                        <td className="py-3 px-3.5">
                          <span className="text-xs font-semibold text-[#111] block">
                            {plan.nombre_plan}
                          </span>
                        </td>

                        {/* Meses */}
                        <td className="py-3 px-3.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5F4F0] text-xs font-mono font-bold text-[#111]">
                            {plan.meses_cubrimiento} Meses
                          </span>
                        </td>

                        {/* Precio */}
                        <td className="py-3 px-3.5 font-mono text-xs font-bold text-[#111]">
                          ${Number(plan.precio).toLocaleString("es-CO")} {plan.moneda}
                        </td>

                        {/* Características */}
                        <td className="py-3 px-3.5 text-xs text-black/60 font-normal max-w-xs truncate">
                          {plan.caracteristicas || "Sin detalles adicionales"}
                        </td>

                        {/* Estado / Vigente */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleVigencia(plan)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                              plan.vigente
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-black/[0.03] text-black/40 border-black/[0.06] hover:bg-black/[0.06]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                plan.vigente ? "bg-emerald-500" : "bg-black/30"
                              }`}
                            />
                            <span>{plan.vigente ? "Vigente" : "Inactivo"}</span>
                          </button>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenPlanModal(plan)}
                              title="Editar Plan"
                              className="p-1.5 rounded-lg border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeletePlan(plan)}
                              title="Eliminar Plan"
                              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: VENTAS & CANJES (DATA TABLE CORPORATIVA) */}
      {/* ========================================================================= */}
      {activeTab === "ventas" && (
        <div className="space-y-4">
          {/* Barra de Controles */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
            <div className="relative flex-1 sm:w-96">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                type="text"
                value={searchVentas}
                onChange={(e) => setSearchVentas(e.target.value)}
                placeholder="Buscar por cliente, correo o revendedor..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
              />
            </div>

            <button
              onClick={loadVentas}
              title="Refrescar Ventas"
              className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer self-end sm:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loadingVentas ? "animate-spin text-[#111]" : ""}`} />
            </button>
          </div>

          {/* Tabla de Ventas */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                    <th className="py-3 px-3.5 font-bold">Cliente / Comprador</th>
                    <th className="py-3 px-3.5 font-bold">Cuenta Platzi</th>
                    <th className="py-3 px-3.5 font-bold">Revendedor Asociado</th>
                    <th className="py-3 px-3.5 font-bold text-center">Código Generado</th>
                    <th className="py-3 px-3.5 font-bold text-center">Cuenta Activa</th>
                    <th className="py-3 px-3.5 font-bold text-center">Canjeado</th>
                    <th className="py-3 px-3.5 font-bold text-right">Fecha Solicitud</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.05]">
                  {loadingVentas ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                        <span>Cargando historial de ventas...</span>
                      </td>
                    </tr>
                  ) : filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        No se encontraron ventas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredVentas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-black/[0.015] transition-colors">
                        {/* Cliente */}
                        <td className="py-3 px-3.5">
                          <span className="text-xs font-semibold text-[#111] block">
                            {venta.name}
                          </span>
                          <span className="text-[11px] text-black/50 font-normal block">
                            {venta.email}
                          </span>
                        </td>

                        {/* Cuenta Platzi */}
                        <td className="py-3 px-3.5">
                          <span className="text-xs font-mono text-black/80 font-medium">
                            {venta.platzi_account_email}
                          </span>
                        </td>

                        {/* Revendedor */}
                        <td className="py-3 px-3.5">
                          {venta.cod_revendedor ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-mono font-bold border border-emerald-200/60">
                              REF: {venta.cod_revendedor}
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-black/40">
                              Directo (Sin código)
                            </span>
                          )}
                        </td>

                        {/* Código Generado Copiable */}
                        <td className="py-3 px-3.5 text-center">
                          {venta.cod_generado ? (
                            <button
                              onClick={() => handleCopyCode(venta.id, venta.cod_generado!)}
                              title="Copiar código de activación"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F4F0] hover:bg-black/[0.08] border border-black/[0.08] text-xs font-mono font-bold text-[#111] tracking-wider transition-colors cursor-pointer"
                            >
                              <span>{venta.cod_generado}</span>
                              {copiedCodeId === venta.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-black/30" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs font-mono text-black/30">-</span>
                          )}
                        </td>

                        {/* Cuenta Activa (Switch interactivo) */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleVenta(venta, "cuenta_activa")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                              venta.cuenta_activa
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-black/[0.03] text-black/40 border-black/[0.06] hover:bg-black/[0.06]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                venta.cuenta_activa ? "bg-emerald-500" : "bg-black/30"
                              }`}
                            />
                            <span>{venta.cuenta_activa ? "Activa" : "Inactiva"}</span>
                          </button>
                        </td>

                        {/* Código Canjeado (Switch interactivo) */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleVenta(venta, "cod_canjeado")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                              venta.cod_canjeado
                                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                : "bg-black/[0.03] text-black/40 border-black/[0.06] hover:bg-black/[0.06]"
                            }`}
                          >
                            <span>{venta.cod_canjeado ? "Canjeado" : "Pendiente"}</span>
                          </button>
                        </td>

                        {/* Fecha */}
                        <td className="py-3 px-3.5 text-right font-mono text-xs text-black/60">
                          {new Date(venta.fecha_registro).toLocaleDateString("es-CO")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CREAR / EDITAR PLAN ─────────────────────────────────────────── */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#111] tracking-tight">
                  {editingPlan ? "Editar Plan Platzi" : "Configuración de Plan Platzi"}
                </h3>
                <p className="text-xs text-black/50 font-normal mt-0.5">
                  Define la oferta de planes, meses de cobertura y precio.
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:text-black hover:bg-black/[0.04] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  NOMBRE DEL PLAN *
                </label>
                <input
                  type="text"
                  required
                  value={planNombre}
                  onChange={(e) => setPlanNombre(e.target.value)}
                  placeholder="Ej. Plan 5 Meses"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    MESES DE CUBRIMIENTO *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={planMeses}
                    onChange={(e) => setPlanMeses(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] outline-none focus:border-black/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    PRECIO (COP) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={planPrecio}
                    onChange={(e) => setPlanPrecio(e.target.value)}
                    placeholder="85000"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-bold text-[#111] outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  CARACTERÍSTICAS / DETALLES
                </label>
                <textarea
                  rows={2}
                  value={planCaracteristicas}
                  onChange={(e) => setPlanCaracteristicas(e.target.value)}
                  placeholder="Ej. Acceso completo a rutas y cursos por 5 meses..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="planVigenteCheck"
                  checked={planVigente}
                  onChange={(e) => setPlanVigente(e.target.checked)}
                  className="rounded border-black/20 text-black focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="planVigenteCheck"
                  className="text-xs font-sans text-black/80 font-medium cursor-pointer"
                >
                  Plan Vigente (mostrar en catálogo ofertado)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-sans text-black/60 hover:text-black transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] hover:bg-black text-white text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {isSubmittingPlan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingPlan ? "Guardando..." : "Guardar Plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
