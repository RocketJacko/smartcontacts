"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"

export default function TerminosPage() {
  const { language } = useLanguage()

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div className="space-y-4 border-b border-black/[0.08] pb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-black/60 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === "es" ? "VOLVER AL INICIO" : "BACK TO HOME"}</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-blue-800 bg-blue-500/10 border border-blue-500/20 uppercase tracking-widest font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{language === "es" ? "CONDICIONES OPERATIVAS" : "TERMS OF SERVICE"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Términos y Condiciones del Servicio" : "Terms & Conditions of Service"}
          </RevealText>
        </div>

        {/* Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Objeto del Servicio</h2>
            <p>
              SmartContacts opera como un canal adicional de ventas y desarrollo agéntico B2B. Aportamos experiencia comercial dirigida, infraestructura propia de datos de prospectos (+200,000 contactos verificados en Colombia) y sistemas agénticos de Inteligencia Artificial para multiplicar la capacidad de conversión comercial de nuestros clientes.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Modalidades de Contratación</h2>
            <ul className="list-disc pl-5 space-y-2 text-black/75">
              <li><strong>Unidad In-House</strong>: Desarrollo e instalación directa del sistema agéntico en la infraestructura tecnológica y CRM del cliente.</li>
              <li><strong>Unidad Delegada (Full Service)</strong>: Operación externa gestionada integralmente por los especialistas de SmartContacts como canal comercial freelance.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Fidelidad de Marca y Supervisión Humana</h2>
            <p>
              El cliente se compromete a suministrar la información técnica, comercial y de precios exacta de sus productos. Los sistemas de IA se entrenan con las políticas y tono de voz de cada marca, incorporando supervisión humana (Human-in-the-Loop) en las etapas decisivas del proceso.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
