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
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-20 pb-16">
      <MobileNav />

      {/* Clean Interactive Vector Map Section */}
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
