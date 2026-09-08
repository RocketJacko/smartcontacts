"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { BenefitsSection } from "@/components/benefits-section"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import { ShieldAlert, Lock, ArrowLeft, ExternalLink, CheckCircle2 } from "lucide-react"

export default function BeneficiosClientPage() {
  const { language } = useLanguage()
  const [hasReferral, setHasReferral] = useState<boolean | null>(null)
  const [activeCode, setActiveCode] = useState<string>("")

  useEffect(() => {
    try {
      // 1. Revisar URL search params
      const params = new URLSearchParams(window.location.search)
      const urlCode = params.get("ref") || params.get("referido")
      if (urlCode && urlCode.trim()) {
        const clean = urlCode.trim().toUpperCase()
        setActiveCode(clean)
        setHasReferral(true)
        return
      }

      // 2. Revisar localStorage
      const localCode = localStorage.getItem("sc_ref_code")
      if (localCode && localCode.trim()) {
        setActiveCode(localCode.trim().toUpperCase())
        setHasReferral(true)
        return
      }

      // 3. Revisar cookies
      const match = document.cookie.match(/(?:^|;\s*)sc_ref_code=([^;]+)/)
      if (match && match[1]) {
        const cookieCode = decodeURIComponent(match[1]).trim().toUpperCase()
        setActiveCode(cookieCode)
        setHasReferral(true)
        return
      }
    } catch {}

    setHasReferral(false)
  }, [])

  // Mientras verifica el estado en cliente
  if (hasReferral === null) {
    return (
      <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased flex items-center justify-center">
        <div className="text-xs font-mono text-black/50 animate-pulse">
          {language === "es" ? "Verificando acceso..." : "Verifying access..."}
        </div>
      </main>
    )
  }

  // ACCESO NO AUTORIZADO: Si no ingresó por un enlace de revendedor
  if (!hasReferral) {
    return (
      <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16 flex flex-col justify-between">
        <MobileNav />

        <section className="max-w-xl mx-auto px-4 sm:px-6 my-auto text-center space-y-6 py-12">
          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-black/[0.04] border border-black/10 flex items-center justify-center mx-auto shadow-xs text-black/70">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-black/60 bg-black/[0.04] border border-black/10 uppercase tracking-widest font-semibold">
              {language === "es" ? "ACCESO EXCLUSIVO POR ENLACE" : "EXCLUSIVE LINK ACCESS"}
            </span>

            <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-[#111]">
              {language === "es"
                ? "Catálogo Reservado para Invitados"
                : "Catalog Reserved for Guests"}
            </h1>

            <p className="text-xs sm:text-sm text-black/70 leading-relaxed max-w-md mx-auto">
              {language === "es"
                ? "Los beneficios comerciales y tarifas preferenciales de este módulo están disponibles únicamente para usuarios que ingresan mediante el enlace de un revendedor o aliado comercial autorizado."
                : "The commercial benefits in this module are exclusively available to users accessing via an authorized reseller or partner link."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/573127529629?text=Hola,%20quisiera%20solicitar%20un%20enlace%20para%20acceder%20al%20cat%C3%A1logo%20de%20beneficios%20de%20SmartContacts"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer"
            >
              <span>💬 {language === "es" ? "Solicitar Enlace en WhatsApp" : "Request Link on WhatsApp"}</span>
            </a>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#fafaf8] border border-black/15 text-xs font-mono font-semibold text-black/80 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === "es" ? "Ir al Inicio" : "Back to Home"}</span>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    )
  }

  // ACCESO AUTORIZADO: El usuario ingresó por medio del enlace de un revendedor
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
