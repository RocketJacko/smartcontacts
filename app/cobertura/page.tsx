"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { ColombiaMapSection } from "@/components/colombia-map-section"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { MapPin, ArrowRight } from "lucide-react"

export default function CoberturaPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8 sm:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          <MapPin className="w-3.5 h-3.5 text-black/70" />
          {language === "es" ? "INTELIGENCIA DE DATOS NACIONAL" : "NATIONAL DATA INTELLIGENCE"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "Base de Datos Propia de Cobertura Nacional" 
            : "Proprietary Database with National Coverage"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Explora nuestra segmentación por departamentos. Prospectamos activamente sobre personas naturales y jurídicas con capacidad comercial y perfilamiento especializado."
            : "Explore our departmental segmentation. We actively prospect natural and legal entities with commercial capacity."}
        </p>
      </section>

      {/* Interactive Vector Map Section */}
      <ColombiaMapSection />

      {/* Bottom Action CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-center">
        <div className="p-8 rounded-2xl border border-black/[0.08] bg-white shadow-xs space-y-4">
          <h2 className="text-xl sm:text-2xl font-medium text-[#111]">
            {language === "es" ? "¿Quieres prospectar sobre tu departamento objetivo?" : "Want to prospect in your target region?"}
          </h2>
          <p className="text-xs sm:text-sm text-black/70 max-w-xl mx-auto">
            {language === "es"
              ? "Instalamos nuestro canal agéntico sobre tu zona geográfica o pagaduría de interés en menos de 48 horas."
              : "We launch our agentic channel in your geographic target or payroll entity in less than 48 hours."}
          </p>
          <div className="pt-2">
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/80 transition-all font-medium"
            >
              {language === "es" ? "ACTIVAR CANAL REGIONAL" : "ACTIVATE REGIONAL CHANNEL"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
