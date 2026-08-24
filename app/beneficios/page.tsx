"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { BenefitsSection } from "@/components/benefits-section"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"

export default function BeneficiosPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      {/* Header Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-8 sm:mb-12">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          {language === "es" ? "CATÁLOGO DE BENEFICIOS EXCLUSIVOS" : "EXCLUSIVE BENEFITS CATALOG"}
        </span>

        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es"
            ? "Beneficios & Productos Disponibles"
            : "Available Benefits & Products"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-3xl mx-auto leading-relaxed">
          {language === "es"
            ? "Accede a tarifas preferenciales y herramientas de formación profesional integradas para potenciar las capacidades de tu equipo."
            : "Access preferential rates and integrated professional training tools to empower your team."}
        </p>
      </section>

      {/* Benefits Catalog List */}
      <BenefitsSection />

      <Footer />
    </main>
  )
}
