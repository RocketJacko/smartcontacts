"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { Check, ArrowRight, Layers, Settings2, UserCheck } from "lucide-react"

export default function ModalidadesPage() {
  const { language, t } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          <Layers className="w-3.5 h-3.5 text-black/70" />
          {language === "es" ? "MODALIDADES DE TRABAJO & IMPLEMENTACIÓN" : "WORKING MODALITIES & DEPLOYMENT"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "Dos formas flexibles de activar tu canal comercial" 
            : "Two flexible ways to activate your sales channel"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Elige si deseas que ejecutemos el canal de forma externa sin tocar tu nómina o si prefieres instalar los agentes y flujos dentro de tu empresa."
            : "Choose whether you want us to run the channel externally without expanding payroll or install agents and workflows in-house."}
        </p>
      </section>

      {/* Pricing / Modalities Comparison */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 xl:gap-12 items-stretch">
          
          {/* Card 1: Delegado / Canal Externo */}
          <div className="group relative rounded-3xl border border-black/[0.08] bg-white p-8 sm:p-10 lg:p-12 shadow-sm flex flex-col justify-between hover:border-black/30 lg:hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-black/[0.04] border border-black/10 flex items-center justify-center text-black/80">
                  <UserCheck className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                  {language === "es" ? "RECOMENDADO" : "RECOMMENDED"}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-medium text-[#111] tracking-tight mb-1">
                  {language === "es" ? "Canal Externo Delegado" : "External Delegated Channel"}
                </h3>
                <p className="text-xs text-black/60 font-mono uppercase tracking-wider">
                  {language === "es" ? "Comercialización Directa sobre Resultados" : "Direct Commercialization on Results"}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-black/75 leading-relaxed">
                {language === "es"
                  ? "Nosotros sumamos la base de datos propia, la infraestructura agéntica y la supervisión comercial. Tu empresa solo recibe las citas cerradas y expedientes radicados."
                  : "We bring our own database, agentic infrastructure, and commercial management. Your team simply receives qualified leads and filed documents."}
              </p>

              <div className="pt-4 border-t border-black/[0.06] space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-black/40 font-semibold">
                  {language === "es" ? "INCLUYE:" : "INCLUDES:"}
                </span>
                <ul className="space-y-2.5">
                  {[
                    language === "es" ? "Contacto directo sobre datos propios perfilados" : "Direct contact over profiled proprietary data",
                    language === "es" ? "Presentación de oferta y manejo de objeciones por IA" : "AI offer presentation and objection handling",
                    language === "es" ? "Lectura y validación automática de documentos" : "Automated OCR document reading & validation",
                    language === "es" ? "Agendamiento asistido directo a tu calendario" : "Direct calendar integration and appointment booking",
                    language === "es" ? "Cero costos de nómina fija o indemnizaciones" : "Zero fixed payroll costs or severance liabilities",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-black/80">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/agendar"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all font-medium"
              >
                {language === "es" ? "SOLICITAR CANAL DELEGADO" : "REQUEST DELEGATED CHANNEL"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: In-House / Instalación */}
          <div className="group relative rounded-3xl border border-black/[0.08] bg-[#FAF9F6] p-8 sm:p-10 lg:p-12 shadow-sm flex flex-col justify-between hover:border-black/30 lg:hover:-translate-y-1 transition-all duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black/80">
                  <Settings2 className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full bg-black/[0.04] text-black/70 border border-black/10 font-semibold">
                  IN-HOUSE
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-medium text-[#111] tracking-tight mb-1">
                  {language === "es" ? "Implementación In-House" : "In-House System Setup"}
                </h3>
                <p className="text-xs text-black/60 font-mono uppercase tracking-wider">
                  {language === "es" ? "Instalación en tu Infraestructura" : "Installation in your Infrastructure"}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-black/75 leading-relaxed">
                {language === "es"
                  ? "Desarrollamos e instalamos la arquitectura de agentes, flujos documentales e integraciones directamente en los servidores o CRM de tu empresa."
                  : "We build and deploy the agent architecture, document workflows, and integrations directly into your company's servers or CRM."}
              </p>

              <div className="pt-4 border-t border-black/[0.06] space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-black/40 font-semibold">
                  {language === "es" ? "INCLUYE:" : "INCLUDES:"}
                </span>
                <ul className="space-y-2.5">
                  {[
                    language === "es" ? "Conexión sobre la cartera y leads entrantes de tu empresa" : "Integration over your existing database and inbound leads",
                    language === "es" ? "Entrenamiento RAG con la base de conocimiento interna" : "RAG model training with internal knowledge base",
                    language === "es" ? "Flujos n8n / Make automatizados de radicación documental" : "Automated n8n / Make document processing workflows",
                    language === "es" ? "Integración vía API con WhatsApp, CRM y ERP actual" : "API integration with WhatsApp, CRM, and current ERP",
                    language === "es" ? "Capacitación a tu equipo comercial e infraestructura propia" : "Sales team onboarding and full proprietary infrastructure",
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-black/80">
                      <Check className="w-4 h-4 text-black/70 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/agendar"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-black/15 bg-white text-[#111] text-xs font-mono tracking-widest uppercase hover:bg-black/[0.04] transition-all font-medium"
              >
                {language === "es" ? "COTIZAR PROYECTO IN-HOUSE" : "QUOTE IN-HOUSE SETUP"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
