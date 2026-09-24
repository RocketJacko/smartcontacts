"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, Cookie, Mail, ShieldCheck } from "lucide-react"

export default function CookiesPage() {
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

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-amber-800 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest font-semibold">
            <Cookie className="w-3.5 h-3.5" />
            <span>{language === "es" ? "TECNOLOGÍAS DE ALMACENAMIENTO" : "COOKIE POLICY"}</span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Política de Cookies y Almacenamiento" : "Cookie & Storage Policy"}
          </RevealText>

          <p className="text-xs font-mono text-black/50">
            {language === "es" ? "Última actualización: Agosto 2026 | Medellín, Antioquia, Colombia" : "Last updated: August 2026 | Medellín, Antioquia, Colombia"}
          </p>
        </div>

        {/* Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Uso de Cookies en SmartContacts</h2>
            <p>
              SmartContacts utiliza cookies técnicas esenciales y tecnologías de almacenamiento local (*localStorage*) para garantizar el correcto funcionamiento del sitio, recordar las preferencias de idioma (Español e Inglés) y registrar de forma transparente la aceptación del consentimiento de cookies.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Tipos de Cookies e Integraciones Implementadas</h2>
            <ul className="list-disc pl-5 space-y-2 text-black/75">
              <li><strong>Cookies Técnicas Esenciales</strong>: Permiten recordar la preferencia de idioma seleccionada (`sc_language`) y el estado de aceptación del banner legal (`sc_cookie_consent`).</li>
              <li><strong>Métricas de Rendimiento y Analítica Anónima</strong>: Utilizadas a través de la infraestructura del servidor para medir tiempos de carga en milisegundos sin recolectar ni almacenar datos de identificación personal (PII).</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Control, Desactivación y Revocación</h2>
            <p>
              Puedes restringir, borrar o revocar el consentimiento de almacenamiento en cualquier momento desde la configuración de tu navegador (Google Chrome, Mozilla Firefox, Apple Safari o Microsoft Edge). Asimismo, puedes reiniciar tus preferencias haciendo clic en el botón de aceptación o escribiendo a nuestro correo oficial.
            </p>
            <div className="pt-2 text-xs font-mono text-black/70 border-t border-black/[0.06] mt-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Contacto oficial sobre cookies: <strong>activaciones@smartcontacts.cloud</strong></span>
            </div>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
