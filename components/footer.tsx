"use client"

import React from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="relative py-10 sm:py-12 lg:py-16 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] overflow-hidden bg-[#F5F4F0]">
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
          background: "linear-gradient(to bottom, #F5F4F0 0%, rgba(245,244,240,0.6) 50%, rgba(245,244,240,0.95) 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col space-y-8 pt-4">
        
        {/* Main top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 pb-8 border-b border-black/[0.08]">
          <div className="space-y-3 max-w-sm">
            <Link href="/" className="font-pixel text-xs tracking-[0.25em] text-black/80 hover:opacity-80 transition-opacity block">
              SMARTCONTACTS
            </Link>
            <p className="text-xs text-black/70 font-normal leading-relaxed">
              Unidad de crecimiento comercial e inteligencia de datos B2B para multiplicar tus ventas con Agentes de IA.
            </p>
          </div>

          {/* Contact Details */}
          <div className="space-y-2 text-xs font-mono text-black/75">
            <span className="text-[10px] text-black/40 uppercase tracking-widest block font-bold">CONTACTO DIRECTO</span>
            <p className="flex items-center gap-2">
              <a href="https://wa.me/573127529629" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors font-medium underline decoration-black/20 underline-offset-4">
                +57 312 752 9629 (WhatsApp)
              </a>
            </p>
            <p>
              <a href="mailto:codificandoandoacces@gmail.com" className="hover:text-black transition-colors font-medium underline decoration-black/20 underline-offset-4">
                codificandoandoacces@gmail.com
              </a>
            </p>
            <p className="text-black/60">Medellín, Antioquia, Colombia</p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col space-y-2 text-xs font-mono">
            <span className="text-[10px] text-black/40 uppercase tracking-widest block font-bold">NAVEGACIÓN</span>
            <Link href="/propuesta" className="text-black/70 hover:text-black transition-colors">{t.nav.platform}</Link>
            <Link href="/cobertura" className="text-black/70 hover:text-black transition-colors">{t.nav.coverage}</Link>
            <Link href="/modalidades" className="text-black/70 hover:text-black transition-colors">{t.nav.modalities}</Link>
            <Link href="/sobre-mi" className="text-black/70 hover:text-black transition-colors">{t.nav.about}</Link>
            <Link href="/agendar" className="text-black/70 hover:text-black transition-colors">{t.nav.schedule}</Link>
          </div>

          {/* Legal links */}
          <div className="flex flex-col space-y-2 text-xs font-mono">
            <span className="text-[10px] text-black/40 uppercase tracking-widest block font-bold">LEGAL & CUMPLIMIENTO</span>
            <Link href="/privacidad" className="text-black/70 hover:text-black transition-colors font-medium">Privacidad (Ley 1581)</Link>
            <Link href="/cookies" className="text-black/70 hover:text-black transition-colors font-medium">Política de Cookies</Link>
            <Link href="/terminos" className="text-black/70 hover:text-black transition-colors font-medium">Términos y Condiciones</Link>
            <Link href="/legal" className="text-black/70 hover:text-black transition-colors font-medium">Marco Legal Colombia</Link>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-black/50">
          <p>© {new Date().getFullYear()} SmartContacts — Medellín, Colombia. Todos los derechos reservados.</p>
          <a
            href="https://www.linkedin.com/in/jesus-carmona-automatization/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-black transition-colors font-medium"
          >
            LinkedIn &rarr;
          </a>
        </div>

      </div>
    </footer>
  )
}
