"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react"

export function FAQSection() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  if (!t.faq) return null

  return (
    <section id="faq" className="py-24 relative overflow-hidden bg-[#FAF9F6]">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/5 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.03] border border-black/[0.06] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-black/60" />
            <span className="text-[11px] font-mono font-medium text-black/80 tracking-wider uppercase">
              {t.faq.tag}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-sans font-semibold tracking-tight text-[#111] mb-4">
            <RevealText>{t.faq.title}</RevealText>
          </h2>

          <p className="text-sm font-sans text-black/80 max-w-2xl mx-auto leading-relaxed">
            {t.faq.subtitle}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {t.faq.items.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-xs transition-all duration-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-black/10 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-black/[0.04] text-black/75 text-xs font-mono font-semibold shrink-0">
                      0{index + 1}
                    </span>
                    <h3 className="text-base font-sans font-semibold text-[#111] leading-snug">
                      {item.question}
                    </h3>
                  </div>
                  <div className={`p-1.5 rounded-full bg-black/[0.03] text-black/75 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 bg-black/[0.08]' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${index}`}
                    className="px-5 sm:px-6 pb-6 pt-1 text-sm font-sans text-black/80 leading-relaxed border-t border-black/[0.04] bg-black/[0.01] animate-in fade-in slide-in-from-top-1 duration-150"
                  >
                    <p className="font-normal text-black/80">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Trust Bottom Banner */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-white border border-black/[0.06] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-xs font-mono font-semibold text-[#111] uppercase tracking-wider">
                ¿Tienes alguna otra duda sobre la arquitectura o integración?
              </h4>
              <p className="text-xs font-sans text-black/75 mt-0.5">
                Nuestro equipo de ingeniería agéntica responde tus consultas técnicas directamente en la sesión consultiva.
              </p>
            </div>
          </div>
          <a
            href="#agendar"
            className="px-4 py-2.5 rounded-xl bg-[#111] text-white text-xs font-mono font-medium hover:bg-black/80 transition-colors whitespace-nowrap"
          >
            Agendar Asesoría Técnica →
          </a>
        </div>
      </div>
    </section>
  )
}
