'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { IntroAnimation, HERO_REVEAL_MS } from '@/components/intro-animation'
import { KageSalesIndicator } from '@/components/kage-sales-indicator'
import { BookingSection } from '@/components/booking-section'
import { RevealText } from '@/components/reveal-text'
import { MobileNav } from '@/components/mobile-nav'
import { Footer } from '@/components/footer'
import { useLanguage } from '@/lib/language-context'
import { SERVICES_CONFIG, ServiceItem } from '@/lib/config/services-config'
import { ServiceFormModal } from '@/components/services/service-form-modal'
import Link from 'next/link'
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

export default function AgenticPage() {
  const { t, language } = useLanguage()
  const [heroReady, setHeroReady] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  const handleIntroDone = useCallback(() => {
    setHeroReady(true)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), HERO_REVEAL_MS)
    return () => clearTimeout(timer)
  }, [])

  const platziService = SERVICES_CONFIG.find(s => s.id === 'platzi') || SERVICES_CONFIG[0]

  return (
    <div className="bg-[#F5F4F0] text-[#111] min-h-screen font-sans antialiased selection:bg-black selection:text-white">
      {/* INTRO ANIMATION */}
      <IntroAnimation onDone={handleIntroDone} />

      {/* NAVIGATION BAR */}
      <MobileNav />

      {/* HERO SECTION — HIGH CONVERSION & COMPACT */}
      <section
        id="hero"
        className="relative min-h-[80vh] flex flex-col justify-center pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 bg-[#F5F4F0] border-b border-black/[0.06] overflow-hidden"
      >
        {/* Hero Background Video */}
        <div className="hidden sm:block absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 mix-blend-multiply">
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
              transform: videoReady ? 'scale(1)' : 'scale(1.05)',
              transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F4F0] via-transparent to-[#F5F4F0]/70" />
        </div>

        <div className="relative z-30 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Direct Title & Value Prop */}
            <div className="lg:col-span-7 space-y-6">
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest font-semibold"
                style={{
                  opacity: heroReady ? 1 : 0,
                  transition: 'opacity 0.8s ease',
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>UNIDAD DE CRECIMIENTO COMERCIAL CON IA</span>
              </div>

              <h1
                className="text-3xl sm:text-5xl lg:text-6xl font-medium text-[#111] leading-[1.08] tracking-tight"
                style={{
                  opacity: heroReady ? 1 : 0,
                  filter: heroReady ? 'blur(0px)' : 'blur(20px)',
                  transform: heroReady ? 'translateY(0px)' : 'translateY(24px)',
                  transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {language === 'es' ? (
                  <>
                    Multiplica tus Ventas B2B <br />
                    <span className="text-black/60">con Agentes de IA & Platzi.</span>
                  </>
                ) : (
                  <>
                    Multiply B2B Sales <br />
                    <span className="text-black/60">with AI Agents & Platzi.</span>
                  </>
                )}
              </h1>

              <p
                className="text-sm sm:text-base text-black/75 font-normal leading-relaxed max-w-xl"
                style={{
                  opacity: heroReady ? 1 : 0,
                  transform: heroReady ? 'translateY(0px)' : 'translateY(20px)',
                  transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 80ms',
                }}
              >
                {language === 'es'
                  ? 'Accede a la activación inmediata de servicios y licencias de Platzi, potenciadas con nuestra infraestructura de inteligencia de datos (+200,000 contactos B2B) y agentes de IA.'
                  : 'Access instant activation for Platzi accounts and services, powered by our AI agentic infrastructure and B2B dataset (+200k contacts).'}
              </p>

              {/* Action Buttons */}
              <div
                className="flex flex-wrap items-center gap-3 pt-2"
                style={{
                  opacity: heroReady ? 1 : 0,
                  transform: heroReady ? 'translateY(0px)' : 'translateY(20px)',
                  transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 120ms',
                }}
              >
                {platziService && (
                  <button
                    type="button"
                    onClick={() => setSelectedService(platziService)}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-black/80 transition-all shadow-md font-semibold cursor-pointer group"
                  >
                    <GraduationCap className="w-4 h-4 text-emerald-400" />
                    <span>ACTIVAR PLATZI AHORA</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <a
                  href="#agendar"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-black/15 text-[#111] text-xs font-mono uppercase tracking-wider hover:bg-black/[0.04] transition-all font-semibold"
                >
                  <span>AGENDAR ASESORÍA</span>
                </a>
              </div>

              {/* Value Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-black/10 text-xs font-mono text-black/70">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>+200K Contactos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sin Nómina Fija</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Activación 24/7</span>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Conversion Card (Platzi Spotlight) */}
            <div className="lg:col-span-5">
              {platziService && (
                <div className="relative bg-white border border-black/[0.12] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-emerald-700" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-bold uppercase tracking-wider">
                      {platziService.badge || 'Requiere Comprobante'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest block font-bold">
                      ACTIVACIÓN DIRECTA
                    </span>
                    <h3 className="text-2xl font-medium text-[#111]">
                      {platziService.name}
                    </h3>
                    <p className="text-xs font-sans text-black/70 leading-relaxed">
                      {platziService.description}
                    </p>
                  </div>

                  {/* Required Fields Summary */}
                  <div className="space-y-2 bg-[#F5F4F0] p-4 rounded-2xl border border-black/[0.06]">
                    <span className="text-[10px] font-mono text-black/50 uppercase tracking-wider block font-bold">
                      REQUISITOS DE ACTIVACIÓN:
                    </span>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-black/75">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Nombre y teléfono de contacto</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-black/75">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Correo electrónico</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-black/75">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Comprobante de pago (Imagen / PDF max 5MB)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedService(platziService)}
                    className="w-full py-3.5 rounded-xl bg-black hover:bg-black/85 text-white text-xs font-mono font-medium transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>SOLICITAR ACTIVACIÓN PLATZI</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SALES INDICATOR SLIDER (COMPACT & INTERACTIVE) */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] bg-[#F5F4F0]">
        <KageSalesIndicator />
      </section>

      {/* AGENDAR CITA & DIAGNÓSTICO COMERCIAL */}
      <section id="agendar" className="py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F4F0]">
        <BookingSection />
      </section>

      {/* FOOTER */}
      <Footer />

      {/* SERVICE FORM MODAL */}
      <ServiceFormModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  )
}
