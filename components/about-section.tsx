"use client"

import React from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"

export function AboutSection() {
  const { language } = useLanguage()

  return (
    <section id="sobre-mi" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto">
        <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-8 sm:p-12 shadow-sm transition-all hover:border-black/[0.15]">
          <div className="flex flex-col md:flex-row items-center justify-center md:items-start gap-8 lg:gap-12">
            
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
                  {language === "es" ? "Jesús Carmona" : "Jesús Carmona"}
                </RevealText>
              </div>

              <div className="space-y-3 pt-1">
                <p className="text-sm sm:text-base text-[#111] font-normal leading-relaxed">
                  {language === "es"
                    ? "Soy Jesús Carmona. Lideré equipos comerciales por más de 10 años en el sector crédito, en productos de libranza, y en el sector salud, comercializando servicios de asistencia médica y planes complementarios."
                    : "I'm Jesús Carmona. I led sales teams for over 10 years in the credit sector, in payroll loans, and in the health sector, commercializing medical assistance and complementary plans."}
                </p>
                <p className="text-xs sm:text-sm text-black/80 font-normal leading-relaxed">
                  {language === "es"
                    ? "Con esa experiencia decidí dedicarme a crear sistemas agénticos que apoyan a las empresas en la comercialización de sus servicios. Automatizo procesos comerciales y desarrollo sistemas de soporte inteligente para tu negocio, implementados sin que tengas que preocuparte por temas técnicos."
                    : "With that experience, I decided to dedicate myself to building agentic systems that empower companies to market their services. I automate sales workflows and build intelligent support systems for your business, deployed seamlessly without technical friction."}
                </p>
                <p className="text-xs sm:text-sm text-black/80 font-normal leading-relaxed">
                  {language === "es"
                    ? "Hoy soy un canal de ventas adicional para las empresas: traigo mi propia base de datos, mi sistema y mi experiencia comercial, sin que tengas que aumentar tu nómina. Ya lo validé en libranzas, donde es un caso de éxito real, y lo estoy replicando a otros sectores."
                    : "Today I am an additional sales channel for companies: bringing my own database, AI system, and commercial experience without expanding your payroll. I've validated it in payroll loans as a real success case, and I'm scaling it across other sectors."}
                </p>
              </div>

              <div className="pt-3">
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
