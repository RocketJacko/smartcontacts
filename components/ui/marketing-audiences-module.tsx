"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Users,
  FolderPlus,
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react"

interface DirectoryItem {
  id: string
  nombre: string
  descripcion?: string
  total_contactos?: number
}

interface ContactItem {
  id: string
  email: string
  nombre?: string
  estado?: string
  creado_en?: string
}

export function MarketingAudiencesModule() {
  const [directories, setDirectories] = useState<DirectoryItem[]>([])
  const [selectedDirectory, setSelectedDirectory] = useState<string>("")
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [isLoadingDirs, setIsLoadingDirs] = useState(true)
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)

  // Búsqueda y Paginación
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [totalContacts, setTotalContacts] = useState(0)

  // Modal para Nuevo Directorio
  const [isNewDirModalOpen, setIsNewDirModalOpen] = useState(false)
  const [newDirName, setNewDirName] = useState("")

  // Subida de Contactos
  const [isUploading, setIsUploading] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar Directorios
  const loadDirectories = async () => {
    setIsLoadingDirs(true)
    try {
      const res = await fetch("/api/email/directories")
      const data = await res.json()
      if (data.success && data.directories) {
        setDirectories(data.directories)
        if (data.directories.length > 0 && !selectedDirectory) {
          setSelectedDirectory(data.directories[0].nombre)
        }
      }
    } catch {
      // Ignorar error
    } finally {
      setIsLoadingDirs(false)
    }
  }

  // Cargar Contactos del Directorio Activo
  const loadContacts = async (dirName: string, p = 1, q = "") => {
    if (!dirName) return
    setIsLoadingContacts(true)
    try {
      const url = `/api/email/contacts?directorio_nombre=${encodeURIComponent(dirName)}&page=${p}&pageSize=${pageSize}&q=${encodeURIComponent(q)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setContacts(data.contacts || [])
        setTotalContacts(data.total || 0)
      }
    } catch {
      // Ignorar error
    } finally {
      setIsLoadingContacts(false)
    }
  }

  useEffect(() => {
    loadDirectories()
  }, [])

  useEffect(() => {
    if (selectedDirectory) {
      setPage(1)
      loadContacts(selectedDirectory, 1, searchQuery)
    }
  }, [selectedDirectory])

  // Crear Nuevo Directorio
  const handleCreateDirectory = async () => {
    if (!newDirName.trim()) return
    try {
      const res = await fetch("/api/email/directories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newDirName.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        await loadDirectories()
        setSelectedDirectory(newDirName.trim())
        setNewDirName("")
        setIsNewDirModalOpen(false)
      }
    } catch (err: any) {
      alert("Error al crear directorio: " + err.message)
    }
  }

  // Subir Archivo CSV al Directorio
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedDirectory) return

    setIsUploading(true)
    setUploadFeedback("Analizando archivo y aplicando filtros anti-spam...")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("directorio_nombre", selectedDirectory)

    try {
      const res = await fetch("/api/email/contacts/process-file", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setUploadFeedback(`✓ ${data.insertedCount || 0} contactos nuevos agregados (${data.duplicateCount || 0} duplicados omitidos).`)
        loadContacts(selectedDirectory, 1, "")
      } else {
        setUploadFeedback("Error en la importación: " + (data.error || "Formato no compatible"))
      }
    } catch (err: any) {
      setUploadFeedback("Error de red: " + err.message)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 font-sans">
      {/* Encabezado */}
      <div className="pb-4 border-b border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-700">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-[#111] tracking-tight">
              Audiencias & Directorios de Contactos
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              Deduplicación & Anti-Spam Activa
            </span>
          </div>
          <p className="text-xs sm:text-sm text-black/60 font-normal mt-1">
            Segmenta tus prospectos en directorios temáticos. Ingesta limpia con deduplicación por correo normalizado y descarte de dominios temporales.
          </p>
        </div>

        <button
          onClick={() => setIsNewDirModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#111] hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs transition-all self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nuevo Directorio</span>
        </button>
      </div>

      {/* Selector de Directorio y Carga de Archivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Directorios (Columna Izquierda) */}
        <div className="bg-white rounded-2xl p-4 border border-black/[0.08] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#111]">
            <span>Directorios Segmentados ({directories.length})</span>
            <button onClick={loadDirectories} className="text-black/40 hover:text-[#111]">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {directories.length === 0 ? (
              <div className="py-6 text-center text-xs text-black/40">No hay directorios creados aún.</div>
            ) : (
              directories.map((dir) => {
                const isSelected = selectedDirectory === dir.nombre
                return (
                  <div
                    key={dir.id}
                    onClick={() => setSelectedDirectory(dir.nombre)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors border select-none ${
                      isSelected
                        ? "bg-purple-50 text-purple-950 font-semibold border-purple-200"
                        : "bg-black/[0.02] hover:bg-black/[0.04] text-black/70 border-black/[0.04]"
                    }`}
                  >
                    <span className="text-xs truncate flex-1">{dir.nombre}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-2" />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Panel de Gestión del Directorio Seleccionado (2 Cols) */}
        <div className="md:col-span-2 space-y-4">
          {/* Tarjeta de Carga Rápida */}
          <div className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111]">
                  Directorio Activo: <strong>{selectedDirectory || "Ninguno"}</strong>
                </h3>
                <span className="text-xs text-black/50">{totalContacts} prospectos registrados</span>
              </div>

              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploading || !selectedDirectory}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] hover:bg-black disabled:bg-black/20 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isUploading ? "Importando..." : "Importar CSV / Excel"}</span>
                </button>
              </div>
            </div>

            {uploadFeedback && (
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.06] text-xs text-black/70 flex items-center justify-between">
                <span>{uploadFeedback}</span>
                <button onClick={() => setUploadFeedback(null)} className="text-black/40 hover:text-[#111]">
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Tabla de Contactos con Búsqueda */}
          <div className="bg-white rounded-2xl border border-black/[0.08] shadow-xs overflow-hidden">
            {/* Barra de Búsqueda */}
            <div className="p-3 border-b border-black/[0.06] flex items-center gap-2">
              <Search className="w-4 h-4 text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  loadContacts(selectedDirectory, 1, e.target.value)
                }}
                placeholder="Buscar prospecto por correo o nombre..."
                className="w-full text-xs text-[#111] bg-transparent focus:outline-none placeholder:text-black/30"
              />
            </div>

            {/* Lista de Filas Estándar (DESIGN.md) */}
            <div className="p-3 space-y-1.5 min-h-[220px]">
              {isLoadingContacts ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-black/40 gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cargando contactos...</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-12 text-center text-xs text-black/40">
                  No hay contactos registrados en este directorio. Importa un archivo CSV arriba.
                </div>
              ) : (
                contacts.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black/[0.02] hover:bg-black/[0.04] transition-colors border border-black/[0.04] group cursor-pointer"
                  >
                    <span className="text-[10px] text-black/25 font-mono min-w-[16px]">{(page - 1) * pageSize + idx + 1}</span>
                    <span className="text-[11px] font-medium text-[#111] truncate min-w-[140px]">{c.email}</span>
                    <span className="text-[11px] text-black/50 font-light flex-1 truncate">{c.nombre || "—"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 group-hover:bg-green-500 transition-colors shrink-0" />
                  </div>
                ))
              )}
            </div>

            {/* Paginación */}
            {totalContacts > pageSize && (
              <div className="px-4 py-3 border-t border-black/[0.06] flex items-center justify-between text-xs text-black/50">
                <span>
                  Mostrando {(page - 1) * pageSize + 1} a {Math.min(page * pageSize, totalContacts)} de {totalContacts}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => {
                      setPage(page - 1)
                      loadContacts(selectedDirectory, page - 1, searchQuery)
                    }}
                    className="p-1 rounded-lg border border-black/[0.08] hover:bg-black/[0.03] disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page * pageSize >= totalContacts}
                    onClick={() => {
                      setPage(page + 1)
                      loadContacts(selectedDirectory, page + 1, searchQuery)
                    }}
                    className="p-1 rounded-lg border border-black/[0.08] hover:bg-black/[0.03] disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Nuevo Directorio */}
      {isNewDirModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-black/10 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-[#111]">Crear Nuevo Directorio</h3>
            <p className="text-xs text-black/60">
              Define un nombre descriptivo para tu nuevo segmento de contactos.
            </p>
            <input
              type="text"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="Ej: Fintechs Colombia 2026"
              className="w-full px-3.5 py-2 rounded-xl bg-[#F5F4F0] border border-black/[0.08] text-xs text-[#111]"
              onKeyDown={(e) => e.key === "Enter" && handleCreateDirectory()}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewDirModalOpen(false)}
                className="px-3 py-1.5 text-xs text-black/60 hover:text-[#111]"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDirectory}
                className="px-4 py-1.5 bg-[#111] hover:bg-black text-white text-xs font-medium rounded-xl shadow-xs"
              >
                Crear Directorio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
