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
  ShieldCheck,
  Bot,
  Menu,
  CheckCircle2,
  Mail,
  Video,
  RefreshCw,
  Database,
  InboxIcon,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

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
    items: [
      { id: "search", titleKey: "search", icon: Search, shortcut: "⌘K" },
      { id: "home", titleKey: "unit", icon: LayoutDashboard },
      { id: "inbox", titleKey: "leads", icon: Inbox, badgeKey: "totalProspectos" },
      { id: "analytics", titleKey: "metrics", icon: Activity },
    ],
  },
  {
    headingKey: "operation",
    items: [
      {
        id: "projects",
        titleKey: "campaigns",
        icon: FolderKanban,
      },
      { id: "calendar", titleKey: "calendar", icon: Calendar },
      {
        id: "team",
        titleKey: "agents",
        icon: Users,
      },
    ],
  },
  {
    headingKey: "integrations",
    items: [
      { id: "api", titleKey: "api", icon: Terminal },
      { id: "webhooks", titleKey: "webhooks", icon: Blocks },
    ],
  },
]

const mockBottomItems: NavItemData[] = [
  { id: "settings", titleKey: "settings", icon: Settings, shortcut: "⌘," },
  { id: "logout", titleKey: "logout", icon: LogOut },
]

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string; onSelect?: (ws: string) => void }) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [internalSelected, setInternalSelected] = useState(t.dashboard?.navWorkspace || "SmartContacts Cloud")

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
  const isActive = activeId === item.id
  const hasChildren = !!item.children
  const [isOpen, setIsOpen] = useState(false)

  const titleText = (t.dashboard?.menu as any)?.[item.titleKey] || item.titleKey
  const badgeVal = item.badgeKey === "totalProspectos" ? (metrics?.overview?.totalProspectos || 0) : null

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
    } else {
      onSelect(item.id)
    }
  }

  return (
    <div className="flex flex-col w-full font-sans">
      <div
        className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 select-none
          ${
            isActive
              ? "bg-black text-white font-medium shadow-sm"
              : "text-black/70 hover:bg-black/[0.04] hover:text-[#111]"
          }
        `}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 min-w-0">
          <item.icon
            className={`w-4 h-4 transition-colors shrink-0 ${isActive ? "text-white" : "text-black/40 group-hover:text-black/80"}`}
            strokeWidth={1.5}
          />
          <span className="text-xs tracking-wide truncate font-medium">{titleText}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.shortcut && (
            <kbd className={`hidden group-hover:inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-mono font-medium rounded ${
              isActive ? "text-white/60 bg-white/10 border border-white/20" : "text-black/40 bg-black/[0.04] border border-black/10"
            }`}>
              {item.shortcut}
            </kbd>
          )}
          {badgeVal !== null && badgeVal > 0 && (
            <span className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-mono font-bold rounded-full ${
              isActive ? "bg-white text-[#111]" : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/20"
            }`}>
              {badgeVal}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isActive ? "text-white/60" : "text-black/40"} ${isOpen ? "rotate-90" : ""}`}
              strokeWidth={2}
            />
          )}
        </div>
      </div>
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
  const [internalId, setInternalId] = useState("home")
  const currentId = activeId !== undefined ? activeId : internalId
  const handleSelect = onSelect || setInternalId

  return (
    <div className={`flex flex-col h-full bg-[#F5F4F0] p-3.5 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {mockNavGroups.map((group, idx) => {
          const headingText = group.headingKey ? (t.dashboard?.groups as any)?.[group.headingKey] : null
          return (
            <div key={idx} className="flex flex-col gap-0.5">
              {headingText && (
                <span className="px-3 mb-1 text-[10px] font-mono font-bold tracking-widest text-black/40 uppercase">
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

      <div className="mt-auto pt-3 border-t border-black/[0.08] flex flex-col gap-0.5">
        {mockBottomItems.map((item) => (
          <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} metrics={metrics} />
        ))}
      </div>
    </div>
  )
}

export default function SidebarNavPreview() {
  const { t } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState("home")
  const [activeWorkspace, setActiveWorkspace] = useState("SmartContacts Cloud")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch real-time API consumption & calendar metrics from /api/dashboard/metrics
  const loadMetrics = () => {
    setIsLoading(true)
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data)
        }
        setIsLoading(false)
      })
      .catch((err) => {
        console.warn("Metrics fetch error:", err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 15000)
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
    if (id === "search") {
      setIsSearchOpen(true)
      setIsMobileOpen(false)
      return
    }
    setActiveId(id)
    setIsMobileOpen(false)
  }

  const activeTitle = (t.dashboard?.menu as any)?.[activeId] || "Unidad Comercial"

  // Real SVG chart calculations based on real hourlyCounts from Supabase PostgreSQL
  const hourlyData = metrics?.hourlyCounts && Array.isArray(metrics.hourlyCounts) ? metrics.hourlyCounts : [0, 0, 0, 0, 0, 0]
  const maxVal = Math.max(1, ...hourlyData)
  const points = hourlyData.map((val: number, idx: number) => {
    const x = idx * 100
    const y = 110 - (val / maxVal) * 80
    return `${x},${y}`
  }).join(" L ")

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
            onClick={loadMetrics}
            title="Refrescar Métricas"
            aria-label="Refrescar Métricas"
            className="p-2 rounded-xl text-black/60 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-emerald-600" : ""}`} strokeWidth={1.5} />
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Buscar en el sistema"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/10 text-xs font-mono text-black/60 hover:bg-black/[0.06] transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.dashboard?.navSearch || "Buscar..."}</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] bg-white border border-black/10 rounded font-bold">⌘K</kbd>
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
                metrics={metrics}
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
            metrics={metrics}
          />
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Top Title Banner */}
          <div className="pb-4 border-b border-black/[0.08]">
            <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
              {t.dashboard?.title || "Tablero de Inteligencia Multiagente & Servicios"}
            </h1>
            <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
              {t.dashboard?.subtitle || "Métricas operacionales en tiempo real de agendamiento, APIs de Google y fuerza agéntica."}
            </p>
          </div>

          {/* ── REAL-TIME API CONSUMPTION & CALENDAR METRICS (BENTO GRID) ──────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* KPI 1: Gmail API Consumption */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GMAIL API CONSUMO</span>
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">
                  {metrics?.googleApiConsumption?.gmailApi?.emailsSent ?? 0}
                </div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Correos & Confirmaciones Despachadas</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>CUOTA DIARIA</span>
                <span className="text-rose-700 font-bold">{metrics?.googleApiConsumption?.gmailApi?.quotaUsedPercentage ?? 0}% USADO</span>
              </div>
            </div>

            {/* KPI 2: Google Meet API */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">GOOGLE MEET API</span>
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">
                  {metrics?.googleApiConsumption?.meetApi?.linksGenerated ?? 0}
                </div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Salas de Videollamada Generadas</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>ESTADO API</span>
                <span className="text-emerald-700 font-bold">
                  {metrics?.googleApiConsumption?.meetApi?.status || "OPERACIONAL"}
                </span>
              </div>
            </div>

            {/* KPI 3: Show-Up Rate en Meet */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">ASISTENCIA MEET</span>
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">
                  {metrics?.overview?.showUpRate ?? 0}%
                </div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Cumplimiento de Citas Consultivas</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>RECORDATORIO 30M</span>
                <span className="text-purple-700 font-bold">{metrics?.overview?.recordatoriosEnviados ?? 0} Enviados</span>
              </div>
            </div>

            {/* KPI 4: Habeas Data Consent (Ley 1581) */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">HABEAS DATA</span>
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">
                  {metrics?.overview?.habeasDataPercentage ?? 0}%
                </div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Consentimiento Legal Registrado</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>TRAZABILIDAD IP</span>
                <span className="text-blue-700 font-bold">
                  {metrics?.overview?.habeasDataAceptados ?? 0} Auditados con IP
                </span>
              </div>
            </div>

          </div>

          {/* ── REAL-TIME CLEAR LATENCY & CONSUMPTION CHART (REAL SVG DYNAMIC) ────── */}
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
              <div>
                <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold block">
                  RENDIMIENTO & VOLUMEN DE EVENTOS EN SUPABASE Y APIS DE GOOGLE
                </span>
                <p className="text-xs text-black/60 font-sans mt-0.5">
                  Visualización en tiempo real basada en registros almacenados en PostgreSQL.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold shrink-0">
                Total Registros DB: {metrics?.overview?.totalEventos || 0}
              </span>
            </div>

            {/* Clear Dynamic SVG Line Chart based on real DB query data */}
            <div className="h-44 w-full pt-4 flex flex-col justify-end relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#000000" strokeOpacity="0.05" strokeDasharray="4 4" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#000000" strokeOpacity="0.05" strokeDasharray="4 4" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#000000" strokeOpacity="0.08" />

                {/* Filled Area */}
                <path
                  d={`M 0,110 L ${points} L 500,110 Z`}
                  fill="url(#chartGradient)"
                />

                {/* Smooth Line */}
                <path
                  d={`M ${points}`}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />

                <circle cx="500" cy="110" r="4" fill="#10B981" />
              </svg>

              <div className="flex items-center justify-between text-[10px] font-mono text-black/40 pt-2 border-t border-black/[0.04]">
                <span>08:00 AM</span>
                <span>10:00 AM</span>
                <span>12:00 PM</span>
                <span>02:00 PM</span>
                <span>04:00 PM</span>
                <span>06:00 PM</span>
              </div>
            </div>
          </div>

          {/* ── LIVE EXECUTION LOGS (100% REAL FROM SUPABASE POSTGRESQL) ───────── */}
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
              <div>
                <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold">
                  REGISTRO REAL DE EJECUCIONES & AGENDAMIENTOS (SUPABASE DB)
                </span>
              </div>
              <span className="text-xs font-mono text-black/50">
                {metrics?.recentLogs?.length || 0} Registros Reales
              </span>
            </div>

            <div className="space-y-2.5">
              {metrics?.recentLogs && metrics.recentLogs.length > 0 ? (
                metrics.recentLogs.map((log: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                  >
                    <span className="text-[11px] text-black/40 font-mono min-w-[65px] font-medium">{log.time}</span>
                    <span className="text-xs text-black/80 font-light flex-1 truncate sm:whitespace-normal">{log.label}</span>
                    <span className="text-[10px] font-mono text-black/50 font-semibold uppercase shrink-0">{log.status}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors shrink-0" />
                  </div>
                ))
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center text-black/40 space-y-2">
                  <InboxIcon className="w-8 h-8 opacity-40" strokeWidth={1.5} />
                  <p className="text-xs font-sans font-medium">No hay registros ni agendamientos en la base de datos de Supabase en este momento.</p>
                  <p className="text-[11px] font-mono text-black/30">Crea una reserva en /agendar para ver aparecer los registros reales en tiempo real aquí.</p>
                </div>
              )}
            </div>
          </div>

        </main>
      </div>

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-xs px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-white border border-black/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center px-4 border-b border-black/10">
              <Search className="w-4 h-4 text-black/40 mr-3 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                className="flex-1 bg-transparent py-4 outline-none text-xs font-sans text-[#111] placeholder:text-black/40"
                placeholder={t.dashboard?.navSearch || "Buscar en el sistema..."}
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-mono text-black/50 bg-black/5 border border-black/10 rounded cursor-pointer hover:bg-black/10 transition-colors"
              >
                ESC
              </kbd>
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="Cerrar búsqueda"
                className="ml-3 p-1 rounded-lg text-black/40 hover:bg-black/5 hover:text-[#111] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center text-center">
              <Command className="w-6 h-6 text-black/30 mb-2" strokeWidth={1.5} />
              <p className="text-xs text-black/60 font-medium font-sans">Busca agendamientos o logs de ejecución de APIs...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
