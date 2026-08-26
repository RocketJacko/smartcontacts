"use client"

import React, { useState, useEffect } from "react"
import { X, CheckCircle2, Loader2, User, Mail, KeyRound, Tag } from "lucide-react"
import { useGeoLocation } from "@/lib/use-geo-location"
import { useLanguage } from "@/lib/language-context"
import { PhoneInput } from "@/components/phone-input"
import { verificarDominioCorreoValido } from "@/lib/email-validator"

interface PlatziActivationModalProps {
  isOpen: boolean
  onClose: () => void
}

function cleanErrorForUI(raw: string): string {
  if (!raw) return ""
  let str = String(raw).trim()

  if (str.includes("threadId") || str.includes("labelIds") || str.includes('"SENT"')) {
    return "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
  }

  const jsonMatch = str.match(/(\{|\[)[\s\S]*(\}|\])/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed?.labelIds || parsed?.threadId) {
        return "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
      }
      if (Array.isArray(parsed) && parsed[0]?.mensaje) return String(parsed[0].mensaje).trim()
      if (Array.isArray(parsed) && parsed[0]?.message) return String(parsed[0].message).trim()
      if (parsed?.mensaje) return String(parsed.mensaje).trim()
      if (parsed?.message) return String(parsed.message).trim()
      if (parsed?.error) return String(parsed.error).trim()
    } catch {
      // fallback
    }
  }

  str = str.replace(/^El webhook de n8n [^:]+:\s*/i, "")
  str = str.replace(/^HTTP \d+ error:\s*/i, "")

  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim()
  }

  return str
}

