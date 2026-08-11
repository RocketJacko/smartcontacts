"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Mail, Phone, MapPin } from "lucide-react"

export default function PrivacidadPage() {
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
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === "es" ? "LEY 1581 DE 2012 — HABEAS DATA" : "PRIVACY & HABEAS DATA"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Política de Tratamiento de Datos Personales" : "Privacy & Personal Data Protection Policy"}
          </RevealText>

          <p className="text-xs font-mono text-black/50">
            {language === "es" ? "Última actualización: Agosto 2026 | Medellín, Antioquia, Colombia" : "Last updated: August 2026 | Medellín, Antioquia, Colombia"}
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Identificación del Responsable del Tratamiento</h2>
            <p>
              SmartContacts, con sede operativa en Medellín, Antioquia, Colombia, actúa como Responsable del Tratamiento de Datos Personales en estricto cumplimiento con la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y la regulación expedida por la Superintendencia de Industria y Comercio (SIC).
            </p>
            <div className="pt-2 text-xs font-mono text-black/70 space-y-1 border-t border-black/[0.06] mt-4">
              <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Directo / WhatsApp: +57 312 752 9629</p>
              <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Correo Oficial: jesus.carmona966@pascualbravo.edu.co</p>
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Ubicación: Medellín, Antioquia, Colombia</p>
            </div>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Finalidades del Tratamiento de Datos</h2>
            <p>Los datos recolectados y procesados mediante nuestras plataformas y sistemas agénticos son utilizados para:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-black/75">
              <li>Coordinar agendamiento de reuniones y consultas de diagnóstico comercial.</li>
              <li>Ejecutar procesos de comunicación B2B sobre prospectos perfilados legalmente bajo legitimidad comercial.</li>
              <li>Sincronizar información comercial con los sistemas agénticos de automatización CRM solicitados por los clientes.</li>
              <li>Atender peticiones, quejas, reclamos y solicitudes de ejercicio de derechos ARCO.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Derechos del Titular (Derechos ARCO)</h2>
            <p>De conformidad con la Ley 1581 de 2012, el titular de la información tiene derecho a:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-black/75">
              <li>Conocer, actualizar y rectificar sus datos personales frente a SmartContacts.</li>
              <li>Solicitar prueba de la autorización otorgada, salvo cuando la ley lo exceptúe.</li>
              <li>Ser informado sobre el uso que se le ha dado a sus datos personales.</li>
              <li>Presentar ante la Superintendencia de Industria y Comercio (SIC) quejas por infracciones a la normativa.</li>
              <li>Revocar la autorización o solicitar la supresión del dato cuando no se respeten los principios normativos.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">4. Procedimiento para el Ejercicio de Derechos</h2>
            <p>
              Para radicar una solicitud de consulta, actualización o supresión de datos, puede escribir directamente a nuestro correo electrónico oficial <strong>jesus.carmona966@pascualbravo.edu.co</strong> o comunicarse vía WhatsApp al <strong>+57 312 752 9629</strong>. Las consultas serán atendidas en un término máximo de diez (10) días hábiles.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
