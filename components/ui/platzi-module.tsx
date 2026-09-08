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
      // Ignorar error de conexión
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
      // Ignorar error de conexión
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
        setFeedbackToast(
          isEs ? "Estado de venta actualizado." : "Sale status updated."
        )
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
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-black text-white text-xs font-mono tracking-wider shadow-2xl border border-white/20 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/[0.03] border border-black/[0.06] text-[11px] font-mono text-black/60 mb-2 font-medium">
            <Layers className="w-3.5 h-3.5 text-black/70" />
            <span>PLATZI BUSINESS MODULE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111]">
            {pT.title || "Administración Platzi"}
          </h2>
          <p className="text-xs sm:text-sm text-black/50 font-light mt-0.5">
            {pT.subtitle || "Catálogo de planes ofertados, control de vigencias y trazabilidad de ventas sincronizadas con revendedores."}
          </p>
        </div>

        {/* Botón Refrescar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadPlanes()
              loadVentas()
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/[0.02] hover:bg-black/[0.05] border border-black/[0.06] text-xs font-mono text-black/60 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isEs ? "Actualizar" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Planes Totales */}
        <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              {pT.kpiTotalPlans || "TOTAL DE PLANES"}
            </span>
            <Layers className="w-4 h-4 text-black/40" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#111]">
              {planes.length}
            </span>
            <span className="text-[11px] text-black/40 font-mono block mt-0.5">
              {planesVigentesCount} {isEs ? "vigentes en catálogo" : "active in catalog"}
            </span>
          </div>
        </div>

        {/* Card 2: Ventas Registradas */}
        <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              {pT.kpiTotalSales || "VENTAS REGISTRADAS"}
            </span>
            <ShoppingBag className="w-4 h-4 text-black/40" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#111]">
              {ventas.length}
            </span>
            <span className="text-[11px] text-black/40 font-mono block mt-0.5">
              {ventasConRevendedorCount} {isEs ? "por revendedores" : "via resellers"}
            </span>
          </div>
        </div>

        {/* Card 3: Cuentas Activas */}
        <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              {pT.kpiActiveAccounts || "CUENTAS ACTIVAS"}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#111]">
              {ventasActivasCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-mono block mt-0.5 font-medium">
              {ventas.length > 0 ? Math.round((ventasActivasCount / ventas.length) * 100) : 0}% {isEs ? "activación efectiva" : "activation rate"}
            </span>
          </div>
        </div>

        {/* Card 4: Códigos Canjeados */}
        <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              {pT.kpiRedeemedCodes || "CÓDIGOS CANJEADOS"}
            </span>
            <Tag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#111]">
              {ventasCanjeadasCount}
            </span>
            <span className="text-[11px] text-black/40 font-mono block mt-0.5">
              {ventas.length - ventasCanjeadasCount} {isEs ? "códigos por canjear" : "pending redemption"}
            </span>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1">
        <button
          onClick={() => setActiveTab("planes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
            activeTab === "planes"
              ? "border-black text-black bg-black/[0.03]"
              : "border-transparent text-black/40 hover:text-black/70"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{pT.tabPlans || "Planes Ofertados"} ({planes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ventas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
            activeTab === "ventas"
              ? "border-black text-black bg-black/[0.03]"
              : "border-transparent text-black/40 hover:text-black/70"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{pT.tabSales || "Ventas & Canjes"} ({ventas.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: PLANES OFERTADOS */}
      {/* ========================================================================= */}
      {activeTab === "planes" && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Botón Crear Plan */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-black/30 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchPlanes}
                onChange={(e) => setSearchPlanes(e.target.value)}
                placeholder={pT.searchPlansPlaceholder || "Buscar plan..."}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.08] text-xs font-mono text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <button
              onClick={() => handleOpenPlanModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#111] hover:bg-black text-white text-xs font-mono font-bold tracking-wider uppercase transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{pT.newPlanButton || "NUEVO PLAN"}</span>
            </button>
          </div>

          {/* Listado de Planes */}
          {loadingPlanes ? (
            <div className="p-8 text-center text-xs font-mono text-black/40 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isEs ? "Cargando catálogo de planes..." : "Loading plans..."}</span>
            </div>
          ) : filteredPlanes.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-black/[0.01] border border-dashed border-black/10">
              <Layers className="w-8 h-8 text-black/20 mx-auto mb-2" />
              <p className="text-xs font-mono text-black/40">
                {isEs ? "No se encontraron planes configurados." : "No plans configured."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlanes.map((plan) => (
                <div
                  key={plan.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-black/[0.015] hover:bg-black/[0.03] border border-black/[0.05] transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 sm:mt-0 shrink-0 ${
                        plan.vigente ? "bg-emerald-500" : "bg-black/20"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111] tracking-tight">
                          {plan.nombre_plan}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.04] text-black/70 font-bold">
                          {plan.meses_cubrimiento} {isEs ? "MESES" : "MONTHS"}
                        </span>
                      </div>
                      {plan.caracteristicas && (
                        <p className="text-xs text-black/50 font-light mt-0.5">
                          {plan.caracteristicas}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-black/[0.04]">
                    {/* Precio Formateado */}
                    <div className="text-left sm:text-right">
                      <span className="text-sm font-mono font-bold text-[#111]">
                        ${Number(plan.precio).toLocaleString("es-CO")} {plan.moneda}
                      </span>
                      <span className="text-[10px] font-mono text-black/40 block">
                        {plan.vigente ? (isEs ? "Vigente en catálogo" : "Active") : (isEs ? "Desactivado" : "Disabled")}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleVigencia(plan)}
                        title={plan.vigente ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          plan.vigente
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-black/[0.03] text-black/40 border-black/[0.06] hover:bg-black/[0.06]"
                        }`}
                      >
                        {plan.vigente ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenPlanModal(plan)}
                        className="p-1.5 rounded-lg bg-black/[0.03] hover:bg-black/[0.06] text-black/60 transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePlan(plan)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: VENTAS & CANJES */}
      {/* ========================================================================= */}
      {activeTab === "ventas" && (
        <div className="space-y-4">
          {/* Buscador de Ventas */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-black/30 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchVentas}
                onChange={(e) => setSearchVentas(e.target.value)}
                placeholder={pT.searchSalesPlaceholder || "Buscar por cliente, correo o revendedor..."}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.08] text-xs font-mono text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black transition-colors"
              />
            </div>
          </div>

          {/* Listado de Ventas */}
          {loadingVentas ? (
            <div className="p-8 text-center text-xs font-mono text-black/40 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isEs ? "Cargando registro de ventas..." : "Loading sales..."}</span>
            </div>
          ) : filteredVentas.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-black/[0.01] border border-dashed border-black/10">
              <ShoppingBag className="w-8 h-8 text-black/20 mx-auto mb-2" />
              <p className="text-xs font-mono text-black/40">
                {isEs ? "No se encontraron ventas registradas." : "No sales found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVentas.map((venta) => (
                <div
                  key={venta.id}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-3.5 rounded-xl bg-black/[0.015] hover:bg-black/[0.03] border border-black/[0.05] transition-all"
                >
                  {/* Info Cliente */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        venta.cuenta_activa ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#111] tracking-tight">
                          {venta.name}
                        </span>
                        {venta.cod_revendedor ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60">
                            REF: {venta.cod_revendedor}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.04] text-black/40">
                            DIRECTO
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black/50 font-light mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-black/30" />
                          {venta.email}
                        </span>
                        <span className="text-black/20">•</span>
                        <span>Platzi: <strong className="font-medium text-black/70">{venta.platzi_account_email}</strong></span>
                        {venta.phone && (
                          <>
                            <span className="text-black/20">•</span>
                            <span>{venta.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado, Código y Acciones */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-2 lg:pt-0 border-black/[0.04]">
                    {/* Código Generado */}
                    {venta.cod_generado ? (
                      <button
                        onClick={() => handleCopyCode(venta.id, venta.cod_generado!)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.06] text-xs font-mono font-bold tracking-widest text-[#111] cursor-pointer"
                      >
                        <span>{venta.cod_generado}</span>
                        {copiedCodeId === venta.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-black/30" />
                        )}
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-black/30">Sin código</span>
                    )}

                    {/* Botón Switch Cuenta Activa */}
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
                      <span>
                        {venta.cuenta_activa
                          ? pT.accountActive || "Activa"
                          : pT.accountInactive || "Inactiva"}
                      </span>
                    </button>

                    {/* Botón Switch Código Canjeado */}
                    <button
                      onClick={() => handleToggleVenta(venta, "cod_canjeado")}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors cursor-pointer border ${
                        venta.cod_canjeado
                          ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          : "bg-black/[0.03] text-black/40 border-black/[0.06] hover:bg-black/[0.06]"
                      }`}
                    >
                      <span>
                        {venta.cod_canjeado
                          ? pT.codeRedeemed || "Canjeado"
                          : pT.codePending || "Pendiente"}
                      </span>
                    </button>

                    {/* Fecha de Registro */}
                    <span className="text-[10px] font-mono text-black/30 hidden sm:inline-block">
                      {new Date(venta.fecha_registro).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR PLAN */}
      {/* ========================================================================= */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#111] tracking-tight">
                  {editingPlan ? (isEs ? "Editar Plan Platzi" : "Edit Plan") : pT.planModalTitle || "Configuración de Plan Platzi"}
                </h3>
                <p className="text-xs text-black/50 font-light mt-0.5">
                  {pT.planModalDesc || "Define la oferta de planes, meses y precio."}
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
                  {pT.planNameLabel || "NOMBRE DEL PLAN *"}
                </label>
                <input
                  type="text"
                  required
                  value={planNombre}
                  onChange={(e) => setPlanNombre(e.target.value)}
                  placeholder="Ej. Plan 5 Meses"
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.1] text-xs font-mono text-[#111] focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    {pT.planMonthsLabel || "MESES *"}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={planMeses}
                    onChange={(e) => setPlanMeses(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.1] text-xs font-mono text-[#111] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    {pT.planPriceLabel || "PRECIO (COP) *"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={planPrecio}
                    onChange={(e) => setPlanPrecio(e.target.value)}
                    placeholder="85000"
                    className="w-full px-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.1] text-xs font-mono text-[#111] focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  {pT.planFeaturesLabel || "CARACTERÍSTICAS"}
                </label>
                <textarea
                  rows={2}
                  value={planCaracteristicas}
                  onChange={(e) => setPlanCaracteristicas(e.target.value)}
                  placeholder="Ej. Acceso completo a rutas y cursos por 5 meses..."
                  className="w-full px-3 py-2 rounded-lg bg-black/[0.02] border border-black/[0.1] text-xs font-mono text-[#111] focus:outline-none focus:border-black transition-colors resize-none"
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
                  className="text-xs font-mono text-black/80 font-medium cursor-pointer"
                >
                  {pT.planActiveLabel || "Plan Vigente y disponible en catálogo"}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-mono text-black/60 hover:text-black transition-colors"
                >
                  {isEs ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#111] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPlan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {isSubmittingPlan
                      ? pT.savingPlan || "GUARDANDO..."
                      : pT.savePlanButton || "GUARDAR PLAN"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
