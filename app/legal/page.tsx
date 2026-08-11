"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, Scale, Shield, Lock, FileCheck } from "lucide-react"

export default function LegalPage() {
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-purple-800 bg-purple-500/10 border border-purple-500/20 uppercase tracking-widest font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>{language === "es" ? "MARCO NORMATIVO COLOMBIA" : "LEGAL FRAMEWORK"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Marco Legal & Cumplimiento Normativo" : "Legal & Regulatory Compliance Framework"}
          </RevealText>

          <p className="text-xs font-mono text-black/50">
            {language === "es" ? "Regulación aplicable en la República de Colombia" : "Applicable regulation in the Republic of Colombia"}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-2 text-[#111] font-medium text-lg sm:text-xl">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2>1. Ley 1581 de 2012 — Proteccion de Datos Personales (Habeas Data)</h2>
            </div>
            <p>
              Toda la recolección, almacenamiento y tratamiento de información en las operaciones de SmartContacts cumple estrictamente con el régimen de la <strong>Ley 1581 de 2012</strong> y su <strong>Decreto Reglamentario 1377 de 2013</strong>. Garantizamos la legitimidad comercial B2B y la protección de los titulares en las 32 regiones de Colombia.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-2 text-[#111] font-medium text-lg sm:text-xl">
              <Lock className="w-5 h-5 text-blue-600" />
              <h2>2. Ley 1273 de 2009 — Seguridad de la Informacion y Delitos Informáticos</h2>
            </div>
            <p>
              Nuestra arquitectura agéntica e infraestructura de software opera con capas encriptadas de control de acceso y protocolos seguros, garantizando la confidencialidad de la información y respetando el bien jurídico de la protección de los datos y de los sistemas de información bajo la <strong>Ley 1273 de 2009</strong>.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-2 text-[#111] font-medium text-lg sm:text-xl">
              <FileCheck className="w-5 h-5 text-purple-600" />
              <h2>3. Ley 1480 de 2011 — Estatuto del Consumidor & Regulación SIC</h2>
            </div>
            <p>
              SmartContacts promueve prácticas de comercio transparente, veraz y ético. Cumplimos las disposiciones del <strong>Estatuto del Consumidor (Ley 1480 de 2011)</strong> y las directivas emitidas por la <strong>Superintendencia de Industria y Comercio (SIC)</strong> en materia de información clara, sin publicidad engañosa y con atención garantizada a usuarios y clientes.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
