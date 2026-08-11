"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react"

export function KageFaqSection() {
  const { language } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = language === "es" ? [
    {
      q: "¿Qué es una Unidad de Crecimiento Comercial con IA en SmartContacts?",
      a: "Una Unidad de Crecimiento Comercial con IA es una infraestructura tecnológica autónoma que combina inteligencia de datos B2B (+200,000 contactos verificados en Colombia), Agentes de Inteligencia Artificial y automatización CRM para multiplicar tus ventas sin reemplazar a tu equipo comercial.",
    },
    {
      q: "¿Cómo funcionan los Agentes de Inteligencia Artificial para ventas B2B?",
      a: "Los Agentes de IA ejecutan la prospección activa las 24/7: identifican decisiones de compra, redactan interacción personalizada, califican el interés mediante tecnología RAG y agendan la reunión directamente en el calendario de tus ejecutivos.",
    },
    {
      q: "¿Cuál es la cobertura de la base de datos empresarial en Colombia?",
      a: "Contamos con una infraestructura propia de datos con más de 200,000 contactos comerciales verificados y segmentados por ejecutivos, empresas y cobertura en los 32 departamentos de Colombia.",
    },
    {
      q: "¿Qué diferencia a SmartContacts de un CRM tradicional o una agencia?",
      a: "Un CRM es solo una herramienta pasiva de registro y las agencias tradicionales cobran por impresiones. SmartContacts construye una unidad operativa agéntica que prospecta activamente y entrega reuniones calificadas en tu embudo.",
    },
    {
      q: "¿Qué modalidades de implementación ofrecen?",
      a: "Ofrecemos dos modalidades: Implementación In-House (configuración directa en tu propia infraestructura de software) o Unidad Delegada (gestión integral externa administrada por nuestros especialistas de crecimiento).",
    },
  ] : [
    {
      q: "What is an AI Commercial Growth Unit at SmartContacts?",
      a: "An AI Commercial Growth Unit is an autonomous tech infrastructure combining B2B data intelligence (+200,000 verified contacts in Colombia), AI Agents, and CRM automation to scale sales without replacing your team.",
    },
    {
      q: "How do AI Agents work for B2B sales acceleration?",
      a: "AI Agents run active prospecting 24/7: they identify buying decision-makers, deliver personalized outreach, qualify intent via RAG technology, and book meetings directly onto your executives' calendars.",
    },
    {
      q: "What is the B2B company database coverage in Colombia?",
      a: "We maintain proprietary data infrastructure with over 200,000 verified commercial contacts segmented by executives, industries, and geographic coverage across all 32 departments of Colombia.",
    },
    {
      q: "How is SmartContacts different from a traditional CRM or agency?",
      a: "A traditional CRM is a passive database and agencies charge for impressions. SmartContacts builds an active agentic unit that prospectively engages prospects and delivers qualified sales meetings.",
    },
    {
      q: "What implementation modalities are available?",
      a: "We offer two operational modalities: In-House Implementation (direct setup within your tech stack) or Delegated Growth Unit (full service managed by our growth specialists).",
    },
  ]

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
