"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, FileText, Scale, ShieldCheck, Mail } from "lucide-react"

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
            <span>{language === "es" ? "CONDICIONES OPERATIVAS Y LEGALES" : "TERMS OF SERVICE"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Términos y Condiciones del Servicio B2B" : "B2B Terms & Conditions of Service"}
          </RevealText>

          <p className="text-xs font-mono text-black/50">
            {language === "es" ? "Última actualización: Agosto 2026 | Medellín, Antioquia, Colombia" : "Last updated: August 2026 | Medellín, Antioquia, Colombia"}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Objeto del Servicio y Propuesta de Valor</h2>
            <p>
              SmartContacts opera como una Unidad de Crecimiento Comercial e Inteligencia de Datos B2B. Aportamos consultoría estratégica, infraestructura agéntica de Inteligencia Artificial (RAG), segmentación de audiencias perfiladas en Colombia y automatización CRM para multiplicar la capacidad de prospección y conversión comercial de nuestros clientes.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Modalidades de Contratación</h2>
            <ul className="list-disc pl-5 space-y-2 text-black/75">
              <li><strong>Unidad In-House</strong>: Desarrollo e instalación directa de la arquitectura de Agentes de IA dentro de los sistemas tecnológicos y CRM del cliente, con transferencia de conocimiento.</li>
              <li><strong>Unidad Delegada (Full Service)</strong>: Operación agéntica externa gestionada por los especialistas de SmartContacts como canal comercial complementario.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Exactitud de la Información & Supervisión Humana (Human-in-the-Loop)</h2>
            <p>
              El cliente es el único responsable de la veracidad de los precios, manuales y condiciones de sus productos suministrados para el entrenamiento de los agentes. SmartContacts implementa salvaguardas (*guardrails*) y supervisión humana en las etapas decisivas, pero no se hace responsable por imprecisiones derivadas de información desactualizada provista por el cliente.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">4. Exención de Garantías Absolutas de Cierre Comercial</h2>
            <p>
              Las proyecciones, estimaciones de métricas y simulaciones mostradas en la plataforma son referentes estadísticos basados en la experiencia comercial previa en sectores como crédito y salud. SmartContacts no garantiza un porcentaje fijo o absoluto de cierre de ventas, toda vez que la tasa final de conversión depende de variables del mercado, la oferta comercial del cliente y el cumplimiento del servicio por parte de la empresa contratante.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">5. Propiedad Intelectual y Confidencialidad</h2>
            <p>
              Todos los modelos agénticos base, algoritmos de orquestación, código fuente e inteligencias de segmentación son propiedad exclusiva de SmartContacts. La información confidencial del cliente suministrada durante el servicio estará protegida bajo estricto deber de reserva y encriptación.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">6. Cancelación y Política de Reembolso</h2>
            <p>
              Los términos de cancelación, vencimiento de ciclos y reembolsos están regidos explícitamente por nuestra <Link href="/reembolso" className="text-emerald-700 underline font-medium">Política de Reembolso B2B</Link>.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-2 text-[#111] font-medium text-lg sm:text-xl">
              <Scale className="w-5 h-5 text-blue-600" />
              <h2>7. Ley Aplicable y Jurisdicción</h2>
            </div>
            <p>
              Estos Términos y Condiciones se rigen por la legislación de la República de Colombia. Cualquier controversia será sometida a la jurisdicción de los tribunales ordinarios de la ciudad de Medellín, Antioquia, Colombia.
            </p>
            <div className="pt-2 text-xs font-mono text-black/70 border-t border-black/[0.06] mt-3">
              Contacto para asuntos legales: <strong>activaciones@smartcontacts.cloud</strong>
            </div>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
