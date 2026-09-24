"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Mail, ShieldCheck } from "lucide-react"

export default function ReembolsoPage() {
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest font-semibold">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{language === "es" ? "POLÍTICA DE REEMBOLSO Y CANCELACIÓN" : "REFUND & CANCELLATION POLICY"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Política de Reembolsos y Cancelaciones B2B" : "B2B Refund & Cancellation Policy"}
          </RevealText>

          <p className="text-xs font-mono text-black/50">
            {language === "es" ? "Última actualización: Agosto 2026 | Medellín, Antioquia, Colombia" : "Last updated: August 2026 | Medellín, Antioquia, Colombia"}
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Naturaleza Comercial del Servicio B2B</h2>
            <p>
              SmartContacts presta servicios especializados de consultoría de crecimiento comercial B2B, diseño e instalación de sistemas agénticos de Inteligencia Artificial (RAG) e inteligencia de segmentación. Dado que nuestros servicios involucran la asignación inmediata de infraestructura de servidores, entrenamiento agéntico a medida y recursos humanos especializados, los reembolsos se rigen bajo los parámetros aquí estipulados.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Tarifas de Configuración e Instalación (Setup)</h2>
            <p>
              Las tarifas de configuración, arquitectura e instalación agéntica (<em>Setup Fees</em>) cubren el análisis técnico, integración con CRM, entrenamiento de modelos de lenguaje sobre la documentación del cliente y adecuación de bases de datos.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-black/75">
              <li><strong>Antes del inicio de trabajo</strong>: Si el cliente solicita la cancelación dentro de las 24 horas posteriores al pago y antes de que se inicie el proceso de relevamiento técnico, se reembolsará el 100% del importe.</li>
              <li><strong>Una vez iniciado el desarrollo</strong>: Una vez iniciado el proceso de arquitectura o entrenamiento agéntico, la tarifa de setup no es reembolsable debido a la asignación irreversible de cómputo y horas de ingeniería.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Suscripciones Recurrentes y Licenciamiento Agéntico</h2>
            <p>
              Para planes mensuales, bolsas de llamadas o licencias de mantenimiento agéntico:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-black/75">
              <li>El cliente puede solicitar la no renovación de su periodo mediante notificación por escrito con al menos cinco (5) días hábiles de anticipación al siguiente ciclo de facturación.</li>
              <li>No se emitirán reembolsos parciales por ciclos mensuales ya transcurridos o en curso.</li>
              <li>En caso de fallas imputables exclusivamente a los servidores de SmartContacts que impidan la prestación del servicio por más de 72 horas continuas, el cliente tendrá derecho al reembolso prorrateado del periodo afectado.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">4. Procedimiento para Solicitar un Reembolso</h2>
            <p>
              Para radicar una solicitud formal de cancelación o reembolso, el titular de la cuenta o representante legal debe enviar un correo electrónico a nuestro departamento oficial de atención:
            </p>
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-black/10 text-xs font-mono space-y-2 mt-3">
              <p className="flex items-center gap-2 font-semibold text-[#111]">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>Correo Oficial: activaciones@smartcontacts.cloud</span>
              </p>
              <p className="text-black/70">
                {language === "es"
                  ? "Asunto obligatorio: Solicito Reembolso / Cancelación - [Nombre de tu Empresa]"
                  : "Mandatory Subject: Refund / Cancellation Request - [Company Name]"}
              </p>
              <p className="text-black/60 pt-1 border-t border-black/10">
                Las solicitudes son evaluadas y respondidas en un término máximo de tres (3) a cinco (5) días hábiles.
              </p>
            </div>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <div className="flex items-center gap-2 text-[#111] font-medium text-lg sm:text-xl">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2>5. Ley Aplicable & Estatuto del Consumidor</h2>
            </div>
            <p>
              Esta política se interpreta de acuerdo con las leyes de la República de Colombia, respetando el Estatuto del Consumidor (Ley 1480 de 2011) en lo relativo al derecho de retracto cuando sea legalmente aplicable a transacciones electrónicas B2B.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
