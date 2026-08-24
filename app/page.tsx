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
            {t.hero.titleLine1}<br />{t.hero.titleLine2}{t.hero.titleLine3 ? <><br />{t.hero.titleLine3}</> : ""}
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
              <span>{t.hero.primaryCta || "Agendar Cita"}</span>
              <span className="text-emerald-400 font-bold">&rarr;</span>
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

      {/* ── CTA FINAL DE ALTA CONVERSIÓN ─────────────────────────────────── */}
      <section className="relative py-14 sm:py-20 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden bg-[#F5F4F0]">
        {/* Glass panels image background */}
        <img
          src="/images/footer.png"
          alt=""
          loading="lazy"
          aria-hidden="true"
          className="absolute bottom-0 left-0 w-full object-cover object-bottom pointer-events-none select-none opacity-80"
        />
        {/* Progressive blur */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            maskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 55%)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgb(245,244,240) 0%, rgba(245,244,240,0.92) 20%, rgba(245,244,240,0.6) 45%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-black/10 p-8 sm:p-12 md:p-14 shadow-xl text-center space-y-8">
            


            {/* Main Headline */}
            <div className="space-y-4 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight leading-[1.08] text-[#111]">
                {t.cta.title}
              </h2>
              <p className="text-sm sm:text-base text-black/75 font-normal leading-relaxed max-w-2xl mx-auto">
                {t.cta.desc}
              </p>
            </div>

            {/* High-Conversion Action Button Area */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <a
                href="#agendar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-mono uppercase tracking-wider hover:bg-black/90 transition-all shadow-md hover:shadow-xl font-bold cursor-pointer"
              >
                <span>SOLICITAR ASESORÍA ESTRATÉGICA</span>
                <span className="text-emerald-400 font-bold">&rarr;</span>
              </a>

              <a
                href="https://wa.me/573127529629"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-mono tracking-wider hover:bg-emerald-700 transition-all shadow-md font-bold cursor-pointer"
              >
                <span>💬 Hablar por WhatsApp</span>
              </a>
            </div>

            {/* Proof Indicators Bar */}
            <div className="pt-6 border-t border-black/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-black/70 font-medium">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>+200,000 Contactos B2B Verificados</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Sin Nómina Fija ni Pasivos</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Atención Directa en &lt; 15 min</span>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  )
}
