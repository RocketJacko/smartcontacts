"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { AboutSection } from "@/components/about-section"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { User, ArrowRight, Award, Briefcase, Code } from "lucide-react"

export default function SobreMiPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8 sm:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          <User className="w-3.5 h-3.5 text-black/70" />
          {language === "es" ? "LIDERAZGO Y EXPERIENCIA COMERCIAL" : "LEADERSHIP & COMMERCIAL EXPERIENCE"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "Jesús Carmona" 
            : "Jesús Carmona"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Mas de 10 años dirigiendo equipos de ventas en crédito de libranzas y servicios de salud, combinados con ingeniería de software para automatizar procesos comerciales y documentales."
            : "Over 10 years leading sales teams in payroll credit and healthcare services, combined with software engineering to automate sales and documental workflows."}
        </p>
      </section>

      {/* Executive About Component */}
      <AboutSection />

      {/* Highlights Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-xs space-y-2">
            <Briefcase className="w-6 h-6 text-black/70 mb-1" />
            <h3 className="text-sm font-medium text-[#111]">
              {language === "es" ? "Sector Financiero & Libranzas" : "Financial & Payroll Loans"}
            </h3>
            <p className="text-xs text-black/65 leading-relaxed">
              {language === "es"
                ? "Dirección comercial en bancas, cooperativas y entidades de libranza con segmentación Ley 1527."
                : "Commercial leadership in banks, cooperatives, and payroll entities with Ley 1527 regulations."}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-xs space-y-2">
            <Award className="w-6 h-6 text-black/70 mb-1" />
            <h3 className="text-sm font-medium text-[#111]">
              {language === "es" ? "Sector Salud & Asistencias" : "Healthcare & Assistance Services"}
            </h3>
            <p className="text-xs text-black/65 leading-relaxed">
              {language === "es"
                ? "Venta masiva outbound de planes complementarios, medicina domiciliaria y atención asistida."
                : "Outbound mass commercialization of complementary healthcare and home medical assistance."}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-xs space-y-2">
            <Code className="w-6 h-6 text-black/70 mb-1" />
            <h3 className="text-sm font-medium text-[#111]">
              {language === "es" ? "Desarrollo Agéntico & IA" : "Agentic Software Engineering"}
            </h3>
            <p className="text-xs text-black/65 leading-relaxed">
              {language === "es"
                ? "Ingeniería de software enfocada en RAG, agentes de WhatsApp y automatizaciones documentales."
                : "Software engineering focused on RAG, WhatsApp AI agents, and documental workflow automation."}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
        <div className="p-8 rounded-2xl border border-black/[0.08] bg-white shadow-xs space-y-4">
          <h2 className="text-xl sm:text-2xl font-medium text-[#111]">
            {language === "es" ? "¿Hablamos de cómo automatizar tu canal comercial?" : "Let's discuss automating your sales channel"}
          </h2>
          <div className="pt-2">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all font-medium"
            >
              {language === "es" ? "AGENDAR CITA DIRECTA" : "SCHEDULE DIRECT CALL"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
