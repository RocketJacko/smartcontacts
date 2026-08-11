"use client"

import React, { useState, useEffect } from "react"
import { Cookie, X, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export function CookieBanner() {
  const { language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been accepted
    const consent = localStorage.getItem("sc_cookie_consent")
    if (!consent) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("sc_cookie_consent", JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <aside
      aria-label={language === "es" ? "Aviso de cookies" : "Cookie notice"}
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-500"
    >
      <div className="bg-[#111] text-white p-5 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-4 backdrop-blur-md bg-opacity-95">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">
            <Cookie className="w-4 h-4 text-emerald-400" />
            <span>{language === "es" ? "POLÍTICA DE COOKIES & PRIVACIDAD" : "COOKIE & PRIVACY NOTICE"}</span>
          </div>
          <button
            onClick={handleAccept}
            aria-label={language === "es" ? "Cerrar aviso de cookies" : "Close cookie notice"}
            className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text */}
        <p className="text-xs text-white/80 leading-relaxed font-sans font-light">
          {language === "es" ? (
            <>
              Utilizamos cookies técnicas necesarias y analíticas para recordar tus preferencias de idioma, optimizar el rendimiento y garantizar la seguridad según la <strong>Ley 1581 de 2012 (Habeas Data)</strong>.
            </>
          ) : (
            <>
              We use essential technical and analytics cookies to remember your language preferences, optimize performance, and ensure security under <strong>Law 1581 of 2012 (Habeas Data)</strong>.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white text-[#111] text-xs font-mono font-semibold uppercase tracking-wider hover:bg-white/90 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{language === "es" ? "ACEPTAR COOKIES" : "ACCEPT COOKIES"}</span>
          </button>

          <Link
            href="/cookies"
            className="py-2.5 px-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 text-[11px] font-mono uppercase tracking-wider transition-all text-center cursor-pointer"
          >
            {language === "es" ? "VER DETALLES" : "DETAILS"}
          </Link>
        </div>

      </div>
    </aside>
  )
}
