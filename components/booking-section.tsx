"use client"

import React, { useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PhoneInput } from "@/components/phone-input"
import { User, Phone, Mail, FileText, CheckCircle2, ShieldCheck, Loader2, Send } from "lucide-react"

export function BookingSection() {
  const { t, language } = useLanguage()

  // Form Fields State (Ultra-Simplified: 4 Direct Fields)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [emailError, setEmailError] = useState("")
  const [hasAcceptedHabeasData, setHasAcceptedHabeasData] = useState(true)

  const validateEmailDomain = async (inputEmail: string) => {
    if (!inputEmail || !inputEmail.includes("@")) {
      setEmailError("")
      return true
    }

    try {
      const res = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail }),
      })
      const data = await res.json()
      if (data && data.valid === false) {
        setEmailError(language === "es" ? "Email no aceptado" : "Email not allowed")
        return false
      } else {
        setEmailError("")
        return true
      }
    } catch {
      setEmailError("")
      return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(language === "es" ? "Por favor completa todos los campos obligatorios." : "Please fill in all required fields.")
      return
    }

    if (!hasAcceptedHabeasData) {
      setErrorMsg(language === "es" ? "Debes autorizar el tratamiento de datos personales para continuar." : "You must authorize personal data treatment to proceed.")
      return
    }

    const isValidDomain = await validateEmailDomain(email)
    if (!isValidDomain) return

    setErrorMsg("")
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lead",
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          description: description.trim(),
          acepta_tratamiento_datos: hasAcceptedHabeasData,
        }),
      })

      const data = await res.json()
      setIsSubmitting(false)

      if (res.ok && data.success) {
        setSubmitted(true)
      } else {
        setErrorMsg(data.error || (language === "es" ? "Ocurrió un error al enviar la solicitud. Inténtalo de nuevo." : "Error submitting request."))
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMsg(
        err?.message ||
        (language === "es"
          ? "No se pudo completar el envío. Por favor verifica tu conexión o inténtalo nuevamente."
          : "Could not complete request. Please check your connection or try again.")
      )
    }
  }

  const resetForm = () => {
    setName("")
    setPhone("")
    setEmail("")
    setDescription("")
    setSubmitted(false)
    setErrorMsg("")
    setEmailError("")
  }

  return (
    <section id="agendar" className="relative z-30 py-12 sm:py-16 pb-20 sm:pb-28 bg-[#F5F4F0] border-b border-black/[0.06]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── SECTION HEADER ───────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto space-y-3 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono text-black/70 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-semibold">
            {t.booking.tag}
          </span>

          <RevealText as="h2" className="text-3xl sm:text-4xl md:text-5xl font-medium text-[#111] tracking-tight leading-tight">
            {t.booking.title}
          </RevealText>
          <RevealText as="p" className="text-xs sm:text-sm md:text-base text-black/75 font-normal leading-relaxed">
            {t.booking.subtitle}
          </RevealText>
        </div>

        {/* ── SIMPLIFIED 4-FIELD ADVISORY FORM CARD ────────────────────────── */}
        <div className="bg-white rounded-3xl border border-black/[0.08] p-6 sm:p-10 shadow-sm max-w-2xl mx-auto">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Field 1: Nombre Completo */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {t.booking.nameLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-black/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.booking.namePlaceholder}
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF9F5] border border-black/15 rounded-xl text-sm text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Field 2 & 3 Grid: Celular/WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Field 2: Celular / WhatsApp */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                    {t.booking.phoneLabel} <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    placeholder={t.booking.phonePlaceholder}
                  />
                </div>

                {/* Field 3: Correo Electrónico */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                    {t.booking.emailLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-black/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError("")
                      }}
                      placeholder={t.booking.emailPlaceholder}
                      className={`w-full pl-10 pr-4 py-3 bg-[#FAF9F5] border ${
                        emailError ? "border-red-500" : "border-black/15"
                      } rounded-xl text-sm text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] font-mono text-red-600 font-medium mt-1">
                      {emailError}
                    </p>
                  )}
                </div>

              </div>

              {/* Field 4: Comentario / Mensaje */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {t.booking.commentLabel || "Comentario / Mensaje"}
                </label>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.booking.commentPlaceholder || "Cuéntanos sobre tus objetivos comerciales o dudas..."}
                    className="w-full p-4 bg-[#FAF9F5] border border-black/15 rounded-xl text-sm text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Habeas Data Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-black/70 leading-relaxed font-mono">
                  <input
                    type="checkbox"
                    checked={hasAcceptedHabeasData}
                    onChange={(e) => setHasAcceptedHabeasData(e.target.checked)}
                    className="mt-0.5 rounded border-black/20 text-black focus:ring-black"
                  />
                  <span>
                    {language === "es"
                      ? "Autorizo el tratamiento de mis datos personales según la Ley 1581 de 2012 (Habeas Data)."
                      : "I authorize personal data treatment under Ley 1581 (Habeas Data)."}
                  </span>
                </label>
              </div>

              {/* High-Impact Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[52px] py-4 px-6 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-mono uppercase tracking-wider hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{t.booking.submittingBtn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.booking.submitBtn}</span>
                    <Send className="w-4 h-4 text-emerald-400 ml-1" />
                  </>
                )}
              </button>

            </form>
          ) : (
            /* Confirmation Success Card */
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-medium text-[#111]">
                  {t.booking.successTitle}
                </h3>
                <p className="text-sm text-black/75 max-w-md mx-auto leading-relaxed">
                  {t.booking.successDesc}
                </p>
              </div>

              <div className="pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 rounded-xl border border-black/15 bg-white hover:bg-black/[0.03] text-xs font-mono uppercase tracking-wider font-semibold text-black/80 transition-colors"
                >
                  {t.booking.newBookingBtn}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Confidentiality Trust Banner */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-black/50 text-center pt-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Atención personalizada en menos de 15 minutos • Cero spam</span>
        </div>

      </div>
    </section>
  )
}
