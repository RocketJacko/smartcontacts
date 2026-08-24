"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { StackingPlatformCards } from "@/components/stacking-platform-cards"
import { StackingAgentCards } from "@/components/stacking-agent-cards"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

export default function ServiciosPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          {language === "es" ? "SERVICIOS & SOLUCIONES COMERCIALES" : "COMMERCIAL SERVICES & SOLUTIONS"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "Servicios de Comercialización Directa & Agentes de IA" 
            : "Direct Commercialization & AI Agent Services"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Apoyamos a tu empresa comercializando tus productos y servicios directamente a clientes finales (B2C) y empresas (B2B) sobre nuestra propia base de datos perfilada."
            : "We support your company by commercializing your products and services directly to end customers (B2C) and businesses (B2B) on our proprietary database."}
        </p>
      </section>

      {/* Value Proposition Cards */}
      <section id="servicios-cards" className="mb-16">
        <StackingPlatformCards />
      </section>

      {/* Agents System */}
      <section id="agentes-servicios" className="mb-16">
        <StackingAgentCards />
      </section>

      {/* CTA Button */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl border border-black/[0.08] bg-white shadow-sm space-y-6 flex flex-col items-center">
          <h2 className="text-2xl sm:text-4xl font-medium text-[#111]">
            {language === "es" ? "¿Listo para activar tu unidad de crecimiento?" : "Ready to activate your growth unit?"}
          </h2>
          <p className="text-xs sm:text-sm text-black/70 max-w-xl mx-auto">
            {language === "es"
              ? "Agenda una cita para diagnosticar tu modelo comercial y estructurar la prospección activa de tu marca."
              : "Schedule a call to diagnose your sales model and structure active prospecting for your brand."}
          </p>
          <Link
            href="/#agendar"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all font-semibold shadow-md"
          >
            <span>{language === "es" ? "AGENDAR CITA" : "SCHEDULE CALL"}</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
