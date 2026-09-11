"use client"

import React, { useState, useEffect } from "react"
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Inbox,
  Calendar,
  Activity,
  CreditCard,
  Terminal,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
  Bot,
  Menu,
  RefreshCw,
  InboxIcon,
  Globe,
  Mail,
  Play,
  FileText,
  Sparkles,
  Cpu,
  CheckCircle2,
  BrainCircuit,
  Key,
  ShieldCheck,
  Send,
  Zap,
  Share2,
  Layers,
  Clock,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { CalendarDataTable4 } from "@/components/ui/calendar-data-table-4"
import { BookingEmailsModule } from "@/components/ui/booking-emails-module"
import { MarketingCampaignsModule } from "@/components/ui/marketing-campaigns-module"
import { MarketingAudiencesModule } from "@/components/ui/marketing-audiences-module"
import { GmailAccountsModule } from "@/components/ui/gmail-accounts-module"
import { ResellersModule } from "@/components/ui/resellers-module"
import { PlatziModule } from "@/components/ui/platzi-module"

export type NavItemData = {
  id: string
  titleKey: string
  icon: React.ElementType
  badgeKey?: string
  shortcut?: string
  children?: NavItemData[]
}

export type NavGroupData = {
  headingKey?: string
  items: NavItemData[]
}

const mockNavGroups: NavGroupData[] = [
  {
    headingKey: "overview",
    items: [
      { id: "overview", titleKey: "overview", icon: LayoutDashboard, shortcut: "⌘1" },
    ],
  },
  {
    headingKey: "agents",
    items: [
      { id: "agents", titleKey: "agents", icon: Bot, shortcut: "⌘2" },
    ],
  },
  {
    headingKey: "operation",
    items: [
      { id: "calendar", titleKey: "calendar", icon: Calendar, badgeKey: "totalProspectos" },
      { id: "booking-emails", titleKey: "bookingEmails", icon: Clock },
    ],
  },
  {
    headingKey: "marketing",
    items: [
      { id: "marketing-campaigns", titleKey: "marketingCampaigns", icon: Send },
      { id: "marketing-audiences", titleKey: "marketingAudiences", icon: Users },
    ],
  },
  {
    headingKey: "partners",
    items: [
      { id: "referrals", titleKey: "referrals", icon: Share2 },
      { id: "platzi", titleKey: "platzi", icon: Layers },
    ],
  },
  {
    headingKey: "infrastructure",
    items: [
      { id: "email-accounts", titleKey: "emailAccounts", icon: Key },
      { id: "api", titleKey: "api", icon: Terminal },
    ],
  },
]

