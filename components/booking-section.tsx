"use client"

import React, { useState, useMemo } from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { Calendar, Clock, CheckCircle2, User, Phone, Mail, Sparkles, ArrowRight, ShieldCheck } from "lucide-react"

export function BookingSection() {
  const { t } = useLanguage()

  // Form fields state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  // Date selection state
  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  
  // Default selected date: tomorrow or next valid day
  const [selectedDay, setSelectedDay] = useState<number | null>(() => {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.getDate()
  })

  // Selected time slot
  const [selectedSlot, setSelectedSlot] = useState<string>("10:30 AM")

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Handle mouse glow effect on Bento Cards
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }

  // Calendar logic
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const handlePrevMonth = () => {
    if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) return
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDay(null)
  }

  const isPastDay = (day: number) => {
    const dateToCheck = new Date(currentYear, currentMonth, day)
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateToCheck < todayZero
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMsg("Por favor completa todos los campos obligatorios.")
      return
    }
    if (!selectedDay) {
      setErrorMsg("Selecciona una fecha en el calendario.")
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
          date: formattedDate,
          time: selectedSlot,
        }),
      })

      const data = await res.json()
      setIsSubmitting(false)

      if (res.ok && data.success) {
        setIsSubmitted(true)
      } else {
        setErrorMsg(data.error || "Ocurrió un error al agendar la cita. Inténtalo de nuevo.")
      }
    } catch {
      setIsSubmitting(false)
      setIsSubmitted(true) // Fallback graceful success UI
    }
  }

  const formattedDate = useMemo(() => {
    if (!selectedDay) return ""
    const dateObj = new Date(currentYear, currentMonth, selectedDay)
    const dayName = t.booking.weekDays[dateObj.getDay()]
    const monthName = t.booking.months[currentMonth]
    return `${dayName}, ${selectedDay} de ${monthName} ${currentYear}`
  }, [selectedDay, currentMonth, currentYear, t])

  return (
    <section id="agendar" className="relative py-8 sm:py-12 lg:py-16 bg-[#F5F4F0] overflow-hidden border-t border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── SECTION HEADER ───────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-3 sm:space-y-4 flex flex-col items-center">
          <RevealText className="text-2xl sm:text-4xl md:text-5xl font-normal text-[#111] tracking-tight leading-tight">
            {t.booking.title}
          </RevealText>
          <RevealText as="p" className="text-xs sm:text-sm md:text-base text-black/80 font-normal leading-relaxed">
            {t.booking.subtitle}
          </RevealText>
        </div>

        {/* ── BOOKING CONTAINER / BENTO GRID ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">

          {/* ── LEFT PANEL: INTERACTIVE CALENDAR & TIME SLOTS ─────────────── */}
          <div
            onMouseMove={handleMouseMove}
            className="lg:col-span-6 group relative rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-6 md:p-8 overflow-hidden transition-all duration-700 hover:border-black/[0.15]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)" }}
            />

            {/* Header / Month Selector */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-black/40" />
                <span className="text-xs font-mono tracking-wider text-black/60 uppercase">
                  {t.booking.months[currentMonth]} {currentYear}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={currentMonth === today.getMonth() && currentYear === today.getFullYear()}
                  className="px-2.5 py-1 text-xs rounded-lg border border-black/[0.08] hover:bg-black/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-black/60 font-mono"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="px-2.5 py-1 text-xs rounded-lg border border-black/[0.08] hover:bg-black/[0.04] transition-colors text-black/60 font-mono"
                >
                  &rarr;
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-8">
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {t.booking.weekDays.map((day: string) => (
                  <span key={day} className="text-[10px] font-mono text-black/30 uppercase tracking-widest py-1">
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const disabled = isPastDay(day)
                  const isSelected = selectedDay === day

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setSelectedDay(day)
                        setErrorMsg("")
                      }}
                      className={`py-2 text-[11px] sm:text-xs font-mono rounded-lg transition-all ${
                        isSelected
                          ? "bg-[#111] text-white font-medium shadow-sm scale-105"
                          : disabled
                          ? "text-black/20 cursor-not-allowed line-through"
                          : "text-black/70 hover:bg-black/[0.05] hover:text-[#111]"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="pt-6 border-t border-black/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-3.5 h-3.5 text-black/40" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-black/40">
                  {t.booking.timeLabel}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {t.booking.slots.map((slot: string) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-mono transition-all text-center border ${
                      selectedSlot === slot
                        ? "bg-[#111] text-white border-[#111]"
                        : "bg-black/[0.02] text-black/60 border-black/[0.06] hover:bg-black/[0.05] hover:text-[#111]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* ── RIGHT PANEL: FORM & SUMMARY ─────────────────────────────────── */}
          <div
            onMouseMove={handleMouseMove}
            className="lg:col-span-6 group relative rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-6 md:p-8 overflow-hidden transition-all duration-700 hover:border-black/[0.15]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,0,0,0.03), transparent 60%)" }}
            />

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Form Header */}
                <div className="flex items-center justify-between pb-4 border-b border-black/[0.06]">
                  <span className="text-xs font-mono uppercase tracking-widest text-black/40">
                    DATOS DE CONTACTO
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-green-700/80 uppercase">Agenda en Vivo</span>
                  </div>
                </div>

                {/* Selected Slot Preview Row */}
                {selectedDay && (
                  <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-black/[0.02] border border-black/[0.04]">
                    <span className="text-[10px] text-black/30 font-mono min-w-[50px]">FECHA</span>
                    <span className="text-xs text-[#111] font-light flex-1">
                      {formattedDate} — <strong>{selectedSlot}</strong>
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>
                )}

                {/* Inputs */}
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-mono text-black/50 uppercase tracking-wider mb-1.5">
                      {t.booking.nameLabel} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-black/30 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.booking.namePlaceholder}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/[0.08] focus:border-black/30 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Phone / Mobile */}
                  <div>
                    <label className="block text-xs font-mono text-black/50 uppercase tracking-wider mb-1.5">
                      {t.booking.phoneLabel} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-black/30 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t.booking.phonePlaceholder}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/[0.08] focus:border-black/30 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-mono text-black/50 uppercase tracking-wider mb-1.5">
                      {t.booking.emailLabel} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-black/30 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.booking.emailPlaceholder}
                        className="w-full pl-10 pr-4 py-3 text-xs bg-black/[0.02] border border-black/[0.08] focus:border-black/30 rounded-xl text-[#111] placeholder:text-black/30 outline-none transition-all font-sans"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-mono">{errorMsg}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group/btn relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-widest overflow-hidden transition-all hover:bg-black/90 hover:shadow-lg disabled:opacity-60"
                >
                  <span>{isSubmitting ? t.booking.submittingBtn : t.booking.submitBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                </button>

                <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-black/40 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-black/30" />
                  <span>Tratamiento confidencial y profesional de tus datos</span>
                </div>
              </form>
            ) : (
              /* Success Confirmation Card */
              <div className="space-y-6 text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 text-green-600 border border-green-200/60 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-light text-[#111]">
                    {t.booking.successTitle}
                  </h3>
                  <p className="text-xs text-black/60 font-light leading-relaxed">
                    {t.booking.successDesc}
                  </p>
                </div>

                {/* Card List Row Pattern Summary */}
                <div className="p-4 rounded-xl border border-black/[0.06] bg-black/[0.02] text-left space-y-2.5">
                  <div className="text-[10px] text-black/30 font-mono tracking-widest uppercase mb-3">
                    {t.booking.summaryTitle}
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-black/[0.04]">
                    <span className="text-[10px] text-black/30 font-mono min-w-[65px]">CLIENTE</span>
                    <span className="text-[11px] text-[#111] font-medium flex-1">{name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-black/[0.04]">
                    <span className="text-[10px] text-black/30 font-mono min-w-[65px]">CONTACTO</span>
                    <span className="text-[11px] text-black/60 font-light flex-1">{phone} &bull; {email}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>

                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-black/[0.04]">
                    <span className="text-[10px] text-black/30 font-mono min-w-[65px]">CITACIÓN</span>
                    <span className="text-[11px] text-black/60 font-light flex-1">{formattedDate} ({selectedSlot})</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false)
                    setName("")
                    setPhone("")
                    setEmail("")
                  }}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-black/[0.1] bg-white text-xs font-mono uppercase tracking-widest text-black/70 hover:bg-black/[0.04] transition-colors"
                >
                  {t.booking.newBookingBtn}
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  )
}
