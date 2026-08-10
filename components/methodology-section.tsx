"use client"

import React from "react"
import { useLanguage } from "@/lib/language-context"
import { RevealText } from "@/components/reveal-text"
import { PixelIcon } from "@/components/pixel-icon"

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] tracking-widest font-mono text-black/50 bg-black/[0.05] uppercase border border-black/10 font-medium">
      {children}
    </span>
  )
}

export function MethodologySection() {
  const { t, language } = useLanguage()

  const advantages = [
    { title: language === "es" ? "Mayor Eficiencia Operativa" : "Higher Operational Efficiency", desc: language === "es" ? "Automatiza tareas repetitivas y complejas, reduciendo el margen de error a cero." : "Automates repetitive and complex tasks, eliminating human error." },
    { title: language === "es" ? "Mejora en Decisiones" : "Better Decision Making", desc: language === "es" ? "Accede a insights basados en datos reales e indicadores de prospección." : "Access real data insights and active prospecting indicators." },
    { title: language === "es" ? "Reducción de Costos" : "Cost Reduction", desc: language === "es" ? "Optimiza recursos sin inflar la nómina fija ni asumir cargas prestacionales." : "Optimizes resources without expanding fixed payroll." },
    { title: language === "es" ? "Experiencia 24/7" : "24/7 Customer Experience", desc: language === "es" ? "Respuestas inmediatas y atención continua sin importar el horario." : "Instant responses and continuous engagement anytime." },
    { title: language === "es" ? "Escalabilidad & Crecimiento" : "Scalability & Growth", desc: language === "es" ? "Expande la capacidad comercial fácilmente según el volumen." : "Easily expand sales capacity based on lead volume." },
    { title: language === "es" ? "Ventaja Competitiva" : "Competitive Advantage", desc: language === "es" ? "Posiciónate por delante de tus competidores con tecnología agéntica." : "Position your business ahead of competitors with AI agents." },
  ]

  const phases = [
    {
      num: "01",
      title: language === "es" ? "Diagnóstico y Entendimiento de Requerimientos" : "Diagnosis & Requirements Gathering",
      desc: language === "es" ? "Entendemos tus retos, objetivos y flujos comerciales. Analizamos datos clave, creamos la hoja de ruta y co-diseñamos el plan de implementación con casos de uso, tecnologías y reglas definidas." : "We analyze key metrics, design the deployment roadmap, and map out workflows."
    },
    {
      num: "02",
      title: language === "es" ? "Desarrollo, Implementación e Integración" : "Development, Setup & Integration",
      desc: language === "es" ? "Ajustamos prompts, modelos agénticos, pipelines de datos y APIs. Integramos con seguridad y permisos. Garantizamos calidad con pruebas A/B y control de costos, liberando por fases." : "Fine-tune prompts, setup data pipelines, APIs, SSO, and cost controls with phased release."
    },
    {
      num: "03",
      title: language === "es" ? "Entrenamiento, Optimización y Despliegue" : "Training, Optimization & Deployment",
      desc: language === "es" ? "Entrenamos con datos y políticas exactas de tu marca. Optimizamos precisión, latencia y costos. Aplicamos feedback humano y desplegamos con monitoreo en tiempo real." : "Train agents on brand knowledge, optimize latency and costs with real-time logging."
    },
    {
      num: "04",
      title: language === "es" ? "Validación, Ajustes y Acompañamiento Continuo" : "Validation, Adjustments & Continuous Support",
      desc: language === "es" ? "Evaluamos métricas de conversión y tiempos de ciclo. Aplicamos mejoras continuas en el conocimiento de los agentes y acompañamos la evolución operativa para asegurar el máximo ROI." : "Monitor conversion metrics and continuously update agent knowledge bases."
    }
  ]

  return (
    <section id="metodologia" className="py-12 sm:py-16 border-t border-black/[0.06] bg-[#F5F4F0]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* ── PART 1: STRATEGIC ADVANTAGES GRID ────────────────────────────── */}
        <div className="space-y-8">
          <div className="text-center flex flex-col items-center">
            <PixelIcon type="integrations" size={40} />
            <div className="mt-3"><Tag>{language === "es" ? "VENTAJAS ESTRATÉGICAS" : "STRATEGIC ADVANTAGES"}</Tag></div>
            <RevealText className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium text-[#111] tracking-tight leading-tight">
              {language === "es" ? "Valor Medible para tu Empresa" : "Measurable Value for Your Business"}
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {advantages.map((adv, idx) => (
              <div
                key={adv.title}
                className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-xs hover:border-black/30 lg:hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-semibold">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-[#111] tracking-tight">
                    {adv.title}
                  </h3>
                  <p className="text-xs text-black/70 leading-relaxed font-normal">
                    {adv.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PART 2: 4-PHASE METHODOLOGY ──────────────────────────────────── */}
        <div className="space-y-8 pt-6 border-t border-black/[0.06]">
          <div className="text-center flex flex-col items-center">
            <PixelIcon type="workflow" size={40} />
            <div className="mt-3"><Tag>{language === "es" ? "METODOLOGÍA DE INGENIERÍA" : "ENGINEERING METHODOLOGY"}</Tag></div>
            <RevealText className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium text-[#111] tracking-tight leading-tight">
              {language === "es" ? "¿Cómo Hacemos Inteligencia Artificial en 4 Fases?" : "How We Deploy Artificial Intelligence in 4 Phases"}
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {phases.map(phase => (
              <div
                key={phase.num}
                className="p-6 sm:p-8 rounded-2xl border border-black/[0.08] bg-white shadow-xs flex flex-col justify-between hover:border-black/30 lg:hover:-translate-y-1 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-mono text-black/80 bg-black/[0.04] border border-black/10 font-bold">
                      FASE {phase.num}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-medium text-[#111] tracking-tight">
                    {phase.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-normal">
                    {phase.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
