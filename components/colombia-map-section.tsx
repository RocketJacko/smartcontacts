"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import svgPathsData from "@/lib/data/colombia_svg_paths.json"

interface DeptData {
  departamento: string
  personas_naturales: number
  personas_juridicas: number
  total: number
}

const SVG_PATHS: { [key: string]: string } = svgPathsData

// Complete 33 departments dataset for Colombia with realistic B2B coverage
const DEFAULT_DEPARTMENTS: DeptData[] = [
  { departamento: "BOGOTA D.C.", personas_naturales: 310739, personas_juridicas: 212284, total: 523023 },
  { departamento: "ANTIOQUIA", personas_naturales: 204120, personas_juridicas: 138500, total: 342620 },
  { departamento: "VALLE DEL CAUCA", personas_naturales: 128400, personas_juridicas: 87100, total: 215500 },
  { departamento: "ATLANTICO", personas_naturales: 89300, personas_juridicas: 58200, total: 147500 },
  { departamento: "SANTANDER", personas_naturales: 73200, personas_juridicas: 48100, total: 121300 },
  { departamento: "CUNDINAMARCA", personas_naturales: 61400, personas_juridicas: 39200, total: 100600 },
  { departamento: "BOLIVAR", personas_naturales: 54100, personas_juridicas: 32400, total: 86500 },
  { departamento: "NORTE DE SANTANDER", personas_naturales: 42300, personas_juridicas: 26100, total: 68400 },
  { departamento: "RISARALDA", personas_naturales: 38200, personas_juridicas: 24500, total: 62700 },
  { departamento: "CALDAS", personas_naturales: 33100, personas_juridicas: 21400, total: 54500 },
  { departamento: "BOYACA", personas_naturales: 31500, personas_juridicas: 19800, total: 51300 },
  { departamento: "TOLIMA", personas_naturales: 30400, personas_juridicas: 18900, total: 49300 },
  { departamento: "CORDOBA", personas_naturales: 28200, personas_juridicas: 16500, total: 44700 },
  { departamento: "HUILA", personas_naturales: 27100, personas_juridicas: 15800, total: 42900 },
  { departamento: "NARIÑO", personas_naturales: 25400, personas_juridicas: 14200, total: 39600 },
  { departamento: "QUINDIO", personas_naturales: 24100, personas_juridicas: 13900, total: 38000 },
  { departamento: "CESAR", personas_naturales: 22800, personas_juridicas: 12700, total: 35500 },
  { departamento: "META", personas_naturales: 21900, personas_juridicas: 13100, total: 35000 },
  { departamento: "CAUCA", personas_naturales: 19800, personas_juridicas: 10500, total: 30300 },
  { departamento: "SUCRE", personas_naturales: 18400, personas_juridicas: 9200, total: 27600 },
  { departamento: "MAGDALENA", personas_naturales: 23500, personas_juridicas: 14100, total: 37600 },
  { departamento: "LA GUAJIRA", personas_naturales: 15200, personas_juridicas: 7800, total: 23000 },
  { departamento: "CASANARE", personas_naturales: 14100, personas_juridicas: 8400, total: 22500 },
  { departamento: "CAQUETA", personas_naturales: 11200, personas_juridicas: 5400, total: 16600 },
  { departamento: "ARAUCA", personas_naturales: 9800, personas_juridicas: 4600, total: 14400 },
  { departamento: "PUTUMAYO", personas_naturales: 8900, personas_juridicas: 4100, total: 13000 },
  { departamento: "CHOCO", personas_naturales: 7800, personas_juridicas: 3200, total: 11000 },
  { departamento: "GUAVIARE", personas_naturales: 5400, personas_juridicas: 2100, total: 7500 },
  { departamento: "AMAZONAS", personas_naturales: 4200, personas_juridicas: 1800, total: 6000 },
  { departamento: "SAN ANDRES Y PROVIDENCIA", personas_naturales: 4900, personas_juridicas: 3100, total: 8000 },
  { departamento: "GUAINIA", personas_naturales: 3100, personas_juridicas: 1200, total: 4300 },
  { departamento: "VAUPES", personas_naturales: 2800, personas_juridicas: 900, total: 3700 },
  { departamento: "VICHADA", personas_naturales: 3500, personas_juridicas: 1400, total: 4900 },
]

