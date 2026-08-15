"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import SalesIndicator from "@/components/ui/sales-indicator"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface ScrollSalesProps {
  sections: {
    id: string
    badge?: string
    title: string
    subtitle?: string
    description: string
    align?: "left" | "center" | "right"
    features?: { title: string; description: string }[]
    actions?: { label: string; variant: "primary" | "secondary"; onClick?: () => void }[]
  }[]
  indicatorConfig?: {
    positions: {
      top: string
      left: string
      scale: number
    }[]
  }
  className?: string
}

const defaultIndicatorConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.1 }, // Section 0: Right
    { top: "30%", left: "50%", scale: 1.0 }, // Section 1: Center top
    { top: "45%", left: "80%", scale: 1.2 }, // Section 2: Right medium
    { top: "50%", left: "50%", scale: 1.3 }, // Section 3: Center large
  ],
}

const parsePercent = (str: string): number => parseFloat(str.replace("%", ""))

export function ScrollSalesSection({ sections, indicatorConfig = defaultIndicatorConfig, className }: ScrollSalesProps) {
  const { language } = useLanguage()
  const [activeSection, setActiveSection] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [transformStyle, setTransformStyle] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLElement | null)[]>([])
  const animationFrameId = useRef<number>(0)

  const calculatedPositions = useMemo(() => {
    return indicatorConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale,
    }))
  }, [indicatorConfig.positions])

  const updateScrollPosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const totalHeight = containerRef.current.clientHeight - window.innerHeight
    if (totalHeight <= 0) return

    const currentScroll = -rect.top
    const progress = Math.min(Math.max(currentScroll / totalHeight, 0), 1)
    setScrollProgress(progress)

    const viewportCenter = window.innerHeight / 2
    let newActiveSection = 0
    let minDistance = Infinity

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const sRect = ref.getBoundingClientRect()
        const sectionCenter = sRect.top + sRect.height / 2
        const distance = Math.abs(sectionCenter - viewportCenter)
        if (distance < minDistance) {
          minDistance = distance
          newActiveSection = index
        }
      }
    })

    const currentPos = calculatedPositions[newActiveSection] || calculatedPositions[0]
    const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`
    setTransformStyle(transform)
    setActiveSection(newActiveSection)
  }, [calculatedPositions])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    updateScrollPosition()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [updateScrollPosition])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full overflow-hidden bg-[#FAF9F6] text-[#111] border-t border-black/[0.06]", className)}
    >
      {/* Top Scroll Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-black/[0.05] z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-[#111] transition-transform duration-150 ease-out"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* Floating Sales Indicator Widget - Absolute inside container, sticky when in view */}
      <div
        className="sticky top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] hidden md:block float-right mr-12 lg:mr-24"
        style={{
          transform: `scale3d(${calculatedPositions[activeSection]?.scale || 1}, ${calculatedPositions[activeSection]?.scale || 1}, 1)`,
        }}
      >
        <SalesIndicator scrollProgress={scrollProgress} activeSection={activeSection} />
      </div>

      {/* Dynamic Sections */}
      {sections.map((section, index) => (
        <section
          key={section.id}
          ref={el => { sectionRefs.current[index] = el }}
          className={cn(
            "relative min-h-[90vh] flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-16 sm:py-24 z-20 border-b border-black/[0.04]",
            section.align === "center" && "items-center text-center",
            section.align === "right" && "items-end text-right",
            (!section.align || section.align === "left") && "items-start text-left"
          )}
        >
          <div className="w-full max-w-xl lg:max-w-2xl space-y-6">
            {section.badge && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono tracking-widest text-black/50 bg-black/[0.05] font-medium uppercase">
                {section.badge}
              </span>
            )}

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium text-[#111] tracking-tight leading-[1.08]">
              {section.title}
              {section.subtitle && (
                <span className="block text-black/50 text-xl sm:text-2xl mt-1 font-normal">
                  {section.subtitle}
                </span>
              )}
            </h2>

            <p className="text-sm sm:text-base text-black/75 font-normal leading-relaxed">
              {section.description}
            </p>

            {/* Mobile inline indicator widget */}
            <div className="md:hidden pt-4">
              <SalesIndicator scrollProgress={scrollProgress} activeSection={activeSection} />
            </div>

            {section.features && (
              <div className="grid gap-3 pt-2">
                {section.features.map(feat => (
                  <div key={feat.title} className="p-4 rounded-xl bg-white border border-black/[0.06] shadow-xs">
                    <div className="text-xs font-semibold text-[#111] font-mono">{feat.title}</div>
                    <div className="text-xs text-black/60 font-normal mt-0.5">{feat.description}</div>
                  </div>
                ))}
              </div>
            )}

            {section.actions && (
              <div className="flex flex-wrap gap-3 pt-4">
                {section.actions.map(act => (
                  <button
                    key={act.label}
                    onClick={act.onClick}
                    className={cn(
                      "px-6 py-3 rounded-xl text-xs font-mono uppercase tracking-widest transition-all font-medium",
                      act.variant === "primary"
                        ? "bg-[#111] text-white hover:bg-black/80 shadow-xs"
                        : "bg-white border border-black/15 text-[#111] hover:bg-black/[0.04]"
                    )}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
