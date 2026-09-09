"use client"

import React, { useState, useEffect } from "react"
import { X, Loader2, Save, User, Mail, Phone, Building, CreditCard, FileText } from "lucide-react"
import { AfiliadoData } from "./resellers-module"

interface EditResellerModalProps {
  isOpen: boolean
  onClose: () => void
  afiliado: AfiliadoData | null
  onSuccess: () => void
}

export function EditResellerModal({ isOpen, onClose, afiliado, onSuccess }: EditResellerModalProps) {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [banco, setBanco] = useState("Bancolombia")
  const [tipoCuenta, setTipoCuenta] = useState("ahorros")
  const [numeroCuenta, setNumeroCuenta] = useState("")
  const [titularCuenta, setTitularCuenta] = useState("")
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (afiliado) {
      setNombre(afiliado.nombre || "")
      setEmail(afiliado.email || "")
      setTelefono(afiliado.telefono || "")
      setBanco(afiliado.banco || "Bancolombia")
      setTipoCuenta(afiliado.tipo_cuenta || "ahorros")
      setNumeroCuenta(afiliado.numero_cuenta || "")
      setTitularCuenta(afiliado.titular_cuenta || afiliado.nombre || "")
      setErrorMsg("")
    }
  }, [afiliado])

  if (!isOpen || !afiliado) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!nombre.trim() || !email.trim()) {
      setErrorMsg("El nombre y correo son obligatorios.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/referidos/${afiliado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim() || null,
          banco: banco.trim(),
          tipo_cuenta: tipoCuenta,
          numero_cuenta: numeroCuenta.trim() || null,
          titular_cuenta: titularCuenta.trim() || nombre.trim(),
          numero_documento: numeroDocumento.trim() || "0",
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Error al actualizar revendedor.")
        return
      }

      onSuccess()
      onClose()
    } catch {
      setErrorMsg("Error de conexión al guardar cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-black/10 shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
          <div>
            <span className="text-[10px] font-mono text-black/40 uppercase tracking-widest font-bold block">
              GESTIÓN DE ALIADO
            </span>
            <h3 className="text-xl font-medium text-[#111] tracking-tight">
              Editar Revendedor
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-600">
              {errorMsg}
            </div>
          )}

          {/* Información General */}
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-black/50 font-bold block">
              1. Datos de Contacto
            </span>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-black/70 font-semibold">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Información Bancaria */}
          <div className="space-y-3 pt-2 border-t border-black/[0.06]">
            <span className="text-xs font-mono uppercase tracking-wider text-black/50 font-bold block">
              2. Datos Bancarios para Liquidación
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Banco
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <select
                    value={banco}
                    onChange={(e) => setBanco(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors cursor-pointer"
                  >
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Banco de Occidente">Banco de Occidente</option>
                    <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Tipo de Cuenta
                </label>
                <select
                  value={tipoCuenta}
                  onChange={(e) => setTipoCuenta(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors cursor-pointer"
                >
                  <option value="ahorros">Ahorros</option>
                  <option value="corriente">Corriente</option>
                  <option value="billetera_digital">Billetera Digital</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Número de Cuenta
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    placeholder="Ej. 1234567890"
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-mono text-black/70 font-semibold">
                  Número de Documento (Cédula/NIT)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-black/30 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    placeholder="Ej. 1020304050"
                    className="w-full pl-9 pr-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-mono text-black/70 font-semibold">
                Titular de la Cuenta
              </label>
              <input
                type="text"
                value={titularCuenta}
                onChange={(e) => setTitularCuenta(e.target.value)}
                placeholder="Nombre del titular en la cuenta bancaria"
                className="w-full px-3 py-2 bg-[#F5F4F0] border border-black/[0.08] rounded-xl text-xs text-[#111] focus:bg-white focus:border-black/30 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-black/60 hover:text-[#111] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#111] text-white text-xs font-mono uppercase tracking-wider font-bold hover:bg-black/90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