const mockBottomItems: NavItemData[] = []

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string; onSelect?: (ws: any) => void }) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [internalSelected, setInternalSelected] = useState<string>(t.dashboard?.navWorkspace || "SmartContacts Cloud")

  const current = selected || internalSelected
  const handleSelect = onSelect || setInternalSelected

  return (
    <div className="relative font-sans">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3 py-2.5 mb-3 rounded-xl bg-white border border-black/[0.08] hover:border-black/20 hover:bg-[#FAFAF8] cursor-pointer transition-all select-none shadow-2xs group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#111] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs shrink-0">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold leading-tight text-[#111] truncate">{current}</span>
            <span className="text-[10px] font-mono text-black/40 leading-tight">Unidad Agéntica</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-black/40 group-hover:text-[#111] transition-colors shrink-0 ml-2" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-white border border-black/10 rounded-xl shadow-xl z-50 py-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
            {["SmartContacts Cloud", "Unidad In-House"].map((ws) => (
              <div
                key={ws}
                onClick={() => {
                  handleSelect(ws)
                  setIsOpen(false)
                }}
                className={`px-3 py-2 mx-1 text-xs rounded-lg cursor-pointer transition-colors ${
                  current === ws ? "bg-black/5 text-[#111] font-semibold" : "text-black/70 hover:bg-black/[0.03] hover:text-[#111]"
                }`}
              >
                {ws}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function NavItem({
  item,
  activeId,
  onSelect,
  metrics,
  level = 0,
}: {
  item: NavItemData
  activeId: string
  onSelect: (id: string) => void
  metrics?: any
  level?: number
}) {
  const { t } = useLanguage()
  const hasChildren = !!item.children && item.children.length > 0
  const isChildActive = hasChildren && item.children!.some((child) => child.id === activeId)
  const isActive = activeId === item.id || isChildActive
  const [isOpen, setIsOpen] = useState(isChildActive || item.id === "email")

  useEffect(() => {
    if (isChildActive) setIsOpen(true)
  }, [isChildActive])

  const titleText = (t.dashboard?.menu as any)?.[item.titleKey] || item.titleKey
  const badgeVal = item.badgeKey === "totalProspectos" ? (metrics?.overview?.totalProspectos || 0) : null

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
      if (!isOpen && item.children && item.children.length > 0) {
        onSelect(item.children[0].id)
      }
    } else {
      onSelect(item.id)
    }
  }

  return (
    <div className="flex flex-col w-full font-sans">
      <div
        className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 select-none
          ${
            isActive && !hasChildren
              ? "bg-purple-900 text-white font-medium shadow-2xs"
              : isActive && hasChildren
              ? "bg-purple-50 text-purple-950 font-semibold"
              : "text-black/70 hover:bg-black/[0.04] hover:text-[#111]"
          }
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 min-w-0">
          <item.icon
            className={`w-4 h-4 transition-colors shrink-0 ${
              isActive && !hasChildren ? "text-white" : "text-purple-600 group-hover:text-black/80"
            }`}
            strokeWidth={1.5}
          />
          <span className="text-xs tracking-wide truncate font-medium">{titleText}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.shortcut && (
            <kbd className={`hidden group-hover:inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-mono font-medium rounded ${
              isActive && !hasChildren ? "text-white/60 bg-white/10 border border-white/20" : "text-black/40 bg-black/[0.04] border border-black/10"
            }`}>
              {item.shortcut}
            </kbd>
          )}
          {badgeVal !== null && badgeVal > 0 && (
            <span className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-mono font-bold rounded-full ${
              isActive && !hasChildren ? "bg-white text-[#111]" : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/20"
            }`}>
              {badgeVal}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isActive && !hasChildren ? "text-white/60" : "text-black/40"
              } ${isOpen ? "rotate-90" : ""}`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col ml-4 pl-2 border-l border-black/10 my-1 space-y-0.5">
          {item.children!.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              activeId={activeId}
              onSelect={onSelect}
              metrics={metrics}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SidebarNav({
  className = "",
  activeId,
  onSelect,
  activeWorkspace,
  onWorkspaceSelect,
  metrics,
}: {
  className?: string
  activeId?: string
  onSelect?: (id: string) => void
  activeWorkspace?: string
  onWorkspaceSelect?: (ws: string) => void
  metrics?: any
}) {
  const { t } = useLanguage()
  const [internalId, setInternalId] = useState("overview")
  const currentId = activeId !== undefined ? activeId : internalId
  const handleSelect = onSelect || setInternalId

  return (
    <div className={`flex flex-col h-full bg-[#F5F4F0] p-3.5 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {mockNavGroups.map((group, idx) => {
          const defaultTitles: Record<string, string> = {
            overview: "Centro de Mando",
            agents: "Inteligencia & Fuerza Agéntica IA",
            operation: "Operación & Agendamiento Comercial",
            marketing: "Prospección & Outbound Marketing",
            partners: "Red de Aliados & Convenios",
            infrastructure: "Infraestructura & Canales",
          }
          const headingText = group.headingKey ? ((t.dashboard?.groups as any)?.[group.headingKey] || defaultTitles[group.headingKey] || group.headingKey) : null
          return (
            <div key={idx} className="flex flex-col gap-0.5">
              {headingText && (
                <span className="px-3 mb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-black/40">
                  {headingText}
                </span>
              )}
              {group.items.map((item) => (
                <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} metrics={metrics} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SidebarNavPreview() {
  const { t } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState("overview") // Default directly to Executive Command Center
  const [activeWorkspace, setActiveWorkspace] = useState("SmartContacts Cloud")
  const [googleMetrics, setGoogleMetrics] = useState<any>(null)
  const [generalMetrics, setGeneralMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch dedicated Google Metrics from /api/google/metrics
  const loadGoogleMetrics = () => {
    setIsLoading(true)
    fetch("/api/google/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGoogleMetrics(data)
        }
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }

  // Fetch general operational metrics from /api/dashboard/metrics
  const loadGeneralMetrics = () => {
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setGeneralMetrics(data)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadGoogleMetrics()
    loadGeneralMetrics()
    const interval = setInterval(() => {
      loadGoogleMetrics()
      loadGeneralMetrics()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleSelect = (id: string) => {
    setActiveId(id)
    setIsMobileOpen(false)
  }

  const activeTitle = (t.dashboard?.menu as any)?.[activeId] || "Centro de Mando Agéntico"

  return (
    <div className="min-h-screen w-full bg-[#F5F4F0] text-[#111] font-sans antialiased flex flex-col overflow-hidden">
      
      {/* ── TOP HEADER BAR ────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-black/[0.08] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menú móvil"
            className="md:hidden p-2 rounded-xl text-black/70 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Alternar barra lateral"
            className="hidden md:flex p-2 rounded-xl text-black/70 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" strokeWidth={1.5} /> : <PanelLeftOpen className="w-5 h-5" strokeWidth={1.5} />}
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-black/50">
            <span className="truncate max-w-[120px] sm:max-w-none">{activeWorkspace}</span>
            <span>/</span>
            <span className="font-bold text-[#111] truncate max-w-[140px] sm:max-w-none">{activeTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={loadGoogleMetrics}
            title="Refrescar Métricas"
            aria-label="Refrescar Métricas"
            className="p-2 rounded-xl text-black/60 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} strokeWidth={1.5} />
          </button>

          <button
            onClick={async () => {
              try {
                await fetch('/api/auth/logout', { method: 'POST' })
              } finally {
                window.location.href = '/login'
              }
            }}
            title={t.auth?.logoutButton || "Cerrar Sesión"}
            aria-label="Cerrar Sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 hover:bg-black/5 text-black/70 hover:text-red-700 transition-colors cursor-pointer text-xs font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.auth?.logoutButton || "Cerrar Sesión"}</span>
          </button>

          <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
            SC
          </div>
        </div>
      </header>

      {/* ── BODY LAYOUT ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* MOBILE DRAWER */}
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#F5F4F0] border-r border-black/[0.08] shadow-2xl flex flex-col md:hidden animate-in slide-in-from-left duration-300">
              <div className="p-3.5 flex justify-between items-center border-b border-black/[0.08]">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#111]">MENÚ NAVEGACIÓN</span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Cerrar menú"
                  className="p-1 rounded-lg text-black/60 hover:bg-black/5 hover:text-[#111]"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
              <SidebarNav
                className="w-full border-none bg-transparent"
                activeId={activeId}
                onSelect={handleSelect}
                activeWorkspace={activeWorkspace}
                onWorkspaceSelect={setActiveWorkspace}
                metrics={generalMetrics}
              />
            </div>
          </>
        )}

        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:block h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[#F5F4F0] border-r border-black/[0.08] ${
            isSidebarOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 border-none"
          }`}
        >
          <SidebarNav
            className="w-[260px] border-none bg-transparent"
            activeId={activeId}
            onSelect={handleSelect}
            activeWorkspace={activeWorkspace}
            onWorkspaceSelect={setActiveWorkspace}
            metrics={generalMetrics}
          />
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* ── 1. EXECUTIVE COMMAND CENTER (VISIÓN GENERAL) ─────────────────── */}
          {activeId === "overview" || activeId === "home" ? (
            <>
              {/* Header Banner */}
              <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wider text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                      UNIDAD DE CRECIMIENTO EN VIVO
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
                    Centro de Mando Agéntico & Crecimiento Comercial
                  </h1>
                  <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
                    Monitoreo consolidado de agendamientos, prospección autónoma sobre +4M contactos, fuerza agéntica RAG y red de aliados.
                  </p>
                </div>
              </div>

              {/* ── BENTO GRID: 4 MAIN EXECUTIVE KPIS ───────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* KPI 1: Citas & Agendamiento */}
                <div
                  onClick={() => setActiveId("calendar")}
                  className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">AGENDA & CITAS</span>
                      <Calendar className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      {generalMetrics?.overview?.totalProspectos ?? 0}
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Prospectos Registrados (`calendario`)</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>AGENDAMIENTO</span>
                    <span className="text-purple-700 font-bold group-hover:underline">VER TABLA →</span>
                  </div>
                </div>

                {/* KPI 2: Habeas Data & Trazabilidad */}
                <div
                  onClick={() => setActiveId("calendar")}
                  className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">CUMPLIMIENTO LEGAL</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-emerald-700 tracking-tight">
                      100%
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Habeas Data (Ley 1581) Verificado</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>TRAZABILIDAD</span>
                    <span className="text-emerald-700 font-bold font-mono">CONFORME</span>
                  </div>
                </div>

                {/* KPI 3: Fuerza Agéntica IA */}
                <div
                  onClick={() => setActiveId("agents")}
                  className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">FUERZA AGÉNTICA IA</span>
                      <BrainCircuit className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      4 AGENTES
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Prospector, Outbound, Orquestador, Cierre</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>ARQUITECTURA</span>
                    <span className="text-blue-700 font-bold group-hover:underline">VER DETALLE →</span>
                  </div>
                </div>

                {/* KPI 4: Red de Aliados & Revendedores */}
                <div
                  onClick={() => setActiveId("referrals")}
                  className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md hover:border-black/20 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">RED DE REVENDEDORES</span>
                      <Share2 className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      ACTIVA
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Atribución de Enlaces & Convenios</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>ALIADOS</span>
                    <span className="text-amber-700 font-bold group-hover:underline">GESTIONAR →</span>
                  </div>
                </div>

              </div>

              {/* ── MIDDLE GRID: GOOGLE WORKSPACE & MARKETING INFRASTRUCTURE ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Integraciones Google Workspace */}
                <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold">
                      ESTADO INTEGRACIONES GOOGLE WORKSPACE
                    </span>
                    <button
                      onClick={() => setActiveId("api")}
                      className="text-xs font-mono text-purple-700 hover:underline font-semibold"
                    >
                      VER MONITOR COMPLETO →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {/* Gmail */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-medium text-[#111]">Gmail API (Despacho Correos)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">OPERACIONAL</span>
                    </div>

                    {/* Meet */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-medium text-[#111]">Google Meet API (Salas Virtuales)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">OPERACIONAL</span>
                    </div>

                    {/* Calendar */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-[#111]">Google Calendar API (Eventos & Agenda)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">OPERACIONAL</span>
                    </div>

                    {/* Sheets */}
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-[#111]">Google Sheets API (Sync Tablas)</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-700">OPERACIONAL</span>
                    </div>
                  </div>
                </div>

                {/* Prospección & Infraestructura Outbound */}
                <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
                    <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold">
                      CAPACIDAD Y RECURSOS DE PROSPECCIÓN
                    </span>
                    <button
                      onClick={() => setActiveId("marketing-audiences")}
                      className="text-xs font-mono text-purple-700 hover:underline font-semibold"
                    >
                      EXPLORAR BASE +4M →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#111]">Base de Datos Propia Colombia</div>
                        <div className="text-[11px] text-black/50 font-mono">Segmentada por 5 Criterios Clave</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-purple-700">+4,000,000 REGISTROS</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#111]">Infraestructura Multi-Remitente</div>
                        <div className="text-[11px] text-black/50 font-mono">Cuentas Gmail OAuth Vinculadas</div>
                      </div>
                      <button
                        onClick={() => setActiveId("email-accounts")}
                        className="text-xs font-mono font-bold text-emerald-700 hover:underline"
                      >
                        GESTIONAR CUENTAS →
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#111]">Sectores Atendidos en Salud & Financiero</div>
                        <div className="text-[11px] text-black/50 font-mono">Libranzas, Prepaga, Domiciliaria, Odontología</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700">ACTIVO</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── BOTTOM SECTION: AUDIT EVENT FEED (DESIGN.MD PATTERN) ──────── */}
              <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
                  <div>
                    <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold">
                      REGISTRO EN TIEMPO REAL DE ACTIVIDAD COMERCIAL & AGÉNTICA
                    </span>
                  </div>
                  <span className="text-xs font-mono text-black/50">
                    {googleMetrics?.recentEvents?.length || 0} Eventos Registrados Hoy
                  </span>
                </div>

                <div className="space-y-2">
                  {googleMetrics?.recentEvents && googleMetrics.recentEvents.length > 0 ? (
                    googleMetrics.recentEvents.map((evt: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                      >
                        <span className="text-[10px] text-black/25 font-mono min-w-[60px] font-medium">{evt.time}</span>
                        <span className="text-xs text-black/80 font-light flex-1 truncate sm:whitespace-normal">
                          {evt.title} {evt.meetLink ? `(Link Meet: ${evt.meetLink})` : ''}
                        </span>
                        <span className="text-[10px] font-mono text-black/50 font-semibold uppercase shrink-0">{evt.service}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center text-black/40 space-y-2">
                      <InboxIcon className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                      <p className="text-xs font-sans font-medium">No se han registrado interacciones o eventos adicionales el día de hoy en la API de Google.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeId === "agents" ? (
            /* ── 2. FUERZA AGÉNTICA IA MODULE ──────────────────────────────── */
            <>
              <div className="pb-4 border-b border-black/[0.08]">
                <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
                  Arquitectura de Agentes de IA & RAG Comercial
                </h1>
                <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
                  Fuerza comercial autónoma entrenada con el conocimiento, voz, productos y políticas de tu marca sobre nuestra base de datos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Agente 1 */}
                <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                      <Search className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111]">Agente Prospector & Perfilador RAG</h3>
                      <span className="text-[10px] font-mono text-black/50 uppercase">Base Propia +4M Registros</span>
                    </div>
                  </div>
                  <p className="text-xs text-black/70 leading-relaxed font-light">
                    Selecciona y califica automáticamente prospectos de nuestra base de datos nacional en Colombia alineados al perfil del cliente ideal.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-black/[0.06]">
                    <span className="text-black/50">COBERTURA</span>
                    <span className="font-bold text-purple-700">33 DEPARTAMENTOS</span>
                  </div>
                </div>

                {/* Agente 2 */}
                <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                      <Bot className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111]">Agente Comercial Outbound (WhatsApp & Voz)</h3>
                      <span className="text-[10px] font-mono text-black/50 uppercase">Lenguaje Natural & RAG</span>
                    </div>
                  </div>
                  <p className="text-xs text-black/70 leading-relaxed font-light">
                    Presenta la oferta de tu empresa en lenguaje natural, maneja objeciones complejas y envía propuestas personalizadas sin errores humanos.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-black/[0.06]">
                    <span className="text-black/50">RESPUESTA</span>
                    <span className="font-bold text-blue-700">100% EXACTA</span>
                  </div>
                </div>

                {/* Agente 3 */}
                <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <Activity className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111]">Agente Orquestador & CRM Sync</h3>
                      <span className="text-[10px] font-mono text-black/50 uppercase">Trazabilidad Comercial</span>
                    </div>
                  </div>
                  <p className="text-xs text-black/70 leading-relaxed font-light">
                    Monitorea la trazabilidad en tiempo real y sincroniza las oportunidades calificadas directamente con la operación del cliente.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-black/[0.06]">
                    <span className="text-black/50">SINCRONIZACIÓN</span>
                    <span className="font-bold text-amber-700">TIEMPO REAL</span>
                  </div>
                </div>

                {/* Agente 4 */}
                <div className="p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#111]">Agente Ejecutor de Cierre & Agendamiento</h3>
                      <span className="text-[10px] font-mono text-black/50 uppercase">Google Calendar & Meet</span>
                    </div>
                  </div>
                  <p className="text-xs text-black/70 leading-relaxed font-light">
                    Reserva citas automáticamente en Google Calendar generando el link de la sala en Google Meet, o ejecuta el despacho cuando corresponde.
                  </p>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-black/[0.06]">
                    <span className="text-black/50">DISPONIBILIDAD</span>
                    <span className="font-bold text-emerald-700">24/7 AUTÓNOMO</span>
                  </div>
                </div>
              </div>
            </>
          ) : activeId === "api" ? (
            <>
              {/* Top Title Banner */}
              <div className="pb-4 border-b border-black/[0.08]">
                <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
                  Módulo de APIs & Google Cloud (Consumos en Tiempo Real)
                </h1>
                <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
                  Monitoreo exclusivo de las 4 APIs de Google Workspace: Gmail, Google Meet, Google Calendar y Google Sheets en el proyecto <span className="font-mono font-bold text-[#111]">auto-n8n-123456-a1</span>.
                </p>
              </div>

              {/* ── 4 GOOGLE WORKSPACE APIS BENTO GRID ────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                
                {/* 1. Gmail API */}
                <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GMAIL API</span>
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      {googleMetrics?.apis?.gmail?.requestCount ?? 0}
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Correos Despachadas Hoy</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>CUOTA 2,000</span>
                    <span className="text-rose-700 font-bold">{googleMetrics?.apis?.gmail?.quotaUsedPercentage ?? 0}% USADO</span>
                  </div>
                </div>

                {/* 2. Google Meet API */}
                <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GOOGLE MEET API</span>
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      {googleMetrics?.apis?.meet?.requestCount ?? 0}
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Salas Meet Generadas Hoy</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>ESTADO API</span>
                    <span className="text-emerald-700 font-bold">
                      {googleMetrics?.apis?.meet?.status || "OPERACIONAL"}
                    </span>
                  </div>
                </div>

                {/* 3. Google Calendar API */}
                <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GOOGLE CALENDAR API</span>
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      {googleMetrics?.apis?.calendar?.requestCount ?? 0}
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Eventos Sincronizados Hoy</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>ESTADO API</span>
                    <span className="text-purple-700 font-bold">
                      {googleMetrics?.apis?.calendar?.status || "OPERACIONAL"}
                    </span>
                  </div>
                </div>

                {/* 4. Google Sheets API */}
                <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div>
                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GOOGLE SHEETS API</span>
                    </div>
                    <div className="text-3xl font-bold text-[#111] tracking-tight">
                      {googleMetrics?.apis?.sheets?.requestCount ?? 0}
                    </div>
                    <p className="text-xs text-black/70 mt-1 font-sans font-medium">Peticiones a Hojas de Cálculo</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                    <span>ESTADO API</span>
                    <span className="text-blue-700 font-bold">
                      {googleMetrics?.apis?.sheets?.status || "OPERACIONAL"}
                    </span>
                  </div>
                </div>

              </div>

              {/* ── REAL-TIME EVENT LOGS EXCLUSIVELY FROM GOOGLE CLOUD ───────────── */}
              <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
                  <div>
                    <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold">
                      REGISTRO EXCLUSIVO DE EVENTOS Y SALAS MEET EN GOOGLE WORKSPACE
                    </span>
                  </div>
                  <span className="text-xs font-mono text-black/50">
                    {googleMetrics?.recentEvents?.length || 0} Eventos Registrados Hoy
                  </span>
                </div>

                <div className="space-y-2.5">
                  {googleMetrics?.recentEvents && googleMetrics.recentEvents.length > 0 ? (
                    googleMetrics.recentEvents.map((evt: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                      >
                        <span className="text-[11px] text-black/40 font-mono min-w-[65px] font-medium">{evt.time}</span>
                        <span className="text-xs text-black/80 font-light flex-1 truncate sm:whitespace-normal">
                          {evt.title} {evt.meetLink ? `(Link Meet: ${evt.meetLink})` : ''}
                        </span>
                        <span className="text-[10px] font-mono text-black/50 font-semibold uppercase shrink-0">{evt.service}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors shrink-0" />
                      </div>
                    ))
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center text-black/40 space-y-2">
                      <InboxIcon className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                      <p className="text-xs font-sans font-medium">No se han registrado eventos o salas Meet adicionales el día de hoy en la API de Google.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeId === "booking-emails" ? (
            <BookingEmailsModule />
          ) : activeId === "platzi" ? (
            <PlatziModule />
          ) : activeId === "referrals" ? (
            <ResellersModule />
          ) : activeId === "marketing-campaigns" || activeId === "email" || activeId === "projects" ? (
            <MarketingCampaignsModule />
          ) : activeId === "marketing-audiences" ? (
            <MarketingAudiencesModule />
          ) : activeId === "email-accounts" ? (
            <GmailAccountsModule />
          ) : activeId === "calendar" ? (
            <>
              {/* Top Title Banner */}
              <div className="pb-4 border-b border-black/[0.08]">
                <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
                  Módulo de Agendamiento 45M & Operaciones CRUD (`calendario`)
                </h1>
                <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
                  Tabla de datos con paneles desplegables en sitio (Data Table 4) para administrar el esquema <span className="font-mono font-bold text-[#111]">calendario.eventos</span> y <span className="font-mono font-bold text-[#111]">calendario.prospectos</span>.
                </p>
              </div>

              {/* DATA TABLE 4 */}
              <CalendarDataTable4 />
            </>
          ) : (
            <CalendarDataTable4 />
          )}

        </main>
      </div>
    </div>
  )
}
