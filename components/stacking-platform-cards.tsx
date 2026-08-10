"use client"

import React, { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/lib/language-context"
import { PixelIcon } from "@/components/pixel-icon"

const STICKY_TOP = 90
const STICKY_STEP = 16
const SCALE_STEP = 0.03
const OFFSET_STEP = 8

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] tracking-widest font-sans text-black/50 bg-black/[0.05] font-medium uppercase">
      {children}
    </span>
  )
}

export function StackingPlatformCards() {
  const { t, language } = useLanguage()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* ── CARD 1: SISTEMA AUTÓNOMO ────────────────────────────────────── */}
      <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-black/[0.15] hover:shadow-md flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center">
              <PixelIcon type="platform" size={20} />
            </div>
            <Tag>{t.platform.autonomousTag}</Tag>
          </div>

          <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">
            {t.platform.autonomousTitle}
          </h3>

          <p className="text-xs sm:text-sm text-black/75 font-normal leading-relaxed">
            {t.platform.autonomousDesc}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-black/[0.06] space-y-2">
          {[
            { id: "01", label: language === "es" ? "Enfoque Consultivo" : "Consultative Approach", desc: "Venta directa de alto valor" },
            { id: "02", label: language === "es" ? "Control de Marca" : "Brand Guidelines", desc: "Alineado a tus políticas" },
            { id: "03", label: language === "es" ? "Escala Comercial" : "Sales Scaling", desc: "Sin inflar nómina fija" },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
              <span className="text-[10px] text-black/25 font-mono min-w-[16px]">{item.id}</span>
              <span className="text-[11px] text-black/70 font-medium flex-1">{item.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 group-hover:bg-emerald-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 2: INTELIGENCIA DE DATOS ───────────────────────────────── */}
      <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-black/[0.15] hover:shadow-md flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center">
              <PixelIcon type="integrations" size={20} />
            </div>
            <Tag>{t.platform.memoryTag}</Tag>
          </div>

          <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">
            {t.platform.memoryTitle}
          </h3>

          <p className="text-xs sm:text-sm text-black/75 font-normal leading-relaxed">
            {t.platform.memoryDesc}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-black/[0.06] space-y-2">
          {[
            { id: "01", label: language === "es" ? "Segmentación por Ubicación" : "Location Segmentation", desc: "Perfilamiento geográfico" },
            { id: "02", label: language === "es" ? "Leyes & Capacidad" : "Regulations & Capacity", desc: "Cálculo Ley 1527" },
            { id: "03", label: language === "es" ? "Cartera Propia o In-House" : "Proprietary or In-House", desc: "Integración directa" },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
              <span className="text-[10px] text-black/25 font-mono min-w-[16px]">{item.id}</span>
              <span className="text-[11px] text-black/70 font-medium flex-1">{item.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60 group-hover:bg-blue-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 3: MANIFIESTO Y FLUJOS DOCUMENTALES ───────────────────── */}
      <div className="group relative rounded-2xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-sm transition-all hover:border-black/[0.15] hover:shadow-md flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl border border-black/10 bg-black/[0.02] flex items-center justify-center">
              <PixelIcon type="security" size={20} />
            </div>
            <Tag>{t.platform.manifesto.tagline}</Tag>
          </div>

          <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">
            {t.platform.manifesto.title}
          </h3>

          <p className="text-xs sm:text-sm text-black/75 font-normal leading-relaxed">
            {t.platform.manifesto.desc}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-black/[0.06] space-y-2">
          {[
            { id: "01", label: language === "es" ? "Validación Documental" : "Document Validation", desc: "Lectura OCR automática" },
            { id: "02", label: language === "es" ? "Orquestación n8n / APIs" : "n8n / API Orchestration", desc: "Flujos sincronizados" },
            { id: "03", label: language === "es" ? "Cero Tareas Repetitivas" : "Zero Repetitive Work", desc: "Operación eficiente" },
          ].map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer">
              <span className="text-[10px] text-black/25 font-mono min-w-[16px]">{item.id}</span>
              <span className="text-[11px] text-black/70 font-medium flex-1">{item.label}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500/60 group-hover:bg-purple-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
