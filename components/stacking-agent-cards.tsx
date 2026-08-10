"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"

const STICKY_TOP   = 80
const STICKY_STEP  = 16
const SCALE_STEP   = 0.04
const OFFSET_STEP  = 8

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
      {children}
    </span>
  )
}

export function StackingAgentCards() {
  const { t } = useLanguage()

  const agents = [
    {
      label: "PROSPECTADOR & RAG",
      title: t.agents.researcher.title,
      desc: t.agents.researcher.desc,
    },
    {
      label: "AGENTE OUTBOUND",
      title: t.agents.coder.title,
      desc: t.agents.coder.desc,
    },
    {
      label: "ORQUESTADOR CRM",
      title: t.agents.analyst.title,
      desc: t.agents.analyst.desc,
    },
    {
      label: "EJECUTOR & CIERRE",
      title: t.agents.executor.title,
      desc: t.agents.executor.desc,
    },
  ]

  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [depth, setDepth] = useState<number[]>(agents.map(() => 0))

  useEffect(() => {
    function onScroll() {
      const nextDepth = agents.map((_, i) => {
        let count = 0
        for (let j = i + 1; j < agents.length; j++) {
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
  }, [agents.length])

  return (
    <div className="flex flex-col" style={{ perspective: "1400px", perspectiveOrigin: "50% 0%" }}>
      {agents.map((agent, i) => {
        const d         = depth[i]
        const scale     = 1 - d * SCALE_STEP
        const translateY = d * OFFSET_STEP

        return (
          <div
            key={agent.label}
            ref={el => { cardRefs.current[i] = el }}
            className="sticky mb-4"
            style={{ top: `${STICKY_TOP + i * STICKY_STEP}px`, zIndex: 10 + i }}
          >
            <div
              style={{
                transform:      `scale(${scale}) translateY(${translateY}px)`,
                transformOrigin: "top center",
                transition:     "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
                willChange:     "transform",
              }}
            >
              <div className="group relative bg-white rounded-2xl border border-black/[0.08] p-8 sm:p-10 shadow-sm transition-all hover:border-black/20">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <Tag>{agent.label}</Tag>
                    <span className="font-mono text-xs text-black/30">0{i + 1}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">{agent.title}</h3>
                  <p className="text-xs sm:text-sm text-black/80 font-normal leading-relaxed">{agent.desc}</p>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
