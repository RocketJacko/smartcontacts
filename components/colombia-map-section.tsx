"use client"

import React, { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PixelIcon } from "@/components/pixel-icon"
import svgPathsData from "@/lib/data/colombia_svg_paths.json"
import { Loader2 } from "lucide-react"

interface DeptData {
  departamento: string
  personas_naturales: number
  personas_juridicas: number
  total: number
}

const SVG_PATHS: { [key: string]: string } = svgPathsData

function getSvgKeyForDept(deptName: string): string | undefined {
  if (deptName === "BOGOTA D.C.") return "SANTAFE DE BOGOTA D.C"
  if (deptName === "SAN ANDRES Y PROVIDENCIA") return "ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA"
  if (deptName === "NARINO") return "NARIÑO"
  return Object.keys(SVG_PATHS).find(
    k => k === deptName || k.normalize("NFD").replace(/[\u0300-\u036f]/g, "") === deptName.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/50 bg-black/[0.05] font-medium uppercase">
      {children}
    </span>
  )
}

export function ColombiaMapSection() {
  const { language } = useLanguage()
  const [deptList, setDeptList] = useState<DeptData[]>([])
  const [activeDept, setActiveDept] = useState<DeptData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch dynamic coverage data from Supabase API (/api/coverage)
  useEffect(() => {
    fetch("/api/coverage")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.departamentos) && data.departamentos.length > 0) {
          const mapped = data.departamentos.map((d: any) => ({
            departamento: String(d.departamento),
            personas_naturales: Number(d.personas_naturales || 0),
            personas_juridicas: Number(d.personas_juridicas || 0),
            total: Number(d.total || 0),
          }))
          setDeptList(mapped)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.warn("Error fetching dynamic coverage:", err)
        setIsLoading(false)
      })
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  // Dynamic selected department or fallback to Bogota
  const defaultDept: DeptData = deptList.find(d => d.departamento === "BOGOTA D.C.") || deptList[0] || {
    departamento: "BOGOTA D.C.",
    personas_naturales: 310739,
    personas_juridicas: 212284,
    total: 523023
  }
  const displayDept = activeDept || defaultDept

  const naturalPercent = displayDept.total > 0 ? Math.round((displayDept.personas_naturales / displayDept.total) * 100) : 50
  const juridicaPercent = 100 - naturalPercent

  return (
    <section id="cobertura" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 border-t border-black/[0.06] bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Tag>{language === "es" ? "COBERTURA NACIONAL DE DATOS" : "NATIONAL DATA COVERAGE"}</Tag>
          <RevealText className="mt-4 text-3xl sm:text-4xl md:text-5xl font-medium text-[#111] tracking-tight leading-[1.05] max-w-3xl">
            {language === "es"
              ? "Segmentación por Departamentos en Colombia"
              : "Departmental Segmentation in Colombia"}
          </RevealText>
          <p className="mt-3 text-sm sm:text-base text-black/70 font-normal leading-relaxed max-w-2xl">
            {language === "es"
              ? "Explora el desglose en tiempo real de personas naturales y jurídicas seleccionando cualquier departamento en el mapa."
              : "Explore real-time counts of natural and legal entities by selecting any department on the map."}
          </p>
        </div>

        {/* Layout: Interactive SVG Map (Left) + Executive Data Inspector Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-stretch">
          
          {/* SVG Vector Map Container */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="lg:col-span-7 group relative rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-8 lg:p-10 shadow-sm overflow-hidden flex flex-col items-center justify-center select-none min-h-[380px] sm:min-h-[420px] lg:min-h-[480px] hover:border-black/[0.15] transition-all"
          >
            <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg aspect-[3/4] flex items-center justify-center">
              <svg
                viewBox="0 0 600 800"
                className="w-full h-full filter drop-shadow-sm transition-all"
              >
                {(deptList.length > 0 ? deptList : Object.keys(SVG_PATHS).map(k => ({ departamento: k, personas_naturales: 0, personas_juridicas: 0, total: 0 }))).map(dept => {
                  const svgKey = getSvgKeyForDept(dept.departamento)
                  if (!svgKey || !SVG_PATHS[svgKey]) return null

                  const isHovered = displayDept.departamento === dept.departamento

                  return (
                    <path
                      key={dept.departamento}
                      d={SVG_PATHS[svgKey]}
                      onMouseEnter={() => setActiveDept(dept)}
                      onTouchStart={() => setActiveDept(dept)}
                      onClick={() => setActiveDept(dept)}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        fill: isHovered ? "#111111" : "#F0EEE8",
                        stroke: isHovered ? "#000000" : "rgba(0, 0, 0, 0.15)",
                        strokeWidth: isHovered ? 1.8 : 0.8,
                        opacity: isHovered ? 1 : 0.92,
                      }}
                    />
                  )
                })}
              </svg>
            </div>

            {/* Mobile Centered Indicator Pill (Hidden on Desktop) */}
            <div className="lg:hidden mt-4 w-full text-center flex items-center justify-center">
              <div className="inline-flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-black/[0.08] shadow-xs text-center w-full max-w-xs">
                <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-medium">
                  {displayDept.departamento}
                </span>
                <span className="text-2xl font-light font-mono text-[#111] tracking-tight my-0.5">
                  {displayDept.total.toLocaleString()}
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono text-black/60 pt-1 border-t border-black/[0.06] w-full justify-center">
                  <span>Natural: {displayDept.personas_naturales.toLocaleString()} ({naturalPercent}%)</span>
                  <span className="text-black/20">•</span>
                  <span>Jurídica: {displayDept.personas_juridicas.toLocaleString()} ({juridicaPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Executive Data Inspection Panel (Hidden on Mobile) */}
          <div className="hidden lg:flex lg:col-span-5 space-y-5 p-8 lg:p-10 rounded-2xl border border-black/[0.08] bg-white shadow-sm flex-col justify-between hover:border-black/[0.15] transition-all">
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-black/[0.08] pb-4">
                <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-medium">DEPARTAMENTO SELECCIONADO</div>
                <h3 className="text-2xl lg:text-3xl font-medium text-[#111] font-mono tracking-tight mt-1 uppercase">
                  {displayDept.departamento}
                </h3>
              </div>

              {/* Total General Banner */}
              <div className="p-5 rounded-xl bg-[#FAF9F6] border border-black/[0.06] space-y-1">
                <div className="text-[10px] font-mono text-black/50 uppercase tracking-wider">TOTAL REGISTROS DEPARTAMENTO</div>
                <div className="text-3xl lg:text-4xl font-light font-mono text-[#111] tracking-tight">
                  {displayDept.total.toLocaleString()}
                </div>
              </div>

              {/* Proportion Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-black/50">
                  <span>Natural ({naturalPercent}%)</span>
                  <span>Jurídica ({juridicaPercent}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-black/[0.06] overflow-hidden flex border border-black/[0.04]">
                  <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${naturalPercent}%` }} />
                  <div className="h-full bg-black/80 transition-all duration-300" style={{ width: `${juridicaPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Data Rows */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
                <span className="text-[10px] text-black/30 font-mono min-w-[16px]">01</span>
                <span className="text-xs text-black/70 font-normal flex-1">Personas Naturales</span>
                <span className="font-mono text-xs font-semibold text-[#111]">{displayDept.personas_naturales.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
                <span className="text-[10px] text-black/30 font-mono min-w-[16px]">02</span>
                <span className="text-xs text-black/70 font-normal flex-1">Personas Jurídicas</span>
                <span className="font-mono text-xs font-semibold text-[#111]">{displayDept.personas_juridicas.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
