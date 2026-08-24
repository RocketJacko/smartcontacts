"use client"

import React, { useState } from "react"
import { X, CheckCircle2, Loader2, ShieldCheck, Tag, User, Phone, Mail, Sparkles, KeyRound, RefreshCw } from "lucide-react"
import { useGeoLocation } from "@/lib/use-geo-location"
import { useLanguage } from "@/lib/language-context"
import { PhoneInput } from "@/components/phone-input"

interface PlatziActivationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PlatziActivationModal({ isOpen, onClose }: PlatziActivationModalProps) {
  const { language } = useLanguage()
  const { countryCode, countryName, dialCode, flagUrl, userCurrency, formattedPlatziPrice, toggleCurrency } = useGeoLocation()

  // Step 1 Form States
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [platziAccountEmail, setPlatziAccountEmail] = useState("")
  const [discountCode, setDiscountCode] = useState("")

  // Flow & Step States
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [expectedCode, setExpectedCode] = useState("")
  const [inputCode, setInputCode] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  if (!isOpen) return null

  const handleResetModal = () => {
    setStep(1)
    setExpectedCode("")
    setInputCode("")
    setErrorMsg("")
    setSuccessMessage("")
    onClose()
  }

  // Step 1: Submit initial request -> Receive verification PIN
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name.trim() || !phone.trim() || !email.trim() || !platziAccountEmail.trim()) {
      setErrorMsg(language === "es" ? "Por favor completa todos los campos obligatorios." : "Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/benefits/platzi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          platziAccountEmail,
          discountCode,
          countryCode,
          countryName,
          currency: userCurrency,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setExpectedCode(data.verificationCode || "")
        setStep(2)
      } else {
        setErrorMsg(data.error || (language === "es" ? "Ocurrió un error al procesar la solicitud." : "An error occurred."))
      }
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al enviar la solicitud." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Verify PIN & Execute final activation webhook
  const handleStep2Verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!inputCode.trim()) {
      setErrorMsg(language === "es" ? "Por favor ingresa el código de confirmación." : "Please enter confirmation code.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/benefits/platzi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputCode,
          expectedCode,
          name,
          phone,
          email,
          platziAccountEmail,
          discountCode,
          countryCode,
          countryName,
          currency: userCurrency,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccessMessage(data.message || "¡Beneficio de Platzi activado exitosamente!")
        setStep(3)
      } else {
        setErrorMsg(data.error || (language === "es" ? "Código incorrecto o error en activación." : "Verification error."))
      }
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al verificar el código." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetModal}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/[0.04] hover:bg-black/10 flex items-center justify-center text-black/60 hover:text-black transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 ? (
          <div className="text-center py-6 space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-medium text-[#111]">
                {language === "es" ? "¡Activación Confirmada!" : "Activation Confirmed!"}
              </h3>
              <p className="text-xs sm:text-sm text-black/75 leading-relaxed max-w-sm mx-auto">
                {successMessage}
              </p>
              <p className="text-[11px] font-mono text-black/50">
                Se activó la cuenta <span className="font-semibold text-black">{platziAccountEmail}</span> por 5 meses ({formattedPlatziPrice}).
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetModal}
              className="px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-wider hover:bg-black/80 transition-all font-semibold cursor-pointer"
            >
              {language === "es" ? "FINALIZAR" : "FINISH"}
            </button>
          </div>
        ) : step === 2 ? (
          /* STEP 2: CODE VERIFICATION (RATE LIMIT PROTECTION) */
          <form onSubmit={handleStep2Verify} className="space-y-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/60 font-semibold uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === "es" ? "PASO 2 DE 2: VERIFICACIÓN DE CÓDIGO" : "STEP 2 OF 2: CODE VERIFICATION"}</span>
              </div>

              <div>
                <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                  {language === "es" ? "Ingresa tu Código de Confirmación" : "Enter Confirmation Code"}
                </h3>
                <p className="text-xs text-black/70 leading-relaxed mt-1">
                  {language === "es"
                    ? `Hemos generado el código de activación de 6 dígitos para la cuenta: ${platziAccountEmail}.`
                    : `Enter the 6-digit confirmation code for account: ${platziAccountEmail}.`}
                </p>
              </div>

              {/* Demo Helper Banner showing expected PIN */}
              {expectedCode && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-mono text-center">
                  Código de activación generado: <span className="font-bold text-sm tracking-widest">{expectedCode}</span>
                </div>
              )}
            </div>

            {/* Input PIN Field */}
            <div className="space-y-1">
              <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                {language === "es" ? "Código de 6 Dígitos *" : "6-Digit Code *"}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Ej. 123456"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F5] border border-black/15 rounded-xl text-base font-mono font-bold tracking-widest text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black focus:bg-white transition-colors text-center"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === "es" ? "VERIFICANDO Y ACTIVANDO..." : "VERIFYING..."}</span>
                  </>
                ) : (
                  <span>{language === "es" ? "CONFIRMAR Y ACTIVAR BENEFICIO" : "CONFIRM AND ACTIVATE BENEFIT"}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2.5 text-xs font-mono text-black/60 hover:text-black transition-colors"
              >
                &larr; {language === "es" ? "Volver a editar datos" : "Edit request details"}
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: INITIAL DATA COLLECTION */
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div className="space-y-3">


              <div>
                <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                  {language === "es" ? "Activar Beneficio Platzi" : "Activate Platzi Benefit"}
                </h3>
                <p className="text-xs text-black/60 font-mono mt-0.5">
                  {formattedPlatziPrice} — 5 meses de acceso total
                </p>
              </div>


            </div>

            {/* Form Fields */}
            <div className="space-y-3 pt-1">
              
              {/* Field 1: Nombre Completo */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Nombre Completo *" : "Full Name *"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Field 2: Celular / WhatsApp con PhoneInput */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Número Celular / WhatsApp " : "Mobile / WhatsApp Number "}
                  <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={phone}
                  onChange={(fullNum) => setPhone(fullNum)}
                  placeholder="+57 300 123 4567"
                />
              </div>

              {/* Field 3: Correo de Contacto */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Correo de Contacto *" : "Contact Email *"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@empresa.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Field 4: Cuenta de Correo que tomará el servicio Platzi */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-emerald-900 font-bold uppercase tracking-wider">
                  {language === "es" ? "Cuenta de correo que tomará el servicio Platzi *" : "Platzi Service Account Email *"}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={platziAccountEmail}
                    onChange={(e) => setPlatziAccountEmail(e.target.value)}
                    placeholder="mi-cuenta-platzi@correo.com"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs text-[#111] placeholder:text-black/40 focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[10px] font-mono text-black/50">
                  Activamos primero el beneficio sobre esta cuenta de correo.
                </p>
              </div>

              {/* Field 5: Código de Descuento (opcional) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-mono text-black/70 font-semibold uppercase tracking-wider">
                  {language === "es" ? "Código de Descuento (Opcional)" : "Discount Code (Optional)"}
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Ej. PLATZI2026"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs font-mono text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors uppercase"
                  />
                </div>
              </div>

            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === "es" ? "GENERANDO CÓDIGO..." : "GENERATING CODE..."}</span>
                </>
              ) : (
                <span>Activar Cuenta</span>
              )}
            </button>



          </form>
        )}

      </div>
    </div>
  )
}
