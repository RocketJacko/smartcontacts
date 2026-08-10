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

      <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pt-4">
        <Link href="/" className="font-pixel text-xs tracking-[0.25em] text-black/70 hover:opacity-80 transition-opacity">
          SMARTCONTACTS
        </Link>

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
            <Link key={l.label} href={l.href} className="text-xs text-black/60 hover:text-black transition-colors font-mono tracking-wider">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Social / Direct links */}
        <div className="flex items-center gap-6">
          <a
            href="https://www.linkedin.com/in/jesus-carmona-automatization/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-black/60 hover:text-black transition-colors font-mono tracking-wider font-medium"
          >
            LinkedIn &rarr;
          </a>
        </div>
      </div>
    </footer>
  )
}
