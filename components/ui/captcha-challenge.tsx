"use client"

import React, { useState, useEffect } from "react"
import { RefreshCw, ShieldCheck, Loader2 } from "lucide-react"

interface CaptchaChallengeProps {
  onTokenChange: (token: string, answer: string) => void
  error?: string
  language?: "es" | "en"
}

export function CaptchaChallenge({ onTokenChange, error, language = "es" }: CaptchaChallengeProps) {
  const [token, setToken] = useState("")
  const [svg, setSvg] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const isEs = language === "es"

  const fetchNewCaptcha = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/captcha", { cache: "no-store" })
      const data = await res.json()
      if (data.token && data.svg) {
        setToken(data.token)
        setSvg(data.svg)
        setAnswer("")
        onTokenChange(data.token, "")
      }
    } catch (err) {
      console.error("Error al cargar captcha:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNewCaptcha()
  }, [])

  const handleAnswerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setAnswer(val)
    onTokenChange(token, val)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isEs ? "Verificación de Seguridad *" : "Security Verification *"}</span>
        </label>
        <button
          type="button"
          onClick={fetchNewCaptcha}
          disabled={isLoading}
          aria-label={isEs ? "Cambiar desafío de captcha" : "Change captcha challenge"}
          className="text-[11px] font-mono text-black/40 hover:text-[#111] flex items-center gap-1 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin text-emerald-600" : ""}`} />
          <span>{isEs ? "Cambiar" : "Refresh"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Renderizado de la imagen SVG distorsionada */}
        <div
          className="shrink-0 rounded-xl overflow-hidden border border-black/10 bg-[#F5F4F0] flex items-center justify-center min-w-[120px] h-[38px] shadow-2xs select-none"
          dangerouslySetInnerHTML={{ __html: svg || '<div class="text-[10px] font-mono text-black/30">Cargando...</div>' }}
        />

        {/* Input para la respuesta */}
        <div className="relative flex-1">
          <input
            type="text"
            required
            value={answer}
            onChange={handleAnswerChange}
            placeholder={isEs ? "Resultado..." : "Result..."}
            className={`w-full px-3 py-2 text-xs font-mono bg-[#F5F4F0] border rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all ${
              error ? "border-red-500 bg-red-50/20" : "border-black/10 focus:border-black/30"
            }`}
          />
          {isLoading && (
            <Loader2 className="w-3 h-3 animate-spin text-black/40 absolute right-2.5 top-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 font-mono mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