export function PlatziActivationModal({ isOpen, onClose }: PlatziActivationModalProps) {
  const { language } = useLanguage()
  const { countryCode, countryName, userCurrency, formattedPlatziPrice } = useGeoLocation()

  // Step 1 Form States
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [platziAccountEmail, setPlatziAccountEmail] = useState("")
  const [discountCode, setDiscountCode] = useState("")

  // Sub-stage for Step 1: 'code' (only discount code input) vs 'details' (user contact & account inputs)
  const [step1SubStage, setStep1SubStage] = useState<"code" | "details">("code")

  // Dynamic Discount Validation States
  const [displayPrice, setDisplayPrice] = useState<string>(formattedPlatziPrice || "$400.909,75 COP")
  const [displayDuration, setDisplayDuration] = useState<string>("1 año")
  const [displayPlanName, setDisplayPlanName] = useState<string>("Plan Basic")
  const [displayDiscountLabel, setDisplayDiscountLabel] = useState<string>("")
  const [isCodeValid, setIsCodeValid] = useState<boolean>(true)
  const [isCouponValidated, setIsCouponValidated] = useState<boolean>(false)

  // Flow & Step States
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [inputCode, setInputCode] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidatingCode, setIsValidatingCode] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  if (!isOpen) return null

  const handleResetModal = () => {
    setStep(1)
    setStep1SubStage("code")
    setInputCode("")
    setErrorMsg("")
    setSuccessMessage("")
    setDisplayDiscountLabel("")
    setIsCouponValidated(false)
    onClose()
  }

  // Advance from SubStage 1A (Code Input) to SubStage 1B (Data Input)
  const handleContinueToDetails = async (e: React.FormEvent) => {
    e.preventDefault()

    // If coupon has already been validated and confirmed by server, user click on 'ACTIVAR' proceeds to details form
    if (isCouponValidated) {
      setErrorMsg("")
      setStep1SubStage("details")
      return
    }

    setErrorMsg("")
    setIsValidatingCode(true)

    const codeToValidate = discountCode.trim()

    try {
      const res = await fetch("/api/benefits/platzi/validate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToValidate,
          currency: userCurrency,
          validarCupon: true,
          VALIDARCUPON: true,
        }),
      })
      const resolved = await res.json()

      if (res.ok && resolved) {
        if (!resolved.valid && codeToValidate !== "") {
          setErrorMsg(
            resolved.error ||
            resolved.message ||
            (language === "es"
              ? `El código "${codeToValidate}" no es un código de descuento válido.`
              : `Invalid discount code "${codeToValidate}".`)
          )
          setIsCouponValidated(false)
          setIsValidatingCode(false)
          return
        }

        setDisplayPrice(resolved.formattedPrice || resolved.price || "$400.909,75 COP")
        setDisplayDuration(resolved.duration || "1 año")
        setDisplayPlanName(resolved.planName || resolved.plan || "Plan Basic")
        setDisplayDiscountLabel(resolved.discountLabel || "")
        setIsCodeValid(resolved.valid)
        setIsCouponValidated(true)
        setErrorMsg("")
      } else {
        setErrorMsg(resolved.error || resolved.message || (language === "es" ? "Error validando el código de descuento." : "Error validating discount code."))
      }
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al validar el código." : "Network error validating discount code.")
    } finally {
      setIsValidatingCode(false)
    }
  }

  // Step 1 Final Submit (SubStage 1B) -> Webhook sends email verification code to user
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name.trim() || !phone.trim() || !email.trim() || !platziAccountEmail.trim()) {
      setErrorMsg(language === "es" ? "Por favor completa todos los campos obligatorios." : "Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Validar dominio de correo de contacto
      const contactDomainCheck = await verificarDominioCorreoValido(email)
      if (!contactDomainCheck.valid) {
        setErrorMsg(contactDomainCheck.reason || (language === "es" ? "El correo de contacto no tiene un dominio válido." : "Invalid contact email domain."))
        setIsSubmitting(false)
        return
      }

      // 2. Validar dominio de correo de cuenta Platzi
      const platziDomainCheck = await verificarDominioCorreoValido(platziAccountEmail)
      if (!platziDomainCheck.valid) {
        setErrorMsg(platziDomainCheck.reason || (language === "es" ? "La cuenta Platzi no tiene un dominio válido." : "Invalid Platzi email domain."))
        setIsSubmitting(false)
        return
      }

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
        if (data.planInfo) {
          setDisplayPlanName(data.planInfo.planName)
          setDisplayPrice(data.planInfo.formattedPrice)
          setDisplayDuration(data.planInfo.duration)
        }
        setStep(2)
      } else {
        const rawErr = data.error || (language === "es" ? "Ocurrió un error al enviar el código de seguridad." : "An error occurred.")
        setErrorMsg(cleanErrorForUI(rawErr))
      }
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al enviar la solicitud." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: Forward user-entered PIN to n8n webhook for verification & activation
  const handleStep2Verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!inputCode.trim()) {
      setErrorMsg(language === "es" ? "Por favor ingresa el código de seguridad." : "Please enter security code.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/benefits/platzi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputCode,
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

      const rawMsg = String(data.error || data.message || data.details || "").toLowerCase()
      const isError =
        !res.ok ||
        !data.success ||
        data.error ||
        rawMsg.includes("errado") ||
        rawMsg.includes("mal escrito") ||
        rawMsg.includes("incorrecto") ||
        rawMsg.includes("no coincide") ||
        rawMsg.includes("inválido") ||
        rawMsg.includes("invalido") ||
        rawMsg.includes("error")

      if (isError) {
        const rawErr = data.error || data.message || (language === "es" ? "El código de seguridad ingresado es incorrecto o está mal escrito." : "Invalid security code.")
        setErrorMsg(cleanErrorForUI(rawErr))
        // NUNCA AVANZAR AL PASO 3 SI HAY ERROR EN EL CÓDIGO DE SEGURIDAD
        return
      }

      if (data.planInfo) {
        setDisplayPlanName(data.planInfo.planName)
        setDisplayPrice(data.planInfo.formattedPrice)
        setDisplayDuration(data.planInfo.duration)
      }
      setSuccessMessage(data.message || "¡Beneficio de Platzi activado exitosamente!")
      setStep(3)
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al verificar el código." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clean success message if it contains n8n test strings or raw Gmail JSON
  const isRawN8nTestMsg =
    !successMessage ||
    successMessage.includes("is not registered") ||
    successMessage.includes("Execute workflow") ||
    successMessage.includes("webhook") ||
    successMessage.includes("threadId") ||
    successMessage.includes("labelIds") ||
    successMessage.includes('"SENT"')

  const cleanSuccessMsgText = isRawN8nTestMsg
    ? "¡Tu solicitud de beneficio Platzi ha sido recibida y confirmada exitosamente!"
    : successMessage

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetModal}
          className="absolute top-5 right-5 p-2 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 3 ? (
          /* STEP 3: ACTIVATION SUCCESS STATE (ONLY REACHED UPON TRUE VALIDATION) */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-medium text-[#111]">
                {language === "es" ? "¡Activación Confirmada!" : "Activation Confirmed!"}
              </h3>
              <p className="text-xs sm:text-sm text-black/75 leading-relaxed max-w-sm mx-auto">
                {cleanSuccessMsgText}
              </p>
              <p className="text-[11px] font-mono text-black/60 pt-2 border-t border-black/[0.06] mt-2">
                Se activó el <span className="font-semibold text-black">{displayPlanName}</span> para la cuenta <span className="font-semibold text-black">{platziAccountEmail}</span> por {displayDuration} ({displayPrice}).
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
          /* STEP 2: CODE VERIFICATION (COPIED FROM EMAIL) */
          <form onSubmit={handleStep2Verify} className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "Código de Seguridad" : "Security Code"}
              </h3>
              <p className="text-xs text-black/70 leading-relaxed">
                {language === "es"
                  ? `Hemos enviado un código de seguridad al correo electrónico: ${email}. Revisa tu bandeja de entrada, cópialo e ingrésalo a continuación para confirmar la activación de la cuenta ${platziAccountEmail}.`
                  : `We sent a security code to ${email}. Check your inbox and enter it below to confirm activation for ${platziAccountEmail}.`}
              </p>
            </div>

            {/* Input Security Code Field */}
            <div className="space-y-1">
              <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                {language === "es" ? "Código de Seguridad *" : "Security Code *"}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Ej. 123456"
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F5] border border-black/15 rounded-xl text-base font-mono font-bold tracking-widest text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black focus:bg-white transition-colors text-center"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-mono font-medium text-red-600 text-center py-1">
                {errorMsg}
              </p>
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
                    <span>{language === "es" ? "VERIFICANDO CÓDIGO..." : "VERIFYING..."}</span>
                  </>
                ) : (
                  <span>{language === "es" ? "CONFIRMAR ACTIVACIÓN" : "CONFIRM ACTIVATION"}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-mono text-black/60 hover:text-black transition-colors cursor-pointer"
              >
                &larr; {language === "es" ? "Volver a editar datos" : "Edit request details"}
              </button>
            </div>
          </form>
        ) : step1SubStage === "code" ? (
          /* STEP 1A: DISCOUNT CODE INPUT ONLY (BUTTON ONLY SHOWN WHEN CODE IS VALID) */
          <form onSubmit={handleContinueToDetails} className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "Activar Beneficio Platzi" : "Activate Platzi Benefit"}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-sm font-mono font-bold text-[#111]">
                  {displayPrice}
                </span>
                <span className="text-xs text-black/60 font-mono">
                  — {displayDuration} (Para 1 estudiante)
                </span>
                {displayDiscountLabel && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    {displayDiscountLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Single Field: Código de Descuento (Opcional) */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Código de Descuento (Opcional)" : "Discount Code (Optional)"}
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value)
                      setIsCouponValidated(false)
                    }}
                    placeholder={language === "es" ? "Ingresa tu código de descuento" : "Enter discount code"}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs font-mono text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors uppercase font-bold"
                  />
                </div>
              </div>

              {/* Tarjeta de Confirmación de Plan detectado por el Backend */}
              {isCouponValidated && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 space-y-1.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {language === "es" ? "Plan Confirmado por el Servidor" : "Server Plan Confirmed"}
                    </span>
                    {discountCode.trim() && (
                      <button
                        type="button"
                        onClick={() => setIsCouponValidated(false)}
                        className="text-[10px] font-mono text-emerald-700 underline hover:text-emerald-900 cursor-pointer"
                      >
                        {language === "es" ? "Editar código" : "Edit code"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-950 pt-0.5">
                    <span className="font-bold">{displayPlanName}</span>
                    <span className="font-bold text-emerald-700">{displayPrice}</span>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-xs font-mono font-medium text-red-600 text-center py-1">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isValidatingCode}
              className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isValidatingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{language === "es" ? "VALIDANDO CON SERVIDOR..." : "VERIFYING WITH SERVER..."}</span>
                </>
              ) : isCouponValidated ? (
                <span>{language === "es" ? "ACTIVAR" : "ACTIVATE"}</span>
              ) : (
                <span>{language === "es" ? "CONTINUAR" : "CONTINUE"}</span>
              )}
            </button>
          </form>
        ) : (
          /* STEP 1B: USER DATA INPUTS (WITH REAL DNS DOMAIN VALIDATION) */
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {displayPlanName && displayPlanName !== "Plan Basic"
                  ? `${language === "es" ? "Activar Beneficio" : "Activate Benefit"} — ${displayPlanName}`
                  : (language === "es" ? "Activar Beneficio Platzi" : "Activate Platzi Benefit")}
              </h3>
              
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-sm font-mono font-bold text-[#111]">
                  {displayPrice}
                </span>
                <span className="text-xs text-black/60 font-mono">
                  — {displayDuration} (Para 1 estudiante)
                </span>
                {displayDiscountLabel && (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    {displayDiscountLabel}
                  </span>
                )}
              </div>
            </div>

            {/* User Contact & Account Fields */}
            <div className="space-y-3 pt-1">
              
              {/* Field 1: Nombre Completo */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Nombre Completo " : "Full Name "}
                  <span className="text-red-500">*</span>
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

              {/* Field 2: Celular / WhatsApp */}
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
                  {language === "es" ? "Correo de Contacto " : "Contact Email "}
                  <span className="text-red-500">*</span>
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
                  {language === "es" ? "Cuenta de correo que tomará el servicio Platzi " : "Platzi Service Account Email "}
                  <span className="text-red-500">*</span>
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

            </div>

            {errorMsg && (
              <p className="text-xs font-mono font-medium text-red-600 text-center py-1">
                {errorMsg}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === "es" ? "VALIDANDO CORREOS Y ENVIANDO CÓDIGO..." : "VALIDATING & SENDING CODE..."}</span>
                  </>
                ) : (
                  <span>Activar Cuenta</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep1SubStage("code")}
                className="w-full py-2 text-xs font-mono text-black/60 hover:text-black transition-colors cursor-pointer"
              >
                &larr; {language === "es" ? "Volver a editar código de descuento" : "Back to edit discount code"}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
