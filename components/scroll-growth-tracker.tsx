"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { TrendingUp, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react"

export function ScrollGrowthTracker() {
  const { language } = useLanguage()
  const [scrollProgress, setScrollProgress] = useState(0) // 0 to 1
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = Math.min(1, Math.max(0, window.scrollY / totalHeight))
        setScrollProgress(currentProgress)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculation metrics
  const pct = Math.round(scrollProgress * 100)
  const salesGrowth = Math.round(scrollProgress * 340)
  const leadsContacted = Math.round(5000 + scrollProgress * 526802)

  // Stage stages
  let stageName = language === "es" ? "Punto Cero (Nómina Tradicional)" : "Zero Point (Traditional Staff)"
  if (scrollProgress > 0.25 && scrollProgress <= 0.55) {
    stageName = language === "es" ? "Base de Datos Propia (+4M)" : "Proprietary Dataset (+4M)"
  } else if (scrollProgress > 0.55 && scrollProgress <= 0.85) {
    stageName = language === "es" ? "Agentes IA Outbound 24/7" : "24/7 Outbound AI Agents"
  } else if (scrollProgress > 0.85) {
    stageName = language === "es" ? "Escala Agéntica Máxima 10X" : "Maximum 10X Agentic Scale"
  }

  // 5 bar heights for 3D-like growth step visual
  const barHeights = [20, 40, 60, 80, 100]

  return (
    <div className="fixed bottom-5 right-5 z-50 select-none transition-all duration-300">
      <div className={`rounded-2xl border border-black/15 bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 ${
        isMinimized ? "w-48 p-3" : "w-72 sm:w-80 p-5"
      }`}>
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[10px] font-mono text-black/60 uppercase tracking-widest font-semibold">
              {language === "es" ? "PROYECCIÓN EN VIVO" : "LIVE SCROLL GROWTH"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-black/40 hover:text-black p-1 rounded-md transition-colors"
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Minimized View */}
        {isMinimized ? (
          <div className="flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>+{salesGrowth}%</span>
            </div>
            <span className="text-[10px] text-black/40">{pct}% DOC</span>
          </div>
        ) : (
          /* Expanded View with 3D Ascending Bars and Dynamic Arrow */
          <div className="space-y-4">
            
            {/* 3D Ascending Bars Chart with Animated Arrow */}
            <div className="relative pt-6 pb-2 px-2 bg-black/[0.02] rounded-xl border border-black/[0.04]">
              
              {/* Dynamic Floating Arrow following scroll percentage */}
              <div
                className="absolute transition-all duration-200 ease-out z-10 flex flex-col items-center"
                style={{
                  left: `${Math.min(82, Math.max(8, pct))}%`,
                  bottom: `${Math.min(85, Math.max(15, pct * 0.75 + 15))}%`,
                }}
              >
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold shadow-md whitespace-nowrap">
                  <span>+{salesGrowth}%</span>
                  <ArrowUpRight className="w-3 h-3 stroke-[3]" />
                </div>
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-emerald-600 -mt-0.5" />
              </div>

              {/* 5 Ascending Bar Steps */}
              <div className="h-16 flex items-end justify-between gap-1.5 px-2">
                {barHeights.map((h, i) => {
                  const stepActive = pct >= i * 20
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          stepActive
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400 border-t-2 border-emerald-300 shadow-sm"
                            : "bg-black/[0.08]"
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Min to Max scale label */}
              <div className="flex items-center justify-between text-[9px] font-mono text-black/40 mt-2 px-1">
                <span>0% (CERO)</span>
                <span>50%</span>
                <span>100% (MÁX)</span>
              </div>
            </div>

            {/* Live Metrics */}
            <div className="space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-black/50 text-[10px] uppercase">{language === "es" ? "ETAPA SEGÚN SCROLL:" : "SCROLL STAGE:"}</span>
                <span className="font-semibold text-[#111] text-[11px] truncate max-w-[170px]">{stageName}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-black/[0.03] border border-black/[0.04]">
                <span className="text-[10px] text-black/50 uppercase">{language === "es" ? "Contactos Activos" : "Active Leads"}</span>
                <span className="text-xs font-bold text-[#111]">{leadsContacted.toLocaleString()}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
