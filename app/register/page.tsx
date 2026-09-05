"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, BrainCircuit, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function RegisterPage() {
  const { t, language } = useLanguage()
  const router = useRouter()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    if (password !== confirmPassword) {
      setErrorMsg(language === "es" ? "Las contraseñas no coinciden." : "Passwords do not match.")
      return
    }

    if (password.length < 8) {
      setErrorMsg(language === "es" ? "La contraseña debe tener al menos 8 caracteres." : "Password must be at least 8 characters.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "No se pudo completar el registro.")
        setIsLoading(false)
        return
      }

      setSuccessMsg(
        language === "es"
          ? "Cuenta creada con éxito. Redirigiendo al inicio de sesión..."
          : "Account created successfully. Redirecting to login..."
      )

      setTimeout(() => {
        router.push("/login")
      }, 2000)

    } catch {
      setErrorMsg("Error de conexión con el servidor de autenticación.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F4F0] text-[#111] font-sans antialiased selection:bg-black selection:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative">
      
      {/* Botón de regreso al sitio público */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-mono text-black/50 hover:text-[#111] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{language === "es" ? "Volver al inicio" : "Back to home"}</span>
      </Link>

      <div className="w-full max-w-md space-y-6">
        {/* Cabecera & Branding */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#111] text-white shadow-xs mx-auto mb-1">
            <BrainCircuit className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-mono tracking-widest text-black/50 bg-black/[0.04] border border-black/[0.06] uppercase">
            REGISTRO DE USUARIOS
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#111]">
            {t.auth?.registerTitle || "Crear Cuenta Nueva"}
          </h1>
          <p className="text-xs sm:text-sm text-black/60 font-light max-w-sm mx-auto">
            {t.auth?.registerSubtitle || "Registra tu usuario para acceder a los servicios y herramientas"}
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-2xs space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input Nombre */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider mb-1.5">
                {t.auth?.nameLabel || "NOMBRE COMPLETO"} *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder={t.auth?.namePlaceholder || "Ej. Jesús Alexis Carmona"}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F5F4F0] border border-black/10 focus:border-black/40 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider mb-1.5">
                {t.auth?.emailLabel || "CORREO ELECTRÓNICO"} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.auth?.emailPlaceholder || "tu@empresa.com"}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F5F4F0] border border-black/10 focus:border-black/40 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider mb-1.5">
                {t.auth?.passwordLabel || "CONTRASEÑA"} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth?.passwordPlaceholder || "••••••••"}
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#F5F4F0] border border-black/10 focus:border-black/40 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Alternar visibilidad de contraseña"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-[#111] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Input Confirmar Password */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-black/60 uppercase tracking-wider mb-1.5">
                {language === "es" ? "CONFIRMAR CONTRASEÑA" : "CONFIRM PASSWORD"} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.auth?.passwordPlaceholder || "••••••••"}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F5F4F0] border border-black/10 focus:border-black/40 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                />
              </div>
            </div>

            {/* Mensajes de Alerta */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-start gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-tight">{successMsg}</span>
              </div>
            )}

            {/* Botón de Submit */}
            <button
              type="submit"
              disabled={isLoading || Boolean(successMsg)}
              className="w-full py-3 rounded-xl bg-[#111] hover:bg-black/90 text-white text-xs font-mono font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.auth?.registering || "CREANDO CUENTA..."}</span>
                </>
              ) : (
                <span>{t.auth?.registerButton || "CREAR CUENTA"}</span>
              )}
            </button>
          </form>

          {/* Enlace a Login */}
          <div className="pt-4 border-t border-black/[0.06] text-center text-xs text-black/60 font-light">
            <span>{t.auth?.hasAccount || "¿Ya tienes cuenta?"} </span>
            <Link
              href="/login"
              className="font-medium text-[#111] underline hover:text-black transition-colors"
            >
              {t.auth?.loginLink || "Inicia sesión aquí"}
            </Link>
          </div>
        </div>

        {/* Nota de Seguridad */}
        <p className="text-[11px] font-mono text-center text-black/40">
          Validación automática contra dominios desechables & Criptografía Supabase
        </p>
      </div>
    </main>
  )
}
