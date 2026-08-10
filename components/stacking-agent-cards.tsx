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
      id: "01",
      label: "PROSPECTADOR & RAG",
      title: t.agents.researcher.title,
      desc: t.agents.researcher.desc,
    },
    {
      id: "02",
      label: "AGENTE OUTBOUND",
      title: t.agents.coder.title,
      desc: t.agents.coder.desc,
    },
    {
      id: "03",
      label: "ORQUESTADOR CRM & FLUJOS",
      title: t.agents.analyst.title,
      desc: t.agents.analyst.desc,
    },
    {
      id: "04",
      label: "EJECUTOR & CIERRE DOCUMENTAL",
      title: t.agents.executor.title,
      desc: t.agents.executor.desc,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {agents.map((agent) => (
        <div
          key={agent.label}
          className="group relative bg-white rounded-2xl border border-black/[0.08] p-6 sm:p-8 shadow-sm transition-all hover:border-black/20 hover:shadow-md flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Tag>{agent.label}</Tag>
              <span className="font-mono text-xs text-black/30 font-semibold">{agent.id}</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">{agent.title}</h3>
            <p className="text-xs sm:text-sm text-black/75 font-normal leading-relaxed">{agent.desc}</p>
          </div>

          <div className="mt-6 pt-4 border-t border-black/[0.04]">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
              <span className="text-[10px] text-black/25 font-mono min-w-[16px]">{agent.id}</span>
              <span className="text-[11px] text-black/60 font-light flex-1">{agent.title}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
