"use client"

import React, { useState } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import {
  Share2,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Search,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react"
import { Afiliado } from "@/lib/domain/entities/referral"

export default function ReferidosPublicPage() {
  const { language } = useLanguage()
  const [searchCode, setSearchCode] = useState("")
  const [afiliadoData, setAfiliadoData] = useState<Afiliado | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [copied, setCopied] = useState(false)

  // Formulario nuevo afiliado
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [banco, setBanco] = useState("Bancolombia")
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [tipoCuenta, setTipoCuenta] = useState("ahorros")
  const [isRegistering, setIsRegistering] = useState(false)
  const [registerSuccess, setRegisterSuccess] = useState<Afiliado | null>(null)

  // Consultar afiliado por código
  const handleSearchAfiliado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchCode.trim()) return
    setIsSearching(true)
    setSearchError("")
    setAfiliadoData(null)

    try {
      const res = await fetch(`/api/referrals/affiliates?codigo=${encodeURIComponent(searchCode.trim())}`)
      const data = await res.json()
      if (data.success && data.afiliado) {
        setAfiliadoData(data.afiliado)
      } else {
        setSearchError(data.error || "No encontramos ningún aliado con ese código.")
      }
    } catch {
      setSearchError("Error consultando el código de aliado.")
    } finally {
      setIsSearching(false)
    }
  }

  // Registrarse como nuevo afiliado
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    try {
      const res = await fetch("/api/referrals/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          telefono,
          datosPago: {
            banco,
            tipoCuenta,
            numeroCuenta,
            titularCuenta: nombre,
          },
        }),
      })

      const data = await res.json()
      if (data.success && data.afiliado) {
        setRegisterSuccess(data.afiliado)
        setAfiliadoData(data.afiliado)
      } else {
        alert(data.error || "No se pudo completar el registro.")
      }
    } catch {
      alert("Error en el registro.")
    } finally {
      setIsRegistering(false)
    }
  }

  const activeLink = afiliadoData?.enlacePrincipal?.codigoReferido
    ? `${typeof window !== "undefined" ? window.location.origin : "https://smartcontacts.cloud"}/?ref=${afiliadoData.enlacePrincipal.codigoReferido}`
    : ""

  const handleCopyLink = () => {
    if (!activeLink) return
    navigator.clipboard.writeText(activeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-12 sm:mb-16">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono tracking-widest text-black/50 bg-black/[0.04] border border-black/[0.06] uppercase">
          PROGRAMA DE ALIADOS & TRABAJA CON NOSOTROS
        </span>

        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-[#111] leading-tight">
          Refiere Nuestros Servicios y Genera Comisiones Directas
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/60 max-w-2xl mx-auto leading-relaxed font-light">
          Comparte tu enlace exclusivo con empresas que necesiten multiplicar sus ventas con nuestra fuerza de prospección y agentes de IA. Gana comisiones garantizadas por cada contrato cerrado.
        </p>
      </section>

      {/* ── CONSULTA DE ESTADÍSTICAS POR CÓDIGO ──────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.07] shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
            <h2 className="text-xs font-mono font-medium uppercase tracking-widest text-black/70">
              Consultar Estadísticas y Saldo de Aliado
            </h2>
          </div>

          <form onSubmit={handleSearchAfiliado} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
              placeholder="Ingresa tu código de aliado (ej. CAROLINA-1024)..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F4F0] border border-black/10 font-mono text-xs uppercase outline-none focus:border-black/30"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {isSearching ? "BUSCANDO..." : "CONSULTAR"}
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-mono">
              {searchError}
            </p>
          )}

          {/* DATOS DEL AFILIADO CONSULTADO */}
          {afiliadoData && (
            <div className="pt-4 border-t border-black/[0.06] space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-[#111]">{afiliadoData.nombre}</h3>
                  <p className="text-xs text-black/50 font-mono">Aliado Comercial Activo</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#F5F4F0] px-3 py-1 rounded-lg border border-black/10">
                    {afiliadoData.enlacePrincipal?.codigoReferido}
                  </span>
                </div>
              </div>

              {/* COPIAR ENLACE */}
              <div className="p-3.5 rounded-2xl bg-[#F5F4F0] border border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-mono truncate w-full sm:w-auto">
                  <span className="text-black/50 block text-[10px] uppercase font-bold">Tu Enlace Personalizado:</span>
                  <span className="text-[#111] font-semibold">{activeLink}</span>
                </div>
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111] text-white text-xs font-mono font-bold hover:bg-black/80 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "COPIADO" : "COPIAR ENLACE"}</span>
                </button>
              </div>

              {/* MÉTRICAS DE IMPACTO */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-white border border-black/[0.07] text-center space-y-0.5">
                  <span className="text-[10px] font-mono text-black/40 uppercase block">Clics</span>
                  <p className="text-lg font-bold font-mono text-[#111]">
                    {afiliadoData.enlacePrincipal?.clicsTotales || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-black/[0.07] text-center space-y-0.5">
                  <span className="text-[10px] font-mono text-black/40 uppercase block">Agendados</span>
                  <p className="text-lg font-bold font-mono text-[#111]">
                    {afiliadoData.totalReferidosAgendados}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-black/[0.07] text-center space-y-0.5">
                  <span className="text-[10px] font-mono text-black/40 uppercase block">Cerrados</span>
                  <p className="text-lg font-bold font-mono text-emerald-700">
                    {afiliadoData.totalReferidosCerrados}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-black/[0.07] text-center space-y-0.5">
                  <span className="text-[10px] font-mono text-black/40 uppercase block">Saldo Pendiente</span>
                  <p className="text-lg font-bold font-mono text-amber-700">
                    ${afiliadoData.saldoPendiente.toLocaleString("es-CO")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FORMULARIO: REGÍSTRATE COMO NUEVO ALIADO ────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 mb-16">
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-black/[0.07] shadow-2xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-black/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
            <h2 className="text-xs font-mono font-medium uppercase tracking-widest text-black/70">
              Registro Rápido de Nuevo Aliado Comercial
            </h2>
          </div>

          {registerSuccess ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <Check className="w-8 h-8 text-emerald-700 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900 font-mono">¡REGISTRO COMPLETADO CON ÉXITO!</h3>
              <p className="text-xs text-emerald-800">
                Tu código generado es:{" "}
                <span className="font-mono font-bold text-black">{registerSuccess.enlacePrincipal?.codigoReferido}</span>
              </p>
              <p className="text-[11px] text-emerald-700">
                Ya puedes usar el buscador superior para consultar tus estadísticas y compartir tu enlace.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Tu Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Juan Sebastián Gómez"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Correo Electrónico *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@empresa.com"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">WhatsApp / Celular *</label>
                  <input
                    required
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Banco para Liquidación *</label>
                  <input
                    required
                    type="text"
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    placeholder="Bancolombia, Davivienda, Nequi..."
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs outline-none focus:border-black/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-black/50 uppercase block mb-1">Número de Cuenta para Transferencias *</label>
                <input
                  required
                  type="text"
                  value={numeroCuenta}
                  onChange={(e) => setNumeroCuenta(e.target.value)}
                  placeholder="Número de cuenta de ahorros o celular Nequi"
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono outline-none focus:border-black/30"
                />
              </div>

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3.5 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all shadow-md cursor-pointer mt-2"
              >
                {isRegistering ? "REGISTRANDO..." : "OBTENER MI ENLACE DE ALIADO COMERCIAL"}
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
