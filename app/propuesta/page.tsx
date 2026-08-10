"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { StackingPlatformCards } from "@/components/stacking-platform-cards"
import { StackingAgentCards } from "@/components/stacking-agent-cards"
import { MethodologySection } from "@/components/methodology-section"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function PropuestaPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          {language === "es" ? "PROPUESTA DE VALOR & TECNOLOGÍA AGÉNTICA" : "VALUE PROPOSITION & AGENTIC TECH"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "No reemplazamos tu departamento comercial. Creamos tu nueva unidad de crecimiento." 
            : "We don't replace your sales team. We build your new growth unit."}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Combinamos inteligencia de datos con +200k contactos perfilados, arquitectura agéntica de IA con RAG sobre la voz de tu marca, y automatización documental continua."
            : "We combine data intelligence (+200k contacts), agentic AI architecture with RAG trained on your brand voice, and continuous workflow automation."}
        </p>
      </section>

      {/* 1. Stacking Platform Cards */}
      <section id="platform" className="mb-16">
        <StackingPlatformCards />
      </section>

      {/* 2. Stacking Agent Cards */}
      <section id="agentes" className="mb-16">
        <StackingAgentCards />
      </section>

      {/* 3. Deep-dive Technology Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl border border-black/[0.08] bg-white p-8 sm:p-12 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-black/40 font-semibold">
              {language === "es" ? "ARQUITECTURA DE IA" : "AI ARCHITECTURE"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#111]">
              {language === "es" ? "Respuesta exacta y cero improvisación humana" : "Exact response with zero human improvisation"}
            </h2>
            <p className="text-xs sm:text-sm text-black/70 leading-relaxed">
              {language === "es"
                ? "Nuestros agentes operan bajo modelos de RAG (Retrieval-Augmented Generation) conectados a la base de conocimiento de tu empresa. Jamás inventan información ni ofrecen ofertas fuera de norma."
                : "Our agents operate under RAG (Retrieval-Augmented Generation) connected to your company's knowledge base. They never hallucinate info or make unauthorized offers."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-black/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black/80">
                <PixelIcon type="integrations" size={24} />
              </div>
              <h3 className="text-sm font-medium text-[#111]">
                {language === "es" ? "Datos & Cartera Propia" : "Data & Proprietary Database"}
              </h3>
              <p className="text-xs text-black/60 leading-relaxed">
                {language === "es" 
                  ? "Prospectamos sobre nuestra base de datos nacional perfilada por actividad económica, ubicación y capacidad."
                  : "We prospect over our national profiled database categorized by economic activity, location, and capacity."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-black/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black/80">
                <PixelIcon type="workflow" size={24} />
              </div>
              <h3 className="text-sm font-medium text-[#111]">
                {language === "es" ? "Procesos Documentales" : "Documental Workflows"}
              </h3>
              <p className="text-xs text-black/60 leading-relaxed">
                {language === "es"
                  ? "Lectura automática de cédulas, libranzas, desprendibles de pago y validación de expedientes sin trabajo manual."
                  : "Automated OCR extraction of IDs, payroll slips, documents, and compliance verification without human manual labor."}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-black/[0.06] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-black/80">
                <PixelIcon type="agents" size={24} />
              </div>
              <h3 className="text-sm font-medium text-[#111]">
                {language === "es" ? "Seguridad & Cierre" : "Security & Conversion"}
              </h3>
              <p className="text-xs text-black/60 leading-relaxed">
                {language === "es"
                  ? "Manejo estructurado de objeciones comerciales, envío de links oficiales de pago y agendamiento asistido."
                  : "Structured objection handling, official payment link dispatching, and automated calendar scheduling."}
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all shadow-sm font-medium"
            >
              {language === "es" ? "AGENDAR DIAGNÓSTICO COMERCIAL" : "SCHEDULE COMMERCIAL DIAGNOSIS"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <MethodologySection />

      <Footer />
    </main>
  )
}
