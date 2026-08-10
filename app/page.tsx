"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { IntroAnimation, INTRO_DURATION_MS, HERO_REVEAL_MS } from "@/components/intro-animation"
import { AgentInterface } from "@/components/agent-interface"
import { PixelIcon } from "@/components/pixel-icon"
import { LiveAgentFeed, LiveAgentCounter } from "@/components/live-agent-feed"
import { RevealText } from "@/components/reveal-text"
import { StackingAgentCards } from "@/components/stacking-agent-cards"
import { StackingPlatformCards } from "@/components/stacking-platform-cards"
import { MobileNav } from "@/components/mobile-nav"
import { BookingSection } from "@/components/booking-section"
import { ColombiaMapSection } from "@/components/colombia-map-section"
import { MethodologySection } from "@/components/methodology-section"
import { KageSalesIndicator } from "@/components/kage-sales-indicator"
import { KageModalitiesSection } from "@/components/kage-modalities-section"
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
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/40 bg-black/[0.04]">
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

  // Start video zoom slightly before hero content reveals, for seamless overlap
  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased">

      {/* ── INTRO ANIMATION ───────────────────────────────────────────────── */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* ── STICKY NAV ────────────────────────────────────────────────────── */}
      <MobileNav />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-[70vh] flex flex-col justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 bg-[#F5F4F0] border-b border-black/[0.06] overflow-hidden">

        {/* Hero Background Video */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-35 mix-blend-multiply">
          <video
            autoPlay
            loop
            muted
            playsInline
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
            className="text-sm sm:text-base text-black/60 font-light leading-relaxed max-w-xl mb-6"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(16px)",
              transform: heroReady ? "translateY(0px)" : "translateY(24px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 80ms, filter 1s cubic-bezier(0.16,1,0.3,1) 80ms, transform 1s cubic-bezier(0.16,1,0.3,1) 80ms",
            }}
          >
            {t.hero.subtitle}
          </p>

          {/* Hero CTA Button */}
          <div
            className="mb-10"
            style={{
              opacity: heroReady ? 1 : 0,
              filter: heroReady ? "blur(0px)" : "blur(16px)",
              transform: heroReady ? "translateY(0px)" : "translateY(20px)",
              transition: "opacity 1s cubic-bezier(0.16,1,0.3,1) 100ms, filter 1s cubic-bezier(0.16,1,0.3,1) 100ms, transform 1s cubic-bezier(0.16,1,0.3,1) 100ms",
            }}
          >
            <a
              href="#agendar"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/80 transition-all shadow-sm font-medium"
            >
              {t.hero.submitBtn} &rarr;
            </a>
          </div>

          {/* 3 metrics — staggered after title */}
          <div className="flex gap-8 sm:gap-12">
            {[
              { value: language === 'es' ? "Más de 10" : "Over 10", label: t.hero.stats.tasks },
              { value: language === 'es' ? "Nacional" : "National", label: t.hero.stats.prospects },
              { value: "2", label: t.hero.stats.modalities },
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
                <div className="text-3xl sm:text-4xl text-[#111] font-light tracking-tight" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.value}</div>
                <div className="text-xs text-black/40 tracking-widest uppercase mt-1" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>{stat.label}</div>
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
      <section id="platform" className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-16 xl:px-20 border-t border-black/[0.06]">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="mb-10">
            <PixelIcon type="platform" size={40} />
            <div className="mt-4"><Tag>{t.platform.tag}</Tag></div>
            <RevealText className="mt-5 text-4xl md:text-5xl lg:text-6xl font-normal text-[#111] tracking-tight leading-[1.05]">
              {t.platform.title}
            </RevealText>
          </div>

          {/* Sticky Stacking Cards Effect */}
          <StackingPlatformCards />
        </div>
      </section>

      {/* ── MODALIDADES DE TRABAJO (KAGE INTERACTIVE SWITCHER) ───────────── */}
      <KageModalitiesSection />

      {/* ── METODOLOGÍA 4 FASES & VENTAJAS ESTRATÉGICAS ───────────────────── */}
      <MethodologySection />

      {/* ── MAPA DE COBERTURA COLOMBIA (CONSOLIDADO NACIONAL) ───────────── */}
      <ColombiaMapSection />

      {/* ── AGENDAR CITA (CALENDARIO & LISTA KAGE DE CONSULTAS) ──────────── */}
      <BookingSection />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="relative py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden">
        {/* Glass panels image — anchored to bottom center */}
        <img
          src="/images/footer.png"
          alt=""
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
          <p className="text-sm text-black/45 leading-relaxed mb-10">
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
                placeholder={t.cta.inputPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-[#111] placeholder:text-black/25 focus:outline-none focus:border-black/25 transition-colors"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-[#111] text-white text-xs sm:text-sm rounded-xl hover:bg-[#333] transition-colors tracking-widest font-medium shrink-0"
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
      <footer className="py-6 sm:py-8 px-6 md:px-12 lg:px-20 border-t border-black/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <span className="font-pixel text-xs tracking-[0.25em] text-black/50">SMARTCONTACTS</span>

          {/* Nav sections */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {[
              { label: t.nav.platform,   href: "/propuesta" },
              { label: t.nav.coverage,   href: "/cobertura" },
              { label: t.nav.modalities, href: "/modalidades" },
              { label: t.nav.about,      href: "/sobre-mi" },
              { label: t.nav.schedule,   href: "/agendar" },
              { label: "Landing",        href: "/landing" },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-xs text-black/50 hover:text-black transition-colors font-mono tracking-wider">{l.label}</Link>
            ))}
          </div>

          {/* Social / Direct links */}
          <div className="flex items-center gap-6">
            <a
              href="https://www.linkedin.com/in/jesus-carmona-automatization/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-black/50 hover:text-black transition-colors font-mono tracking-wider"
            >
              LinkedIn &rarr;
            </a>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-black/[0.04]">
          <span className="text-xs text-black/20">{t.footer.rights}</span>
        </div>
      </footer>
    </div>
  )
}
