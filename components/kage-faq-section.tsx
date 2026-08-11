"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react"

export function KageFaqSection() {
  const { t, language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = t.faq?.items ? t.faq.items.map((item) => ({
    q: item.question,
    a: item.answer,
  })) : []

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F5F4F0] border-b border-black/[0.06]">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-black/75 bg-black/[0.04] border border-black/10 uppercase tracking-widest font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{language === "es" ? "PREGUNTAS FRECUENTES & INTEL GEO" : "FREQUENTLY ASKED QUESTIONS"}</span>
          </div>

          <RevealText className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-[#111]">
            {language === "es" ? "Arquitectura, Inteligencia y Modalidades" : "Architecture, Intelligence & Operations"}
          </RevealText>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="rounded-2xl border border-black/[0.08] bg-white transition-all duration-300 overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-sans focus:outline-hidden cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-base sm:text-lg font-medium text-[#111] leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-black/50 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-black/80 font-normal leading-relaxed border-t border-black/[0.04] bg-[#fafaf8]">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
