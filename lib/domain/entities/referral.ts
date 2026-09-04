export interface Afiliado {
  id: string
  nombre: string
  email: string
  telefono?: string
  estado: 'activo' | 'suspendido' | 'en_revision'
  saldoPendiente: number
  saldoLiquidado: number
  totalReferidosAgendados: number
  totalReferidosCerrados: number
  creadoEn: string
  datosPago?: DatosPagoAfiliado
  enlacePrincipal?: EnlaceReferido
}

export interface DatosPagoAfiliado {
  afiliadoId: string
  tipoDocumento: 'CC' | 'NIT' | 'CE' | 'PASAPORTE'
  numeroDocumento: string
  tipoCuenta: 'ahorros' | 'corriente' | 'billetera_digital'
  banco: string
  numeroCuenta: string
  titularCuenta: string
  llaveTransferenciaRapida?: string
}

export interface EnlaceReferido {
  id: string
  afiliadoId: string
  codigoReferido: string
  slugPersonalizado?: string
  urlDestino: string
  clicsTotales: number
  activo: boolean
  creadoEn: string
}

export interface AtribucionReferido {
  id: string
  enlaceId: string
  tokenSesion: string
  ipHash?: string
  userAgent?: string
  expiraEn: string
  creadoEn: string
}

export interface ConversionReferido {
  id: string
  afiliadoId: string
  afiliadoNombre?: string
  enlacePrimerToqueId?: string
  enlaceUltimoToqueId?: string
  prospectoId?: string
  prospectoNombre?: string
  prospectoEmail?: string
  tipoAtribucion: 'enlace_cookie' | 'manual_admin'
  tipoComision: 'monto_fijo' | 'porcentaje' | 'personalizado'
  montoTransaccion: number
  porcentajeAplicado?: number
  valorComisionCalculado: number
  estadoLiquidacion: 'pendiente' | 'en_garantia' | 'aprobada' | 'liquidada' | 'cancelada' | 'rechazada_autoreferido'
  motivoAtribucionManual?: string
  autorAdmin?: string
  fechaAdquisicion?: string
  fechaFinGarantia?: string
  creadoEn: string
}

export interface LiquidacionReferido {
  id: string
  afiliadoId: string
  afiliadoNombre?: string
  montoTotal: number
  estado: 'solicitada' | 'en_proceso' | 'pagada' | 'rechazada'
  metodoPagoUtilizado?: string
  referenciaBancaria?: string
  comprobanteUrl?: string
  notas?: string
  pagadoEn: string
  creadoEn: string
}
