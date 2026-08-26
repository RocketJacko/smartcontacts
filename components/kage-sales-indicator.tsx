"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function KageSalesIndicator() {
  const { language } = useLanguage()
  const [progress, setProgress] = useState(35) // 0 to 100%
  const [isAuto, setIsAuto] = useState(true)

  // Smooth automatic pulse simulation unless user interacts
  useEffect(() => {
    if (!isAuto) return
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 20
        return prev + 1
      })
    }, 80)
    return () => clearInterval(interval)
  }, [isAuto])

  // Calculation metrics based on slider progress
  const contacts = Math.round(50000 + (531802 - 50000) * (progress / 100))
  const salesIncrease = Math.round(15 + (340 - 15) * (progress / 100))
  const costSavings = Math.round((progress / 100) * 85)

  const ticks = [
    { pct: 0, label: language === "es" ? "MÍN (Nómina Manual)" : "MIN (Manual Staff)" },
    { pct: 25, label: language === "es" ? "Perfilado Base" : "Base Profiling" },
    { pct: 50, label: language === "es" ? "Venta Outbound" : "Outbound Sales" },
    { pct: 75, label: language === "es" ? "Cierre Agéntico" : "Agentic Closing" },
    { pct: 100, label: language === "es" ? "MÁXIMO (Escala 10X)" : "MAX (10X Scale)" },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white border border-black/[0.08] shadow-xs select-none space-y-8">
      
      {/* ── HEADER & LIVE METRICS COUNTER ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-black/[0.06]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#111]" />
            <span className="text-[11px] font-mono text-black/75 uppercase tracking-widest font-semibold">
              {language === "es" ? "INDICADOR DE INCREMENTO DE VENTAS" : "SALES INCREMENT INDICATOR"}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-medium text-[#111] tracking-tight">
            {language === "es" ? "Capacidad Comercial & Escala Agéntica" : "Sales Capacity & Agentic Scale"}
          </h2>
        </div>

        {/* Dynamic Metric Display */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-4xl sm:text-5xl font-medium text-[#111] tracking-tight">
            +{salesIncrease}%
          </span>
          <span className="text-xs text-black/75 uppercase tracking-wider font-sans font-medium">
            {language === "es" ? "Ventas Estimadas" : "Estimated Sales"}
          </span>
        </div>
      </div>

      {/* ── DYNAMIC METRIC STRIP ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
          <span className="text-[10px] font-mono text-black/70 uppercase tracking-wider block font-medium">
            {language === "es" ? "PROSPECCIÓN NACIONAL" : "NATIONAL PROSPECTING"}
          </span>
          <span className="text-lg font-mono font-medium text-[#111] mt-1 block">
            {formatNumber(contacts)} {language === "es" ? "Contactos" : "Leads"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
          <span className="text-[10px] font-mono text-black/70 uppercase tracking-wider block font-medium">
            {language === "es" ? "INCREMENTO COMERCIAL" : "SALES GROWTH"}
          </span>
          <span className="text-lg font-mono font-medium text-[#111] mt-1 block">
            +{salesIncrease}% {language === "es" ? "Cierre Directo" : "Direct Closing"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
          <span className="text-[10px] font-mono text-black/70 uppercase tracking-wider block font-medium">
            {language === "es" ? "REDUCCIÓN COSTOS NÓMINA" : "PAYROLL SAVINGS"}
          </span>
          <span className="text-lg font-mono font-medium text-[#111] mt-1 block">
            -{costSavings}% {language === "es" ? "Carga Fija" : "Fixed Cost"}
          </span>
        </div>
      </div>

      {/* ── KAGE STYLE SLIDER & TICK HEAD INDICATOR ─────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs font-mono text-black/75 font-medium">
          <span>{language === "es" ? "MÍNIMO: Prospección Tradicional" : "MIN: Traditional Sales"}</span>
          <span>{language === "es" ? "MÁXIMO: Canal Agéntico 24/7" : "MAX: 24/7 Agentic Channel"}</span>
        </div>

        {/* Track Line with Ticks */}
        <div className="relative py-4">
          <input
            type="range"
            min="0"
            max="100"
            aria-label="Indicador de Proyección de Crecimiento en Ventas"
            value={progress}
            onMouseDown={() => setIsAuto(false)}
            onChange={(e) => {
              setIsAuto(false)
              setProgress(Number(e.target.value))
            }}
            className="w-full h-2 bg-black/[0.08] rounded-full appearance-none cursor-pointer outline-none accent-[#111]"
          />

          {/* Tick lines */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none flex justify-between px-1">
            {ticks.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div className={`w-1 h-3 rounded-full transition-colors ${
                  progress >= t.pct ? "bg-[#111]" : "bg-black/20"
                }`} />
              </div>
            ))}
          </div>
        </div>

        {/* Stage Labels Below Slider */}
        <div className="hidden sm:flex items-center justify-between text-[10px] font-mono text-black/50 tracking-wider">
          {ticks.map((t, idx) => (
            <span key={idx} className={progress >= t.pct ? "text-[#111] font-semibold" : ""}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Subtext */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-black/[0.06] text-[11px] text-black/50 font-mono">
        <span>{language === "es" ? "Arrastra la barra para calcular proyección comercial" : "Drag slider to calculate commercial projection"}</span>
        <button
          type="button"
          onClick={() => setIsAuto(!isAuto)}
          className="text-black/80 hover:text-black font-semibold underline shrink-0"
        >
          {isAuto ? (language === "es" ? "Pausar Animación" : "Pause Auto") : (language === "es" ? "Reproducir Proyección" : "Play Auto")}
        </button>
      </div>

    </div>
  )
}
