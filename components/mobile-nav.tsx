"use client"

import { useState } from "react"
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
    { label: t.nav.platform,   href: "#platform" },
    { label: t.nav.coverage,   href: "#cobertura" },
    { label: t.nav.modalities, href: "#modalidades" },
    { label: t.nav.about,      href: "#sobre-mi" },
    { label: t.nav.schedule,   href: "#agendar" },
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
          <a href="#" className="font-pixel text-[11px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-black/80 mr-2 lg:mr-6 shrink-0 select-none hover:opacity-80 transition-opacity">
            SMARTCONTACTS
          </a>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 shrink" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-[11px] text-black/60 hover:text-black transition-colors duration-200 tracking-wide whitespace-nowrap"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher with Slow Animated Sliding Toggle */}
            <div className="relative flex items-center bg-black/[0.04] p-0.5 rounded-xl border border-black/10 text-[10px] font-mono shrink-0 select-none overflow-hidden">
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
                className={`relative z-10 px-2.5 py-1 text-center transition-colors duration-500 cursor-pointer ${
                  language === 'es' ? "text-black font-semibold" : "text-black/50 hover:text-black font-normal"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`relative z-10 px-2.5 py-1 text-center transition-colors duration-500 cursor-pointer ${
                  language === 'en' ? "text-black font-semibold" : "text-black/50 hover:text-black font-normal"
                }`}
              >
                EN
              </button>
            </div>

            {/* CTA Button — DESKTOP ONLY (hidden on mobile/tablet < lg) */}
            <a
              href="#agendar"
              className="text-[11px] w-[210px] hidden lg:inline-flex items-center justify-center py-2 shrink-0 rounded-xl border border-black/10 text-black/80 font-medium hover:text-black hover:border-black/25 hover:bg-black/[0.04] transition-all duration-200 tracking-wide text-center shadow-2xs"
              style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
            >
              {t.nav.startBuilding}
            </a>

            {/* Burger — MOBILE & TABLET ONLY (hidden on desktop lg) */}
            <button
              type="button"
              onClick={() => setOpen(v => !v)}
              className="flex lg:hidden flex-col justify-center items-center w-8 h-8 gap-[5px] rounded-lg hover:bg-black/[0.04] transition-colors shrink-0"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300"
                style={{
                  width: "18px",
                  opacity: open ? 0 : 1,
                  transform: open ? "scaleX(0)" : "none",
                }}
              />
              <span
                className="block h-px bg-black/70 transition-all duration-300 origin-center"
                style={{
                  width: "18px",
                  transform: open ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        <div
          className="lg:hidden mt-2 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open ? "420px" : "0px", opacity: open ? 1 : 0 }}
        >
          <div
            className="rounded-2xl border border-black/[0.06] px-2 py-2 flex flex-col space-y-0.5"
            style={NAV_STYLE}
          >
            {navLinks.map(l => (
              <a
                key={l.label}
                href={l.href}
                onClick={close}
                className="px-4 py-2.5 text-xs text-black/70 hover:text-black hover:bg-black/[0.04] rounded-xl transition-colors tracking-wide"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {l.label}
              </a>
            ))}
            <div className="pt-1 px-2 pb-1">
              <a
                href="#agendar"
                onClick={close}
                className="block w-full text-center text-[11px] px-4 py-2.5 whitespace-nowrap rounded-xl border border-black/10 text-black/80 font-medium hover:text-black hover:border-black/25 hover:bg-black/[0.04] transition-all duration-200 tracking-wide"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {t.nav.startBuilding}
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
