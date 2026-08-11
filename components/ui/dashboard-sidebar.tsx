"use client"

import React, { useState, useEffect } from "react"
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Inbox,
  Calendar,
  Activity,
  CreditCard,
  Globe,
  Terminal,
  Blocks,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
  ShieldCheck,
  Bot,
  TrendingUp,
  Menu,
  Bell,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export type NavItemData = {
  id: string
  title: string
  icon: React.ElementType
  badge?: number | string
  shortcut?: string
  children?: NavItemData[]
}

export type NavGroupData = {
  heading?: string
  items: NavItemData[]
}

const mockNavGroups: NavGroupData[] = [
  {
    items: [
      { id: "search", title: "Buscar en Sistema", icon: Search, shortcut: "⌘K" },
      { id: "home", title: "Unidad Comercial", icon: LayoutDashboard },
      { id: "inbox", title: "Buzón de Leads B2B", icon: Inbox, badge: 14 },
      { id: "analytics", title: "Métricas & KPIs", icon: Activity },
    ],
  },
  {
    heading: "Operación Agéntica",
    items: [
      {
        id: "projects",
        title: "Campañas de Ventas",
        icon: FolderKanban,
        children: [
          { id: "p-active", title: "Prospección Activa", icon: Hash },
          { id: "p-archived", title: "Histórico de Leads", icon: Hash },
        ],
      },
      { id: "calendar", title: "Agendamiento 45m", icon: Calendar },
      {
        id: "team",
        title: "Fuerza de IA",
        icon: Users,
        children: [
          { id: "t-prospector", title: "Agente Prospector", icon: Bot },
          { id: "t-commercial", title: "Agente Comercial", icon: Bot },
          { id: "t-ocr", title: "Agente OCR / Docs", icon: Bot },
        ],
      },
      {
        id: "customers",
        title: "Cobertura Nacional",
        icon: Globe,
        children: [
          { id: "c-enterprise", title: "Empresas (+200k)", icon: Hash },
          { id: "c-smb", title: "Departamentos (33)", icon: Hash },
        ],
      },
      { id: "finance", title: "Facturación & ROI", icon: CreditCard },
    ],
  },
  {
    heading: "Integraciones",
    items: [
      { id: "api", title: "Supabase PostgreSQL", icon: Terminal },
      { id: "webhooks", title: "Webhooks & n8n", icon: Blocks },
    ],
  },
]

const mockBottomItems: NavItemData[] = [
  { id: "settings", title: "Configuración", icon: Settings, shortcut: "⌘," },
  { id: "logout", title: "Cerrar Sesión", icon: LogOut },
]

