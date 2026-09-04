"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PixelIcon } from "@/components/pixel-icon"
import { PhoneInput } from "@/components/phone-input"
import {
  Calendar,
  Clock,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Building,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
} from "lucide-react"

export function BookingSection() {
  const { t, language } = useLanguage()

  // Step State: 1 = Topic, 2 = Date & Time, 3 = Contact & Company Details, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isListboxOpen, setIsListboxOpen] = useState(false)

  // Form Fields State
  const [selectedTopic, setSelectedTopic] = useState<string>("ai-agents-in-house")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isCompany, setIsCompany] = useState<boolean>(true)
  const [company, setCompany] = useState("")
  const [description, setDescription] = useState("")

  // Real Calendar State (Full Month with Real Supabase PL/pgSQL Availability)
  const today = useMemo(() => new Date(), [])
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const isAvailableDay = (dayNum: number) => {
    const dateObj = new Date(currentYear, currentMonth, dayNum)
    const dayOfWeek = dateObj.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) return false
    if (dayNum < today.getDate() && currentMonth === today.getMonth()) return false
    return true
  }

  // Selected Day State
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    for (let d = today.getDate(); d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d)
      const dayOfWeek = dateObj.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) return d
    }
    return today.getDate()
  })

  // Real Availability State from Supabase PL/pgSQL function
  const [fetchedSlots, setFetchedSlots] = useState<Array<{ slot: string; status: string; label: string; bookingToken?: string }>>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [bookingToken, setBookingToken] = useState<string>("")

  // Fetch real availability from Supabase when selectedDay changes
  useEffect(() => {
    if (!selectedDay) return
    const year = currentYear
    const month = String(currentMonth + 1).padStart(2, "0")
    const day = String(selectedDay).padStart(2, "0")
    const formattedDateStr = `${year}-${month}-${day}`

    setIsLoadingSlots(true)
    fetch(`/api/calendar/availability?date=${formattedDateStr}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.slots)) {
          setFetchedSlots(data.slots)
          const firstOpen = data.slots.find((s: any) => s.status === "disponible")
          if (firstOpen) {
            setSelectedSlot(firstOpen.slot)
            if (firstOpen.bookingToken) setBookingToken(firstOpen.bookingToken)
          } else {
            setSelectedSlot("")
            setBookingToken("")
          }
        }
        setIsLoadingSlots(false)
      })
      .catch((err) => {
        console.warn("Error fetching availability:", err)
        setIsLoadingSlots(false)
      })
  }, [selectedDay, currentMonth, currentYear])

  // Submission & Email Validation State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [hasAcceptedHabeasData, setHasAcceptedHabeasData] = useState(true)

  const validateEmailDomain = async (inputEmail: string) => {
    if (!inputEmail || !inputEmail.includes("@")) {
      setEmailError("")
      return true
    }

    setIsValidatingEmail(true)
    try {
      const res = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inputEmail }),
      })
      const data = await res.json()
      if (data && data.valid === false) {
        setEmailError(language === "es" ? "Email no aceptado (dominio bloqueado o genérico)" : "Email not allowed")
        setIsValidatingEmail(false)
        return false
      } else {
        setEmailError("")
        setIsValidatingEmail(false)
        return true
      }
    } catch (err) {
      console.warn("Edge function domain validation error:", err)
      setEmailError("")
      setIsValidatingEmail(false)
      return true
    }
  }

  const selectedTopicData = useMemo(() => {
    const topics = t.booking.topics || []
    return topics.find((top: any) => top.id === selectedTopic) || topics[0] || { id: "general", title: "Asesoría Estratégica" }
  }, [selectedTopic, t])

  const formattedDate = useMemo(() => {
    if (!selectedDay) return ""
    const dateObj = new Date(currentYear, currentMonth, selectedDay)
    const dayName = t.booking.weekDays[dateObj.getDay()]
    const monthName = t.booking.months[currentMonth]
    return `${dayName}, ${selectedDay} de ${monthName} ${currentYear}`
  }, [selectedDay, currentMonth, currentYear, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg(language === "es" ? "Por favor completa todos los campos obligatorios." : "Please fill in all required fields.")
      return
    }
    if (!selectedDay) {
      setErrorMsg(language === "es" ? "Selecciona una fecha en el calendario." : "Select a date on the calendar.")
      return
    }
    if (!selectedSlot) {
      setErrorMsg(language === "es" ? "Selecciona un horario disponible para la cita." : "Select an available time slot.")
      return
    }

    if (!hasAcceptedHabeasData) {
      setErrorMsg(language === "es" ? "Debes autorizar el tratamiento de datos personales para continuar." : "You must authorize personal data treatment to proceed.")
      return
    }

    // Validar dominio antes de enviar
    const isValidDomain = await validateEmailDomain(email)
    if (!isValidDomain) {
      return
    }

    setErrorMsg("")
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "booking",
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          company: isCompany ? company.trim() || "Empresa Privada" : "Persona Natural",
          isCompany,
          topic: selectedTopicData.title,
          service: selectedTopicData.title,
          description: description.trim() || undefined,
          date: formattedDate,
          time: selectedSlot,
          timeSlot: selectedSlot,
          acepta_tratamiento_datos: hasAcceptedHabeasData,
        }),
      })

      const data = await res.json()
      setIsSubmitting(false)

      if (res.ok && data.success) {
        setStep(4)
      } else {
        setErrorMsg(data.error || (language === "es" ? "Ocurrió un error al agendar la cita. Inténtalo de nuevo." : "Error booking slot."))
      }
    } catch (err: any) {
      setIsSubmitting(false)
      setErrorMsg(
        err?.message ||
        (language === "es"
          ? "No se pudo completar el agendamiento. Por favor verifica tu conexión o inténtalo nuevamente."
          : "Could not complete booking. Please check your connection or try again.")
      )
    }
  }

  return (
    <section id="agendar" className="relative z-30 py-12 sm:py-16 pb-24 sm:pb-32 bg-[#F5F4F0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* ── SECTION HEADER ───────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 flex flex-col items-center">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono text-black/60 bg-black/[0.05] border border-black/10 uppercase tracking-widest font-medium">
            {t.booking.tag}
          </span>

          <RevealText as="h2" className="text-3xl sm:text-4xl md:text-5xl font-medium text-[#111] tracking-tight leading-tight">
            {t.booking.title}
          </RevealText>
          <RevealText as="p" className="text-xs sm:text-sm md:text-base text-black/75 font-normal leading-relaxed">
            {t.booking.subtitle}
          </RevealText>
        </div>

        {/* ── PROGRESS INDICATOR (STEP 1 OF 3) ─────────────────────────────── */}
        {step < 4 && (
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-black/75 font-medium">
              <span>{step === 1 ? t.booking.step1Title : step === 2 ? t.booking.step2Title : t.booking.step3Title}</span>
              <span>PASO {step} DE 3</span>
            </div>
            <div className="h-1.5 w-full bg-black/[0.06] rounded-full overflow-hidden border border-black/[0.04]">
              <div
                className="h-full bg-[#111] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* ── CONTAINER BENTO BOARD ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-black/[0.08] p-6 sm:p-8 md:p-10 shadow-xs">
          
          {/* ──────────────── STEP 1: SELECT ADVISORY TOPIC ─────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-medium text-[#111]">
                  {language === "es" ? "¿En qué área deseas enfocar tu asesoría?" : "What area do you want to focus your session on?"}
                </h3>
                <p className="text-xs sm:text-sm text-black/75 font-normal">
                  {language === "es" ? "Selecciona la opción principal para asignar al especialista de nuestra unidad." : "Select the main topic to assign our Growth Unit specialist."}
                </p>
              </div>

              {/* Kage Minimalist List Box Select UI */}
              <div className="relative">
                {/* Active Selected Input Box */}
                <button
                  type="button"
                  aria-label="Abrir selección de área de asesoría"
                  onClick={() => setIsListboxOpen(!isListboxOpen)}
                  className="w-full bg-white border border-black/15 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-left hover:border-black/30 transition-all shadow-xs group cursor-pointer"
                >
                  <div className="flex items-center gap-4 min-w-0 pr-2">
                    <span className="text-xs font-mono font-bold text-black/50 bg-black/[0.04] px-2.5 py-1 rounded-md border border-black/10 shrink-0">
                      0{t.booking.topics.findIndex((tp: any) => tp.id === selectedTopic) + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-semibold">ÁREA SELECCIONADA</div>
                      <div className="text-sm sm:text-base font-medium text-[#111] truncate mt-0.5">
                        {t.booking.topics.find((tp: any) => tp.id === selectedTopic)?.title}
                      </div>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-black/[0.04] flex items-center justify-center text-black/60 group-hover:text-black group-hover:bg-black/[0.08] transition-colors shrink-0">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isListboxOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Dropdown Options Listbox */}
                {isListboxOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-black/15 rounded-2xl shadow-2xl overflow-hidden divide-y divide-black/[0.06] animate-in fade-in zoom-in-95 duration-150">
                    {t.booking.topics.map((item: any, idx: number) => {
                      const isSelected = selectedTopic === item.id
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTopic(item.id)
                            setIsListboxOpen(false)
                          }}
                          className={`p-4 cursor-pointer transition-all flex items-center justify-between group ${
                            isSelected ? "bg-black/[0.04] text-[#111]" : "hover:bg-black/[0.02] text-black/80"
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0 pr-4">
                            <span className="text-xs font-mono text-black/30 font-semibold min-w-[20px]">
                              0{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="text-sm font-medium text-[#111] truncate">{item.title}</h4>
                              <p className="text-xs text-black/50 line-clamp-1 mt-0.5">{item.desc}</p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center">
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-[#111] text-white flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-black/10 group-hover:border-black/30" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Grid Cards for Fast Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {t.booking.topics.map((item: any, index: number) => {
                  const isSelected = selectedTopic === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedTopic(item.id)}
                      className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-black/[0.03] border-black text-[#111] shadow-2xs ring-1 ring-black"
                          : "bg-black/[0.01] border-black/[0.06] text-black/70 hover:border-black/20 hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className="text-[10px] font-mono font-medium text-black/40">
                          0{index + 1}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#111] mb-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-black/60 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-4 flex justify-end border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium cursor-pointer shadow-xs"
                >
                  <span>{language === "es" ? "CONTINUAR A FECHA & HORA" : "CONTINUE TO DATE & TIME"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: SELECT DATE & TIME (REAL SUPABASE AVAILABILITY) ─── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-medium text-[#111]">
                  {language === "es" ? "Selecciona el Día y la Franja Horaria" : "Select Available Date and Time"}
                </h3>
                <p className="text-xs sm:text-sm text-black/75 font-normal">
                  {language === "es"
                    ? "Consultando disponibilidad horaria oficial en tiempo real para sesiones de 45 minutos."
                    : "Querying official real-time availability for 45-minute sessions."}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* ── LEFT: FULL MONTH INTERACTIVE CALENDAR ─────────────────── */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-black/60" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[#111] font-semibold">
                        {t.booking.months[currentMonth]} {currentYear}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-black/40">
                      ZONA HORARIA: COLOMBIA (COT, UTC-5)
                    </span>
                  </div>

                  {/* Day of Week Headers */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-black/40 font-medium pb-1 border-b border-black/[0.06]">
                    {t.booking.weekDays.map((d: string) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {/* Empty Slots for month start offset */}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-9 sm:h-10" />
                    ))}

                    {/* Actual Days */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1
                      const available = isAvailableDay(dayNum)
                      const isSelected = selectedDay === dayNum

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          disabled={!available}
                          onClick={() => setSelectedDay(dayNum)}
                          className={`h-9 sm:h-10 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                            isSelected
                              ? "bg-[#111] text-white font-bold shadow-xs"
                              : available
                              ? "bg-black/[0.02] text-[#111] hover:bg-black/[0.06] border border-black/[0.05]"
                              : "text-black/20 cursor-not-allowed opacity-40"
                          }`}
                        >
                          <span>{dayNum}</span>
                          {available && !isSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-black/50 pt-2 border-t border-black/[0.04]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{language === "es" ? "Día Disponible" : "Available"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
                      <span>{language === "es" ? "No Disponible / Fin de Semana" : "Unavailable / Weekend"}</span>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: REAL TIME SLOTS FROM DATABASE ─────────────────── */}
                <div className="lg:col-span-5 space-y-4 bg-black/[0.02] p-5 rounded-2xl border border-black/[0.06]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-black/60" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[#111] font-semibold">
                        {language === "es" ? "HORARIOS DISPONIBLES" : "AVAILABLE TIME SLOTS"}
                      </span>
                    </div>
                    {isLoadingSlots && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black/40" />
                    )}
                  </div>

                  <div className="text-xs font-medium text-[#111] pb-2 border-b border-black/[0.06]">
                    {formattedDate}
                  </div>

                  {isLoadingSlots ? (
                    <div className="py-8 text-center space-y-2">
                      <Loader2 className="w-5 h-5 animate-spin text-black/40 mx-auto" />
                      <p className="text-xs text-black/50 font-mono">
                        {language === "es" ? "Consultando disponibilidad..." : "Checking availability..."}
                      </p>
                    </div>
                  ) : fetchedSlots.length === 0 ? (
                    <div className="py-8 text-center text-xs text-black/50 font-mono">
                      {language === "es" ? "No hay franjas disponibles para este día." : "No slots available for this day."}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                      {fetchedSlots.map((item) => {
                        const isDispo = item.status === "disponible"
                        const isSelected = selectedSlot === item.slot

                        return (
                          <button
                            key={item.slot}
                            type="button"
                            disabled={!isDispo}
                            onClick={() => {
                              setSelectedSlot(item.slot)
                              if (item.bookingToken) setBookingToken(item.bookingToken)
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-[#111] text-white font-bold shadow-xs"
                                : isDispo
                                ? "bg-white border border-black/[0.08] text-[#111] hover:border-black/25"
                                : "bg-black/[0.02] text-black/30 border border-transparent cursor-not-allowed line-through"
                            }`}
                          >
                            <span>{item.slot}</span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold">
                              {isSelected
                                ? (language === "es" ? "SELECCIONADO" : "SELECTED")
                                : isDispo
                                ? (language === "es" ? "LIBRE" : "OPEN")
                                : (language === "es" ? "OCUPADO" : "BOOKED")}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Action buttons */}
              <div className="pt-4 flex justify-between items-center border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "ANTERIOR" : "BACK"}</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  <span>{language === "es" ? "CONTINUAR A DATOS" : "CONTINUE TO DETAILS"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: CONTACT DETAILS & VALIDATIONS ───────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-medium text-[#111]">
                  {language === "es" ? "Datos de Contacto y Confirmación" : "Contact Details & Confirmation"}
                </h3>
                <p className="text-xs sm:text-sm text-black/75 font-normal">
                  {language === "es"
                    ? "Generaremos tu sala oficial en Google Meet y te enviaremos la confirmación por correo."
                    : "We will generate your official Google Meet room and send you the email confirmation."}
                </p>
              </div>

              {/* Selected Slot & Topic Pill Summary */}
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs font-mono">
                <span className="text-black/40 uppercase">CITA:</span>
                <span className="font-semibold text-[#111]">{selectedTopicData.title}</span>
                <span className="text-black/30">&bull;</span>
                <span className="text-black/70">{formattedDate} a las {selectedSlot}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.nameLabel} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.booking.namePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-black/[0.02] border border-black/10 focus:border-black rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp with PhoneInput component */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.phoneLabel} *
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(val) => setPhone(val)}
                    placeholder={t.booking.phonePlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Corporate Email with Check-Domain Real-time Validation */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.emailLabel} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onBlur={() => validateEmailDomain(email)}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError("")
                      }}
                      placeholder={t.booking.emailPlaceholder}
                      className={`w-full pl-10 pr-4 py-2.5 text-xs bg-black/[0.02] border rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans ${
                        emailError ? "border-red-500 focus:border-red-600 bg-red-50/20" : "border-black/10 focus:border-black"
                      }`}
                    />
                    {isValidatingEmail && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-black/40 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  {emailError && (
                    <p className="text-[11px] text-red-600 font-mono mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.companyLabel}
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-black/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={!isCompany}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={isCompany ? t.booking.companyPlaceholder : "Persona Natural"}
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-black/[0.02] border border-black/10 focus:border-black rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Is Company Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isCompanyToggle"
                  aria-label={t.booking.isCompanyLabel}
                  checked={isCompany}
                  onChange={(e) => setIsCompany(e.target.checked)}
                  className="w-4 h-4 rounded border-black/20 text-[#111] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isCompanyToggle" className="text-xs text-black/70 font-sans cursor-pointer">
                  {t.booking.isCompanyLabel}
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                  {t.booking.descLabel}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={3}
                    aria-label={t.booking.descLabel}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t.booking.descPlaceholder}
                    className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/10 focus:border-black rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans resize-none"
                  />
                </div>
              </div>

              {/* Habeas Data Legal Consent Checkbox (Ley 1581 de 2012) */}
              <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/10 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="habeasDataConsent"
                  aria-label="Autorización de Tratamiento de Datos Personales"
                  checked={hasAcceptedHabeasData}
                  onChange={(e) => setHasAcceptedHabeasData(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-black/20 text-[#111] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="habeasDataConsent" className="text-[11px] text-black/75 leading-relaxed font-sans cursor-pointer select-none">
                  {language === "es" ? (
                    <>
                      Autorizo a <strong>Smartcontacts</strong> para el tratamiento de mis datos personales y el envío de confirmaciones y comunicaciones relativas a esta reserva según la <strong>Ley 1581 de 2012 (Habeas Data)</strong> y la <a href="/privacidad" target="_blank" className="underline hover:text-black">Política de Privacidad</a>.
                    </>
                  ) : (
                    <>
                      I authorize <strong>Smartcontacts</strong> to process my personal data and send confirmations and communications regarding this reservation pursuant to <strong>Law 1581 of 2012 (Habeas Data)</strong> and the <a href="/privacidad" target="_blank" className="underline hover:text-black">Privacy Policy</a>.
                    </>
                  )}
                </label>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-4 flex justify-between items-center border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:text-black transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "ANTERIOR" : "BACK"}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{t.booking.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.booking.submitBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-black/40 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-black/30" />
                <span>Tratamiento confidencial y profesional de tus datos</span>
              </div>
            </form>
          )}

          {/* ──────────────── STEP 4: SUCCESS EMAIL CONFIRMATION CARD ────────── */}
          {step === 4 && (
            <div className="space-y-6 text-center py-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black/[0.04] text-[#111] border border-black/10 mb-2">
                <CheckCircle2 className="w-8 h-8 text-[#111]" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl font-medium text-[#111]">
                  {t.booking.successTitle}
                </h3>
                <p className="text-xs sm:text-sm text-black/70 font-normal leading-relaxed">
                  {t.booking.successDesc}
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl border border-black/[0.08] bg-black/[0.02] text-left space-y-3 max-w-lg mx-auto">
                <div className="text-[10px] text-black/40 font-mono tracking-widest uppercase mb-2">
                  {t.booking.summaryTitle}
                </div>

                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-black/30 font-mono min-w-[70px]">TEMA</span>
                  <span className="text-xs text-[#111] font-medium flex-1">{selectedTopicData.title}</span>
                </div>

                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-black/30 font-mono min-w-[70px]">CLIENTE</span>
                  <span className="text-xs text-[#111] font-medium flex-1">{name} {company ? `(${company})` : ""}</span>
                </div>

                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-black/30 font-mono min-w-[70px]">CONTACTO</span>
                  <span className="text-xs text-black/70 font-normal flex-1">{phone} &bull; {email}</span>
                </div>

                <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-black/[0.04]">
                  <span className="text-[10px] text-black/30 font-mono min-w-[70px]">CITACIÓN</span>
                  <span className="text-xs text-black/70 font-normal flex-1">{formattedDate} ({selectedSlot})</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    setName("")
                    setPhone("")
                    setEmail("")
                    setCompany("")
                    setDescription("")
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black/15 text-xs font-mono tracking-wider uppercase hover:bg-black/5 transition-all text-[#111] cursor-pointer"
                >
                  {t.booking.newBookingBtn}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  )
}
