"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PixelIcon } from "@/components/pixel-icon"
import { Check, ArrowRight } from "lucide-react"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-mono text-black/50 bg-black/[0.05] uppercase border border-black/10 font-medium">
      {children}
    </span>
  )
}

export function KageModalitiesSection() {
  const { t, language } = useLanguage()
  const [activeModality, setActiveModality] = useState<0 | 1>(0)

  const modalities = [
    {
      id: 0,
      code: "01",
      name: language === "es" ? "Comercialización Directa" : "Direct Commercialization",
      subtitle: language === "es" ? "Comercializamos sus servicios con nuestro sistema" : "We commercialize your services using our proprietary infrastructure",
      badge: language === "es" ? "BASE DE DATOS PROPIA (+4M)" : "PROPRIETARY DB (+4M)",
      features: [
        language === "es" ? "Contacto directo sobre datos propios perfilados por 5 variables" : "Direct contact using proprietary dataset segmented by 5 variables",
        language === "es" ? "Presentación de oferta, perfilamiento y manejo de objeciones" : "Full pitch presentation, qualification, and objection handling",
        language === "es" ? "Ejecución del ciclo comercial completo hasta agendamiento o cierre" : "Execution of complete sales cycle up to closing or scheduling",
        language === "es" ? "Despacho automatizado cuando el producto o servicio lo permite" : "Automated delivery dispatch when product model allows",
        language === "es" ? "Sin apropiarnos ni alterar los procesos internos de su empresa" : "Zero friction or interference with internal company operations",
      ],
      impact: language === "es" ? "+340% Velocidad de Prospección Comercial" : "+340% Commercial Prospecting Velocity",
      cta: language === "es" ? "SOLICITAR COMERCIALIZACIÓN" : "REQUEST COMMERCIALIZATION",
    },
    {
      id: 1,
      code: "02",
      name: language === "es" ? "Instalación In-House" : "In-House System Setup",
      subtitle: language === "es" ? "Instalamos el sistema dentro de su operación" : "We install the agentic architecture inside your existing operation",
      badge: language === "es" ? "TRANSFERENCIA TECNOLÓGICA TOTAL" : "FULL TECH TRANSFER",
      features: [
        language === "es" ? "Diseño de la arquitectura de IA agéntica a la medida de su negocio" : "Custom AI agent architecture design tailored to your business",
        language === "es" ? "Entrenamiento con la voz, conocimientos y políticas exactas de su marca" : "Agent training on brand voice, products, and strict guidelines",
        language === "es" ? "Instalación de automatizaciones comerciales y pipelines documentales" : "Setup of sales automations and document processing pipelines",
        language === "es" ? "Transferencia total para una operación 100% autónoma de su equipo" : "Full operational handover for self-sufficient team management",
        language === "es" ? "Reservamos la intervención humana solo para cierres esenciales" : "Human intervention reserved strictly for critical high-value closes",
      ],
      impact: language === "es" ? "100% Autonomía Operativa & Control Total" : "100% Operational Autonomy & Full Control",
      cta: language === "es" ? "SOLICITAR INSTALACIÓN IN-HOUSE" : "REQUEST IN-HOUSE SETUP",
    },
  ]

  const current = modalities[activeModality]

  return (
    <section id="modalidades" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] bg-[#F5F4F0]">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center max-w-3xl mx-auto space-y-3">
          <PixelIcon type="pricing" size={40} />
          <div className="mt-2"><Tag>{t.pricing.tag}</Tag></div>
          <RevealText as="h2" className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#111] tracking-tight leading-tight">
            {t.pricing.title}
          </RevealText>
        </div>

        {/* Kage Style Interactive Switcher Track */}
        <div className="w-full max-w-[#540px] mx-auto bg-white p-1.5 rounded-2xl border border-black/[0.08] shadow-xs flex items-center gap-1.5 select-none">
          {modalities.map(m => {
            const isActive = activeModality === m.id
            return (
              <button
                key={m.id}
                type="button"
                aria-label={`Seleccionar ${m.name}`}
                onClick={() => setActiveModality(m.id as 0 | 1)}
                className={`flex-1 min-h-[48px] py-3.5 px-4 rounded-xl text-xs font-mono tracking-wider transition-all duration-300 flex items-center justify-center font-bold uppercase ${
                  isActive
                    ? "bg-[#111] text-white shadow-xs"
                    : "text-black/70 hover:text-black hover:bg-black/[0.03]"
                }`}
              >
                <span className="truncate">{m.name}</span>
              </button>
            )
          })}
        </div>

        {/* Main Kage Display Card */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-black/[0.08] shadow-xs transition-all duration-300 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-black/75 bg-black/[0.04] px-2.5 py-0.5 rounded border border-black/10 uppercase">
                  {current.badge}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-medium text-[#111] tracking-tight">
                {current.name}
              </h3>
              <p className="text-xs sm:text-sm text-black/75 font-normal mt-1">
                {current.subtitle}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04] shrink-0">
              <span className="text-[10px] font-mono text-black/70 uppercase tracking-widest block font-medium">IMPACTO PROBADO</span>
              <span className="text-xs font-mono font-semibold text-[#111] mt-0.5 block">{current.impact}</span>
            </div>
          </div>

          {/* Minimalist Kage Feature List */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono text-black/70 uppercase tracking-widest block font-medium">
              {language === "es" ? "ALCANCE Y ENTREGABLES INCLUIDOS" : "SCOPE & DELIVERABLES INCLUDED"}
            </span>

            <div className="divide-y divide-black/[0.06] border-y border-black/[0.06]">
              {current.features.map((feat, idx) => (
                <div key={idx} className="py-3.5 px-2 flex items-start gap-3 text-xs sm:text-sm text-black/80 font-normal">
                  <div className="w-4 h-4 rounded-full bg-black/[0.05] border border-black/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 text-[#111]" />
                  </div>
                  <span className="leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-2 flex justify-end">
            <a
              href="#agendar"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium shadow-xs"
            >
              <span>{current.cta}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

        </div>

      </div>
    </section>
  )
}
