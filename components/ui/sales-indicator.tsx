"use client"

import React from "react"

interface SalesIndicatorProps {
  scrollProgress: number // 0 to 1
  activeSection: number
}

export default function SalesIndicator({ scrollProgress, activeSection }: SalesIndicatorProps) {
  // Sales scale from $50,000 USD to $4,200,000 USD (or 0% to 100% capacity)
  const minSales = 50000
  const maxSales = 4200000
  const currentSales = Math.round(minSales + (maxSales - minSales) * scrollProgress)
  const currentPercent = Math.round(scrollProgress * 100)

  const sectionBadges = [
    "MIN: Inicio de Prospección",
    "Escala de Algoritmos IA",
    "Conversión Directa (+4M)",
    "MÁXIMO: Canal Autoliquidable",
  ]

  return (
    <div className="flex items-center justify-center p-2 select-none">
      <div className="relative w-64 sm:w-72 md:w-80 rounded-2xl border border-black/15 bg-white/95 backdrop-blur-md p-6 shadow-2xl transition-all duration-300">
        
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-medium">
              DESPLIEGUE COMERCIAL
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/[0.06] text-black/80">
            {currentPercent}% MÁX
          </span>
        </div>

        {/* Big Sales Counter */}
        <div className="space-y-1 mb-4">
          <div className="text-[10px] font-mono text-black/40 uppercase tracking-wider">
            Ventas Generadas (Acumulado)
          </div>
          <div className="text-3xl sm:text-4xl font-light text-[#111] font-mono tracking-tight">
            ${currentSales.toLocaleString()} <span className="text-xs text-black/40 font-sans">USD</span>
          </div>
        </div>

        {/* Dynamic Sales Progress Bar (Min to Max) */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-black/60">
            <span>MÍN ($50K)</span>
            <span>MÁX ($4.2M)</span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-black/[0.06] overflow-hidden border border-black/[0.04]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-[#111] rounded-full transition-all duration-150 ease-out"
              style={{ width: `${Math.max(4, currentPercent)}%` }}
            />
          </div>
        </div>

        {/* Active Stage Indicator */}
        <div className="p-3 rounded-xl bg-[#FAF9F6] border border-black/[0.06] flex items-center justify-between">
          <div className="text-[10px] font-mono text-black/50 uppercase">Etapa Actual</div>
          <div className="text-[11px] font-mono font-semibold text-[#111]">
            {sectionBadges[activeSection] || sectionBadges[0]}
          </div>
        </div>

      </div>
    </div>
  )
}