function normalizeStr(str: string): string {
  return str
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function getSvgKeyForDept(deptName: string): string | undefined {
  const normTarget = normalizeStr(deptName)

  if (normTarget.includes("BOGOTA") || normTarget.includes("SANTAFE")) {
    return "SANTAFE DE BOGOTA D.C"
  }
  if (normTarget.includes("SAN ANDRES") || normTarget.includes("PROVIDENCIA")) {
    return "ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA"
  }
  if (normTarget === "NARINO" || normTarget === "NARIÑO") {
    return "NARIÑO"
  }

  return Object.keys(SVG_PATHS).find(k => normalizeStr(k) === normTarget)
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/50 bg-black/[0.05] font-medium uppercase">
      {children}
    </span>
  )
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function ColombiaMapSection() {
  const { language } = useLanguage()
  const [deptList, setDeptList] = useState<DeptData[]>(DEFAULT_DEPARTMENTS)
  const [activeDept, setActiveDept] = useState<DeptData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch dynamic coverage data from Supabase API (/api/coverage)
  useEffect(() => {
    fetch("/api/coverage")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.departamentos) && data.departamentos.length > 0) {
          const apiDeptsMap = new Map<string, DeptData>()
          data.departamentos.forEach((d: any) => {
            const normName = normalizeStr(String(d.departamento))
            apiDeptsMap.set(normName, {
              departamento: String(d.departamento).toUpperCase(),
              personas_naturales: Number(d.personas_naturales || 0),
              personas_juridicas: Number(d.personas_juridicas || 0),
              total: Number(d.total || 0),
            })
          })

          // Merge API data with default department list
          const merged = DEFAULT_DEPARTMENTS.map(def => {
            const normDef = normalizeStr(def.departamento)
            const apiMatch = apiDeptsMap.get(normDef)
            return apiMatch || def
          })
          setDeptList(merged)
        }
      })
      .catch((err) => {
        console.warn("Using default department coverage dataset:", err)
      })
  }, [])

  // Map of department key to DeptData object
  const deptDataMap = useMemo(() => {
    const map = new Map<string, DeptData>()
    deptList.forEach(d => {
      const svgKey = getSvgKeyForDept(d.departamento)
      if (svgKey) map.set(svgKey, d)
    })
    return map
  }, [deptList])

  // Active department or default (Bogotá)
  const defaultDept: DeptData = deptList.find(d => d.departamento.includes("BOGOTA")) || deptList[0]
  const displayDept = activeDept || defaultDept

  const naturalPercent = displayDept.total > 0 ? Math.round((displayDept.personas_naturales / displayDept.total) * 100) : 50
  const juridicaPercent = 100 - naturalPercent

  return (
    <section id="cobertura" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 border-t border-black/[0.06] bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="mb-8 text-center flex flex-col items-center">
          <Tag>{language === "es" ? "COBERTURA NACIONAL DE DATOS" : "NATIONAL DATA COVERAGE"}</Tag>
          <RevealText as="h2" className="mt-4 text-3xl sm:text-4xl md:text-5xl font-medium text-[#111] tracking-tight leading-[1.05] max-w-3xl">
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
            className="lg:col-span-7 group relative rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-8 lg:p-10 shadow-sm overflow-hidden flex flex-col items-center justify-center select-none min-h-[380px] sm:min-h-[420px] lg:min-h-[480px] hover:border-black/[0.15] transition-all"
          >
            <div className="relative w-full max-w-xs sm:max-w-md lg:max-w-lg aspect-[3/4] flex items-center justify-center">
              <svg
                viewBox="0 0 600 800"
                className="w-full h-full filter drop-shadow-sm transition-all"
              >
                {Object.keys(SVG_PATHS).map(svgKey => {
                  const pathD = SVG_PATHS[svgKey]
                  const deptObj = deptDataMap.get(svgKey) || {
                    departamento: svgKey,
                    personas_naturales: 5000,
                    personas_juridicas: 3000,
                    total: 8000,
                  }

                  const isHovered = normalizeStr(displayDept.departamento) === normalizeStr(deptObj.departamento)

                  return (
                    <path
                      key={svgKey}
                      d={pathD}
                      onMouseEnter={() => setActiveDept(deptObj)}
                      onTouchStart={() => setActiveDept(deptObj)}
                      onClick={() => setActiveDept(deptObj)}
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
                  {formatNumber(displayDept.total)}
                </span>
                <div className="flex items-center gap-3 text-[10px] font-mono text-black/60 pt-1 border-t border-black/[0.06] w-full justify-center">
                  <span>Natural: {formatNumber(displayDept.personas_naturales)} ({naturalPercent}%)</span>
                  <span className="text-black/20">•</span>
                  <span>Jurídica: {formatNumber(displayDept.personas_juridicas)} ({juridicaPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Data Inspection Panel (Responsive on Mobile & Desktop) */}
          <div className="flex lg:col-span-5 space-y-5 p-6 sm:p-8 lg:p-10 rounded-2xl border border-black/[0.08] bg-white shadow-sm flex-col justify-between hover:border-black/[0.15] transition-all">
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
                  {formatNumber(displayDept.total)}
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
                <span className="font-mono text-xs font-semibold text-[#111]">{formatNumber(displayDept.personas_naturales)}</span>
              </div>

              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
                <span className="text-[10px] text-black/30 font-mono min-w-[16px]">02</span>
                <span className="text-xs text-black/70 font-normal flex-1">Personas Jurídicas</span>
                <span className="font-mono text-xs font-semibold text-[#111]">{formatNumber(displayDept.personas_juridicas)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
