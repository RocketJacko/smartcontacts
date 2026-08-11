"use client"

import React, { useState } from "react"
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
  Zap,
  TrendingUp,
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
      { id: "search", title: "Search / Buscar", icon: Search, shortcut: "⌘K" },
      { id: "home", title: "Unidad Comercial", icon: LayoutDashboard },
      { id: "inbox", title: "Buzón de Leads", icon: Inbox, badge: 14 },
      { id: "analytics", title: "Métricas & KPIs", icon: Activity },
    ],
  },
  {
    heading: "Operación & Agentes",
    items: [
      {
        id: "projects",
        title: "Campañas B2B",
        icon: FolderKanban,
        children: [
          { id: "p-active", title: "Prospección Activa", icon: Hash },
          { id: "p-archived", title: "Histórico de Leads", icon: Hash },
        ],
      },
      { id: "calendar", title: "Agendamiento 45m", icon: Calendar },
      {
        id: "team",
        title: "Agentes de IA",
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
    heading: "Desarrolladores & API",
    items: [
      { id: "api", title: "Supabase & Keys", icon: Terminal },
      { id: "webhooks", title: "Webhooks n8n", icon: Blocks },
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
        className="flex items-center justify-between px-2.5 py-2 mb-3 rounded-xl bg-[#FAFAF8] border border-black/[0.07] hover:border-black/20 hover:bg-white cursor-pointer transition-all select-none group shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#111] text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold leading-tight text-[#111] truncate max-w-[125px]">{current}</span>
            <span className="text-[10px] font-mono text-black/40 leading-tight">Unidad de Crecimiento</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-black/40 group-hover:text-[#111] transition-colors shrink-0" strokeWidth={1.5} />
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
        className={`group flex items-center justify-between px-2.5 py-[7px] rounded-lg cursor-pointer transition-all duration-200 select-none
          ${
            isActive
              ? "bg-black/[0.06] text-[#111] font-semibold shadow-2xs"
              : "text-black/60 hover:bg-black/[0.03] hover:text-[#111]"
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={`w-4 h-4 transition-colors ${isActive ? "text-[#111]" : "text-black/40 group-hover:text-black/70"}`}
            strokeWidth={1.5}
          />
          <span className="text-xs tracking-wide truncate font-medium">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-4 px-1.5 text-[9px] font-mono font-medium text-black/40 bg-black/[0.04] border border-black/10 rounded">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/20">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={`w-3.5 h-3.5 text-black/40 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
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
              style={{ left: `${level * 12 + 17.5}px` }}
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
    <div className={`flex flex-col w-[260px] h-full bg-[#F5F4F0] border-r border-black/[0.07] p-3 font-sans ${className}`}>
      <WorkspaceSwitcher selected={activeWorkspace} onSelect={onWorkspaceSelect} />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {mockNavGroups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[10px] font-mono font-bold tracking-widest text-black/40 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem key={item.id} item={item} activeId={currentId} onSelect={handleSelect} />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-black/[0.07] flex flex-col gap-0.5">
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
    return acc;
  }, [] as NavItemData[])
}
const flatMockData = flattenItems(allItems)

export default function SidebarNavPreview() {
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(true)
  const [activeId, setActiveId] = useState("home")
  const [activeWorkspace, setActiveWorkspace] = useState("SmartContacts Cloud")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const activeItem = flatMockData.find((i) => i.id === activeId)
  const activeTitle = activeItem ? activeItem.title : "Unidad Comercial"

  const handleSelect = (id: string) => {
    if (id === "search") {
      setIsSearchOpen(true)
      return
    }
    setActiveId(id)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[750px] bg-[#F5F4F0] p-4 md:p-8 font-sans">
      <div className="relative w-full max-w-5xl h-[720px] bg-[#FAFAF8] rounded-2xl border border-black/[0.08] flex overflow-hidden shadow-sm">
        {/* Sidebar */}
        <div
          className={`h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-[#F5F4F0] border-r border-black/[0.07] ${
            isOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 border-none"
          }`}
        >
          <SidebarNav
            className="w-[260px] border-none bg-transparent"
            activeId={activeId}
            onSelect={handleSelect}
            activeWorkspace={activeWorkspace}
            onWorkspaceSelect={setActiveWorkspace}
          />
        </div>

        {/* Main Content Dashboard Area */}
        <div className="flex-1 bg-black/[0.01] flex flex-col min-w-0 transition-all duration-300">
          {/* Header Bar */}
          <div className="h-14 border-b border-black/[0.07] flex items-center px-5 justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Sidebar"
                className="p-1.5 rounded-lg text-black/60 hover:bg-black/5 hover:text-[#111] transition-colors cursor-pointer"
              >
                {isOpen ? <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />}
              </button>
              <div className="flex items-center gap-2 text-xs font-mono text-black/50">
                <span className="truncate">{activeWorkspace}</span>
                <span>/</span>
                <span className="font-bold text-[#111] truncate">{activeTitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/[0.03] border border-black/10 text-xs font-mono text-black/50 hover:bg-black/[0.05] transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar prospectos o agentes...</span>
                <kbd className="px-1.5 text-[9px] bg-white border border-black/10 rounded font-bold">⌘K</kbd>
              </button>
              <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center font-mono font-bold text-xs shadow-2xs">
                SC
              </div>
            </div>
          </div>

          {/* Main Dashboard Content - 4 KPI Section Cards */}
          <div className="p-6 md:p-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-6">
            
            {/* Title Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
              <div>
                <h1 className="text-xl sm:text-2xl font-light text-[#111] tracking-tight">
                  {language === "es" ? "Cuadro de Mando de Inteligencia Comercial" : "Commercial Intelligence Dashboard"}
                </h1>
                <p className="text-xs text-black/60 font-normal mt-0.5">
                  {language === "es" ? "Métricas en tiempo real sincronizadas con Supabase PostgreSQL & Agentes de IA." : "Real-time metrics synced with Supabase PostgreSQL & AI Agents."}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 font-semibold w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>SISTEMA EN VIVO</span>
              </span>
            </div>

            {/* 4 Bento KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* KPI 1: Base de Datos B2B */}
              <div className="p-5 rounded-2xl border border-black/[0.07] bg-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">BASE DE DATOS B2B</span>
                    <Globe className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-[#111] tracking-tight">208,450</div>
                  <p className="text-xs text-black/60 mt-1 font-sans">Contactos Verificados en Colombia</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] font-mono text-black/50">
                  <span>33 DEPARTAMENTOS</span>
                  <span className="text-emerald-600 font-bold">98.4% Entrega</span>
                </div>
              </div>

              {/* KPI 2: Agendamiento & Calendario */}
              <div className="p-5 rounded-2xl border border-black/[0.07] bg-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">AGENDAMIENTO</span>
                    <Calendar className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold text-[#111] tracking-tight">45 Minutos</div>
                  <p className="text-xs text-black/60 mt-1 font-sans">Duración por Cita Consultiva</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] font-mono text-black/50">
                  <span>GOOGLE MEET / CALENDAR</span>
                  <span className="text-amber-600 font-bold">Sincronizado</span>
                </div>
              </div>

              {/* KPI 3: Fuerza Agéntica de IA */}
              <div className="p-5 rounded-2xl border border-black/[0.07] bg-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">AGENTES DE IA</span>
                    <Bot className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-[#111] tracking-tight">4 Agentes</div>
                  <p className="text-xs text-black/60 mt-1 font-sans">Prospector, Comercial, OCR, Auto</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] font-mono text-black/50">
                  <span>UPTIME 99.9%</span>
                  <span className="text-purple-600 font-bold">1.2s Latencia</span>
                </div>
              </div>

              {/* KPI 4: Cumplimiento Legal & Habeas Data */}
              <div className="p-5 rounded-2xl border border-black/[0.07] bg-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold">HABEAS DATA</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-[#111] tracking-tight">Ley 1581</div>
                  <p className="text-xs text-black/60 mt-1 font-sans">Trazabilidad IP & Consentimiento</p>
                </div>
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between text-[11px] font-mono text-black/50">
                  <span>AUDITORÍA SIC</span>
                  <span className="text-blue-600 font-bold">100% Conforme</span>
                </div>
              </div>

            </div>

            {/* Standard Card List Rows (Following DESIGN.md specification) */}
            <div className="p-6 rounded-2xl border border-black/[0.07] bg-white shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-black/40 uppercase tracking-widest font-bold">
                  REGISTRO DE EJECUCIONES EN VIVO (LOGS DE AGENTES & AGENDAMIENTO)
                </span>
                <span className="text-xs font-mono text-black/50">4 Tareas Procesadas</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { time: "11:14:09", label: "Agendamiento 45m procesado & Meet generado (pqy-odwu-pwd)", status: "Completado" },
                  { time: "11:10:02", label: "Verificación de disponibilidad de horario comercial en Supabase", status: "Sincronizado" },
                  { time: "11:08:45", label: "Autorización de Tratamiento de Datos (Ley 1581) registrada con IP", status: "Auditado" },
                  { time: "11:05:30", label: "Actualización de Cobertura B2B Nacional (33 Departamentos)", status: "Activo" },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                  >
                    <span className="text-[11px] text-black/40 font-mono min-w-[65px] font-medium">{log.time}</span>
                    <span className="text-xs text-black/80 font-light flex-1">{log.label}</span>
                    <span className="text-[10px] font-mono text-black/50 font-semibold uppercase">{log.status}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80 group-hover:bg-emerald-500 transition-colors" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Quick Search Command Palette Modal */}
        {isSearchOpen && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-xs px-4">
            <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
            <div className="relative w-full max-w-xl bg-white border border-black/15 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center px-4 border-b border-black/10">
                <Search className="w-4 h-4 text-black/40 mr-3 shrink-0" strokeWidth={1.5} />
                <input
                  autoFocus
                  className="flex-1 bg-transparent py-4 outline-none text-xs font-sans text-[#111] placeholder:text-black/40"
                  placeholder="Buscar prospectos, departamentos, o tareas de agentes..."
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
                <p className="text-xs text-black/60 font-medium font-sans">Escribe un comando o busca en los +200,000 contactos B2B...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
