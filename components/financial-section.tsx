"use client"

import React from "react"
import { useLanguage } from "@/lib/language-context"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { LandingAccordionItem } from "@/components/ui/interactive-image-accordion"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04] uppercase">
      {children}
    </span>
  )
}

function BentoCard({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-700 hover:border-black/[0.15] hover:bg-[#fafaf8] ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)",
        }}
      />
      {children}
    </div>
  )
}

export function FinancialSection() {
  const { t } = useLanguage()


  return (
    <section id="financiero" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] bg-[#F5F4F0]">
      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="mb-10">
          <PixelIcon type="agents" size={40} />
          <div className="mt-4">
            <Tag>{t.financialSection.tag}</Tag>
          </div>
          <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-normal text-[#111] tracking-tight leading-[1.05]">
            {t.financialSection.title}
          </RevealText>
        </div>

        {/* ── CHALLENGE & OVERVIEW BENTO CARD (CASO DE ÉXITO) ───────────────── */}
        <BentoCard className="p-8 sm:p-10 md:p-12 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#111]">
                {t.financialSection.challengeTitle}
              </h3>
              <p className="text-sm text-black/80 font-normal leading-relaxed whitespace-pre-line">
                {t.financialSection.challengeDesc}
              </p>
            </div>

            {/* Quick Metrics / Libranzas 01, 02, 03 */}
            <div className="lg:col-span-5 space-y-2.5 p-5 rounded-2xl border border-black/[0.06] bg-black/[0.02]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-black/60 tracking-widest uppercase font-medium">
                  ENFOQUE EN VENTA DE LIBRANZAS
                </span>
              </div>
              {[
                { label: "01. Segmentación por Pagaduría", detail: "Docentes, Pensionados, Fuerza Pública" },
                { label: "02. Capacidad de Endeudamiento", detail: "Cálculo según Ley 1527" },
                { label: "03. Canal Outbound Inteligente", detail: "WhatsApp + IA + Agendamiento" },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white border border-black/[0.04] group cursor-pointer hover:border-black/20 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#111] font-semibold">{row.label}</div>
                    <div className="text-[10px] text-black/60 font-normal mt-0.5">{row.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BentoCard>

        {/* ── HIGH-IMPACT COMMERCIAL FORCE CALLOUT ─────────────────────────── */}
        <div className="p-8 sm:p-10 rounded-2xl border border-black/15 bg-white shadow-sm mb-12 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-black/50 uppercase font-medium">
              FUERZA COMERCIAL Y RESULTADOS REALES
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">
            {t.financialSection.commercialHookTitle}
          </h3>

          <p className="text-xs sm:text-sm text-black/85 font-normal leading-relaxed whitespace-pre-line">
            {t.financialSection.commercialHookDesc}
          </p>
        </div>

        {/* ── INTERACTIVE IMAGE ACCORDION (MODELOS PROBADOS) ────────────────── */}
        <div className="mb-12">
          <div className="text-xs font-mono text-black/50 tracking-widest uppercase mb-6 font-medium">
            {t.financialSection.pillarsTitle} (INTERACTIVE ACCORDION)
          </div>

          <LandingAccordionItem />
        </div>

      </div>
    </section>
  )
}
