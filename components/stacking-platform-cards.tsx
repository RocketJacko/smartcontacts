"use client"

import React, { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { PixelIcon } from "@/components/pixel-icon"

const STICKY_TOP = 90
const STICKY_STEP = 16
const SCALE_STEP = 0.03
const OFFSET_STEP = 8

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/75 bg-black/[0.05] font-semibold uppercase">
      {children}
    </span>
  )
}

export function StackingPlatformCards() {
  const { t } = useLanguage()

  const cardsCount = 3
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [depth, setDepth] = useState<number[]>(Array(cardsCount).fill(0))

  useEffect(() => {
    function onScroll() {
      const nextDepth = Array(cardsCount)
        .fill(0)
        .map((_, i) => {
          let count = 0
          for (let j = i + 1; j < cardsCount; j++) {
            const el = cardRefs.current[j]
            if (!el) continue
            const rect = el.getBoundingClientRect()
            const stickyTopJ = STICKY_TOP + j * STICKY_STEP
            if (rect.top <= stickyTopJ + 2) count++
          }
          return count
        })
      setDepth(nextDepth)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [cardsCount])

  return (
    <div className="max-w-5xl mx-auto flex flex-col space-y-6" style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}>
      {/* ── CARD 1: SISTEMA AUTÓNOMO ────────────────────────────────────── */}
      {(() => {
        const i = 0
        const d = depth[i]
        const scale = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP
        return (
          <div
            ref={el => { cardRefs.current[i] = el }}
            className="sticky"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange: "transform",
              }}
            >
              <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-8 md:p-12 shadow-sm transition-all hover:border-black/[0.15]">
                <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between">
                  <div className="max-w-xl space-y-4">
                    <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center">
                      <PixelIcon type="platform" size={24} />
                    </div>
                    <Tag>{t.platform.autonomousTag}</Tag>
                    <h3 className="text-2xl sm:text-3xl font-medium text-[#111] tracking-tight">
                      {t.platform.autonomousTitle}
                    </h3>
                    <p className="text-sm text-black/80 font-normal leading-relaxed">
                      {t.platform.autonomousDesc}
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl border border-black/[0.06] bg-black/[0.02] w-full lg:w-80 shrink-0 space-y-3">
                    <div className="text-[10px] font-mono text-black/75 tracking-widest uppercase font-semibold">
                      PROMESA DE VALOR
                    </div>
                    {[
                      { label: "Enfoque consultivo", desc: "Venta directa de alto valor, no spam masivo" },
                      { label: "Control de marca", desc: "Cada interacción sigue tus políticas y tono" },
                      { label: "Escala comercial", desc: "Más ventas sin aumentar tu nómina fija" },
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-black/[0.04]">
                        <div className="text-[11px] font-semibold text-[#111]">{item.label}</div>
                        <div className="text-[10px] text-black/75 font-normal">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── CARD 2: DATOS PROPIOS (+4M SEGMENTADOS) ───────────────────── */}
      {(() => {
        const i = 1
        const d = depth[i]
        const scale = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP
        return (
          <div
            ref={el => { cardRefs.current[i] = el }}
            className="sticky"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange: "transform",
              }}
            >
              <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-5 sm:p-8 md:p-12 shadow-sm transition-all hover:border-black/[0.15]">
                <div className="max-w-2xl space-y-4">
                  <div className="w-10 h-10 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center">
                    <PixelIcon type="integrations" size={24} />
                  </div>
                  <Tag>{t.platform.memoryTag}</Tag>
                  <h3 className="text-2xl sm:text-3xl font-medium text-[#111] tracking-tight">
                    {t.platform.memoryTitle}
                  </h3>
                  <p className="text-sm text-black/80 font-normal leading-relaxed">
                    {t.platform.memoryDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── CARD 3: MANIFIESTO (LO QUE SÍ SOMOS VS LO QUE NO SOMOS) ───── */}
      {(() => {
        const i = 2
        const d = depth[i]
        const scale = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP
        return (
          <div
            ref={el => { cardRefs.current[i] = el }}
            className="sticky"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform: `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange: "transform",
              }}
            >
              <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 md:p-12 shadow-md transition-all hover:border-black/[0.15]">
                {/* Intro Header */}
                <div className="max-w-3xl mb-8 space-y-3">
                  <Tag>{t.platform.manifesto.tagline}</Tag>
                  <h3 className="text-2xl md:text-3xl font-medium text-[#111] tracking-tight">
                    {t.platform.manifesto.title}
                  </h3>
                  <p className="text-sm text-black/80 font-normal leading-relaxed">
                    {t.platform.manifesto.desc}
                  </p>
                </div>

              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
