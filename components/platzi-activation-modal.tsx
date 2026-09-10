"use client"

import React, { useState, useEffect } from "react"
import { X, CheckCircle2, Loader2, User, Mail, KeyRound, ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react"
import { useGeoLocation } from "@/lib/use-geo-location"
import { useLanguage } from "@/lib/language-context"
import { PhoneInput } from "@/components/phone-input"
import { verificarDominioCorreoValido } from "@/lib/email-validator"
import { CaptchaChallenge } from "@/components/ui/captcha-challenge"

interface PlatziActivationModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface PlatziPlan {
  id: string
  nombre_plan: string
  meses_cubrimiento: number
  precio: number
  moneda: string
  vigente: boolean
  caracteristicas?: string
  total_disponibles?: number | null
  tipo_pago?: string
  numero_cuotas?: number
  pago_anticipado?: boolean
}

export interface SpecialOfferData {
  id: string
  codigo_oferta: string
  titulo: string
  descripcion: string
  institucion_empresa: string
  precio_cop: number
  precio_usd: number
  meses_cubrimiento: number
  caracteristicas?: string[]
  afiliado_id?: string
  afiliado_nombre?: string
  codigo_referido?: string
  activo: boolean
  tipo_pago?: string
  numero_cuotas?: number
  pago_anticipado?: boolean
}

const DEFAULT_PLANS: PlatziPlan[] = [
  {
    id: "cc7a5125-02a8-44d7-92b5-9e6ef4dca49f",
    nombre_plan: "Plan 6 Meses",
    meses_cubrimiento: 6,
    precio: 95000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Acceso completo a la plataforma Platzi por 6 meses",
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: false,
  },
  {
    id: "b381bcfd-53f5-4ef3-b5d6-6c5863bb3450",
    nombre_plan: "Plan 12 Meses Pago Único",
    meses_cubrimiento: 12,
    precio: 180000,
    moneda: "COP",
    vigente: true,
    caracteristicas: "Suscripción anual con tarifa preferencial y soporte continuo",
    tipo_pago: "pago_unico",
    numero_cuotas: 1,
    pago_anticipado: false,
  },
]

function formatPlanPrice(price: number, currency: string = "COP"): string {
  try {
    return new Intl.NumberFormat(currency === "COP" ? "es-CO" : "en-US", {
      style: "currency",
      currency: currency || "COP",
      maximumFractionDigits: 0,
    }).format(price)
  } catch {
    return `$${Number(price).toLocaleString()} ${currency}`
  }
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
  const {
    countryCode,
    countryName,
    userCurrency,
    flagUrl,
    toggleCurrency,
    formatPlanPriceDynamic,
  } = useGeoLocation()

  // Estados del Formulario
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [platziAccountEmail, setPlatziAccountEmail] = useState("")
  const [discountCode, setDiscountCode] = useState("")
  const [captchaToken, setCaptchaToken] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  // Estados de Planes Disponibles
  const [plans, setPlans] = useState<PlatziPlan[]>(DEFAULT_PLANS)
  const [selectedPlan, setSelectedPlan] = useState<PlatziPlan>(DEFAULT_PLANS[0])
  const [isLoadingPlans, setIsLoadingPlans] = useState(false)
  const [specialOffer, setSpecialOffer] = useState<SpecialOfferData | null>(null)

  // Estados dinámicos de producto / plan
  const [displayPrice, setDisplayPrice] = useState<string>(
    formatPlanPriceDynamic(DEFAULT_PLANS[0].precio, DEFAULT_PLANS[0].moneda)
  )
  const [displayDuration, setDisplayDuration] = useState<string>("6 meses")
  const [displayPlanName, setDisplayPlanName] = useState<string>(DEFAULT_PLANS[0].nombre_plan)

  // Sincronizar precio dinámico si cambia la moneda detectada (COP <-> USD) o el plan
  useEffect(() => {
    if (selectedPlan) {
      setDisplayPrice(formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda))
    }
  }, [selectedPlan, formatPlanPriceDynamic, userCurrency])

  // Pasos: 1 (Ingreso de datos) | 2 (Código PIN recibido al correo) | 3 (Confirmación exitosa)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [inputCode, setInputCode] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Cargar planes vigentes y validar si existe una oferta especial / convenio
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function loadPlans() {
      setIsLoadingPlans(true)
      try {
        let offerItem: PlatziPlan | null = null

        // 1. Detectar si la URL incluye parámetro de oferta o convenio (?oferta=... o ?convenio=...)
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search)
          const offerSlug = params.get("oferta") || params.get("convenio") || params.get("promo")
          if (offerSlug && offerSlug.trim()) {
            try {
              const offerRes = await fetch(`/api/benefits/offers/${encodeURIComponent(offerSlug.trim().toUpperCase())}`)
              const offerData = await offerRes.json()
              if (offerData?.success && offerData?.valida && offerData?.oferta) {
                const off = offerData.oferta as SpecialOfferData
                if (isMounted) setSpecialOffer(off)

                // Si la oferta tiene un revendedor asignado, atribuir su código automáticamente
                if (off.codigo_referido && isMounted) {
                  const refUpper = off.codigo_referido.toUpperCase().trim()
                  setDiscountCode(refUpper)
                  try {
                    localStorage.setItem("sc_ref_code", refUpper)
                  } catch {}
                }

                offerItem = {
                  id: `offer-${off.id}`,
                  nombre_plan: off.titulo,
                  meses_cubrimiento: off.meses_cubrimiento,
                  precio: Number(off.precio_cop),
                  moneda: "COP",
                  tipo_pago: off.tipo_pago || "pago_unico",
                  numero_cuotas: off.numero_cuotas || 1,
                  pago_anticipado: Boolean(off.pago_anticipado),
                  vigente: true,
                  caracteristicas:
                    off.descripcion ||
                    (off.institucion_empresa ? `Convenio especial ${off.institucion_empresa}` : "Plan exclusivo de convenio"),
                }
              }
            } catch {}
          }
        }

        // 2. Cargar planes generales de base de datos
        const res = await fetch("/api/benefits/platzi/plans")
        const data = await res.json()
        const standardPlans: PlatziPlan[] =
          data?.success && Array.isArray(data?.planes) && data.planes.length > 0 ? data.planes : DEFAULT_PLANS

        // 3. Si se accede por oferta especial o enlace de revendedor (?ref=), NO mostrar planes adicionales
        const hasRefOrOfferParam = typeof window !== "undefined" && Boolean(
          new URLSearchParams(window.location.search).get("ref") ||
          new URLSearchParams(window.location.search).get("referido") ||
          new URLSearchParams(window.location.search).get("oferta") ||
          new URLSearchParams(window.location.search).get("convenio")
        )

        let mergedPlans: PlatziPlan[] = standardPlans
        if (offerItem) {
          mergedPlans = [offerItem]
        } else if (hasRefOrOfferParam) {
          mergedPlans = [standardPlans[0]]
        }

        if (isMounted) {
          setPlans(mergedPlans)
          const chosen = offerItem || mergedPlans[0]
          setSelectedPlan(chosen)
          setDisplayPlanName(chosen.nombre_plan)
          setDisplayPrice(formatPlanPriceDynamic(chosen.precio, chosen.moneda))
          setDisplayDuration(
            chosen.meses_cubrimiento === 12
              ? language === "es" ? "1 año" : "1 year"
              : `${chosen.meses_cubrimiento} ${language === "es" ? "meses" : "months"}`
          )
        }
      } catch {
        // Mantener fallback DEFAULT_PLANS
      } finally {
        if (isMounted) setIsLoadingPlans(false)
      }
    }

    loadPlans()

    return () => {
      isMounted = false
    }
  }, [isOpen, language, formatPlanPriceDynamic])

  // Obtener internamente el código de revendedor atribuido (URL ?ref=... o localStorage / cookie)
  useEffect(() => {
    if (isOpen) {
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search)
          const urlRef = params.get("ref") || params.get("referido")
          if (urlRef && urlRef.trim()) {
            setDiscountCode(urlRef.trim().toUpperCase())
            return
          }
        }

        const storedCode = localStorage.getItem("sc_ref_code")
        if (storedCode && storedCode.trim()) {
          setDiscountCode(storedCode.trim().toUpperCase())
          return
        }

        const match = typeof document !== "undefined" ? document.cookie.match(/(?:^|;\s*)sc_ref_code=([^;]+)/) : null
        if (match && match[1]) {
          setDiscountCode(decodeURIComponent(match[1]).trim().toUpperCase())
          return
        }
      } catch {}
    }
  }, [isOpen])

  const handleSelectPlan = (planItem: PlatziPlan) => {
    setSelectedPlan(planItem)
    setDisplayPlanName(planItem.nombre_plan)
    setDisplayPrice(formatPlanPriceDynamic(planItem.precio, planItem.moneda))
    setDisplayDuration(
      planItem.meses_cubrimiento === 12
        ? language === "es" ? "1 año" : "1 year"
        : `${planItem.meses_cubrimiento} ${language === "es" ? "meses" : "months"}`
    )
  }

  if (!isOpen) return null

  const handleResetModal = () => {
    setStep(1)
    setInputCode("")
    setErrorMsg("")
    setSuccessMessage("")
    setCaptchaAnswer("")
    const basePlan = plans[0] || DEFAULT_PLANS[0]
    setSelectedPlan(basePlan)
    setDisplayPrice(formatPlanPriceDynamic(basePlan.precio, basePlan.moneda))
    setDisplayDuration(
      basePlan.meses_cubrimiento === 12
        ? language === "es" ? "1 año" : "1 year"
        : `${basePlan.meses_cubrimiento} ${language === "es" ? "meses" : "months"}`
    )
    setDisplayPlanName(basePlan.nombre_plan)
    onClose()
  }

  // ─── PASO 1: Ingreso de datos del usuario y envío de la solicitud ──────────
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name.trim() || !phone.trim() || !email.trim() || !platziAccountEmail.trim()) {
      setErrorMsg(
        language === "es"
          ? "Por favor completa todos los campos del formulario."
          : "Please fill out all required fields."
      )
      return
    }

    if (!captchaAnswer.trim()) {
      setErrorMsg(
        language === "es"
          ? "Por favor completa la verificación de seguridad (CAPTCHA)."
          : "Please complete the security verification (CAPTCHA)."
      )
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Validar dominio de correo de contacto
      const contactDomainCheck = await verificarDominioCorreoValido(email)
      if (!contactDomainCheck.valid) {
        setErrorMsg(
          contactDomainCheck.reason ||
            (language === "es" ? "El correo de contacto no tiene un dominio válido." : "Invalid contact email domain.")
        )
        setIsSubmitting(false)
        return
      }

      // 2. Validar dominio de correo de cuenta Platzi
      const platziDomainCheck = await verificarDominioCorreoValido(platziAccountEmail)
      if (!platziDomainCheck.valid) {
        setErrorMsg(
          platziDomainCheck.reason ||
            (language === "es" ? "La cuenta Platzi no tiene un dominio válido." : "Invalid Platzi email domain.")
        )
        setIsSubmitting(false)
        return
      }

      // 3. Validar resultado del CAPTCHA de seguridad
      const captchaRes = await fetch("/api/auth/captcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: captchaToken,
          answer: captchaAnswer.trim(),
        }),
      })

      const captchaData = await captchaRes.json()

      if (!captchaRes.ok || !captchaData.valid) {
        setErrorMsg(
          captchaData?.error ||
            (language === "es"
              ? "El resultado de la verificación de seguridad es incorrecto."
              : "Security verification answer is incorrect.")
        )
        setIsSubmitting(false)
        return
      }

      // Código de revendedor interno atribuido por enlace
      const cleanCode = discountCode.trim().toUpperCase()

      // 4. Enviar los datos del usuario con el código de revendedor y plan seleccionado incluidos en la petición
      const res = await fetch("/api/benefits/platzi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          platziAccountEmail: platziAccountEmail.trim(),
          discountCode: cleanCode,
          Proveedor: cleanCode,
          captchaToken,
          captchaAnswer,
          countryCode,
          countryName,
          currency: userCurrency,
          plan: selectedPlan?.nombre_plan || displayPlanName,
          planName: selectedPlan?.nombre_plan || displayPlanName,
          planId: selectedPlan?.id || "",
          meses_cubrimiento: selectedPlan?.meses_cubrimiento || 6,
          precio: selectedPlan?.precio || 95000,
          precio_formateado: displayPrice,
          tipo_pago: selectedPlan?.tipo_pago || specialOffer?.tipo_pago || "pago_unico",
          numero_cuotas: selectedPlan?.numero_cuotas || specialOffer?.numero_cuotas || 1,
          oferta_id: specialOffer?.id || null,
          oferta_codigo: specialOffer?.codigo_oferta || null,
          institucion: specialOffer?.institucion_empresa || null,
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
        setErrorMsg("")
        // Código despachado al correo: avanza al Paso 2 para ingresar el PIN
        setStep(2)
      } else {
        const rawErr =
          data?.error ||
          data?.mensaje ||
          data?.message ||
          (language === "es" ? "Error al procesar la solicitud." : "Error processing request.")
        setErrorMsg(cleanErrorForUI(rawErr))
      }
    } catch {
      setErrorMsg(
        language === "es"
          ? "Error de conexión al procesar la solicitud. Intenta de nuevo."
          : "Connection error processing request. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── PASO 2: Envío del código de seguridad recibido en el correo ───────────
  const handleStep2Verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!inputCode.trim()) {
      setErrorMsg(
        language === "es"
          ? "Por favor ingresa el código de seguridad recibido en tu correo."
          : "Please enter the security code received in your email."
      )
      return
    }

    setIsSubmitting(true)

    try {
      const cleanCode = discountCode.trim().toUpperCase()

      // Se envían los datos completos nuevamente junto con el código recibido y el plan seleccionado
      const res = await fetch("/api/benefits/platzi/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputCode: inputCode.trim(),
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          platziAccountEmail: platziAccountEmail.trim(),
          discountCode: cleanCode,
          Proveedor: cleanCode,
          countryCode,
          countryName,
          currency: userCurrency,
          plan: selectedPlan?.nombre_plan || displayPlanName,
          planName: selectedPlan?.nombre_plan || displayPlanName,
          planId: selectedPlan?.id || "",
          meses_cubrimiento: selectedPlan?.meses_cubrimiento || 6,
          precio: selectedPlan?.precio || 95000,
          precio_formateado: displayPrice,
          tipo_pago: selectedPlan?.tipo_pago || specialOffer?.tipo_pago || "pago_unico",
          numero_cuotas: selectedPlan?.numero_cuotas || specialOffer?.numero_cuotas || 1,
          oferta_id: specialOffer?.id || null,
          oferta_codigo: specialOffer?.codigo_oferta || null,
          institucion: specialOffer?.institucion_empresa || null,
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
        const rawErr =
          data.error ||
          (language === "es"
            ? "El código de seguridad ingresado es incorrecto o está vencido."
            : "Invalid or expired security code.")
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
      // Activación completada con éxito
      setStep(3)
    } catch {
      setErrorMsg(
        language === "es"
          ? "Error de conexión al verificar el código de seguridad."
          : "Connection error verifying code."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 my-auto font-sans">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetModal}
          className="absolute top-5 right-5 p-2 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 3 ? (
          /* ─── PASO 3: ACTIVACIÓN EXITOSA ─────────────────────────────────── */
          <div className="text-center py-4 space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "¡Activación Confirmada!" : "Activation Confirmed!"}
              </h3>
              
              <p className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50/80 py-2.5 px-4 rounded-xl border border-emerald-200/80 max-w-sm mx-auto">
                {successMessage || "Cuenta activada exitosamente"}
              </p>

              {/* Structured Card displaying activation details */}
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
          /* ─── PASO 2: INGRESO DE CÓDIGO RECIBIDO AL CORREO ────────────────── */
          <form onSubmit={handleStep2Verify} className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "Código de Seguridad" : "Security Code"}
              </h3>

              <p className="text-xs text-black/70 leading-relaxed">
                {language === "es"
                  ? `Hemos enviado un código de seguridad al correo electrónico: ${email}. Revisa tu bandeja de entrada o spam, cópialo e ingrésalo a continuación para confirmar la activación de ${platziAccountEmail}.`
                  : `We sent a security code to ${email}. Check your inbox or spam and enter it below to confirm activation for ${platziAccountEmail}.`}
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
                  autoFocus
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
                onClick={() => {
                  setErrorMsg("")
                  setStep(1)
                }}
                className="w-full py-2 text-xs font-mono text-black/60 hover:text-black transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === "es" ? "Volver a editar datos" : "Back to edit details"}</span>
              </button>
            </div>
          </form>
        ) : (
          /* ─── PASO 1: DATOS PERSONALES DEL USUARIO + CAPTCHA ─────────────── */
          <form onSubmit={handleStep1Submit} className="space-y-5">
            
            {/* Header Title & Dynamic Price Banner */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                  {language === "es" ? "Activar Beneficio Platzi" : "Activate Platzi Benefit"}
                </h3>
                
                {/* Country Flag & Currency Toggle Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F6] border border-black/[0.08] text-xs font-mono text-black/70 shrink-0">
                  <img src={flagUrl} alt={countryName} className="w-4 h-3 object-cover rounded-xs" />
                  <span className="font-semibold text-black/80">{countryCode}</span>
                  <button
                    type="button"
                    onClick={toggleCurrency}
                    className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/[0.06] hover:bg-black/10 border border-black/10 text-[10px] font-bold text-black cursor-pointer transition-colors"
                    title={language === "es" ? "Cambiar moneda (COP / USD)" : "Toggle currency (COP / USD)"}
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-black/50" />
                    <span>{userCurrency}</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-sm font-mono font-bold text-[#111]">
                  {displayPrice}
                </span>
                <span className="text-xs text-black/60 font-mono">
                  — {displayDuration} ({displayPlanName})
                </span>
                {selectedPlan?.pago_anticipado && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                    ⚡ Pago Anticipado Requerido
                  </span>
                )}
              </div>

              {/* Banner Institucional de Oferta Especial / Convenio */}
              {specialOffer && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono text-amber-950 mt-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block">
                      {language === "es" ? "Convenio Institucional Aplicado" : "Institutional Deal Applied"}
                    </span>
                    <span className="font-medium truncate block">
                      {specialOffer.institucion_empresa
                        ? `${specialOffer.institucion_empresa} — ${specialOffer.titulo}`
                        : specialOffer.titulo}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Selector de Planes Disponibles */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                {language === "es" ? "Planes Disponibles *" : "Available Plans *"}
              </label>

              {isLoadingPlans ? (
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/10 flex items-center justify-center gap-2 text-xs font-mono text-black/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === "es" ? "Cargando planes disponibles..." : "Loading available plans..."}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {plans.map((p) => {
                    const isSelected = selectedPlan?.id === p.id
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectPlan(p)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            handleSelectPlan(p)
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-black/[0.04] border-black text-[#111] shadow-xs"
                            : "bg-[#FAF9F5] border-black/10 hover:border-black/30 hover:bg-black/[0.02] text-black/70"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                              isSelected ? "border-black bg-black text-white" : "border-black/30 bg-white"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-mono font-bold text-[#111] truncate">{p.nombre_plan}</div>
                            <div className="text-[11px] text-black/60 font-light truncate">
                              {p.caracteristicas || `${p.meses_cubrimiento} meses de acceso`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="text-xs font-bold text-[#111] block">
                            {formatPlanPriceDynamic(p.precio, p.moneda)}
                          </span>
                          {p.tipo_pago === "cuotas" ? (
                            <span className="text-[10px] text-purple-700 font-bold block">
                              {p.numero_cuotas || 2} cuotas
                            </span>
                          ) : (
                            <span className="text-[10px] text-black/50 block">
                              {p.meses_cubrimiento === 12
                                ? language === "es" ? "12 meses" : "12 months"
                                : `${p.meses_cubrimiento} ${language === "es" ? "meses" : "months"}`}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
                  countryCode={countryCode}
                  placeholder={countryCode === "CO" ? "+57 300 123 4567" : undefined}
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
                    placeholder="contacto@tuempresa.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F5] border border-black/15 rounded-xl text-xs text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Field 4: Cuenta de Platzi a Activar */}
              <div className="space-y-1">
                <label className="block text-xs font-mono text-emerald-900 font-bold uppercase tracking-wider">
                  {language === "es" ? "Cuenta de correo que tomará el servicio Platzi " : "Platzi Account to Activate "}
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
                  {language === "es"
                    ? "Activamos primero el beneficio sobre esta cuenta de correo."
                    : "We activate the benefit on this email account first."}
                </p>
              </div>

              {/* Verificación de Seguridad Anti-Bot (CAPTCHA) */}
              <div className="pt-1">
                <CaptchaChallenge
                  onTokenChange={(tok, ans) => {
                    setCaptchaToken(tok)
                    setCaptchaAnswer(ans)
                  }}
                  language={language as "es" | "en"}
                />
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
                    <span>{language === "es" ? "PROCESANDO..." : "PROCESSING..."}</span>
                  </>
                ) : (
                  <>
                    <span>{language === "es" ? "SOLICITAR CÓDIGO DE ACTIVACIÓN" : "REQUEST ACTIVATION CODE"}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  )
}
