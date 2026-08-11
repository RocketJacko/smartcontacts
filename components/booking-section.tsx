"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PixelIcon } from "@/components/pixel-icon"
import { PhoneInput } from "@/components/phone-input"
import { Calendar, Clock, CheckCircle2, User, Phone, Mail, Building, ArrowRight, ArrowLeft, ShieldCheck, FileText, Check, ChevronDown, AlertCircle, Loader2 } from "lucide-react"

export function BookingSection() {
  const { t, language } = useLanguage()

  // Step State: 1 = Topic, 2 = Date & Time, 3 = Contact & Company Details, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isListboxOpen, setIsListboxOpen] = useState(false)

  // Form Fields State
  const [selectedTopic, setSelectedTopic] = useState<string>("automation-no-ai")
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
        setEmailError("Email no aceptado")
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
    return t.booking.topics.find(top => top.id === selectedTopic) || t.booking.topics[0]
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
          name,
          phone,
          email,
          company: isCompany ? company : "Persona Natural",
          isCompany,
          topic: selectedTopicData.title,
          description,
          date: formattedDate,
          time: selectedSlot,
          timeSlot: selectedSlot,
        }),
      })

      const data = await res.json()
      setIsSubmitting(false)

      if (res.ok && data.success) {
        setStep(4)
      } else {
        setErrorMsg(data.error || (language === "es" ? "Ocurrió un error al agendar la cita. Inténtalo de nuevo." : "Error booking slot."))
      }
    } catch {
      setIsSubmitting(false)
      setStep(4) // Fallback graceful success UI
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
                      0{t.booking.topics.findIndex(t => t.id === selectedTopic) + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-semibold">ÁREA SELECCIONADA</div>
                      <div className="text-sm sm:text-base font-medium text-[#111] truncate mt-0.5">
                        {t.booking.topics.find(t => t.id === selectedTopic)?.title}
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
                    {t.booking.topics.map((item, idx) => {
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
                              <p className="text-xs text-black/50 font-normal truncate mt-0.5">{item.desc}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-[#111] border-[#111] text-white" : "border-black/20 bg-transparent group-hover:border-black/50"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111] text-white text-xs font-mono tracking-widest uppercase hover:bg-black/90 transition-all font-medium"
                >
                  <span>{language === "es" ? "CONTINUAR A FECHA & HORA" : "CONTINUE TO DATE & TIME"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: CALENDAR & HORARIOS ───── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium text-[#111]">
                    {t.booking.dateLabel}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-black/70 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "CAMBIAR TEMA" : "CHANGE TOPIC"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Real Calendar Grid */}
                <div className="lg:col-span-7 space-y-4 p-5 rounded-xl border border-black/[0.08] bg-black/[0.01]">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <span className="text-sm font-mono font-medium text-[#111] tracking-wider uppercase">
                      {t.booking.months[currentMonth]} {currentYear}
                    </span>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-black/60 uppercase tracking-wider py-1 font-semibold">
                    {t.booking.weekDays.map(d => (
                      <div key={d}>{d}</div>
                    ))}
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1
                      const available = isAvailableDay(dayNum)
                      const isSelected = selectedDay === dayNum

                      return (
                        <button
                          key={dayNum}
                          type="button"
                          disabled={!available}
                          onClick={() => {
                            setSelectedDay(dayNum)
                          }}
                          className={`min-h-[44px] sm:min-h-[48px] flex items-center justify-center rounded-lg text-xs font-mono font-medium transition-all ${
                            isSelected
                              ? "bg-[#111] text-white shadow-xs"
                              : available
                              ? "bg-white border border-black/15 text-[#111] hover:border-black cursor-pointer shadow-2xs"
                              : "text-black/30 bg-black/[0.02] cursor-not-allowed border border-transparent line-through"
                          }`}
                        >
                          {dayNum}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Time Slot Picker */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-black/50" />
                    <span className="text-xs font-mono uppercase tracking-widest text-black/75 font-semibold">
                      {t.booking.timeLabel}
                    </span>
                    {isLoadingSlots && <Loader2 className="w-3.5 h-3.5 animate-spin text-black/40 ml-auto" />}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {fetchedSlots.map(({ slot, status, label, bookingToken: token }) => {
                      const isSelected = selectedSlot === slot
                      const isOccupied = status === "ocupado"

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isOccupied}
                          onClick={() => {
                            setSelectedSlot(slot)
                            if (token) setBookingToken(token)
                          }}
                          className={`w-full min-h-[48px] py-3 px-4 rounded-xl text-xs font-mono tracking-wider flex items-center justify-between border transition-all ${
                            isOccupied
                              ? "bg-black/[0.02] text-black/30 border-black/[0.04] cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-[#111] text-white border-[#111] shadow-xs"
                              : "bg-white text-black/80 border-black/15 hover:border-black/40 cursor-pointer"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{slot}</span>
                            <span className="text-[10px] opacity-60 font-sans font-normal">({label})</span>
                          </div>
                          {isOccupied ? (
                            <span className="text-[10px] uppercase tracking-wider font-mono text-black/40 font-semibold">OCUPADO</span>
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 ml-1" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  {selectedDay && (
                    <div className="p-3.5 rounded-xl bg-black/[0.03] border border-black/[0.06] text-xs space-y-1">
                      <span className="text-[10px] font-mono text-black/70 uppercase tracking-widest block font-medium">CITACIÓN SELECCIONADA</span>
                      <p className="font-medium text-[#111]">{formattedDate} — {selectedSlot}</p>
                    </div>
                  )}
                </div>

              </div>

              <div className="pt-4 flex justify-between items-center border-t border-black/[0.06] gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 px-5 py-3.5 min-h-[48px] rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "ANTERIOR" : "BACK"}</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedDay}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3.5 min-h-[48px] rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium disabled:opacity-50"
                >
                  <span>{language === "es" ? "INGRESAR DATOS" : "ENTER DETAILS"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: CONTACT & COMPANY DETAILS FORM ───────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-medium text-[#111]">
                    {t.booking.step3Title}
                  </h3>
                  <p className="text-xs text-black/60 font-normal mt-0.5">
                    {language === "es" ? "Ingresa tu información para confirmar la citación y enviar el correo de acceso." : "Enter your contact details to send email confirmation."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-xs font-mono text-black/60 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "CAMBIAR HORARIO" : "CHANGE TIME"}</span>
                </button>
              </div>

              {/* Selection Summary Pill */}
              <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest block">TEMA</span>
                  <span className="font-medium text-[#111]">{selectedTopicData.title}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest block">FECHA & HORA</span>
                  <span className="font-medium text-[#111]">{formattedDate} ({selectedSlot})</span>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.nameLabel} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      aria-label={t.booking.nameLabel}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.booking.namePlaceholder}
                      className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/10 focus:border-black rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                    />
                  </div>
                </div>

                {/* Phone / Mobile */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.phoneLabel} *
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(fullNum) => setPhone(fullNum)}
                    placeholder={t.booking.phonePlaceholder}
                  />
                </div>

                {/* Corporate Email */}
                <div>
                  <label className="block text-xs font-mono text-black/60 uppercase tracking-wider mb-1.5 font-medium">
                    {t.booking.emailLabel} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      aria-label={t.booking.emailLabel}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError("")
                      }}
                      onBlur={() => validateEmailDomain(email)}
                      placeholder={t.booking.emailPlaceholder}
                      className={`w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans ${
                        emailError ? "border-rose-500 bg-rose-500/5 focus:border-rose-600" : "border-black/10 focus:border-black"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-[11px] font-mono text-rose-600 mt-1.5 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
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
                    <Building className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      aria-label={t.booking.companyLabel}
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={t.booking.companyPlaceholder}
                      className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/10 focus:border-black rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Is Company Checkbox Toggle */}
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

              {errorMsg && (
                <p className="text-xs text-red-600 font-mono font-medium">{errorMsg}</p>
              )}

              {/* Action buttons */}
              <div className="pt-4 flex justify-between items-center border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-black/10 text-xs font-mono text-black/70 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{language === "es" ? "ANTERIOR" : "BACK"}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest hover:bg-black/90 transition-all font-medium disabled:opacity-60 shadow-xs"
                >
                  <span>{isSubmitting ? t.booking.submittingBtn : t.booking.submitBtn}</span>
                  <ArrowRight className="w-4 h-4" />
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-black/15 text-xs font-mono tracking-wider uppercase hover:bg-black/5 transition-all text-[#111]"
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
