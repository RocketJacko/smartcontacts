"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  X,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from "lucide-react"
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
  admite_cuotas?: boolean
  max_cuotas?: number
  pago_anticipado?: boolean
  es_oferta_especial?: boolean
  codigo_oferta?: string
  institucion_empresa?: string
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

  // Modalidad interactiva de pago: Pago Único vs Cuotas
  const [paymentMode, setPaymentMode] = useState<"pago_unico" | "cuotas">("pago_unico")
  const [installments, setInstallments] = useState<number>(1)

  // Estados dinámicos de producto / plan
  const [displayPrice, setDisplayPrice] = useState<string>(
    formatPlanPriceDynamic(DEFAULT_PLANS[0].precio, DEFAULT_PLANS[0].moneda)
  )
  const [displayDuration, setDisplayDuration] = useState<string>("6 meses")
  const [displayPlanName, setDisplayPlanName] = useState<string>(DEFAULT_PLANS[0].nombre_plan)

  // Sincronizar precio dinámico si cambia la moneda detectada (COP <-> USD), el plan o el modo de pago
  useEffect(() => {
    if (selectedPlan) {
      if (paymentMode === "cuotas" && installments > 1) {
        const installmentPrice = Math.round(selectedPlan.precio / installments)
        setDisplayPrice(
          `${installments} cuotas de ${formatPlanPriceDynamic(installmentPrice, selectedPlan.moneda)}`
        )
      } else {
        setDisplayPrice(formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda))
      }
    }
  }, [selectedPlan, formatPlanPriceDynamic, userCurrency, paymentMode, installments])

  // Pasos: 1 (Ingreso de datos) | 2 (Código PIN recibido) | 4 (Pago y Garantía de Cancelación PYTHONCODE) | 3 (Confirmación exitosa)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [inputCode, setInputCode] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [copiedLlave, setCopiedLlave] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Detectar si la sesión actual corresponde a la oferta especial PYTHONCODE
  const isPythonCodeFlow = useMemo(() => {
    const cleanDiscount = (discountCode || "").trim().toUpperCase()
    const cleanPlanOffer = (selectedPlan?.codigo_oferta || "").trim().toUpperCase()
    const cleanSpecialOffer = (specialOffer?.codigo_oferta || "").trim().toUpperCase()
    if (cleanDiscount === "PYTHONCODE" || cleanPlanOffer === "PYTHONCODE" || cleanSpecialOffer === "PYTHONCODE") {
      return true
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const urlOffer = (params.get("oferta") || params.get("convenio") || params.get("ref") || "").trim().toUpperCase()
      if (urlOffer === "PYTHONCODE") return true
    }
    return false
  }, [discountCode, selectedPlan, specialOffer])

  // Carga y renderizado dinámico del botón oficial de PayPal cuando se ingresa al paso 4 fuera de Colombia
  useEffect(() => {
    if (step === 4 && countryCode !== "CO") {
      const scriptId = "paypal-sdk-hosted-buttons"
      let script = document.getElementById(scriptId) as HTMLScriptElement | null

      const renderPayPal = () => {
        const container = document.getElementById("paypal-container-LYMYJAM3YUSZA")
        if (container && (window as any).paypal?.HostedButtons) {
          container.innerHTML = ""
          try {
            (window as any).paypal.HostedButtons({
              hostedButtonId: "LYMYJAM3YUSZA",
            }).render("#paypal-container-LYMYJAM3YUSZA")
          } catch (e) {
            console.error("Error al renderizar botón PayPal Hosted:", e)
          }
        }
      }

      if (!script) {
        script = document.createElement("script")
        script.id = scriptId
        script.src = "https://www.paypal.com/sdk/js?client-id=BAA52QJ_2ETawiw8peuRJv0iNnRdyRhvyRdVb5u73l0EamRSaNc4NXC76euwkOiHvR-J3t0Xx2jP99vJg8&components=hosted-buttons&disable-funding=venmo&currency=USD"
        script.async = true
        script.onload = () => {
          renderPayPal()
        }
        document.head.appendChild(script)
      } else {
        renderPayPal()
      }
    }
  }, [step, countryCode])

  // Cargar planes vigentes consumiendo la API unificada de planes con soporte de código
  useEffect(() => {
    if (!isOpen) return
    let isMounted = true

    async function loadPlans() {
      setIsLoadingPlans(true)
      try {
        let code = ""
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search)
          code = (
            params.get("oferta") ||
            params.get("convenio") ||
            params.get("promo") ||
            params.get("ref") ||
            params.get("referido") ||
            ""
          ).trim()
        }

        if (!code) {
          try {
            code = (localStorage.getItem("sc_ref_code") || "").trim()
            if (!code && typeof document !== "undefined") {
              const match = document.cookie.match(/(?:^|;\s*)sc_ref_code=([^;]+)/)
              if (match && match[1]) code = decodeURIComponent(match[1]).trim()
            }
          } catch {}
        }

        // Petición HTTP unificada al servidor
        const res = await fetch(`/api/benefits/platzi/plans?code=${encodeURIComponent(code)}`)
        const data = await res.json()

        if (isMounted && data?.success && Array.isArray(data?.planes) && data.planes.length > 0) {
          let planList: PlatziPlan[] = data.planes

          // Si el usuario ingresó por un enlace de oferta especial (ej. PYTHONCODE o convenio),
          // GARANTIZAR que SOLO se muestre el plan asociado a dicha oferta, ocultando planes estándar.
          const isUrlOffer = Boolean(
            (code && (data.tipo === "oferta_especial" || data.tipo === "oferta_especial_directa" || data.tipo === "oferta_especial_enlace")) ||
            code.toUpperCase() === "PYTHONCODE"
          )

          if (isUrlOffer) {
            const offerOnly = planList.filter(
              (p) =>
                p.es_oferta_especial ||
                p.codigo_oferta?.toUpperCase() === code.toUpperCase() ||
                p.nombre_plan.toLowerCase().includes("pythoncode")
            )
            if (offerOnly.length > 0) {
              planList = offerOnly
            }
          }

          setPlans(planList)
          const chosen = planList[0]
          setSelectedPlan(chosen)
          setDisplayPlanName(chosen.nombre_plan)
          setDisplayPrice(formatPlanPriceDynamic(chosen.precio, chosen.moneda))
          setDisplayDuration(
            chosen.meses_cubrimiento === 12
              ? language === "es" ? "1 año" : "1 year"
              : `${chosen.meses_cubrimiento} ${language === "es" ? "meses" : "months"}`
          )

          if (data.oferta) {
            setSpecialOffer(data.oferta as SpecialOfferData)
            if (data.oferta.codigo_referido) {
              const refUpper = data.oferta.codigo_referido.toUpperCase().trim()
              setDiscountCode(refUpper)
              try {
                localStorage.setItem("sc_ref_code", refUpper)
              } catch {}
            }
          }
        }
      } catch {
        // Fallback a DEFAULT_PLANS
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

    // Configurar cuotas según el plan seleccionado
    const allowsCuotas = Boolean(planItem.admite_cuotas || (planItem.max_cuotas && planItem.max_cuotas > 1) || planItem.tipo_pago === "cuotas")
    if (allowsCuotas) {
      const defaultCuotas = planItem.max_cuotas || planItem.numero_cuotas || 2
      setInstallments(defaultCuotas)
      if (planItem.tipo_pago === "cuotas") {
        setPaymentMode("cuotas")
      }
    } else {
      setPaymentMode("pago_unico")
      setInstallments(1)
    }

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
    setPaymentReference("")
    setCopiedLlave(false)
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
          tipo_pago: paymentMode,
          numero_cuotas: paymentMode === "cuotas" ? installments : 1,
          oferta_id: selectedPlan?.codigo_oferta || specialOffer?.id || null,
          oferta_codigo: selectedPlan?.codigo_oferta || specialOffer?.codigo_oferta || null,
          institucion: selectedPlan?.institucion_empresa || specialOffer?.institucion_empresa || null,
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

  // ─── PASO 2: Envío o Validación del código de seguridad recibido ───────────
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

    // SI ES EL ENLACE / OFERTA PYTHONCODE:
    // NO activar la cuenta todavía, garantizar primero que el usuario cancele (pague) el plan de 1 año
    if (isPythonCodeFlow) {
      if (inputCode.trim().length < 4) {
        setErrorMsg(
          language === "es"
            ? "El código de seguridad ingresado es demasiado corto. Revisa tu correo."
            : "The security code entered is too short. Please check your email."
        )
        return
      }

      setErrorMsg("")
      // Avanzar al paso de selección de plan y medios de pago (garantía de cancelación)
      setStep(4)
      return
    }

    // FLUJO ESTÁNDAR / OTROS ENLACES: Procede de forma regular a la verificación y activación
    await executeFinalActivation()
  }

  // ─── ACTIVACIÓN DEFINITIVA Y ENVÍO AL WEBHOOK DE ACTIVACIÓN ───────────────
  const executeFinalActivation = async (paymentMethodUsed?: string) => {
    setIsSubmitting(true)
    setErrorMsg("")

    try {
      const cleanCode = discountCode.trim().toUpperCase()

      // Se envían los datos completos al endpoint de verificación y activación
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
          meses_cubrimiento: selectedPlan?.meses_cubrimiento || 12,
          precio: selectedPlan?.precio || 95000,
          precio_formateado: displayPrice,
          tipo_pago: selectedPlan?.tipo_pago || specialOffer?.tipo_pago || "pago_unico",
          numero_cuotas: selectedPlan?.numero_cuotas || specialOffer?.numero_cuotas || 1,
          oferta_id: specialOffer?.id || null,
          oferta_codigo: specialOffer?.codigo_oferta || null,
          institucion: specialOffer?.institucion_empresa || null,
          metodo_pago: paymentMethodUsed || (countryCode === "CO" ? "Llave @smartcontacts" : "PayPal"),
          referencia_pago: paymentReference.trim() || null,
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
        setDisplayPlanName(data.planInfo.planName || "Plan Platzi 1 Año")
        setDisplayPrice(data.planInfo.formattedPrice || (countryCode === "CO" ? "$95.000 COP" : "$24 USD"))
        setDisplayDuration(data.planInfo.duration || "1 año")
      } else if (data.details) {
        const rawDetail = Array.isArray(data.details) ? data.details[0] : data.details
        if (rawDetail?.plan) setDisplayPlanName(rawDetail.plan)
        if (rawDetail?.valor) setDisplayPrice(rawDetail.valor)
      }

      setSuccessMessage(data.resultado || data.message || "¡Cuenta Platzi activada exitosamente!")
      setErrorMsg("")
      // Activación completada con éxito
      setStep(3)
    } catch {
      setErrorMsg(
        language === "es"
          ? "Error de conexión al verificar el código de seguridad y activar la cuenta."
          : "Connection error verifying code and activating account."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLlave = () => {
    navigator.clipboard.writeText("@smartcontacts")
    setCopiedLlave(true)
    setTimeout(() => setCopiedLlave(false), 2500)
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
          /* ─── PASO 3: ACTIVACIÓN EXITOSA & CONFIRMACIÓN DE DATOS ─────────── */
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
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Beneficiario</span>
                  <span className="font-bold text-black">{name}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 py-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Cuenta Platzi</span>
                  <span className="font-bold text-black">{platziAccountEmail}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-black/5 py-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Plan Activado</span>
                  <span className="font-bold text-emerald-700 text-xs leading-snug">{displayPlanName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-black/5 py-2">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Medio de Pago</span>
                  <span className="font-bold text-black text-xs">
                    {countryCode === "CO" ? "Llave @smartcontacts (Colombia)" : "PayPal (Internacional)"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-black/50 uppercase tracking-wider font-bold text-[10px]">Estado</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                    <Check className="w-3.5 h-3.5" /> Cuenta Activa
                  </span>
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
        ) : step === 4 ? (
          /* ─── PASO 4: GARANTÍA DE PAGO & CANCELACIÓN PREVIA (FLUJO PYTHONCODE) ─── */
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>CONVENIO PYTHONCODE — PLAN 1 AÑO</span>
              </div>

              <h3 className="text-2xl font-medium text-[#111] tracking-tight">
                {language === "es" ? "Confirmación de Plan & Pago" : "Plan & Payment Confirmation"}
              </h3>

              <p className="text-xs text-black/70 leading-relaxed">
                {language === "es"
                  ? "Para garantizar la activación de tu cuenta Platzi por 1 año con la tarifa preferencial de PYTHONCODE, realiza la cancelación según tu ubicación:"
                  : "To guarantee your 1-year Platzi account activation with the PYTHONCODE preferential rate, complete your payment based on your location:"}
              </p>
            </div>

            {/* Tarjeta Resumen del Plan Deseado */}
            <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/10 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <span className="text-black/50 uppercase text-[10px] font-bold">Plan Solicitado</span>
                <span className="font-bold text-emerald-800">
                  {selectedPlan?.nombre_plan || "Oferta especial familia PythonCode"} ({selectedPlan?.meses_cubrimiento || 12} Meses)
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-black/5 py-2">
                <span className="text-black/50 uppercase text-[10px] font-bold">Cuenta a Activar</span>
                <span className="font-bold text-black">{platziAccountEmail}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-black/50 uppercase text-[10px] font-bold">Total a Cancelar</span>
                <span className="font-bold text-black text-sm">
                  {countryCode === "CO"
                    ? (selectedPlan?.precio ? formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda) : "$ 120.000 COP")
                    : "$24 USD"}
                </span>
              </div>
            </div>

            {/* SELECCIÓN DE MEDIO DE PAGO SEGÚN PAÍS */}
            {countryCode === "CO" ? (
              /* MEDIO DE PAGO EN COLOMBIA: LLAVE @smartcontacts */
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-900 uppercase">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pago en Colombia por Llave Oficial</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                    Bancolombia / Nequi / Bre-B
                  </span>
                </div>

                <p className="text-xs text-black/70">
                  Transfiere los{" "}
                  <strong className="text-black font-mono">
                    {selectedPlan?.precio ? formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda) : "$ 120.000 COP"}
                  </strong>{" "}
                  directamente desde la app de tu banco favorito o billetera digital ingresando la siguiente llave:
                </p>

                {/* Caja de Llave con Copiado Rápido */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-300 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-mono text-black/40 block">Llave de Transferencia:</span>
                    <span className="text-base font-mono font-bold text-[#111] tracking-wide">
                      @smartcontacts
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLlave}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] text-white text-xs font-mono font-semibold hover:bg-black transition-colors cursor-pointer"
                  >
                    {copiedLlave ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>¡Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white/70" />
                        <span>Copiar Llave</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Campo opcional de referencia bancaria */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-mono text-black/70 uppercase">
                    Número de comprobante / Aprobación (Opcional):
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej. Nro. de Aprobación o Teléfono remitente"
                    className="w-full px-3 py-2 bg-white border border-black/15 rounded-xl text-xs font-mono text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            ) : (
              /* MEDIO DE PAGO FUERA DE COLOMBIA: PAYPAL */
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-blue-900 uppercase">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>Pago Internacional Seguro con PayPal</span>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                    $24 USD
                  </span>
                </div>

                <p className="text-xs text-black/70">
                  Para activar tu cuenta desde el exterior, realiza el pago de <strong className="text-black font-mono">$24 USD</strong> mediante el botón oficial alojado de PayPal o su enlace seguro:
                </p>

                {/* Contenedor del Botón Alojado Oficial de PayPal */}
                <div className="bg-white p-3 rounded-xl border border-blue-150 flex flex-col items-center justify-center min-h-[60px]">
                  <div id="paypal-container-LYMYJAM3YUSZA" className="w-full flex justify-center py-1"></div>
                  
                  {/* Enlace alternativo directo a PayPal */}
                  <a
                    href="https://www.paypal.com/ncp/payment/LYMYJAM3YUSZA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    <span>Abrir pasarela directa de PayPal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Campo opcional de ID de transacción PayPal */}
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-mono text-black/70 uppercase">
                    ID de Transacción PayPal (Opcional):
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej. Transaction ID o correo PayPal"
                    className="w-full px-3 py-2 bg-white border border-black/15 rounded-xl text-xs font-mono text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="text-xs font-mono font-medium text-red-600 text-center py-1">
                {errorMsg}
              </p>
            )}

            {/* BOTONES DE ACCIÓN PASO 4 */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => executeFinalActivation(countryCode === "CO" ? "Llave @smartcontacts" : "PayPal")}
                className="w-full py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono tracking-wider uppercase hover:bg-black/90 transition-all duration-200 font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{language === "es" ? "ACTIVANDO CUENTA..." : "ACTIVATING..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {countryCode === "CO"
                        ? "CONFIRMAR PAGO Y ACTIVAR CUENTA"
                        : "YA REALICÉ EL PAGO EN PAYPAL — ACTIVAR CUENTA"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg("")
                  setStep(2)
                }}
                className="w-full py-2 text-xs font-mono text-black/60 hover:text-black transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === "es" ? "Volver a verificar código" : "Back to security code"}</span>
              </button>
            </div>
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
                  <span>
                    {isPythonCodeFlow
                      ? (language === "es" ? "CONTINUAR AL PAGO (PLAN 1 AÑO)" : "PROCEED TO PAYMENT (1 YEAR)")
                      : (language === "es" ? "CONFIRMAR ACTIVACIÓN" : "CONFIRM ACTIVATION")}
                  </span>
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
              </div>
            </div>

            {/* 1. Selector de Planes Disponibles / Oferta Exclusiva Aplicada */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-black/80 font-bold uppercase tracking-wider">
                  {isPythonCodeFlow || selectedPlan?.es_oferta_especial
                    ? (language === "es" ? "Plan Incluido en tu Oferta *" : "Plan Included in your Offer *")
                    : (language === "es" ? "Planes Disponibles *" : "Available Plans *")}
                </label>
                {(isPythonCodeFlow || selectedPlan?.es_oferta_especial) && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/80">
                    {selectedPlan.codigo_oferta || "OFERTA EXCLUSIVA"}
                  </span>
                )}
              </div>

              {isLoadingPlans ? (
                <div className="p-4 rounded-2xl bg-[#FAF9F5] border border-black/10 flex items-center justify-center gap-2 text-xs font-mono text-black/50">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{language === "es" ? "Cargando planes disponibles..." : "Loading available plans..."}</span>
                </div>
              ) : isPythonCodeFlow || (plans.length === 1 && selectedPlan?.es_oferta_especial) ? (
                /* TARJETA DESTACADA EXCLUSIVA PARA LA OFERTA (SIN OPCIONES ADICIONALES) */
                <div className="p-3.5 rounded-2xl bg-amber-500/[0.05] border border-amber-500/30 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-bold text-[#111] truncate">
                        {selectedPlan.nombre_plan}
                      </div>
                      <div className="text-[11px] text-black/60 font-light truncate">
                        {selectedPlan.caracteristicas || "Acceso completo por 1 año a Platzi"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <span className="text-xs font-bold text-[#111] block">
                      {formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda)}
                    </span>
                    <span className="text-[10px] text-amber-800/80 font-bold block">
                      {selectedPlan.meses_cubrimiento === 12 ? "1 año (12 meses)" : `${selectedPlan.meses_cubrimiento} meses`}
                    </span>
                  </div>
                </div>
              ) : (
                /* CATÁLOGO GENERAL ESTÁNDAR */
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

            {/* Modalidad de Pago Interactiva (Pago Único vs Cuotas) */}
            {Boolean(selectedPlan?.admite_cuotas || (selectedPlan?.max_cuotas && selectedPlan.max_cuotas > 1) || selectedPlan?.tipo_pago === "cuotas") && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-black/[0.02] border border-black/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-black/80 uppercase tracking-wider">
                    {language === "es" ? "Modalidad de Pago *" : "Payment Option *"}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                    {paymentMode === "cuotas"
                      ? `${installments} cuotas de ${formatPlanPriceDynamic(Math.round(selectedPlan.precio / installments), selectedPlan.moneda)}`
                      : `${formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda)} (Pago Único)`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("pago_unico")
                      setInstallments(1)
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                      paymentMode === "pago_unico"
                        ? "bg-black text-white border-black shadow-xs"
                        : "bg-white text-black/70 border-black/10 hover:border-black/30"
                    }`}
                  >
                    <span>{language === "es" ? "PAGO ÚNICO" : "ONE-TIME PAYMENT"}</span>
                    <span className={`text-[10px] font-normal ${paymentMode === "pago_unico" ? "text-white/70" : "text-black/50"}`}>
                      {formatPlanPriceDynamic(selectedPlan.precio, selectedPlan.moneda)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode("cuotas")
                      setInstallments(selectedPlan.max_cuotas || selectedPlan.numero_cuotas || 2)
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                      paymentMode === "cuotas"
                        ? "bg-black text-white border-black shadow-xs"
                        : "bg-white text-black/70 border-black/10 hover:border-black/30"
                    }`}
                  >
                    <span>{language === "es" ? "EN CUOTAS" : "IN INSTALLMENTS"}</span>
                    <span className={`text-[10px] font-normal ${paymentMode === "cuotas" ? "text-emerald-300" : "text-emerald-700"}`}>
                      {installments > 1 ? `${installments}x ${formatPlanPriceDynamic(Math.round(selectedPlan.precio / installments), selectedPlan.moneda)}` : "Dividir pago"}
                    </span>
                  </button>
                </div>

                {/* Sub-selector de número de cuotas si está en modo cuotas y max_cuotas > 2 */}
                {paymentMode === "cuotas" && (selectedPlan.max_cuotas || 2) > 2 && (
                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    <span className="text-black/60">{language === "es" ? "Número de cuotas:" : "Number of installments:"}</span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: (selectedPlan.max_cuotas || 3) - 1 }, (_, i) => i + 2).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setInstallments(num)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            installments === num
                              ? "bg-black text-white"
                              : "bg-white border border-black/15 text-black/70 hover:bg-black/5"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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
