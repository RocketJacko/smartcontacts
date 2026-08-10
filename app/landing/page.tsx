"use client"

import React, { useState } from "react"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Database, FileText, Cpu, Phone, Building, User, Mail, Loader2 } from "lucide-react"

export default function DirectLandingPage() {
  const { language } = useLanguage()

  const [formState, setFormState] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    sector: "financiero",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email || "no-provided@smartcontacts.co",
          phone: formState.phone,
          company: `${formState.company} (${formState.sector})`,
          service: "Landing Campaign Lead",
          date: new Date().toISOString(),
          timeSlot: "Asap",
        }),
      })

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        setIsSubmitted(true)
      }
    } catch {
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10 sm:space-y-16">

        {/* Brand Header */}
        <header className="flex items-center justify-between border-b border-black/[0.08] pb-4">
          <div className="font-pixel text-xs tracking-[0.25em] text-black/90">
            SMARTCONTACTS
          </div>
          <span className="text-[10px] font-mono tracking-widest text-emerald-800 uppercase px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/60 font-semibold">
            ● UNIDAD DE CRECIMIENTO AGÉNTICA
          </span>
        </header>

        {/* Main Hero & Lead Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: High Impact Value Proposition */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono text-black/60 bg-white border border-black/10 uppercase tracking-widest font-medium shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-black/70" />
              {language === "es" ? "AUTOMATIZACIÓN COMERCIAL & DOCUMENTAL" : "SALES & DOCUMENT AUTOMATION"}
            </span>

            <RevealText className="text-3xl sm:text-5xl lg:text-5xl font-medium tracking-tight text-[#111] leading-[1.12]">
              {language === "es"
                ? "Automatizamos tus procesos comerciales y documentales con Inteligencia Artificial."
                : "We automate your sales and document processes with Artificial Intelligence."}
            </RevealText>

            <p className="text-sm sm:text-base text-black/80 font-normal leading-relaxed">
              {language === "es"
                ? "Escala la prospección, el cierre de ventas y la validación de documentos sin aumentar tu nómina fija. Operamos sobre nuestra propia base de datos nacional perfilada o sobre la cartera de tu empresa."
                : "Scale prospecting, sales closing, and document validation without increasing fixed payroll. We operate on our proprietary national database or your own client portfolio."}
            </p>

            {/* 3 Core Value Cards */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#111] uppercase tracking-wide font-mono">
                    {language === "es" ? "1. Cartera Propia o de la Empresa" : "1. Proprietary or Company Database"}
                  </h4>
                  <p className="text-xs text-black/70 leading-relaxed mt-0.5">
                    {language === "es"
                      ? "Prospectamos sobre nuestra base de datos perfilada o nos conectamos a tu cartera de clientes dormidos."
                      : "We prospect on our profiled database or connect to your existing client leads."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#111] uppercase tracking-wide font-mono">
                    {language === "es" ? "2. Procesos Documentales Automáticos" : "2. Automated Document Workflows"}
                  </h4>
                  <p className="text-xs text-black/70 leading-relaxed mt-0.5">
                    {language === "es"
                      ? "Lectura de cédulas, libranzas, desprendibles de pago y validación de expedientes sin trabajo manual."
                      : "Automated reading of IDs, payroll slips, and compliance check without manual work."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-700 shrink-0 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#111] uppercase tracking-wide font-mono">
                    {language === "es" ? "3. Agentes de IA por WhatsApp" : "3. WhatsApp AI Sales Agents"}
                  </h4>
                  <p className="text-xs text-black/70 leading-relaxed mt-0.5">
                    {language === "es"
                      ? "Atención, resolución de objeciones y agendamiento 24/7 con respuesta exacta sin alucinaciones."
                      : "24/7 objection handling and appointment scheduling with exact non-hallucinated responses."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Lead Conversion Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-black/10 p-6 sm:p-8 shadow-sm">
            {isSubmitted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-medium text-[#111]">
                  {language === "es" ? "¡Solicitud Recibida!" : "Request Received!"}
                </h3>
                <p className="text-xs sm:text-sm text-black/70 leading-relaxed">
                  {language === "es"
                    ? "Nos comunicaremos contigo por WhatsApp para presentar la demostración y diagnosticar la automatización de tu empresa."
                    : "We'll contact you via WhatsApp to present the demo and diagnose your company's automation."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-center sm:text-left">
                  <h3 className="text-lg font-medium text-[#111]">
                    {language === "es" ? "Solicitar Diagnóstico Comercial" : "Request Commercial Diagnosis"}
                  </h3>
                  <p className="text-xs text-black/60 font-mono uppercase tracking-wider">
                    {language === "es" ? "Sin costo ni compromiso" : "Free & No commitment"}
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-black/70 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-black/50" />
                    {language === "es" ? "Nombre Completo" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-sans text-[#111] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-black/70 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-black/50" />
                    {language === "es" ? "WhatsApp Empresarial" : "WhatsApp Number"} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="Ej. +57 300 123 4567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-sans text-[#111] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-black/70 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-black/50" />
                    {language === "es" ? "Correo Corporativo" : "Corporate Email"}
                  </label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="juan@empresa.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-sans text-[#111] focus:outline-none focus:border-black transition-colors"
                  />
                </div>

                {/* Company & Sector */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-black/70 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-black/50" />
                      {language === "es" ? "Empresa" : "Company"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.company}
                      onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                      placeholder="Ej. Financiamos S.A."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-sans text-[#111] focus:outline-none focus:border-black transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-black/70">
                      {language === "es" ? "Sector" : "Sector"}
                    </label>
                    <select
                      value={formState.sector}
                      onChange={(e) => setFormState({ ...formState, sector: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-black/15 bg-[#FAF9F6] text-xs font-sans text-[#111] focus:outline-none focus:border-black transition-colors"
                    >
                      <option value="financiero">Crédito / Libranzas</option>
                      <option value="salud">Salud / Asistencias</option>
                      <option value="servicios">Servicios B2B</option>
                      <option value="otro">Otro Sector</option>
                    </select>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      PROCESANDO...
                    </>
                  ) : (
                    <>
                      {language === "es" ? "SOLICITAR DEMOSTRACIÓN EN VIVO" : "REQUEST LIVE DEMO"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[10px] text-black/40 text-center font-mono pt-1">
                  🔒 {language === "es" ? "Tus datos están protegidos. Cero SPAM." : "Your data is secure. Zero SPAM."}
                </p>
              </form>
            )}
          </div>

        </div>

        {/* Simple Footer */}
        <footer className="text-center pt-8 border-t border-black/[0.06] text-xs text-black/40 font-mono">
          © 2026 SmartContacts. {language === "es" ? "Todos los derechos reservados." : "All rights reserved."}
        </footer>
      </div>
    </main>
  )
}