function WorkspaceSwitcher({ selected, onSelect }: { selected?: string; onSelect?: (ws: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalSelected, setInternalSelected] = useState("SmartContacts Cloud")

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
            <span className="text-[10px] font-mono text-black/40 leading-tight">Unidad de Crecimiento</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-black/40 group-hover:text-[#111] transition-colors shrink-0 ml-2" strokeWidth={1.5} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-white border border-black/10 rounded-xl shadow-xl z-50 py-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 font-sans">
            {["SmartContacts Cloud", "Unidad Comercial In-House", "Sandbox de Pruebas"].map((ws) => (
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
            <div className="h-px bg-black/[0.06] my-1 mx-2" />
            <div className="px-3 py-2 mx-1 text-xs text-black/50 hover:bg-black/[0.03] hover:text-[#111] rounded-lg cursor-pointer flex items-center gap-2 transition-colors font-mono">
              <span className="text-sm leading-none">+</span> Crear Nueva Unidad
            </div>
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
  level = 0,
}: {
  item: NavItemData
  activeId: string
  onSelect: (id: string) => void
  level?: number
}) {
  const isActive = activeId === item.id
  const hasChildren = !!item.children
  const [isOpen, setIsOpen] = useState(false)

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
          <span className="text-xs tracking-wide truncate font-medium">{item.title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.shortcut && (
            <kbd className={`hidden group-hover:inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-mono font-medium rounded ${
              isActive ? "text-white/60 bg-white/10 border border-white/20" : "text-black/40 bg-black/[0.04] border border-black/10"
            }`}>
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className={`flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-mono font-bold rounded-full ${
              isActive ? "bg-white text-[#111]" : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/20"
            }`}>
              {item.badge}
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

      {hasChildren && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 border-l border-black/10"
              style={{ left: `${level * 12 + 19}px` }}
            />
            {item.children!.map((child) => (
              <NavItem key={child.id} item={child} activeId={activeId} onSelect={onSelect} level={level + 1} />
            ))}
          </div>
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
}: {
  className?: string
  activeId?: string
  onSelect?: (id: string) => void
  activeWorkspace?: string
  onWorkspaceSelect?: (ws: string) => void
}) {
  const [internalId, setInternalId] = useState("home")
  const currentId = activeId !== undefined ? activeId : internalId
  const handleSelect = onSelect || setInternalId

  return (
    <div className={`flex flex-col h-full bg-[#F5F4F0] p-3.5 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {mockNavGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-3 mb-1 text-[10px] font-mono font-bold tracking-widest text-black/40 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-black/[0.08] flex flex-col gap-0.5">
        {mockBottomItems.map((item) => (
          <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} />
        ))}
      </div>
    </div>
  )
}

const allItems = [...mockNavGroups.flatMap((g) => g.items), ...mockBottomItems]
const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item)
    if (item.children) acc.push(...flattenItems(item.children))
    return acc
  }, [] as NavItemData[])
}
const flatMockData = flattenItems(allItems)

export default function SidebarNavPreview() {
  const { language } = useLanguage()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState("home")
  const [activeWorkspace, setActiveWorkspace] = useState("SmartContacts Cloud")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Handle window resize for mobile responsiveness
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

  const activeItem = flatMockData.find((i) => i.id === activeId)
  const activeTitle = activeItem ? activeItem.title : "Unidad Comercial"

  const handleSelect = (id: string) => {
    if (id === "search") {
      setIsSearchOpen(true)
      setIsMobileOpen(false)
      return
    }
    setActiveId(id)
    setIsMobileOpen(false)
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F4F0] text-[#111] font-sans antialiased flex flex-col overflow-hidden">
      
      {/* ── TOP HEADER BAR (100% RESPONSIVE) ─────────────────────────────────── */}
      <header className="h-16 border-b border-black/[0.08] bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Drawer Toggle */}
          <button
            onClick={() => setIsMobileOpen(true)}
            aria-label="Abrir menú móvil"
            className="md:hidden p-2 rounded-xl text-black/70 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Alternar barra lateral"
            className="hidden md:flex p-2 rounded-xl text-black/70 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" strokeWidth={1.5} /> : <PanelLeftOpen className="w-5 h-5" strokeWidth={1.5} />}
          </button>

          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs font-mono text-black/50">
            <span className="truncate max-w-[120px] sm:max-w-none">{activeWorkspace}</span>
            <span>/</span>
            <span className="font-bold text-[#111] truncate max-w-[140px] sm:max-w-none">{activeTitle}</span>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Buscar en el sistema"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.03] border border-black/10 text-xs font-mono text-black/60 hover:bg-black/[0.06] transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buscar...</span>
            <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[9px] bg-white border border-black/10 rounded font-bold">⌘K</kbd>
          </button>

          <div className="relative">
            <button aria-label="Notificaciones" className="p-2 rounded-xl text-black/60 hover:bg-black/5 hover:text-[#111] transition-colors relative cursor-pointer">
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
            </button>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
            SC
          </div>
        </div>
      </header>

      {/* ── BODY LAYOUT (MOBILE OVERLAY DRAWER + RESPONSIVE SIDEBAR + MAIN CONTENT) ── */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* MOBILE OVERLAY DRAWER (SLIDE-IN BACKDROP) */}
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
              />
            </div>
          </>
        )}

        {/* DESKTOP COLLAPSIBLE SIDEBAR */}
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
          />
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA (100% RESPONSIVE BENTO GRID) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.08]">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-[#111] tracking-tight">
                {language === "es" ? "Cuadro de Mando de Inteligencia Comercial" : "Commercial Intelligence Dashboard"}
              </h1>
              <p className="text-xs sm:text-sm text-black/70 font-normal mt-1">
                {language === "es"
                  ? "Métricas operacionales en tiempo real sincronizadas con Supabase PostgreSQL & Agentes de IA."
                  : "Real-time operational metrics synced with Supabase PostgreSQL & AI Agents."}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 font-semibold w-fit shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SISTEMA EN VIVO</span>
            </span>
          </div>

          {/* ── 4-STAGE SALES CONVERSION FUNNEL (AARRR METRICS) ────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            
            {/* ETAPA 1: Tráfico & Captura Web */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">1. TRÁFICO & VISITAS</span>
                  <Globe className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">1,250</div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Visitantes Únicos a la Web</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>🇨🇴 🇲🇽 🇺🇸 PAÍSES</span>
                <span className="text-blue-700 font-bold">78% Móvil / 22% PC</span>
              </div>
            </div>

            {/* ETAPA 2: Conversión a Agendamiento */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">2. AGENDAMIENTOS 45M</span>
                  <Calendar className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">60 Citas</div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">Reservadas en Calendario</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>CONVERSIÓN WEB</span>
                <span className="text-amber-700 font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> 4.8%
                </span>
              </div>
            </div>

            {/* ETAPA 3: Asistencia a Meet (Show-Up Rate) */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">3. ASISTENCIA MEET</span>
                  <Bot className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">85.0%</div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">51 Conectados a Videollamada</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>RECORDATORIO 30M</span>
                <span className="text-purple-700 font-bold">Gmail / API Activo</span>
              </div>
            </div>

            {/* ETAPA 4: Calificación & Cierre Comercial */}
            <div className="p-5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-black/50 uppercase tracking-widest font-bold">4. CIERRE DE VENTAS</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl font-bold text-[#111] tracking-tight">12 Cerrados</div>
                <p className="text-xs text-black/70 mt-1 font-sans font-medium">18 en 2do Contacto / 15 Futuro</p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.06] flex items-center justify-between text-[11px] font-mono text-black/50">
                <span>TASA DE CIERRE</span>
                <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> 23.5%
                </span>
              </div>
            </div>

          </div>

          {/* ── MÓDULO DE CALIFICACIÓN RÁPIDA DE CITAS MEET ───────────────────── */}
          <div className="p-5 sm:p-6 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] pb-3">
              <div>
                <span className="text-xs font-mono text-black/50 uppercase tracking-widest font-bold block">
                  CALIFICACIÓN DE REUNIONES MEET (CICLO DE VIDA & EVOLUCIÓN DE CITA)
                </span>
                <p className="text-xs text-black/60 font-sans mt-0.5">
                  Selecciona la clasificación de la sesión realizada para actualizar Supabase en tiempo real.
                </p>
              </div>
              <span className="text-xs font-mono text-black/50 shrink-0">Supabase RPC Activo</span>
            </div>

            <div className="space-y-3">
              {[
                { id: "evt-01", name: "Carlos Mendoza", company: "Grupo Ventus S.A.S.", topic: "Unidad Comercial IA", time: "Hoy, 02:00 PM", status: "agendado" },
                { id: "evt-02", name: "Mariana Silva", company: "Tecnología Logística LTDA", topic: "Integración n8n & CRM", time: "Hoy, 03:00 PM", status: "recordatorio_enviado" },
                { id: "evt-03", name: "Andrés Restrepo", company: "Inversiones del Norte", topic: "Flujos de Automatización", time: "Ayer, 04:00 PM", status: "cumplida" },
              ].map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-black/[0.03]">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111]">{item.name}</span>
                      <span className="text-[10px] font-mono text-black/40">• {item.company}</span>
                    </div>
                    <p className="text-xs text-black/60 font-sans">
                      Tema: <strong>{item.topic}</strong> | Horario: <span className="font-mono text-black/50">{item.time}</span>
                    </p>
                  </div>

                  {/* Badges de Calificación de Llamada en 1 Clic */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => alert(`Calificado como CERRADO GANADO para ${item.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                    >
                      🏆 Cerrado
                    </button>
                    <button
                      onClick={() => alert(`Calificado como SEGUNDO CONTACTO para ${item.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border border-blue-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                    >
                      ⏳ 2do Contacto
                    </button>
                    <button
                      onClick={() => alert(`Calificado como LLAMAR FUTURO para ${item.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                    >
                      📅 Futuro
                    </button>
                    <button
                      onClick={() => alert(`Calificado como NO INTERESA para ${item.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-gray-500/10 hover:bg-gray-500/20 text-gray-800 border border-gray-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                    >
                      ❌ No Interesa
                    </button>
                    <button
                      onClick={() => alert(`Calificado como NO-SHOW (No Asistió) para ${item.name}`)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 border border-rose-500/20 text-[11px] font-mono font-semibold transition-all cursor-pointer"
                    >
                      🚫 No-Show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-xs px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-white border border-black/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 border-b border-black/10">
              <Search className="w-4 h-4 text-black/40 mr-3 shrink-0" strokeWidth={1.5} />
              <input
                autoFocus
                className="flex-1 bg-transparent py-4 outline-none text-xs font-sans text-[#111] placeholder:text-black/40"
                placeholder="Buscar prospectos, departamentos o agentes de IA..."
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
              <p className="text-xs text-black/60 font-medium font-sans">Escribe un comando o busca en la base de datos B2B (+200,000)...</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
