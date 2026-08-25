"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { useGeoLocation } from "@/lib/use-geo-location"
import { Check, ArrowRight, Clock, ShieldCheck, Sparkles, RefreshCw } from "lucide-react"
import { PlatziActivationModal } from "@/components/platzi-activation-modal"

export interface BenefitItem {
  id: string
  title: string
  subtitle: string
  image: string
  period: string
  periodLabel: string
  features: string[]
  ctaText: string
  badge?: string
}

const BENEFITS_LIST: BenefitItem[] = [
  {
    id: "platzi",
    title: "Platzi (Plan Basic)",
    subtitle: "Para 1 estudiante — Contenido profesional y acceso a los beneficios incluidos en el plan.",
    image: "https://cdn.sanity.io/images/vr0czzef/production/0332c01ab74e4d12d723d11c8b4cd7815bebe373-1200x1200.png?w=3840&h=3840&fm=webp&q=80&fit=crop&auto=format",
    period: "1 año",
    periodLabel: "Pago único por el período completo de 1 año",
    features: [
      "Contenido profesional actualizado con certificados digitales",
      "Certificados físicos para las rutas de aprendizaje profesional",
      "Acceso a las escuelas de Startups, Inglés y Liderazgo",
      "Eventos exclusivos como Platzi Conf",
      "Descarga de contenido en la aplicación móvil",
    ],
    ctaText: "ACTIVAR BENEFICIO PLATZI",
    badge: "OFERTA EXCLUSIVA",
  },
]

export function BenefitsSection() {
  const { language } = useLanguage()
  const { formattedPlatziPrice, userCurrency, countryName, flagUrl, toggleCurrency } = useGeoLocation()
  const [activeModalId, setActiveModalId] = useState<string | null>(null)

  return (
    <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 gap-8 lg:gap-10">
        {BENEFITS_LIST.map((benefit) => (
          <div
            key={benefit.id}
            className="group relative rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-10 lg:p-12 shadow-sm flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch hover:border-black/20 transition-all duration-300"
          >
            {/* Left Column: Product Image & Quick Spec Badge */}
            <div className="lg:w-5/12 flex flex-col items-center justify-between space-y-6">
              <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] rounded-2xl bg-[#FAF9F6] border border-black/[0.06] p-6 flex items-center justify-center overflow-hidden shadow-xs">
                <img
                  src={benefit.image}
                  alt={benefit.title}
                  className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Price & Period Highlight Card */}
              <div className="w-full p-5 rounded-2xl bg-[#FAF9F6] border border-black/[0.06] text-center space-y-1.5">
                <div className="flex items-center justify-center gap-2 mb-1">
                  {benefit.badge && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{benefit.badge}</span>
                    </span>
                  )}
                  {/* Currency Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleCurrency}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.05] hover:bg-black/10 border border-black/10 text-[10px] font-mono font-bold text-black transition-colors cursor-pointer"
                    title="Cambiar moneda (COP / USD)"
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-black/50" />
                    <span>{userCurrency}</span>
                  </button>
                </div>

                <div className="text-3xl sm:text-4xl font-light font-mono text-[#111] tracking-tight">
                  {formattedPlatziPrice}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-black/70 font-medium">
                  <Clock className="w-3.5 h-3.5 text-black/40" />
                  <span>{benefit.period}</span>
                </div>

                <p className="text-[11px] font-mono text-black/50 pt-1 border-t border-black/[0.06] mt-2">
                  {benefit.periodLabel}
                </p>
              </div>
            </div>

            {/* Right Column: Title, Subtitle, Features & Direct Action Button */}
            <div className="lg:w-7/12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-black/[0.08] pb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-black/40 font-semibold block mb-1">
                      {language === "es" ? "CATÁLOGO DE BENEFICIOS" : "BENEFITS CATALOG"}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-medium text-[#111] tracking-tight">
                      {benefit.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FAF9F6] border border-black/[0.06] text-xs font-mono text-black/60">
                    <img src={flagUrl} alt={countryName} className="w-4 h-3 object-cover rounded-xs" />
                    <span>{countryName}</span>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-black/75 font-normal leading-relaxed">
                  {benefit.subtitle}
                </p>

                {/* Step 1 Activation Indicator */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-900 font-semibold">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1° PASO: Activamos primero el beneficio sobre la cuenta que indiques.</span>
                </div>

                {/* Features List */}
                <div className="pt-2 space-y-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-black/50 font-semibold block">
                    {language === "es" ? "SERVICIOS E INCLUSIONES DEL PLAN:" : "INCLUDED PLAN FEATURES:"}
                  </span>
                  <ul className="space-y-3">
                    {benefit.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-black/85 leading-relaxed">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveModalId(benefit.id)}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-mono tracking-wider uppercase hover:bg-black/90 transition-all font-bold shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>{benefit.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activation Modal for Platzi */}
      <PlatziActivationModal
        isOpen={activeModalId === "platzi"}
        onClose={() => setActiveModalId(null)}
      />
    </section>
  )
}
