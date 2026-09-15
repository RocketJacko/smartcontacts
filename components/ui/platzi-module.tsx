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
  Sparkles,
  ExternalLink,
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
  tipo_pago?: string
  numero_cuotas?: number
  pago_anticipado?: boolean
  es_oferta_especial?: boolean
  codigo_oferta?: string | null
  institucion_empresa?: string | null
  admite_cuotas?: boolean
  max_cuotas?: number
  cupos_maximos?: number | null
  cupos_usados?: number
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
  tipo_pago?: string
  numero_cuotas?: number
  cuotas_pagadas?: number
  pago_anticipado?: boolean
  created_at: string
}

const DEFAULT_PLANES: PlanPlatzi[] = [
  {
    id: "0807dfb2-83bd-4390-88cc-b85a77eb9388",
    nombre_plan: "Plan 6 meses",
    meses_cubrimiento: 6,
    precio: 120000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Accesos completo en tu cuneta personal por 6 meses",
    total_disponibles: null,
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: false,
    es_oferta_especial: false,
    codigo_oferta: null,
    institucion_empresa: null,
    created_at: "2026-09-13T20:17:03.333Z",
  },
  {
    id: "b381bcfd-53f5-4ef3-b5d6-6c5863bb3450",
    nombre_plan: "Plan 12 Meses Pago Único",
    meses_cubrimiento: 12,
    precio: 160000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Suscripción anual con tarifa preferencial",
    total_disponibles: null,
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: false,
    es_oferta_especial: false,
    codigo_oferta: null,
    institucion_empresa: null,
    created_at: "2026-09-08T06:10:33.689Z",
  },
  {
    id: "cc7a5125-02a8-44d7-92b5-9e6ef4dca49f",
    nombre_plan: "Plan 12  Meses",
    meses_cubrimiento: 12,
    precio: 180000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Pagos de 90000 cada 6 meses",
    total_disponibles: null,
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: false,
    es_oferta_especial: false,
    codigo_oferta: null,
    institucion_empresa: null,
    created_at: "2026-09-08T06:10:33.689Z",
  },
  {
    id: "399f6ed5-6d64-4c0f-b7ef-dc69b31038e2",
    nombre_plan: "Oferta especial familia PythonCode",
    meses_cubrimiento: 12,
    precio: 120000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Solo aplica para los integrantes de la cominidad",
    total_disponibles: null,
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: true,
    es_oferta_especial: true,
    codigo_oferta: "PYTHONCODE",
    institucion_empresa: "PythonCode",
    cupos_maximos: null,
    cupos_usados: 0,
    created_at: "2026-09-13T20:27:21.633Z",
  },
  {
    id: "32c6f15c-93d9-4c40-b7f4-995bbc1fc70a",
    nombre_plan: "Convenio Universidad del Valle",
    meses_cubrimiento: 6,
    precio: 85000,
    moneda: "COP",
    vigente: false,
    caracteristicas: "Tarifa exclusiva para estudiantes y docentes de Univalle",
    total_disponibles: 50,
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: true,
    es_oferta_especial: true,
    codigo_oferta: "UNIVALLE-2026",
    institucion_empresa: "Universidad del Valle",
    cupos_maximos: 50,
    cupos_usados: 0,
    created_at: "2026-09-09T06:38:55.891Z",
  },
]

