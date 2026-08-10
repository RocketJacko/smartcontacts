"use client"

import React from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"

export function AboutSection() {
  const { language } = useLanguage()

  return (
    <section id="sobre-mi" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
      <div className="max-w-5xl mx-auto">
        <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-8 sm:p-12 shadow-sm transition-all hover:border-black/[0.15]">
          <div className="flex flex-col md:flex-row items-center justify-center md:items-center gap-8 lg:gap-12">
            
            {/* Real Executive Photograph */}
            <div className="relative shrink-0 flex flex-col items-center justify-center my-auto">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl border border-black/10 bg-[#F5F4F0] p-1.5 shadow-sm overflow-hidden flex items-center justify-center">
                <img
                  src="/images/jesus-carmona.png"
                  alt="Jesús Carmona"
                  className="w-full h-full object-cover object-center rounded-xl"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/50 bg-black/[0.05] font-medium uppercase mb-3">
                  {language === "es" ? "SOBRE MÍ" : "ABOUT ME"}
                </span>
                <RevealText className="text-2xl sm:text-3xl lg:text-4xl font-medium text-[#111] tracking-tight leading-snug">
                  {language === "es" ? "La persona detrás de SmartContacts" : "The Person Behind SmartContacts"}
                </RevealText>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-base sm:text-lg text-[#111] font-normal leading-relaxed">
                  {language === "es"
                    ? "Soy Jesús Carmona, ingeniero de software en formación con más de 10 años de experiencia comercial dirigiendo equipos de ventas en servicios financieros y de salud."
                    : "I'm Jesús Carmona, a software engineer in training with 10+ years of commercial experience leading sales teams in financial and health services."}
                </p>
                <p className="text-xs sm:text-sm text-black/80 font-normal leading-relaxed">
                  {language === "es"
                    ? "Comprendí que es posible obtener mejores resultados con la estrategia correcta. Por ello me enfoqué en el desarrollo de software: lograr un mayor impacto comercial manteniendo o reduciendo la mano de obra, optimizando al máximo los recursos actuales de cada empresa."
                    : "I understood that it is possible to achieve better results with the right strategy. That's why I focused on software development: achieving higher commercial impact while maintaining or reducing labor costs, optimizing existing resources to the fullest."}
                </p>
              </div>

              <div className="pt-4">
                <a
                  href="https://www.linkedin.com/in/jesus-carmona-automatization/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-mono text-[#111] uppercase tracking-widest hover:border-black/30 hover:bg-black/[0.03] transition-all font-medium"
                >
                  {language === "es" ? "Ver perfil en LinkedIn →" : "View LinkedIn Profile →"}
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
