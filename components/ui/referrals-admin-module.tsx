"use client"

import React, { useState, useEffect } from "react"
import {
  Users,
  Share2,
  DollarSign,
  TrendingUp,
  Plus,
  Copy,
  Check,
  Search,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  CreditCard,
  Building,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Percent,
} from "lucide-react"
import { Afiliado, ConversionReferido } from "@/lib/domain/entities/referral"

export function ReferralsAdminModule() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([])
  const [conversiones, setConversiones] = useState<ConversionReferido[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"afiliados" | "conversiones" | "liquidaciones">("afiliados")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [selectedAfiliadoForPayout, setSelectedAfiliadoForPayout] = useState<Afiliado | null>(null)
  const [payoutReference, setPayoutReference] = useState("")
  const [payoutNotes, setPayoutNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulario nuevo afiliado
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    codigoDeseado: "",
    banco: "Bancolombia",
    tipoCuenta: "ahorros" as "ahorros" | "corriente" | "billetera_digital",
    numeroCuenta: "",
    titularCuenta: "",
    numeroDocumento: "",
  })

  // Carga de datos
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [resAfiliados, resConversiones] = await Promise.all([
        fetch("/api/referrals/affiliates"),
        fetch("/api/referrals/conversions"),
      ])

      const dataAfiliados = await resAfiliados.json()
      const dataConversiones = await resConversiones.json()

      if (dataAfiliados.success) setAfiliados(dataAfiliados.afiliados || [])
      if (dataConversiones.success) setConversiones(dataConversiones.conversiones || [])
    } catch {
      // Manejo silencioso
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Métricas consolidadas
  const totalClics = afiliados.reduce((acc, a) => acc + (a.enlacePrincipal?.clicsTotales || 0), 0)
  const totalAgendados = afiliados.reduce((acc, a) => acc + a.totalReferidosAgendados, 0)
  const totalCerrados = afiliados.reduce((acc, a) => acc + a.totalReferidosCerrados, 0)
  const totalSaldoPendiente = afiliados.reduce((acc, a) => acc + a.saldoPendiente, 0)
  const totalSaldoLiquidado = afiliados.reduce((acc, a) => acc + a.saldoLiquidado, 0)

  // Copiar enlace al portapapeles
  const handleCopyLink = (codigo: string) => {
    const fullUrl = `${window.location.origin}/?ref=${codigo}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedCode(codigo)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  // Crear afiliado
  const handleCreateAfiliado = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/referrals/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          codigoDeseado: formData.codigoDeseado,
          datosPago: {
            banco: formData.banco,
            tipoCuenta: formData.tipoCuenta,
            numeroCuenta: formData.numeroCuenta,
            titularCuenta: formData.titularCuenta || formData.nombre,
            numeroDocumento: formData.numeroDocumento,
          },
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Afiliado y enlace generados con éxito.")
        setIsCreateModalOpen(false)
        setFormData({
          nombre: "",
          email: "",
          telefono: "",
          codigoDeseado: "",
          banco: "Bancolombia",
          tipoCuenta: "ahorros",
          numeroCuenta: "",
          titularCuenta: "",
          numeroDocumento: "",
        })
        loadData()
      } else {
        alert(data.error || "No se pudo registrar el afiliado.")
      }
    } catch {
      alert("Error en el registro del afiliado.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Procesar liquidación
  const handleProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAfiliadoForPayout || !payoutReference) return
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/referrals/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          afiliadoId: selectedAfiliadoForPayout.id,
          monto: selectedAfiliadoForPayout.saldoPendiente,
          referenciaBancaria: payoutReference,
          comprobanteUrl: payoutNotes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        alert("Liquidación procesada y saldo actualizado.")
        setIsPayoutModalOpen(false)
        setPayoutReference("")
        setPayoutNotes("")
        loadData()
      } else {
        alert(data.error || "No se pudo procesar la liquidación.")
      }
    } catch {
      alert("Error procesando liquidación.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── HEADER CON ACCIÓN PRINCIPAL ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-black/[0.08] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-semibold text-[#111]">
              Programa de Enlaces de Referidos & Liquidaciones
            </h2>
          </div>
          <p className="text-xs text-black/60 mt-0.5">
            Gestión de aliados comerciales, atribución en citas de consultoría y corte de comisiones para liquidación.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-black/10 hover:bg-black/5 text-black/60 transition-colors cursor-pointer"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>NUEVO AFILIADO</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS (DESIGN.MD STANDARD PATTERN) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase font-bold">Afiliados</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold font-mono text-[#111]">{afiliados.length}</p>
          <span className="text-[10px] text-emerald-600 font-mono flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activos
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase font-bold">Clics Totales</span>
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold font-mono text-[#111]">{totalClics}</p>
          <span className="text-[10px] text-black/50 font-mono">Ventana 45 días</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase font-bold">Citas Agendadas</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl font-bold font-mono text-[#111]">{totalAgendados}</p>
          <span className="text-[10px] text-black/50 font-mono">En calendario</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase font-bold">Cierres / Adquiridos</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700">{totalCerrados}</p>
          <span className="text-[10px] text-emerald-600 font-mono font-semibold">Comisión aprobada</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-2xs space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-black/40">
            <span className="text-[10px] font-mono uppercase font-bold">Por Liquidar</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-amber-700">
            ${totalSaldoPendiente.toLocaleString("es-CO")}
          </p>
          <span className="text-[10px] text-black/50 font-mono">
            Liquidado: ${totalSaldoLiquidado.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* ── SUBNAV TABS ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-black/[0.08] pb-1 font-mono text-xs">
        <button
          onClick={() => setActiveTab("afiliados")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "afiliados"
              ? "bg-[#111] text-white font-bold shadow-2xs"
              : "text-black/60 hover:text-[#111] hover:bg-black/5"
          }`}
        >
          Afiliados & Enlaces ({afiliados.length})
        </button>

        <button
          onClick={() => setActiveTab("conversiones")}
          className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === "conversiones"
              ? "bg-[#111] text-white font-bold shadow-2xs"
              : "text-black/60 hover:text-[#111] hover:bg-black/5"
          }`}
        >
          Conversiones & Citas ({conversiones.length})
        </button>
      </div>

      {/* ── TAB 1: AFILIADOS & ENLACES ─────────────────────────────────────── */}
      {activeTab === "afiliados" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#F5F4F0] border-b border-black/[0.07] text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
                  <th className="py-3 px-4">Afiliado</th>
                  <th className="py-3 px-4">Código & Enlace de Referido</th>
                  <th className="py-3 px-4 text-center">Clics</th>
                  <th className="py-3 px-4 text-center">Agendados</th>
                  <th className="py-3 px-4 text-center">Cerrados</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/[0.05]">
                {afiliados.length > 0 ? (
                  afiliados.map((a) => {
                    const codigo = a.enlacePrincipal?.codigoReferido || "SIN-CODIGO"
                    return (
                      <tr key={a.id} className="hover:bg-black/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#111]">{a.nombre}</span>
                            <span className="text-[11px] text-black/50 font-mono">{a.email}</span>
                            {a.telefono && <span className="text-[10px] text-black/40 font-mono">{a.telefono}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#F5F4F0] border border-black/10 font-mono font-bold text-[11px] text-[#111]">
                              {codigo}
                            </span>
                            <button
                              onClick={() => handleCopyLink(codigo)}
                              className="p-1.5 rounded-lg border border-black/10 hover:bg-black/5 text-black/60 transition-colors cursor-pointer"
                              title="Copiar enlace"
                            >
                              {copiedCode === codigo ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-black/70">
                          {a.enlacePrincipal?.clicsTotales || 0}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-black/70">
                          {a.totalReferidosAgendados}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {a.totalReferidosCerrados}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#111]">
                          <span className={a.saldoPendiente > 0 ? "text-amber-700" : "text-black/40"}>
                            ${a.saldoPendiente.toLocaleString("es-CO")}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedAfiliadoForPayout(a)
                              setIsPayoutModalOpen(true)
                            }}
                            disabled={a.saldoPendiente <= 0}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-mono font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Liquidar
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-black/40 font-mono text-xs">
                      No hay afiliados registrados en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CONVERSIONES & TRAZABILIDAD ──────────────────────────────── */}
      {activeTab === "conversiones" && (
        <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-[#F5F4F0] border-b border-black/[0.07] text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">
                  <th className="py-3 px-4">Prospecto / Cliente</th>
                  <th className="py-3 px-4">Afiliado Beneficiario</th>
                  <th className="py-3 px-4">Atribución</th>
                  <th className="py-3 px-4 text-right">Valor Contrato</th>
                  <th className="py-3 px-4 text-right">Comisión</th>
                  <th className="py-3 px-4 text-center">Estado Liquidación</th>
                  <th className="py-3 px-4 text-right">Fecha</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black/[0.05]">
                {conversiones.length > 0 ? (
                  conversiones.map((c) => (
                    <tr key={c.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#111]">{c.prospectoNombre || "Cliente Agendado"}</span>
                          <span className="text-[11px] text-black/50 font-mono">{c.prospectoEmail || "Sin email"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#111]">{c.afiliadoNombre}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-black/[0.04] text-black/70">
                          {c.tipoAtribucion === "manual_admin" ? "Manual B2B" : "Cookie"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-black/70">
                        ${c.montoTransaccion.toLocaleString("es-CO")}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ${c.valorComisionCalculado.toLocaleString("es-CO")}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            c.estadoLiquidacion === "liquidada"
                              ? "bg-purple-100 text-purple-800"
                              : c.estadoLiquidacion === "aprobada"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.estadoLiquidacion === "rechazada_autoreferido"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {c.estadoLiquidacion.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-black/40 text-[11px]">
                        {new Date(c.creadoEn).toLocaleDateString("es-CO")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-black/40 font-mono text-xs">
                      No hay registros de conversiones asociadas aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVO AFILIADO ─────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-black/15 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-black/[0.08]">
              <h3 className="text-sm font-semibold text-[#111]">Registrar Nuevo Afiliado & Generar Enlace</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAfiliado} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej. Carolina Montoya"
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
                    placeholder="carolina@empresa.com"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Celular / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Código Preferido (Opcional)</label>
                  <input
                    type="text"
                    value={formData.codigoDeseado}
                    onChange={(e) => setFormData({ ...formData, codigoDeseado: e.target.value.toUpperCase() })}
                    placeholder="CAROLINA24"
                    className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono uppercase outline-none focus:border-black/30"
                  />
                </div>
              </div>

              {/* SECCIÓN DATOS BANCARIOS */}
              <div className="p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-2">
                <span className="text-[10px] font-mono font-bold text-black/50 uppercase flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-emerald-600" />
                  Datos Bancarios para Liquidaciones
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-mono text-black/40 block">Banco</label>
                    <input
                      type="text"
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      placeholder="Bancolombia"
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-black/40 block">Tipo Cuenta</label>
                    <select
                      value={formData.tipoCuenta}
                      onChange={(e: any) => setFormData({ ...formData, tipoCuenta: e.target.value })}
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs outline-none font-mono"
                    >
                      <option value="ahorros">Ahorros</option>
                      <option value="corriente">Corriente</option>
                      <option value="billetera_digital">Billetera (Nequi/Davi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] font-mono text-black/40 block">Número Cuenta</label>
                    <input
                      type="text"
                      value={formData.numeroCuenta}
                      onChange={(e) => setFormData({ ...formData, numeroCuenta: e.target.value })}
                      placeholder="000-000000-00"
                      className="w-full px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs font-mono outline-none"
                    />
                  </div>
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
                  {isSubmitting ? "Creando..." : "Crear Afiliado & Enlace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: LIQUIDACIÓN DE SALDO ────────────────────────────────────── */}
      {isPayoutModalOpen && selectedAfiliadoForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-black/15 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-150">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-black/[0.08]">
              <h3 className="text-sm font-semibold text-[#111]">Liquidar Comisiones Pendientes</h3>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessPayout} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-[#F5F4F0] border border-black/[0.06] space-y-1 font-mono">
                <span className="text-[10px] text-black/40 uppercase block">Afiliado Beneficiario</span>
                <p className="font-bold text-[#111]">{selectedAfiliadoForPayout.nombre}</p>
                <p className="text-lg font-bold text-emerald-700">
                  Monto a Liquidar: ${selectedAfiliadoForPayout.saldoPendiente.toLocaleString("es-CO")} COP
                </p>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  Número de Referencia Bancaria / Transferencia *
                </label>
                <input
                  required
                  type="text"
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  placeholder="Ej. TRANSF-BCOL-8492048"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono outline-none focus:border-black/30"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">
                  URL Comprobante o Nota de Pago (Opcional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="https://storage... o nota de cierre"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                />
              </div>

              <div className="pt-3 border-t border-black/[0.08] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-medium text-black/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-mono font-bold text-white shadow-xs"
                >
                  {isSubmitting ? "Procesando..." : "Confirmar Pago & Liquidar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
