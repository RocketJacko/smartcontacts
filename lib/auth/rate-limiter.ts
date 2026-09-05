/**
 * Rate Limiter en memoria para prevenir ataques de fuerza bruta y credential stuffing.
 * Almacena intentos fallidos por IP y por correo electrónico.
 */

interface AttemptRecord {
  count: number
  firstAttempt: number
  blockedUntil?: number
}

const attemptsByIp = new Map<string, AttemptRecord>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutos de bloqueo

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = attemptsByIp.get(ip)

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Verificar si está actualmente bloqueado
  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000)
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
  }

  // Si la ventana expiró, reiniciar el conteo
  if (now - record.firstAttempt > WINDOW_MS) {
    attemptsByIp.delete(ip)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Si ha alcanzado el límite
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000)
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds }
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count }
}

export function recordFailedAttempt(ip: string): { remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now()
  const record = attemptsByIp.get(ip)

  if (!record || (now - record.firstAttempt > WINDOW_MS)) {
    attemptsByIp.set(ip, { count: 1, firstAttempt: now })
    return { remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  record.count += 1
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
    return { remainingAttempts: 0, retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000) }
  }

  return { remainingAttempts: MAX_ATTEMPTS - record.count }
}

export function recordSuccessfulAttempt(ip: string): void {
  attemptsByIp.delete(ip)
}