export function PlatziModule() {
  const { t, language } = useLanguage()
  const isEs = language === "es"
  const pT = (t.dashboard as any)?.platzi || {}

  // Pestañas unificadas: solo "planes" (que incluye estándar y ofertas especiales) y "ventas"
  const [activeTab, setActiveTab] = useState<"planes" | "ventas">("planes")

  // Filtro de subcategoría dentro del catálogo de planes
  const [planCategoryFilter, setPlanCategoryFilter] = useState<"all" | "standard" | "offers">("all")

  // Estados de Planes
  const [planes, setPlanes] = useState<PlanPlatzi[]>(DEFAULT_PLANES)
  const [loadingPlanes, setLoadingPlanes] = useState(false)
  const [searchPlanes, setSearchPlanes] = useState("")

  // Estados de Ventas
  const [ventas, setVentas] = useState<VentaPlatzi[]>([])
  const [loadingVentas, setLoadingVentas] = useState(false)
  const [searchVentas, setSearchVentas] = useState("")

  // Modales
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanPlatzi | null>(null)

  // Formulario Plan
  const [planNombre, setPlanNombre] = useState("")
  const [planMeses, setPlanMeses] = useState<number>(12)
  const [planPrecio, setPlanPrecio] = useState<string>("120000")
  const [planMoneda, setPlanMoneda] = useState("COP")
  const [planTipoPago, setPlanTipoPago] = useState<"pago_unico" | "cuotas">("pago_unico")
  const [planNumeroCuotas, setPlanNumeroCuotas] = useState<number>(1)
  const [planPagoAnticipado, setPlanPagoAnticipado] = useState(false)
  const [planVigente, setPlanVigente] = useState(true)
  const [planCaracteristicas, setPlanCaracteristicas] = useState("")
  const [planEsOfertaEspecial, setPlanEsOfertaEspecial] = useState(false)
  const [planCodigoOferta, setPlanCodigoOferta] = useState("")
  const [planInstitucionEmpresa, setPlanInstitucionEmpresa] = useState("")
  const [planCuposMaximos, setPlanCuposMaximos] = useState("")
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false)

  // Toast feedback
  const [feedbackToast, setFeedbackToast] = useState("")
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)

  // Cargar Catálogo Unificado de Planes (Planes Estándar + Ofertas Especiales)
  const loadPlanes = async () => {
    setLoadingPlanes(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    try {
      const res = await fetch("/api/admin/platzi/plans", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.planes) && data.planes.length > 0) {
          setPlanes(data.planes)
        }
      }
    } catch {
      // Si hay timeout o error de red, se mantiene el catálogo base sin romper la interfaz
    } finally {
      clearTimeout(timeoutId)
      setLoadingPlanes(false)
    }
  }

  // Cargar Ventas en segundo plano
  const loadVentas = async () => {
    setLoadingVentas(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    try {
      const res = await fetch("/api/admin/platzi/sales", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.ventas)) {
          setVentas(data.ventas)
        }
      }
    } catch {
      // Ignorar error
    } finally {
      clearTimeout(timeoutId)
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
      setPlanTipoPago((plan.tipo_pago as any) === "cuotas" ? "cuotas" : "pago_unico")
      setPlanNumeroCuotas(plan.numero_cuotas || plan.max_cuotas || 1)
      setPlanPagoAnticipado(Boolean(plan.pago_anticipado))
      setPlanVigente(plan.vigente)
      setPlanCaracteristicas(plan.caracteristicas || "")
      setPlanEsOfertaEspecial(Boolean(plan.es_oferta_especial))
      setPlanCodigoOferta(plan.codigo_oferta || "")
      setPlanInstitucionEmpresa(plan.institucion_empresa || "")
      setPlanCuposMaximos(plan.cupos_maximos ? String(plan.cupos_maximos) : "")
    } else {
      setEditingPlan(null)
      setPlanNombre("")
      setPlanMeses(12)
      setPlanPrecio("120000")
      setPlanMoneda("COP")
      setPlanTipoPago("pago_unico")
      setPlanNumeroCuotas(1)
      setPlanPagoAnticipado(false)
      setPlanVigente(true)
      setPlanCaracteristicas("")
      setPlanEsOfertaEspecial(false)
      setPlanCodigoOferta("")
      setPlanInstitucionEmpresa("")
      setPlanCuposMaximos("")
    }
    setIsPlanModalOpen(true)
  }

  // Guardar Plan u Oferta Especial
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
        tipo_pago: planTipoPago,
        numero_cuotas: planTipoPago === "cuotas" ? Number(planNumeroCuotas) : 1,
        admite_cuotas: planTipoPago === "cuotas",
        max_cuotas: planTipoPago === "cuotas" ? Number(planNumeroCuotas) : 1,
        pago_anticipado: planPagoAnticipado || planEsOfertaEspecial,
        vigente: planVigente,
        caracteristicas: planCaracteristicas.trim(),
        es_oferta_especial: planEsOfertaEspecial,
        codigo_oferta: planEsOfertaEspecial && planCodigoOferta.trim() ? planCodigoOferta.toUpperCase().trim() : null,
        institucion_empresa: planEsOfertaEspecial && planInstitucionEmpresa.trim() ? planInstitucionEmpresa.trim() : null,
        cupos_maximos: planEsOfertaEspecial && planCuposMaximos.trim() ? Number(planCuposMaximos) : null,
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
            ? editingPlan ? "Plan / Oferta actualizado exitosamente." : "Plan / Oferta creado exitosamente."
            : editingPlan ? "Plan updated successfully." : "Plan created successfully."
        )
        setIsPlanModalOpen(false)
        loadPlanes()
      } else {
        alert(data.error || "Error al guardar el plan")
      }
    } catch {
      alert("Error de red al guardar el plan")
    } finally {
      setIsSubmittingPlan(false)
    }
  }

  // Alternar Vigencia de Plan u Oferta Especial
  const handleToggleVigencia = async (plan: PlanPlatzi) => {
    const nuevaVigencia = !plan.vigente
    try {
      const res = await fetch(`/api/admin/platzi/plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vigente: nuevaVigencia,
          es_oferta_especial: Boolean(plan.es_oferta_especial),
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setPlanes((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, vigente: nuevaVigencia } : p))
        )
        setFeedbackToast(
          isEs
            ? `"${plan.nombre_plan}" ${nuevaVigencia ? "activado" : "desactivado"}.`
            : `"${plan.nombre_plan}" ${nuevaVigencia ? "activated" : "deactivated"}.`
        )
      } else {
        alert(data.error || "Error al cambiar vigencia")
      }
    } catch {
      alert("Error de red al actualizar vigencia")
    }
  }

  // Eliminar Plan u Oferta Especial
  const handleDeletePlan = async (plan: PlanPlatzi) => {
    if (!confirm(pT.deletePlanConfirm || `¿Estás seguro de eliminar "${plan.nombre_plan}"?`)) return

    try {
      const res = await fetch(
        `/api/admin/platzi/plans/${plan.id}?es_oferta_especial=${Boolean(plan.es_oferta_especial)}`,
        { method: "DELETE" }
      )
      const data = await res.json()
      if (res.ok && data.success) {
        setPlanes((prev) => prev.filter((p) => p.id !== plan.id))
        setFeedbackToast(isEs ? "Plan eliminado correctamente." : "Plan deleted successfully.")
      } else {
        alert(data.error || "Error al eliminar el plan")
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
  const planesEstandarCount = useMemo(() => planes.filter((p) => !p.es_oferta_especial).length, [planes])
  const planesOfertasCount = useMemo(() => planes.filter((p) => p.es_oferta_especial).length, [planes])

  const ventasActivasCount = useMemo(() => ventas.filter((v) => v.cuenta_activa).length, [ventas])
  const ventasCanjeadasCount = useMemo(() => ventas.filter((v) => v.cod_canjeado).length, [ventas])
  const ventasConRevendedorCount = useMemo(
    () => ventas.filter((v) => v.cod_revendedor && v.cod_revendedor.trim() !== "").length,
    [ventas]
  )

  // Filtrado de planes por texto y subcategoría
  const filteredPlanes = useMemo(() => {
    return planes.filter((p) => {
      // Filtro de subcategoría
      if (planCategoryFilter === "standard" && p.es_oferta_especial) return false
      if (planCategoryFilter === "offers" && !p.es_oferta_especial) return false

      // Filtro de búsqueda
      if (!searchPlanes.trim()) return true
      const q = searchPlanes.toLowerCase().trim()
      return (
        p.nombre_plan.toLowerCase().includes(q) ||
        (p.caracteristicas && p.caracteristicas.toLowerCase().includes(q)) ||
        (p.codigo_oferta && p.codigo_oferta.toLowerCase().includes(q)) ||
        (p.institucion_empresa && p.institucion_empresa.toLowerCase().includes(q))
      )
    })
  }, [planes, searchPlanes, planCategoryFilter])

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
          Administración centralizada de planes públicos generales, ofertas especiales por convenio y control de activaciones.
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
              {planesEstandarCount} estándar • {planesOfertasCount} ofertas especiales
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              PLANES VIGENTES
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#111]">
              {planesVigentesCount}
            </span>
            <span className="text-xs text-black/40 font-normal block mt-0.5">
              Activos en el catálogo de beneficios
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-black/[0.07] shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
              TOTAL VENTAS
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
              {ventas.length > 0 ? Math.round((ventasActivasCount / ventas.length) * 100) : 0}% efectividad de canje
            </span>
          </div>
        </div>
      </div>

      {/* ── NAVEGACIÓN PRINCIPAL: PLANES UNIFICADOS VS VENTAS ─────────────────── */}
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
          <span>Gestión de Planes & Ofertas Especiales ({planes.length})</span>
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
          <span>Ventas & Canjes Platzi ({ventas.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CATÁLOGO UNIFICADO DE PLANES & OFERTAS ESPECIALES */}
      {/* ========================================================================= */}
      {activeTab === "planes" && (
        <div className="space-y-4">
          {/* Barra de Controles y Subfiltros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-black/[0.07] shadow-2xs">
            {/* Píldoras de filtrado por categoría de plan */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F5F4F0] border border-black/[0.06]">
              <button
                onClick={() => setPlanCategoryFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  planCategoryFilter === "all"
                    ? "bg-white text-[#111] shadow-2xs"
                    : "text-black/50 hover:text-[#111]"
                }`}
              >
                Todos ({planes.length})
              </button>
              <button
                onClick={() => setPlanCategoryFilter("standard")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  planCategoryFilter === "standard"
                    ? "bg-white text-[#111] shadow-2xs"
                    : "text-black/50 hover:text-[#111]"
                }`}
              >
                Planes Estándar ({planesEstandarCount})
              </button>
              <button
                onClick={() => setPlanCategoryFilter("offers")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  planCategoryFilter === "offers"
                    ? "bg-white text-amber-900 shadow-2xs"
                    : "text-black/50 hover:text-amber-800"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Ofertas Especiales ({planesOfertasCount})</span>
              </button>
            </div>

            {/* Buscador y Botón Nuevo Plan */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                <input
                  type="text"
                  value={searchPlanes}
                  onChange={(e) => setSearchPlanes(e.target.value)}
                  placeholder="Buscar por nombre, código o características..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111] placeholder:text-black/40 outline-none focus:border-black/30 transition-all font-sans"
                />
              </div>

              <button
                onClick={loadPlanes}
                title="Refrescar Catálogo"
                className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPlanes ? "animate-spin text-[#111]" : ""}`} />
              </button>

              <button
                onClick={() => handleOpenPlanModal()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111] text-white text-xs font-medium hover:bg-black/90 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Plan / Oferta</span>
              </button>
            </div>
          </div>

          {/* Tabla Unificada de Planes & Ofertas Especiales */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                    <th className="py-3 px-3.5 font-bold">Nombre & Categoría</th>
                    <th className="py-3 px-3.5 font-bold text-center">Cobertura</th>
                    <th className="py-3 px-3.5 font-bold">Precio & Modalidad</th>
                    <th className="py-3 px-3.5 font-bold">Características</th>
                    <th className="py-3 px-3.5 font-bold">Enlace Directo</th>
                    <th className="py-3 px-3.5 font-bold text-center">Estado / Vigente</th>
                    <th className="py-3 px-3.5 font-bold text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.05]">
                  {loadingPlanes && planes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                        <span>Cargando catálogo de planes y ofertas...</span>
                      </td>
                    </tr>
                  ) : filteredPlanes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        No se encontraron planes u ofertas registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredPlanes.map((plan) => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "https://smartcontacts.cloud"
                      const planDirectUrl = plan.codigo_oferta
                        ? `${origin}/beneficios?oferta=${plan.codigo_oferta}`
                        : `${origin}/beneficios`

                      return (
                        <tr key={plan.id} className="hover:bg-black/[0.015] transition-colors">
                          {/* Nombre & Categoría */}
                          <td className="py-3 px-3.5">
                            <span className="text-xs font-semibold text-[#111] block">
                              {plan.nombre_plan}
                            </span>
                            {plan.es_oferta_especial ? (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[9px] font-mono font-bold uppercase tracking-wider">
                                  ⭐ OFERTA: {plan.codigo_oferta || "CONVENIO"}
                                </span>
                                {plan.institucion_empresa && (
                                  <span className="text-[10px] text-black/60 font-medium">
                                    • {plan.institucion_empresa}
                                  </span>
                                )}
                                {plan.cupos_maximos && (
                                  <span className="text-[10px] font-mono text-black/40">
                                    ({plan.cupos_usados || 0}/{plan.cupos_maximos} cupos)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-block mt-0.5 text-[9px] font-mono font-semibold text-black/40 uppercase tracking-wider">
                                Público General
                              </span>
                            )}
                          </td>

                          {/* Cobertura */}
                          <td className="py-3 px-3.5 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5F4F0] text-xs font-mono font-bold text-[#111]">
                              {plan.meses_cubrimiento} {plan.meses_cubrimiento === 12 ? "Meses (1 Año)" : "Meses"}
                            </span>
                          </td>

                          {/* Precio y Modalidad */}
                          <td className="py-3 px-3.5">
                            <div className="font-mono text-xs font-bold text-[#111]">
                              ${Number(plan.precio).toLocaleString("es-CO")} {plan.moneda}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {plan.tipo_pago === "cuotas" ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200/60 text-[9px] font-mono font-bold">
                                  {plan.numero_cuotas || 2} Cuotas
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 text-[9px] font-mono font-medium">
                                  Pago Único
                                </span>
                              )}

                              {plan.pago_anticipado ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-mono font-bold">
                                  ⚡ Pago Anticipado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-medium">
                                  ✓ Inmediato
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Características */}
                          <td className="py-3 px-3.5 text-xs text-black/60 font-normal max-w-xs truncate">
                            {plan.caracteristicas || "Sin especificaciones"}
                          </td>

                          {/* Enlace Directo */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-mono text-black/60 max-w-[130px] truncate bg-[#F5F4F0] px-2 py-0.5 rounded border border-black/[0.06]">
                                {plan.codigo_oferta ? `?oferta=${plan.codigo_oferta}` : "/beneficios"}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(planDirectUrl)
                                  setFeedbackToast(`URL copiada: ${planDirectUrl}`)
                                }}
                                title="Copiar URL directa al portapapeles"
                                className="p-1 rounded-lg border border-black/[0.08] bg-white text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={planDirectUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir enlace en nueva pestaña"
                                className="p-1 rounded-lg border border-black/[0.08] bg-white text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
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
                                type="button"
                                onClick={() => handleOpenPlanModal(plan)}
                                title="Editar Plan"
                                className="p-1.5 rounded-lg border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePlan(plan)}
                                title="Eliminar Plan"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
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

            <div className="flex items-center gap-2">
              <button
                onClick={loadVentas}
                title="Refrescar Ventas"
                className="p-2 rounded-xl border border-black/[0.08] bg-[#F5F4F0] text-black/60 hover:text-[#111] transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingVentas ? "animate-spin text-[#111]" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tabla de Ventas */}
          <div className="bg-white rounded-2xl border border-black/[0.07] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-black/[0.07] bg-[#F5F4F0] text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">
                    <th className="py-3 px-3.5 font-bold">Cliente / Comprador</th>
                    <th className="py-3 px-3.5 font-bold">Cuenta Platzi</th>
                    <th className="py-3 px-3.5 font-bold">Código Activación</th>
                    <th className="py-3 px-3.5 font-bold">Revendedor</th>
                    <th className="py-3 px-3.5 font-bold text-center">Canje</th>
                    <th className="py-3 px-3.5 font-bold text-center">Cuenta Activa</th>
                    <th className="py-3 px-3.5 font-bold">Fecha</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-black/[0.05]">
                  {loadingVentas && ventas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-black/40" />
                        <span>Cargando trazabilidad de ventas...</span>
                      </td>
                    </tr>
                  ) : filteredVentas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs font-mono text-black/40">
                        No se encontraron registros de ventas.
                      </td>
                    </tr>
                  ) : (
                    filteredVentas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-black/[0.015] transition-colors">
                        {/* Cliente */}
                        <td className="py-3 px-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-[#111]">{venta.name}</span>
                            <span className="text-[11px] text-black/50 font-normal">{venta.email}</span>
                            {venta.phone && (
                              <span className="text-[10px] font-mono text-black/40">{venta.phone}</span>
                            )}
                          </div>
                        </td>

                        {/* Cuenta Platzi */}
                        <td className="py-3 px-3.5">
                          <span className="text-xs font-mono font-medium text-[#111]">
                            {venta.platzi_account_email}
                          </span>
                        </td>

                        {/* Código Activación */}
                        <td className="py-3 px-3.5">
                          {venta.cod_generado ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-bold bg-[#F5F4F0] px-2 py-0.5 rounded border border-black/[0.08] select-all">
                                {venta.cod_generado}
                              </span>
                              <button
                                onClick={() => handleCopyCode(venta.id, venta.cod_generado!)}
                                title="Copiar código"
                                className="p-1 rounded text-black/40 hover:text-black transition-colors cursor-pointer"
                              >
                                {copiedCodeId === venta.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-black/30 font-mono italic">Sin código</span>
                          )}
                        </td>

                        {/* Revendedor */}
                        <td className="py-3 px-3.5">
                          {venta.cod_revendedor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-mono font-bold">
                              {venta.cod_revendedor}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-black/40 italic">Directo</span>
                          )}
                        </td>

                        {/* Canje */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleVenta(venta, "cod_canjeado")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors cursor-pointer border ${
                              venta.cod_canjeado
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                venta.cod_canjeado ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            <span>{venta.cod_canjeado ? "Canjeado" : "Pendiente"}</span>
                          </button>
                        </td>

                        {/* Cuenta Activa */}
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => handleToggleVenta(venta, "cuenta_activa")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold transition-colors cursor-pointer border ${
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

                        {/* Fecha */}
                        <td className="py-3 px-3.5 text-[11px] font-mono text-black/50">
                          {venta.fecha_registro
                            ? new Date(venta.fecha_registro).toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
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

      {/* ── MODAL NUEVO / EDITAR PLAN U OFERTA ESPECIAL ──────────────────────── */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl border border-black/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <h3 className="text-lg font-semibold text-[#111]">
                  {editingPlan ? "Editar Plan / Oferta" : "Crear Nuevo Plan / Oferta"}
                </h3>
                <p className="text-xs text-black/50 mt-0.5">
                  Configura tarifas públicas o convenios privados de oferta especial.
                </p>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 font-sans">
              {/* Switch de Oferta Especial / Convenio */}
              <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-950 block">
                        ¿Es una Oferta Especial / Convenio?
                      </span>
                      <span className="text-[11px] text-amber-800/80 font-normal block">
                        Solo visible mediante enlace con código (ej. ?oferta=PYTHONCODE)
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    id="planEsOfertaEspecialSwitch"
                    checked={planEsOfertaEspecial}
                    onChange={(e) => {
                      setPlanEsOfertaEspecial(e.target.checked)
                      if (e.target.checked) setPlanPagoAnticipado(true)
                    }}
                    className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {planEsOfertaEspecial && (
                  <div className="space-y-3 pt-2.5 border-t border-amber-500/20">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-950">
                          CÓDIGO DE OFERTA *
                        </label>
                        <input
                          type="text"
                          required={planEsOfertaEspecial}
                          value={planCodigoOferta}
                          onChange={(e) => setPlanCodigoOferta(e.target.value.toUpperCase())}
                          placeholder="Ej. PYTHONCODE"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-mono font-bold text-[#111] outline-none focus:border-amber-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-950">
                          CUPOS MÁXIMOS
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={planCuposMaximos}
                          onChange={(e) => setPlanCuposMaximos(e.target.value)}
                          placeholder="Ilimitados"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-mono text-[#111] outline-none focus:border-amber-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-amber-950">
                        INSTITUCIÓN O COMUNIDAD ALIADA
                      </label>
                      <input
                        type="text"
                        value={planInstitucionEmpresa}
                        onChange={(e) => setPlanInstitucionEmpresa(e.target.value)}
                        placeholder="Ej. Comunidad PythonCode"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-sans text-[#111] outline-none focus:border-amber-600"
                      />
                    </div>

                    {planCodigoOferta && (
                      <div className="text-[10px] font-mono text-amber-900 bg-white/70 p-2 rounded-lg border border-amber-200">
                        Enlace generado: <span className="font-bold">https://smartcontacts.cloud/beneficios?oferta={planCodigoOferta}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Nombre del Plan */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  NOMBRE DEL PLAN *
                </label>
                <input
                  type="text"
                  required
                  value={planNombre}
                  onChange={(e) => setPlanNombre(e.target.value)}
                  placeholder="Ej. Plan 12 Meses Pago Único u Oferta Especial PythonCode"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30"
                />
              </div>

              {/* Meses y Precio */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    MESES DE COBERTURA *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    required
                    value={planMeses}
                    onChange={(e) => setPlanMeses(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono text-[#111] outline-none focus:border-black/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    PRECIO TOTAL (COP) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={planPrecio}
                    onChange={(e) => setPlanPrecio(e.target.value)}
                    placeholder="120000"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-bold text-[#111] outline-none focus:border-black/30"
                  />
                </div>
              </div>

              {/* Modalidad de Pago */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                    MODALIDAD DE PAGO *
                  </label>
                  <select
                    value={planTipoPago}
                    onChange={(e) => setPlanTipoPago(e.target.value as "pago_unico" | "cuotas")}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30"
                  >
                    <option value="pago_unico">Pago Único (1 cuota)</option>
                    <option value="cuotas">Diferido en Cuotas</option>
                  </select>
                </div>

                {planTipoPago === "cuotas" && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                      NÚMERO DE CUOTAS *
                    </label>
                    <select
                      value={planNumeroCuotas}
                      onChange={(e) => setPlanNumeroCuotas(parseInt(e.target.value) || 2)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-mono font-bold text-[#111] outline-none focus:border-black/30"
                    >
                      <option value={2}>2 Cuotas (${Math.round((Number(planPrecio) || 0) / 2).toLocaleString("es-CO")} c/u)</option>
                      <option value={3}>3 Cuotas (${Math.round((Number(planPrecio) || 0) / 3).toLocaleString("es-CO")} c/u)</option>
                      <option value={6}>6 Cuotas (${Math.round((Number(planPrecio) || 0) / 6).toLocaleString("es-CO")} c/u)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Características */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-black/70">
                  CARACTERÍSTICAS / DETALLES
                </label>
                <textarea
                  rows={2}
                  value={planCaracteristicas}
                  onChange={(e) => setPlanCaracteristicas(e.target.value)}
                  placeholder="Ej. Acceso completo a rutas de aprendizaje y eventos..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs font-sans text-[#111] outline-none focus:border-black/30 resize-none"
                />
              </div>

              {/* Switches de Vigencia y Pago Anticipado */}
              <div className="space-y-2 pt-1 border-t border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="planVigenteCheckModal"
                    checked={planVigente}
                    onChange={(e) => setPlanVigente(e.target.checked)}
                    className="rounded border-black/20 text-black focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="planVigenteCheckModal"
                    className="text-xs font-sans text-black/80 font-medium cursor-pointer"
                  >
                    Plan Vigente (mostrar en catálogo ofertado)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="planPagoAnticipadoCheckModal"
                    checked={planPagoAnticipado}
                    onChange={(e) => setPlanPagoAnticipado(e.target.checked)}
                    className="rounded border-amber-400 text-amber-600 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="planPagoAnticipadoCheckModal"
                    className="text-xs font-sans text-amber-900 font-medium cursor-pointer flex items-center gap-1"
                  >
                    <span>⚡ Requiere Pago Anticipado (Garantizar pago antes de enviar activación)</span>
                  </label>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-sans text-black/60 hover:text-black transition-colors cursor-pointer"
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
