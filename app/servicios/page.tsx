'use client'

import React, { useState } from 'react'
import { MobileNav } from '@/components/mobile-nav'
import { Footer } from '@/components/footer'
import { RevealText } from '@/components/reveal-text'
import { useLanguage } from '@/lib/language-context'
import { SERVICES_CONFIG, ServiceItem } from '@/lib/config/services-config'
import { ServiceFormModal } from '@/components/services/service-form-modal'
import {
  GraduationCap,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react'

export default function ServiciosPage() {
  const { language } = useLanguage()
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  const renderIcon = (name: string) => {
    switch (name) {
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-emerald-700" />
      case 'Globe':
        return <Globe className="w-6 h-6 text-blue-700" />
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-700" />
      default:
        return <Layers className="w-6 h-6 text-purple-700" />
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white pt-24 pb-16">
      <MobileNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header Section */}
        <div className="space-y-4 border-b border-black/[0.08] pb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-widest font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'es' ? 'ACTIVACIÓN DE SERVICIOS AGÉNTICOS' : 'AGENTIC SERVICES ACTIVATION'}
            </span>
          </div>

          <RevealText className="text-3xl sm:text-5xl font-medium tracking-tight text-[#111]">
            {language === 'es' ? 'Servicios y Plataformas Requeridas' : 'Services & Platform Activation'}
          </RevealText>

          <p className="text-sm sm:text-base text-black/70 max-w-3xl leading-relaxed font-sans">
            {language === 'es'
              ? 'Solicita la activación de tus cuentas y plataformas integradas para potenciar tu unidad de crecimiento comercial. Selecciona el servicio deseado y completa el formulario con tus datos.'
              : 'Request activation of your integrated accounts and platforms to power your commercial growth unit. Select your desired service and complete the form.'}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {SERVICES_CONFIG.map(service => (
            <div
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="group relative bg-white/80 hover:bg-white border border-black/[0.08] hover:border-black/20 rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black/[0.03] border border-black/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {renderIcon(service.iconName)}
                  </div>
                  {service.badge ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-semibold">
                      {service.badge}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-black/[0.04] text-black/60 border border-black/10 font-medium">
                      {language === 'es' ? 'Activación Inmediata' : 'Instant Activation'}
                    </span>
                  )}
                </div>

                {/* Title & Tag */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-semibold block">
                    {service.tag}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-medium text-[#111] group-hover:text-black transition-colors">
                    {service.name}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm font-sans text-black/70 leading-relaxed">
                  {service.description}
                </p>

                {/* Requirements Checklist Card Row (Standard AGENTS.md Card Row Pattern) */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono text-black/40 uppercase tracking-wider block">
                    {language === 'es' ? 'CAMPOS REQUERIDOS EN EL FORMULARIO:' : 'REQUIRED FIELDS IN FORM:'}
                  </span>
                  <div className="space-y-1.5">
                    {service.fields.map(field => (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/[0.02] group-hover:bg-black/[0.04] transition-colors border border-black/[0.04]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors shrink-0" />
                        <span className="text-[11px] text-black/70 font-mono flex-1 truncate">
                          {field.label}
                        </span>
                        <span className="text-[10px] text-black/40 font-mono uppercase">
                          {field.type === 'file' ? 'Archivo' : field.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-6 mt-6 border-t border-black/[0.06] flex items-center justify-between">
                <span className="text-xs font-mono text-black/60 group-hover:text-black transition-colors flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'es' ? 'Integrable con n8n & JWT' : 'Integrated with n8n & JWT'}
                </span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-black/5 group-hover:bg-black group-hover:text-white text-black text-xs font-mono font-medium transition-all duration-300 flex items-center gap-2"
                >
                  <span>{language === 'es' ? 'SOLICITAR' : 'REQUEST'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />

      {/* Service Form Modal */}
      <ServiceFormModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  )
}
