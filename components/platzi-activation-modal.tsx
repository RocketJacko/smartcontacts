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

  // Form Field States
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [platziAccountEmail, setPlatziAccountEmail] = useState("")
  const [discountCode, setDiscountCode] = useState("")

  // Dynamic Display States
  const [displayPrice, setDisplayPrice] = useState<string>(formattedPlatziPrice || "$400.909,75 COP")
  const [displayDuration, setDisplayDuration] = useState<string>("1 año")
  const [displayPlanName, setDisplayPlanName] = useState<string>("Plan Basic")
  const [displayDiscountLabel, setDisplayDiscountLabel] = useState<string>("")

  // Step States: 1 (Form) | 2 (Verification PIN) | 3 (Success)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [inputCode, setInputCode] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Update default display price when geolocation resolves
  useEffect(() => {
    if (formattedPlatziPrice) {
      setDisplayPrice(formattedPlatziPrice)
    }
  }, [formattedPlatziPrice])

  if (!isOpen) return null

  const handleResetModal = () => {
    setStep(1)
    setInputCode("")
    setErrorMsg("")
    setSuccessMessage("")
    setDiscountCode("")
    setDisplayPrice(formattedPlatziPrice || "$400.909,75 COP")
    setDisplayDuration("1 año")
    setDisplayPlanName("Plan Basic")
    setDisplayDiscountLabel("")
    onClose()
  }

  // Submit Main Form (Step 1) -> Validates code and sends activation email via n8n backend
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name.trim() || !phone.trim() || !email.trim() || !platziAccountEmail.trim() || !discountCode.trim()) {
      setErrorMsg(language === "es" ? "Por favor completa todos los campos obligatorios, incluyendo el código de descuento." : "Please fill in all required fields, including the discount code.")
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
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          platziAccountEmail: platziAccountEmail.trim(),
          discountCode: discountCode.trim(),
          countryCode,
          countryName,
          currency: userCurrency,
        }),
      })

      let data: any = null
      try {
        data = await res.json()
      } catch {
        data = { error: "Respuesta inesperada del servidor al procesar la solicitud." }
      }

      const isSuccess = Boolean(
        res.ok &&
        data?.success !== false &&
        !data?.error &&
        !String(data?.error || data?.mensaje || data?.message || "").toLowerCase().includes("incompleto") &&
        !String(data?.error || data?.mensaje || data?.message || "").toLowerCase().includes("no valido") &&
        !String(data?.error || data?.mensaje || data?.message || "").toLowerCase().includes("no válido") &&
        !String(data?.error || data?.mensaje || data?.message || "").toLowerCase().includes("inválido") &&
        !String(data?.error || data?.mensaje || data?.message || "").toLowerCase().includes("invalido")
      )

      if (isSuccess) {
        if (data.planInfo) {
          setDisplayPlanName(data.planInfo.planName)
          setDisplayPrice(data.planInfo.formattedPrice)
          setDisplayDuration(data.planInfo.duration)
        }
        setErrorMsg("")
        setStep(2)
      } else {
        const rawErr = data?.error || data?.mensaje || data?.message || (language === "es" ? "Codigo Incompleto o no valido" : "Invalid code")
        setErrorMsg(cleanErrorForUI(rawErr))
      }
    } catch (err: any) {
      console.error("[PLATZI MODAL SUBMIT ERROR]", err)
      setErrorMsg(language === "es" ? "Error de conexión al enviar la solicitud." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2 Submit: Verify PIN entered by user
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
          inputCode: inputCode.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          platziAccountEmail: platziAccountEmail.trim(),
          discountCode: discountCode.trim(),
          countryCode,
          countryName,
          currency: userCurrency,
        }),
      })

      const data = await res.json()

      const rawMsg = String(data.error || data.message || data.details || "").toLowerCase()
      const isSuccessConfirmation =
        rawMsg.includes("recibida") ||
        rawMsg.includes("confirmada") ||
        rawMsg.includes("exitosa") ||
        rawMsg.includes("exitoso") ||
        rawMsg.includes("activad")

      const isError =
        !res.ok ||
        data.success === false ||
        (data.error && !isSuccessConfirmation) ||
        rawMsg.includes("errado") ||
        rawMsg.includes("mal escrito") ||
        rawMsg.includes("incorrecto") ||
        rawMsg.includes("no coincide")

      if (isError) {
        const rawErr = data.error || (language === "es" ? "El código de seguridad ingresado es incorrecto o está mal escrito." : "Invalid security code.")
        setErrorMsg(cleanErrorForUI(rawErr))
        return
      }

      if (data.planInfo) {
        setDisplayPlanName(data.planInfo.planName || "5 MESES + 7 MESES EXTRAS CONDICIONALES AL CONVENIO")
        setDisplayPrice(data.planInfo.formattedPrice || "0 COP")
        setDisplayDuration(data.planInfo.duration || data.planInfo.planName)
      } else if (data.details) {
        const rawDetail = Array.isArray(data.details) ? data.details[0] : data.details
        if (rawDetail?.plan) setDisplayPlanName(rawDetail.plan)
        if (rawDetail?.valor) setDisplayPrice(rawDetail.valor)
      }

      setSuccessMessage(data.resultado || data.message || "Cuenta activada exitosamente")
      setErrorMsg("")
      setStep(3)
    } catch {
      setErrorMsg(language === "es" ? "Error de conexión al verificar el código." : "Connection error.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          /* STEP 3: ACTIVATION SUCCESS CELEBRATION WITH N8N CONFIRMATION DETAILS */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "¡Activación Confirmada!" : "Activation Confirmed!"}
              </h3>
              
              <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50/80 py-2.5 px-4 rounded-xl border border-emerald-200/80 max-w-sm mx-auto">
                {successMessage || "Cuenta activada exitosamente"}
              </p>

              {/* Structured Card displaying n8n activation details */}
              <div className="text-xs font-mono text-black/70 pt-3 space-y-2 text-left bg-[#FAF9F5] p-4 rounded-2xl border border-black/10">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Producto</span>
                  <span className="font-bold text-black">Platzi</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 py-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Cuenta Platzi</span>
                  <span className="font-bold text-black">{platziAccountEmail}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 py-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Plan Activado</span>
                  <span className="font-bold text-emerald-700 text-xs leading-snug">{displayPlanName}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Valor</span>
                  <span className="font-bold text-black text-sm">{displayPrice}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetModal}
              className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-wider hover:bg-black/90 transition-all font-bold shadow-md cursor-pointer"
            >
              {language === "es" ? "FINALIZAR" : "FINISH"}
            </button>
          </div>
        ) : step === 2 ? (
          /* STEP 2: SECURITY CODE VERIFICATION PIN INPUT */
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
        ) : (
          /* STEP 1: CLEAN UNIFIED FORM WITH OPTIONAL DISCOUNT CODE */
          <form onSubmit={handleStep1Submit} className="space-y-5">
            
            {/* Header Title & Dynamic Price Banner */}
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

            {/* Input Fields Container */}
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

              {/* Field 5: Código de Descuento (Requerido) */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {language === "es" ? "Código de Descuento " : "Discount Code "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-black/40 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder={language === "es" ? "Ingresa tu código de descuento" : "Enter discount code"}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs font-mono text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors uppercase font-bold"
                  />
                </div>
              </div>

            </div>

            {errorMsg && (
              <p className="text-xs font-mono font-medium text-red-600 text-center py-1">
                {errorMsg}
              </p>
            )}

            {/* Submit Button */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === "es" ? "ENVIANDO CÓDIGO DE ACTIVACIÓN..." : "SENDING ACTIVATION CODE..."}</span>
                  </>
                ) : (
                  <span>{language === "es" ? "SOLICITAR CÓDIGO DE ACTIVACIÓN" : "REQUEST ACTIVATION CODE"}</span>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
