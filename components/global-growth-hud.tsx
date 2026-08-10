"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { TrendingUp, ArrowUpRight, ChevronDown } from "lucide-react"

export function GlobalGrowthHUD() {
  const { language } = useLanguage()
  const [scrollPct, setScrollPct] = useState(0)
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight <= 0) return
      const current = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100))
      setScrollPct(current)

      // Section stage detection based on scroll height %
      if (current < 25) setActiveStage(0)
      else if (current < 55) setActiveStage(1)
      else if (current < 80) setActiveStage(2)
      else setActiveStage(3)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Dynamic calculated metrics based on current scroll position
  const currentSales = Math.round((scrollPct / 100) * 340)
  const currentLeads = Math.round(50000 + (scrollPct / 100) * 481802)

  const stages = [
    { name: language === "es" ? "PUNTO CERO: INICIO" : "ZERO POINT: START", tag: "0%" },
    { name: language === "es" ? "CANAL DE VENTAS IA" : "AI SALES CHANNEL", tag: "+150%" },
    { name: language === "es" ? "ESCALA DE CAPACIDAD" : "CAPACITY SCALE", tag: "+280%" },
    { name: language === "es" ? "MÁXIMA EFICIENCIA" : "MAX EFFICIENCY", tag: "+340%" },
  ]

  return (
    <>
      {/* ── FIXED RIGHT DYNAMIC HUD PANEL ───────────────────────────────── */}
      <div className="fixed top-24 right-4 sm:right-8 z-40 hidden md:flex flex-col items-end pointer-events-none select-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl p-4 shadow-xl transition-all duration-300 w-64 space-y-3">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-semibold">
                {language === "es" ? "TRAYECTORIA EN VIVO" : "LIVE TRAJECTORY"}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {Math.round(scrollPct)}%
            </span>
          </div>

          {/* Dynamic 3D Arrow Visual Indicator */}
          <div className="relative h-16 w-full rounded-xl bg-black/[0.03] border border-black/[0.04] p-3 overflow-hidden flex items-center justify-between">
            {/* SVG Dynamic Rising Arrow Graph */}
            <svg className="absolute inset-0 w-full h-full p-2 text-emerald-500" viewBox="0 0 100 40" fill="none">
              <path
                d="M 5 35 Q 30 30, 50 20 T 95 5"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="100"
                strokeDashoffset={100 - scrollPct}
                strokeLinecap="round"
                className="transition-all duration-150 ease-out"
              />
            </svg>

            {/* Live Counter */}
            <div className="relative z-10 space-y-0.5">
              <span className="text-[9px] font-mono text-black/40 uppercase block">
                {language === "es" ? "CRECIMIENTO ACUMULADO" : "ACCUMULATED GROWTH"}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-medium text-[#111]">
                  +{currentSales}%
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600 animate-pulse" />
              </div>
            </div>

            {/* Floating Arrow Icon that moves upwards */}
            <div
              className="relative z-10 w-8 h-8 rounded-lg bg-[#111] text-white flex items-center justify-center shadow-sm transition-transform duration-150"
              style={{
                transform: `translateY(${- (scrollPct / 100) * 12}px) rotate(${Math.min(45, (scrollPct / 100) * 45)}deg)`
              }}
            >
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Submetrics */}
          <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-black/60">
            <span>{language === "es" ? "Contactos:" : "Leads:"}</span>
            <span className="font-bold text-[#111]">{currentLeads.toLocaleString()}</span>
          </div>

          {/* Current Stage Indicator */}
          <div className="text-[10px] font-mono p-2 rounded-lg bg-black/[0.03] border border-black/[0.04] text-black/70 flex items-center justify-between">
            <span className="truncate">{stages[activeStage].name}</span>
            <ChevronDown className="w-3 h-3 text-black/40 animate-bounce shrink-0" />
          </div>

        </div>
      </div>

      {/* ── MOBILE TOP FLOATING RIBBON BAR ──────────────────────────────── */}
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden pointer-events-none">
        <div className="pointer-events-auto bg-[#111] text-white rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-white/50 uppercase">CRECIMIENTO EN VIVO</div>
              <div className="text-xs font-mono font-bold text-white">+{currentSales}% VENTAS</div>
            </div>
          </div>

          <a
            href="#agendar"
            className="px-3.5 py-1.5 rounded-xl bg-white text-[#111] text-[11px] font-mono uppercase font-bold tracking-wider hover:bg-white/90 transition-colors"
          >
            AGENDAR &rarr;
          </a>
        </div>
      </div>
    </>
  )
}
