"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { PixelIcon } from "@/components/pixel-icon"

export function DevExSection() {
  const { t } = useLanguage()
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)

  const steps = [
    {
      num: "01",
      title: t.devex.step1Title,
      desc: t.devex.step1Desc,
      file: t.devex.codeComments.legalFile,
      icon: "platform" as const,
      code: [
        { type: "comment", text: t.devex.codeComments.legalComment },
        { type: "plain", text: t.devex.codeComments.legalCode1 },
        { type: "gap" },
        { type: "plain", text: t.devex.codeComments.legalCode2 },
        { type: "gap" },
        { type: "success", text: t.devex.codeComments.legalCode3 },
      ],
    },
    {
      num: "02",
      title: t.devex.step2Title,
      desc: t.devex.step2Desc,
      file: t.devex.codeComments.accountingFile,
      icon: "pricing" as const,
      code: [
        { type: "comment", text: t.devex.codeComments.accountingComment },
        { type: "plain", text: t.devex.codeComments.accountingCode1 },
        { type: "gap" },
        { type: "plain", text: t.devex.codeComments.accountingCode2 },
        { type: "gap" },
        { type: "success", text: t.devex.codeComments.accountingCode3 },
      ],
    },
    {
      num: "03",
      title: t.devex.step3Title,
      desc: t.devex.step3Desc,
      file: t.devex.codeComments.commercialFile,
      icon: "agents" as const,
      code: [
        { type: "comment", text: t.devex.codeComments.commercialComment },
        { type: "plain", text: t.devex.codeComments.commercialCode1 },
        { type: "gap" },
        { type: "plain", text: t.devex.codeComments.commercialCode2 },
        { type: "gap" },
        { type: "success", text: t.devex.codeComments.commercialCode3 },
      ],
    },
    {
      num: "04",
      title: t.devex.step4Title,
      desc: t.devex.step4Desc,
      file: t.devex.codeComments.technicalFile,
      icon: "integrations" as const,
      code: [
        { type: "comment", text: t.devex.codeComments.technicalComment },
        { type: "plain", text: t.devex.codeComments.technicalCode1 },
        { type: "gap" },
        { type: "plain", text: t.devex.codeComments.technicalCode2 },
        { type: "gap" },
        { type: "success", text: t.devex.codeComments.technicalCode3 },
      ],
    },
    {
      num: "05",
      title: t.devex.step5Title,
      desc: t.devex.step5Desc,
      file: t.devex.codeComments.supportFile,
      icon: "agents" as const,
      code: [
        { type: "comment", text: t.devex.codeComments.supportComment },
        { type: "plain", text: t.devex.codeComments.supportCode1 },
        { type: "gap" },
        { type: "plain", text: t.devex.codeComments.supportCode2 },
        { type: "gap" },
        { type: "success", text: t.devex.codeComments.supportCode3 },
      ],
    },
  ]

  function selectStep(i: number) {
    if (i === active) return
    setVisible(false)
    setTimeout(() => {
      setActive(i)
      setVisible(true)
    }, 180)
  }

  // Auto-advance tabs every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setActive((prev) => (prev + 1) % steps.length)
        setVisible(true)
      }, 180)
    }, 3500)
    return () => clearInterval(timer)
  }, [steps.length])

  const currentStep = steps[active]

  return (
    <section id="devex" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 md:px-12 lg:px-20 border-t border-black/[0.06] bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/[0.04] border border-black/[0.06] text-[11px] tracking-widest text-black/40 uppercase font-sans">
            {t.devex.tag}
          </div>
          <h2 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-normal text-[#111] tracking-tight leading-[1.05]">
            {t.devex.title}
          </h2>
          <p className="mt-3 text-sm md:text-base text-black/70 max-w-2xl font-normal leading-relaxed">
            {t.devex.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left — 5 sector step selection buttons */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {steps.map((s, i) => {
              const isActive = active === i
              return (
                <button
                  key={s.num}
                  onClick={() => selectStep(i)}
                  className={`
                    w-full text-left rounded-2xl border transition-all duration-300 p-5 group flex items-start justify-between
                    ${isActive
                      ? "bg-black/[0.04] border-black/20 shadow-sm"
                      : "bg-[#FAF9F6] border-black/[0.06] hover:bg-white hover:border-black/15"
                    }
                  `}
                >
                  <div className="flex gap-3.5 items-start">
                    <div
                      className={`
                        w-8 h-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center shrink-0 transition-colors
                        ${isActive ? "bg-black/10 text-black/80" : "bg-black/[0.04] text-black/40 group-hover:bg-black/[0.08]"}
                      `}
                    >
                      {s.num}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium transition-colors ${isActive ? "text-[#111]" : "text-black/70 group-hover:text-[#111]"}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-black/50 font-normal mt-0.5">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <PixelIcon type={s.icon} size={18} />
                  </div>
                </button>
              )
            })}
          </div>

          {/* Right — Architecture / Workflow simulation panel */}
          <div className="lg:col-span-7 rounded-2xl border border-black/[0.08] bg-[#FAF9F6] p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-black/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs text-black/60 tracking-wider uppercase font-medium"
                  style={{
                    opacity: visible ? 1 : 0,
                    transition: "opacity 200ms ease",
                  }}
                >
                  {currentStep.file}
                </span>
              </div>
              <div className="flex gap-1.5">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      idx === active ? "bg-black/80 w-5" : "bg-black/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1 rounded-xl p-6 bg-white border border-black/[0.06] shadow-inner font-mono text-xs leading-relaxed space-y-3">
              <div
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 220ms ease, transform 220ms ease",
                }}
              >
                {currentStep.code.map((line, idx) => {
                  if (line.type === "gap") return <div key={idx} className="h-2" />
                  if (line.type === "comment") return <div key={idx} className="text-purple-700 font-semibold">{line.text}</div>
                  if (line.type === "success") return (
                    <div key={idx} className="flex items-center gap-2 mt-3 pt-3 border-t border-black/[0.06] text-emerald-600 font-semibold">
                      <span>✓</span>
                      <span>{line.text}</span>
                    </div>
                  )
                  return (
                    <div key={idx} className="text-black/80 font-normal">
                      {line.text}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
              <span>SISTEMA DE IA AGENTIVO A MEDIDA</span>
              <span className="text-emerald-600 font-medium">✓ OPERATIVO EN CUALQUIER SECTOR</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
