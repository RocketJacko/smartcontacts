'use client'

import React, { useState } from 'react'
import { ServiceItem } from '@/lib/config/services-config'
import {
  X,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  GraduationCap,
  Globe,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

interface ServiceFormModalProps {
  service: ServiceItem | null
  onClose: () => void
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function ServiceFormModal({ service, onClose }: ServiceFormModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [fileValues, setFileValues] = useState<Record<string, File>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<FormStatus>('idle')
  const [serverErrorMessage, setServerErrorMessage] = useState<string>('')

  if (!service) return null

  const renderIcon = (name: string) => {
    switch (name) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-emerald-700" />
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-700" />
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-700" />
      default:
        return <Layers className="w-5 h-5 text-purple-700" />
    }
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const handleFileChange = (fieldId: string, file: File | null, acceptStr?: string, maxSizeMB: number = 5) => {
    if (!file) return

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: `El archivo excede el tamaño máximo permitido de ${maxSizeMB}MB (Peso: ${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
      }))
      return
    }

    // Validar tipo si acceptStr está presente
    if (acceptStr) {
      const allowedTypes = acceptStr.split(',').map(t => t.trim().toLowerCase())
      const fileType = file.type.toLowerCase()
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`

      const isValidType = allowedTypes.some(allowed => {
        if (allowed.endsWith('/*')) {
          const category = allowed.split('/')[0]
          return fileType.startsWith(`${category}/`)
        }
        return fileType === allowed || fileExt === allowed
      })

      if (!isValidType) {
        setErrors(prev => ({
          ...prev,
          [fieldId]: `Formato de archivo no válido. Se aceptan: ${acceptStr}`,
        }))
        return
      }
    }

    setFileValues(prev => ({ ...prev, [fieldId]: file }))
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const removeFile = (fieldId: string) => {
    setFileValues(prev => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    service.fields.forEach(field => {
      if (field.type === 'file') {
        if (field.required && !fileValues[field.id]) {
          newErrors[field.id] = field.errorMessage || 'Debes adjuntar el archivo solicitado.'
        }
      } else {
        const val = (formValues[field.id] || '').trim()

        if (field.required && !val) {
          newErrors[field.id] = field.errorMessage || 'Este campo es obligatorio.'
        } else if (val) {
          if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(val)) {
              newErrors[field.id] = 'Ingresa un correo electrónico válido (ejemplo@dominio.com).'
            }
          } else if (field.type === 'tel') {
            const phoneClean = val.replace(/[\s\-\(\)\+]/g, '')
            if (phoneClean.length < 7 || !/^\d+$/.test(phoneClean)) {
              newErrors[field.id] = 'Ingresa un número de celular o teléfono válido.'
            }
          } else if (field.type === 'text' && val.length < 2) {
            newErrors[field.id] = 'El texto ingresado es demasiado corto.'
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setStatus('submitting')
    setServerErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('serviceId', service.id)
      formData.append('serviceName', service.name)

      // Agregar campos de texto
      Object.entries(formValues).forEach(([key, val]) => {
        formData.append(key, val)
      })

      // Agregar archivos
      Object.entries(fileValues).forEach(([key, file]) => {
        formData.append(key, file, file.name)
      })

      const res = await fetch('/api/services/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setServerErrorMessage(data.error || 'No se pudo completar la solicitud. Por favor intenta de nuevo.')
      }
    } catch (err: any) {
      console.error('[SERVICE MODAL SUBMIT ERROR]:', err)
      setStatus('error')
      setServerErrorMessage(err?.message || 'Error de conexión a la red al procesar el formulario.')
    }
  }

  const resetForm = () => {
    setFormValues({})
    setFileValues({})
    setErrors({})
    setStatus('idle')
    setServerErrorMessage('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#F5F4F0] border border-black/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08] bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] border border-black/10 flex items-center justify-center shrink-0">
              {renderIcon(service.iconName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-black/50 uppercase">ACTIVACIÓN</span>
                {service.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 font-semibold">
                    {service.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold text-[#111]">{service.name}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] hover:bg-black/10 active:bg-black/15 flex items-center justify-center text-black/60 hover:text-black transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {status === 'success' ? (
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-medium text-[#111]">¡Solicitud Enviada con Éxito!</h4>
                <p className="text-xs font-sans text-black/70 max-w-md mx-auto leading-relaxed">
                  Tu solicitud de activación para <strong>{service.name}</strong> ha sido transmitida correctamente. El token de seguridad fue generado y firmado. Un asesor revisará tus datos a la brevedad.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.04] text-xs font-mono text-black/80 font-medium transition-all shadow-2xs"
                >
                  Solicitar otro servicio
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-black/80 text-white text-xs font-mono font-medium transition-all shadow-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="py-8 px-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-medium text-[#111]">Error al Enviar la Solicitud</h4>
                <p className="text-xs font-sans text-rose-700 bg-rose-50/80 p-3 rounded-xl border border-rose-200/80 max-w-md mx-auto leading-relaxed">
                  {serverErrorMessage || 'No se pudo establecer comunicación con el servidor del webhook.'}
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-black/80 text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reintentar Envío
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.04] text-xs font-mono text-black/70 font-medium transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs font-sans text-black/70 leading-relaxed bg-white/70 p-3.5 rounded-xl border border-black/[0.06]">
                {service.description}
              </p>

              {service.fields.map(field => {
                const fieldError = errors[field.id]

                if (field.type === 'file') {
                  const selectedFile = fileValues[field.id]

                  return (
                    <div key={field.id} className="space-y-2">
                      <label className="block text-xs font-mono font-medium text-black/80">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {selectedFile ? (
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-emerald-500/30 text-xs font-mono shadow-2xs">
                          <div className="flex items-center gap-2.5 truncate mr-2">
                            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="truncate">
                              <p className="font-medium text-black/90 truncate">{selectedFile.name}</p>
                              <p className="text-[10px] text-black/50">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(field.id)}
                            className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors shrink-0 cursor-pointer"
                            title="Quitar archivo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-black/15 hover:border-black/40 rounded-2xl bg-white/60 hover:bg-white transition-all cursor-pointer group text-center">
                          <Upload className="w-6 h-6 text-black/40 group-hover:text-black/70 transition-colors mb-2" />
                          <span className="text-xs font-medium text-black/80 mb-1">
                            Haz clic o arrastra tu archivo aquí
                          </span>
                          <span className="text-[10px] font-mono text-black/50">
                            Formatos permitidos: JPG, PNG, WEBP o PDF (Máx. 5MB)
                          </span>
                          <input
                            type="file"
                            accept={field.accept || 'image/*,application/pdf'}
                            className="sr-only"
                            onChange={e => {
                              const file = e.target.files?.[0] || null
                              handleFileChange(field.id, file, field.accept, field.maxSizeMB)
                            }}
                          />
                        </label>
                      )}

                      {fieldError && (
                        <p className="text-[11px] font-mono text-rose-600 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          {fieldError}
                        </p>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={field.id} className="space-y-1.5">
                    <label htmlFor={field.id} className="block text-xs font-mono font-medium text-black/80">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      value={formValues[field.id] || ''}
                      onChange={e => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={status === 'submitting'}
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-white border text-xs text-black/90 placeholder:text-black/30 font-sans outline-none transition-all ${
                        fieldError
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-black/10 focus:border-black/30 focus:ring-2 focus:ring-black/10'
                      }`}
                    />
                    {fieldError && (
                      <p className="text-[11px] font-mono text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {fieldError}
                      </p>
                    )}
                  </div>
                )
              })}

              <div className="pt-4 border-t border-black/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={status === 'submitting'}
                  className="px-4 py-2.5 rounded-xl border border-black/10 bg-white hover:bg-black/[0.04] text-xs font-mono text-black/70 font-medium transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-6 py-2.5 rounded-xl bg-black hover:bg-black/80 active:bg-black text-white text-xs font-mono font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <span>SOLICITAR ACTIVACIÓN</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
