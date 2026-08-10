"use client"

import React, { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/lib/language-context"
import { PixelIcon } from "@/components/pixel-icon"

interface AccordionItemData {
  id: number
  n: string
  title: string
  subtitle: string
  description: string
  tag: string
  iconType: "platform" | "agents" | "integrations" | "pricing"
  points: string[]
}

export function LandingAccordionItem() {
  const { language } = useLanguage()
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const items: AccordionItemData[] = [
    {
      id: 1,
      n: "01",
      title: language === "es" ? "Libranza & Bancos con Agentes de IA" : "Payroll Loans & Banking with AI Agents",
      subtitle: "IA & FINANCIERO",
      description: language === "es"
        ? "Agentes de IA entrenados en normatividad bancaria y Ley 1527. Evalúan capacidad de endeudamiento y orquestan venta consultiva de libranzas y tarjetas de crédito por pagaduría."
        : "AI Agents trained on Law 1527 and banking. They evaluate debt capacity and orchestrate consultative sales by paymaster.",
      tag: "AGENTES DE IA & LIBRANZAS",
      iconType: "platform",
      points: [
        language === "es" ? "Agente RAG evalúa Capacidad Ley 1527" : "RAG Agent evaluates Law 1527 Capacity",
        language === "es" ? "Segmentación por Pagadurías" : "Paymaster Segmentation",
        language === "es" ? "Orquestación Outbound por WhatsApp & Llamadas" : "Outbound Orchestration via WhatsApp & Calls",
      ],
    },
    {
      id: 2,
      n: "02",
      title: language === "es" ? "Prepagada & Salud con Orquestación IA" : "Prepaid Health & AI Orchestration",
      subtitle: "IA & SALUD",
      description: language === "es"
        ? "Orquestación comercial con Agentes de IA para venta consultiva de medicina prepagada, planes complementarios, asistencia médica domiciliaria y servicio odontológico en casa."
        : "Commercial orchestration with AI Agents for consultative sales of prepaid medicine, home medical care, and dental plans.",
      tag: "AGENTES DE IA & SALUD",
      iconType: "agents",
      points: [
        language === "es" ? "Agente Consultivo de Prepagada & Asistencia" : "Consultative Prepaid & Assistance Agent",
        language === "es" ? "Orquestación de Citas Médicas & Domicilio" : "Home & Medical Appointment Orchestration",
        language === "es" ? "Manejo Inteligente de Objeciones en Salud" : "Intelligent Health Objection Handling",
      ],
    },
    {
      id: 3,
      n: "03",
      title: language === "es" ? "Prospección IA Directa sobre +4M" : "Direct AI Outreach on +4M Data",
      subtitle: "IA & DATOS PROPIOS (+4M)",
      description: language === "es"
        ? "Agentes de IA ejecutando contacto directo sobre infraestructura propia de más de 4 millones de registros calificados por 5 variables comerciales clave."
        : "AI Agents performing direct contact over proprietary database of 4M+ records qualified across 5 key criteria.",
      tag: "DATOS PROPIOS CON IA (+4M)",
      iconType: "integrations",
      points: [
        language === "es" ? "Calificación Inteligente de Contactos" : "Intelligent Contact Qualification",
        language === "es" ? "Segmentación por Depto, Edad, Género e Ingresos" : "Segmented by Location, Age, Gender & Income",
        language === "es" ? "Orquestador de Reactivación de Bases" : "Database Reactivation Orchestrator",
      ],
    },
    {
      id: 4,
      n: "04",
      title: language === "es" ? "Comercialización Directa por Agentes IA" : "Direct Sales by AI Agents",
      subtitle: "MODALIDAD DELEGADA",
      description: language === "es"
        ? "Asumimos la comercialización directa de tu oferta con nuestro Sistema de Orquestación y Agentes de IA autónomos hasta el cierre y despacho."
        : "We assume direct sales of your offer using our Orchestration System and AI Agents through closing & dispatch.",
      tag: "SISTEMA AUTÓNOMO DELEGADO",
      iconType: "pricing",
      points: [
        language === "es" ? "Sistema de Orquestación Outbound" : "Outbound Orchestration System",
        language === "es" ? "Agentes de IA en Presentación & Cierre" : "AI Agents handling Pitch & Closing",
        language === "es" ? "Cierre, Validación & Despacho Automático" : "Automatic Closing, Validation & Dispatch",
      ],
    },
    {
      id: 5,
      n: "05",
      title: language === "es" ? "Instalación In-House del Sistema de IA" : "In-House AI System Setup",
      subtitle: "MODALIDAD IN-HOUSE",
      description: language === "es"
        ? "Diseñamos e instalamos la arquitectura de Agentes de IA y Orquestación Comercial RAG dentro de la propia operación e infraestructura del cliente."
        : "We design and install the AI Agents architecture and RAG Commercial Orchestration inside the client's operation.",
      tag: "ARQUITECTURA DE IA IN-HOUSE",
      iconType: "platform",
      points: [
        language === "es" ? "Transferencia de Agentes & RAG" : "AI Agents & RAG Tech Transfer",
        language === "es" ? "Modelos Entrenados con tu Marca & CRM" : "Trained Models with your Brand & CRM",
        language === "es" ? "Operación Autónoma Interna 24/7" : "Internal Autonomous Operation 24/7",
      ],
    },
  ]

  // Auto-play timer (passes through each card automatically every 3.5 seconds)
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [isPaused, items.length])

  // Scroll-driven activation when scrolling through the section
  useEffect(() => {
    function onScroll() {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const windowHeight = window.innerHeight
      if (rect.top < windowHeight && rect.bottom > 0) {
        const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)))
        const idx = Math.min(items.length - 1, Math.floor(progress * items.length))
        if (!isPaused) {
          setActiveIndex(idx)
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isPaused, items.length])

  return (
    <div
      ref={containerRef}
      className="w-full space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── FULLY RESPONSIVE CAROUSEL ACCORDION CONTAINER ───────────────── */}
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 w-full h-auto md:h-[460px] lg:h-[480px]">
        {items.map((item, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={item.id}
              onClick={() => {
                setActiveIndex(index)
                setIsPaused(true)
              }}
              onMouseEnter={() => {
                setActiveIndex(index)
                setIsPaused(true)
              }}
              className={`
                group relative rounded-2xl overflow-hidden cursor-pointer
                transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                border shadow-sm flex flex-col justify-between
                ${isActive
                  ? "bg-white border-black/20 flex-[4] p-6 sm:p-8"
                  : "bg-[#FAF9F6] border-black/[0.08] hover:bg-white hover:border-black/15 flex-1 p-4 md:p-5"
                }
              `}
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-pixel text-xs font-mono text-black/40 tracking-wider">
                    {item.n}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-0.5 rounded-full font-medium bg-black/[0.06] text-black/80">
                      {item.tag}
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-lg border border-black/10 bg-white flex items-center justify-center shrink-0">
                  <PixelIcon type={item.iconType} size={18} />
                </div>
              </div>

              {/* EXPANDED CONTENT (when active) */}
              {isActive ? (
                <div className="flex flex-col justify-between flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight mb-2.5 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-black/80 font-normal leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Points pill list (Flexible layout, zero text truncation) */}
                  <div className="pt-4 border-t border-black/[0.06] space-y-2">
                    <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-medium">
                      {language === "es" ? "PUNTOS CLAVE DE EJECUCIÓN" : "KEY EXECUTION HIGHLIGHTS"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.points.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/[0.02] border border-black/[0.04]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-[11px] text-black/80 font-normal leading-tight">
                            {pt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* COLLAPSED CONTENT (Sleek vertical structure on desktop, clean row on mobile) */
                <div className="flex-1 flex flex-col justify-between pt-2">
                  {/* Desktop Collapsed View: Vertical Writing Mode Title */}
                  <div className="hidden md:flex flex-col items-center justify-between h-full py-2">
                    <div className="flex-1 flex items-center justify-center w-full my-auto">
                      <span className="text-xs font-medium text-[#111] uppercase tracking-wider whitespace-nowrap [writing-mode:vertical-rl] rotate-180 opacity-60 group-hover:opacity-100 transition-opacity">
                        {item.title}
                      </span>
                    </div>
                    <div className="w-6 h-6 rounded-md bg-black/[0.04] flex items-center justify-center text-black/40 group-hover:bg-black/10 group-hover:text-black/80 transition-colors mt-2">
                      &rarr;
                    </div>
                  </div>

                  {/* Mobile Collapsed View: Clean Horizontal Row */}
                  <div className="md:hidden flex items-center justify-between py-2 border-t border-black/[0.04]">
                    <h4 className="text-sm font-medium text-[#111] truncate pr-2">
                      {item.title}
                    </h4>
                    <span className="text-xs text-emerald-600 font-mono font-medium">&rarr;</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── CAROUSEL CONTROLS & PROGRESS INDICATOR ──────────────────────── */}
      <div className="flex items-center justify-between pt-2 px-1">
        <div className="flex items-center gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveIndex(i)
                setIsPaused(true)
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-8 bg-[#111]" : "w-2 bg-black/20 hover:bg-black/40"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest">
            {language === "es" ? "AUTOPLAY EN SCROLL" : "AUTOPLAY ON SCROLL"}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
                setIsPaused(true)
              }}
              className="w-7 h-7 rounded-lg border border-black/10 bg-white flex items-center justify-center text-xs text-black/60 hover:bg-black/5"
            >
              &larr;
            </button>
            <button
              onClick={() => {
                setActiveIndex((prev) => (prev + 1) % items.length)
                setIsPaused(true)
              }}
              className="w-7 h-7 rounded-lg border border-black/10 bg-white flex items-center justify-center text-xs text-black/60 hover:bg-black/5"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
