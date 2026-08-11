"use client"

import React from "react"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { RevealText } from "@/components/reveal-text"
import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { ArrowLeft, Cookie } from "lucide-react"

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
        </div>

        {/* Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-black/80 font-normal">
          
          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">1. Uso de Cookies en SmartContacts</h2>
            <p>
              SmartContacts utiliza cookies técnicas esenciales y tecnologías de almacenamiento local para garantizar la velocidad de carga, recordar tus preferencias de idioma (Español/Inglés) y analizar métricas de rendimiento anónimas.
            </p>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">2. Tipos de Cookies Implementadas</h2>
            <ul className="list-disc pl-5 space-y-2 text-black/75">
              <li><strong>Cookies Necesarias y de Sesión</strong>: Permiten recordar la navegación y la preferencia de idioma seleccionada mediante el contexto de usuario.</li>
              <li><strong>Cookies de Métricas y Rendimiento</strong>: Integradas a través de <em>Vercel Analytics</em> y <em>Speed Insights</em> para evaluar tiempos de carga en milisegundos y optimizar la experiencia móvil. No almacenan información de identificación personal.</li>
            </ul>
          </section>

          <section className="space-y-3 p-6 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
            <h2 className="text-lg sm:text-xl font-medium text-[#111]">3. Control y Desactivación</h2>
            <p>
              Puedes restringir, bloquear o borrar las cookies de este sitio en cualquier momento modificando la configuración de tu navegador web (Chrome, Safari, Firefox o Edge). Ten en cuenta que deshabilitar cookies técnicas puede afectar funciones menores de interfaz.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  )
}
