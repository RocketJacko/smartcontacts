import crypto from 'crypto'

export interface JwtPayload {
  serviceId: string
  serviceName: string
  email: string
  nombre?: string
  telefono?: string
  iat?: number
  exp?: number
  jti?: string
  [key: string]: any
}

/**
 * Función nativa para generar un JSON Web Token (JWT) firmado con algoritmo HS256.
 * Incluye timestamp de emisión (iat), expiración efímera (exp) y UUID (jti).
 */
export function generateServiceRequestToken(
  payload: {
    serviceId: string
    serviceName: string
    email: string
    nombre?: string
    telefono?: string
    [key: string]: any
  },
  expiresInSeconds: number = 300
): string {
  const secret = process.env.CHECK_DOMAIN_SECRET || 'smartcontacts_service_activation_secret_2026'

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JwtPayload = {
    ...payload,
    serviceId: payload.serviceId,
    serviceName: payload.serviceName,
    email: payload.email,
    nombre: payload.nombre,
    telefono: payload.telefono,
    iat: now,
    exp: now + expiresInSeconds,
    jti: crypto.randomUUID(),
  }

  const base64UrlEncode = (str: string): string => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const tokenContent = `${encodedHeader}.${encodedPayload}`

  const signature = crypto
    .createHmac('sha256', secret)
    .update(tokenContent)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${tokenContent}.${signature}`
}
