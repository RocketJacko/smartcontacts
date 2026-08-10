"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { BookingSection } from "@/components/booking-section"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"

export default function AgendarPage() {
  const { language } = useLanguage()

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-0">
      <MobileNav />

      {/* Hero Header */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 mb-4 sm:mb-8 flex flex-col items-center">
        <PixelIcon type="pricing" size={40} />
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
          {language === "es" ? "AGENDAMIENTO DIRECTO" : "DIRECT BOOKING"}
        </span>
        
        <RevealText className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#111] leading-tight">
          {language === "es" 
            ? "Reserva tu Diagnóstico Comercial & Operativo" 
            : "Schedule your Commercial & Operational Diagnosis"}
        </RevealText>

        <p className="text-sm sm:text-base md:text-lg text-black/70 max-w-2xl mx-auto leading-relaxed">
          {language === "es"
            ? "Selecciona la fecha y hora disponible. Analizaremos tu modelo de ventas, flujos documentales y la viabilidad de activar un canal agéntico para tu empresa."
            : "Select an available date and time. We'll analyze your sales model, document workflows, and agentic channel feasibility."}
        </p>
      </section>

      {/* Full Booking Calendar Component */}
      <BookingSection />

      <Footer />
    </main>
  )
}
