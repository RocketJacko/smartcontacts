"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { IntroAnimation, INTRO_DURATION_MS, HERO_REVEAL_MS } from "@/components/intro-animation"
import { StackingPlatformCards } from "@/components/stacking-platform-cards"
import { KageSalesIndicator } from "@/components/kage-sales-indicator"
import { KageModalitiesSection } from "@/components/kage-modalities-section"
import { KageFaqSection } from "@/components/kage-faq-section"
import { BookingSection } from "@/components/booking-section"
import { PixelIcon } from "@/components/pixel-icon"
import { RevealText } from "@/components/reveal-text"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

// ─── Intersection Observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = 16
    const increment = end / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [inView, end])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Bento card ──────────────────────────────────────────────────────────────
function BentoCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView(0.1)
  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl border border-black/[0.07] bg-white overflow-hidden transition-all duration-700 hover:border-black/[0.15] hover:bg-[#fafaf8] ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, border-color 0.3s ease, background-color 0.3s ease`,
      }}
    >
      {/* Hover glow spot */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)" }}
      />
      {children}
    </div>
  )
}

// ─── Pill tag ─────────────────────────────────────────────────────────────────
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-black/75 bg-black/[0.04] border border-black/10 uppercase tracking-widest font-semibold">
      {children}
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AgenticPage() {
  const { t, language } = useLanguage()
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  const handleIntroDone = useCallback(() => {
    setHeroReady(true)
    if (typeof window !== "undefined") {
      const heroElement = document.getElementById("hero")
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }, [])

  // Start video zoom slightly before hero content reveals
  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">

      {/* ── INTRO ANIMATION ───────────────────────────────────────────────── */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* ── STICKY NAV ────────────────────────────────────────────────────── */}
      <MobileNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-[70vh] flex flex-col justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 bg-[#F5F4F0] border-b border-black/[0.06] overflow-hidden">

        {/* Hero Background Video (Desktop Only) */}
        <div className="hidden sm:block absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 mix-blend-multiply">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/agentic-hero-9yW3wnTNMfn2U6lsVhTTZSJFEvAoSj.mp4"
            style={{
              transform: videoReady ? "scale(1)" : "scale(1.05)",
              transition: "transform 2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F4F0] via-transparent to-[#F5F4F0]/70" />
        </div>

        {/* Title + metrics — positioned with safe top padding */}
        <div className="relative z-30 flex flex-col px-6 md:px-12 max-w-4xl">
          {/* Title */}
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-light text-[#111] leading-[1.05] tracking-tight mb-6"
            style={{
              fontFamily: '"IBM Plex Sans", sans-serif',
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(24px)",
              transform: heroReady ? "translateY(0px)" : "translateY(32px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 0ms, filter 1s cubic-bezier(0.16,1,0.3,1) 0ms, transform 1s cubic-bezier(0.16,1,0.3,1) 0ms",
            }}
          >
            {t.hero.titleLine1}<br />{t.hero.titleLine2}<br />{t.hero.titleLine3}
          </h1>

          <p
            className="text-sm sm:text-base text-black/75 font-normal leading-relaxed max-w-xl mb-6"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(16px)",
              transform: heroReady ? "translateY(0px)" : "translateY(24px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 80ms, filter 1s cubic-bezier(0.16,1,0.3,1) 80ms, transform 1s cubic-bezier(0.16,1,0.3,1) 80ms",
            }}
          >
            {t.hero.subtitle}
          </p>

          {/* Hero CTA Buttons (Dual High-Conversion Action) */}
          <div
            className="flex flex-wrap items-center gap-3.5 mb-10"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(16px)",
              transform: heroReady ? "translateY(0px)" : "translateY(20px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 100ms, filter 1s cubic-bezier(0.16,1,0.3,1) 100ms, transform 1s cubic-bezier(0.16,1,0.3,1) 100ms",
            }}
          >
            <a
              href="#agendar"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-wider hover:bg-black/80 transition-all shadow-md font-semibold cursor-pointer"
            >
              <span>🚀 {t.hero.primaryCta || "AGENDAR ASESORÍA & CREAR UNIDAD DE CRECIMIENTO"}</span>
              <span className="text-emerald-400 font-bold">&rarr;</span>
            </a>

            <a
              href="#cobertura"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl border border-black/15 bg-white/80 hover:bg-white text-[#111] text-xs font-mono uppercase tracking-wider transition-all shadow-2xs font-semibold cursor-pointer"
            >
              <span>📊 {t.hero.secondaryCta || "EXPLORAR BASE DE DATOS (+200K)"}</span>
            </a>
          </div>

          {/* 4 Sales Metrics — staggered after title */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 pt-4 border-t border-black/10">
            {[
              { value: "+200,000", label: t.hero.stats.contacts },
              { value: "33", label: t.hero.stats.coverage },
              { value: "100%", label: t.hero.stats.payroll },
              { value: "24/7", label: t.hero.stats.agents },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  opacity: heroReady ? 1 : 0,
                  filter: heroReady ? "blur(0px)" : "blur(16px)",
                  transform: heroReady ? "translateY(0px)" : "translateY(20px)",
                  transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, filter 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${120 + i * 80}ms`,
                }}
              >
                <div className="text-2xl sm:text-3xl text-[#111] font-bold tracking-tight" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.value}</div>
                <div className="text-[11px] text-black/75 font-semibold tracking-wider uppercase mt-1 leading-snug" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INDICADOR KAGE DE INCREMENTO EN VENTAS (SLIDER MÍNIMO A MÁXIMO) ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] bg-[#F5F4F0]">
        <KageSalesIndicator />
      </section>

      {/* ── PROPUESTA DE VALOR & MANIFIESTO (Sticky Stacking Cards) ──────── */}
      <section id="propuesta" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] bg-[#F5F4F0]">
        <StackingPlatformCards />
      </section>

      {/* ── MODALIDADES DE TRABAJO (KAGE INTERACTIVE SWITCHER) ───────────── */}
      <section id="modalidades" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] bg-[#F5F4F0]">
        <KageModalitiesSection />
      </section>

      {/* ── PREGUNTAS FRECUENTES (GEO & RICH SNIPPETS) ───────────────────── */}
      <KageFaqSection />

      {/* ── AGENDAR CITA (CALENDARIO & LISTA KAGE DE CONSULTAS) ──────────── */}
      <BookingSection />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden">
        {/* Glass panels image — anchored to bottom center */}
        <img
          src="/images/footer.png"
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom pointer-events-none select-none"
          style={{ opacity: 0.85 }}
        />
        {/* Progressive blur from bottom — blends into site bg */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        />
        {/* Colour fade from bottom to site bg #f5f4f0 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgb(245,244,240) 0%, rgba(245,244,240,0.92) 18%, rgba(245,244,240,0.55) 35%, transparent 55%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.05] mb-6">
            {t.cta.title}
          </h2>
          <p className="text-sm text-black/75 font-medium leading-relaxed mb-10">
            {t.cta.desc}
          </p>
          {!submitted ? (
            <form
              onSubmit={async e => {
                e.preventDefault()
                if (!email) return
                try {
                  await fetch("/api/booking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: "lead", email }),
                  })
                } catch {
                  // Fallback UI
                }
                setSubmitted(true)
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                aria-label="Correo electrónico de contacto"
                placeholder={t.cta.inputPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-white border border-black/15 rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-black/50 focus:outline-none focus:border-black/40 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#111] text-white text-xs sm:text-sm rounded-xl hover:bg-[#333] transition-colors tracking-widest font-medium shrink-0 cursor-pointer"
              >
                {t.cta.btn}
              </button>
            </form>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-emerald-600/20 bg-emerald-50 text-emerald-700 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t.cta.submitted}
            </div>
          )}
        </div>
      </section>


      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
