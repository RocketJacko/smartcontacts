"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

const NAV_STYLE = {
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  background: "rgba(245,244,240,0.30)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
} as const

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()

  const close = () => setOpen(false)

  const navLinks = [
    { label: t.nav.platform,   href: "/propuesta" },
    { label: t.nav.coverage,   href: "/cobertura" },
    { label: t.nav.modalities, href: "/modalidades" },
    { label: t.nav.benefits || "Beneficios", href: "/beneficios" },
    { label: t.nav.about,      href: "/sobre-mi" },
    { label: t.nav.schedule,   href: "/agendar" },
  ]

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-3 sm:px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-6xl">

        {/* Main bar */}
        <nav
          className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-black/[0.06] overflow-hidden"
          style={NAV_STYLE}
        >
          {/* Logo */}
          <Link href="/" className="font-pixel text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-black/80 mr-2 lg:mr-6 shrink-0 select-none hover:opacity-80 transition-opacity">
            SMARTCONTACTS
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 shrink" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {navLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[11px] text-black/60 hover:text-black transition-colors duration-200 tracking-wide whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Switcher with Touch-Friendly Height */}
            <div className="relative flex items-center bg-black/[0.04] p-0.5 rounded-xl border border-black/10 text-[10px] sm:text-[11px] font-mono shrink-0 select-none overflow-hidden min-h-[40px] sm:min-h-[48px]">
              {/* Sliding Indicator Pill */}
              <div
                className="absolute top-0.5 bottom-0.5 rounded-lg bg-white shadow-xs transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  left: language === 'es' ? "2px" : "calc(50% + 1px)",
                  width: "calc(50% - 3px)",
                }}
              />
              <button
                type="button"
                onClick={() => setLanguage('es')}
                className={`relative z-10 px-2.5 sm:px-3.5 min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center text-center transition-colors duration-500 cursor-pointer ${
                  language === 'es' ? "text-black font-semibold" : "text-black/50 hover:text-black font-normal"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`relative z-10 px-2.5 sm:px-3.5 min-h-[36px] sm:min-h-[44px] min-w-[36px] sm:min-w-[44px] flex items-center justify-center text-center transition-colors duration-500 cursor-pointer ${
                  language === 'en' ? "text-black font-semibold" : "text-black/50 hover:text-black font-normal"
                }`}
              >
                EN
              </button>
            </div>

            {/* CTA Button — DESKTOP ONLY (hidden on mobile/tablet < lg) */}
            <Link
              href="/agendar"
              className="text-[11px] w-[210px] min-h-[48px] hidden lg:inline-flex items-center justify-center py-2 shrink-0 rounded-xl border border-black/10 text-black/80 font-medium hover:text-black hover:border-black/25 hover:bg-black/[0.04] transition-all duration-200 tracking-wide text-center shadow-2xs"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {t.nav.startBuilding}
            </Link>

            {/* Burger — MOBILE & TABLET ONLY (48px Touch Target) */}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex lg:hidden flex-col justify-center items-center w-10 h-10 sm:w-12 sm:h-12 min-w-[40px] sm:min-w-[48px] min-h-[40px] sm:min-h-[48px] gap-[5px] rounded-xl hover:bg-black/[0.05] active:bg-black/10 transition-colors shrink-0 cursor-pointer"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "20px",
                  transform: open ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300"
                style={{
                  width: "20px",
                  opacity: open ? 0 : 1,
                  transform: open ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "20px",
                  transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          className="lg:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out max-h-[80vh] overflow-y-auto"
          style={{ maxHeight: open ? "80vh" : "0px", opacity: open ? 1 : 0 }}
        >
          <div
            className="rounded-2xl border border-black/[0.06] px-2 py-2 flex flex-col space-y-1 max-h-[75vh] overflow-y-auto"
            style={NAV_STYLE}
          >
            {navLinks.map(l => (
              <Link
                key={l.label}
                href={l.href}
                onClick={close}
                className="px-4 py-3 min-h-[48px] flex items-center text-xs text-black/80 hover:text-black hover:bg-black/[0.04] active:bg-black/10 rounded-xl transition-colors tracking-wide font-medium"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-1 px-2 pb-1 space-y-2">
              <Link
                href="/agendar"
                onClick={close}
                className="flex items-center justify-center w-full text-center text-xs min-h-[48px] px-4 py-3 whitespace-nowrap rounded-xl border border-black/10 text-black/80 font-medium hover:text-black hover:border-black/25 hover:bg-black/[0.04] active:bg-black/10 transition-all duration-200 tracking-wide"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {t.nav.startBuilding}
              </Link>
              <a
                href="https://wa.me/573127529629"
                target="_blank"
                rel="noopener noreferrer"
                onClick={close}
                className="flex items-center justify-center gap-2 w-full text-center text-xs font-mono min-h-[48px] px-4 py-3 whitespace-nowrap rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold tracking-wider transition-all duration-200 shadow-sm"
              >
                <span>💬 Hablar por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
