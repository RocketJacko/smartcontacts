export interface ServiceField {
  id: string
  label: string
  type: 'text' | 'tel' | 'email' | 'file'
  required: boolean
  placeholder?: string
  accept?: string
  maxSizeMB?: number
  errorMessage?: string
}

export interface ServiceItem {
  id: string
  name: string
  slug: string
  tag: string
  description: string
  badge?: string
  iconName: 'GraduationCap' | 'Globe' | 'Sparkles' | 'Layers'
  fields: ServiceField[]
}

/**
 * URL del Webhook para el envío de solicitudes de servicios.
 * Actualmente configurado con el webhook de pruebas n8n.
 */
export const SERVICES_WEBHOOK_URL = 'https://ventusn8n.smartcontacts.cloud/webhook-test/0b674181-4ea8-4bfa-adcc-d00135ae6ba5'

/**
 * Configuración dinámica de servicios disponibles.
 * Para agregar un nuevo servicio en el futuro, solo añade un nuevo objeto a este array.
 */
export const SERVICES_CONFIG: ServiceItem[] = [
  {
    id: 'platzi',
    name: 'Platzi',
    slug: 'platzi',
    tag: 'Plataforma Educativa B2B',
    description: 'Solicita la activación de cuentas o licencias para Platzi enviando tus datos y el comprobante de pago.',
    badge: 'Requiere Comprobante',
    iconName: 'GraduationCap',
    fields: [
      {
        id: 'nombre',
        label: 'Nombre completo',
        type: 'text',
        required: true,
        placeholder: 'Ej. Juan Pérez',
        errorMessage: 'El nombre completo es obligatorio (mínimo 2 caracteres)',
      },
      {
        id: 'telefono',
        label: 'Número de contacto móvil',
        type: 'tel',
        required: true,
        placeholder: 'Ej. +57 300 123 4567',
        errorMessage: 'Ingresa un número de celular válido (mínimo 7 dígitos)',
      },
      {
        id: 'email',
        label: 'Correo electrónico',
        type: 'email',
        required: true,
        placeholder: 'ejemplo@empresa.com',
        errorMessage: 'Ingresa un correo electrónico válido',
      },
      {
        id: 'comprobante',
        label: 'Comprobante de pago (Desprendible)',
        type: 'file',
        required: true,
        accept: 'image/jpeg,image/png,image/webp,application/pdf',
        maxSizeMB: 5,
        errorMessage: 'Debes adjuntar el comprobante de pago (Imagen o PDF, máximo 5MB)',
      },
    ],
  },
]
