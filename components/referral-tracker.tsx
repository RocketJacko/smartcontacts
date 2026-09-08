"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"

/**
 * Componente ligero de rastreo de atribución para revendedores y afiliados.
 * Captura ?ref=CODIGO o ?referido=CODIGO en la URL, guarda la atribución en cookies/localStorage
 * y notifica a la API para incrementar el conteo atómico de clics en tiempo real.
 */
export function ReferralTracker() {
  const searchParams = useSearchParams()
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    const refCode = searchParams.get("ref") || searchParams.get("referido")

    if (refCode && refCode.trim()) {
      hasTracked.current = true
      const cleanCode = refCode.trim().toUpperCase()

      try {
        localStorage.setItem("sc_ref_code", cleanCode)
        // Guardar cookie en cliente inmediatamente para sincronización con SSR y navegación
        document.cookie = `sc_ref_code=${encodeURIComponent(cleanCode)}; path=/; max-age=${45 * 24 * 60 * 60}; SameSite=Lax`
        // Notificar a componentes en la misma pestaña (MobileNav, Footer, Beneficios)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("sc_referral_updated", { detail: { code: cleanCode } }))
        }
      } catch {}

      fetch("/api/referrals/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      }).catch(() => {})
    }
  }, [searchParams])

  return null
}
