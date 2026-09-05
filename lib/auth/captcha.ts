import crypto from 'crypto'

const CAPTCHA_SECRET = process.env.CHECK_DOMAIN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'smartcontacts-captcha-secret-salt-2026'
const CAPTCHA_EXPIRATION_MS = 2 * 60 * 1000 // 2 minutos

export interface CaptchaChallenge {
  token: string
  svg: string
  questionText: string
}

/**
 * Genera un desafío visual SVG con distorsión y un token firmado criptográficamente.
 * No requiere servicios externos (Google reCAPTCHA o Cloudflare).
 */
export function generateCaptcha(): CaptchaChallenge {
  const num1 = Math.floor(Math.random() * 8) + 2 // 2 a 9
  const num2 = Math.floor(Math.random() * 8) + 1 // 1 a 8
  const operations = ['+', '-']
  const op = operations[Math.floor(Math.random() * operations.length)]

  let answer: number
  let text = ''

  if (op === '+') {
    answer = num1 + num2
    text = `${num1} + ${num2} = ?`
  } else {
    // Asegurar que el resultado sea positivo
    const max = Math.max(num1, num2)
    const min = Math.min(num1, num2)
    answer = max - min
    text = `${max} - ${min} = ?`
  }

  const timestamp = Date.now()
  const payload = `${answer}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex')

  const token = Buffer.from(`${payload}:${signature}`).toString('base64')

  // Generar SVG con líneas de distorsión y ruido visual anti-OCR
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="38" viewBox="0 0 120 38" style="background:#F5F4F0; border-radius:8px;">
      <defs>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>
      <!-- Líneas de interferencia -->
      <line x1="5" y1="${Math.floor(Math.random() * 30)}" x2="115" y2="${Math.floor(Math.random() * 30)}" stroke="#000000" stroke-width="0.8" opacity="0.25" />
      <line x1="5" y1="${Math.floor(Math.random() * 30)}" x2="115" y2="${Math.floor(Math.random() * 30)}" stroke="#000000" stroke-width="0.6" opacity="0.2" />
      <circle cx="${Math.floor(Math.random() * 100)}" cy="${Math.floor(Math.random() * 30)}" r="1.5" fill="#000000" opacity="0.3" />
      <circle cx="${Math.floor(Math.random() * 100)}" cy="${Math.floor(Math.random() * 30)}" r="1.2" fill="#000000" opacity="0.3" />
      <!-- Texto del desafío matemático -->
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="16" font-weight="bold" fill="#111111" letter-spacing="2" filter="url(#noise)">
        ${text}
      </text>
    </svg>
  `.trim()

  return {
    token,
    svg,
    questionText: text,
  }
}

/**
 * Valida si la respuesta del usuario coincide con el token criptográfico
 * y si se encuentra dentro de la ventana de tiempo de 2 minutos.
 */
export function verifyCaptcha(token: string, userAnswer: string | number): { valid: boolean; reason?: string } {
  if (!token || userAnswer === undefined || userAnswer === null || String(userAnswer).trim() === '') {
    return { valid: false, reason: 'Por favor resuelve el captcha de seguridad.' }
  }

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    const parts = decoded.split(':')

    if (parts.length !== 3) {
      return { valid: false, reason: 'Token de captcha corrupto o inválido.' }
    }

    const [expectedAnswerStr, timestampStr, providedSignature] = parts
    const timestamp = parseInt(timestampStr, 10)

    // 1. Validar ventana de tiempo (máximo 2 minutos)
    if (isNaN(timestamp) || Date.now() - timestamp > CAPTCHA_EXPIRATION_MS) {
      return { valid: false, reason: 'El captcha ha expirado. Por favor solicita uno nuevo.' }
    }

    // 2. Validar firma criptográfica HMAC (evita que el usuario altere el expectedAnswer)
    const expectedPayload = `${expectedAnswerStr}:${timestampStr}`
    const calculatedSignature = crypto
      .createHmac('sha256', CAPTCHA_SECRET)
      .update(expectedPayload)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(calculatedSignature))) {
      return { valid: false, reason: 'Firma de seguridad de captcha alterada.' }
    }

    // 3. Comparar respuesta del usuario
    const cleanUserAnswer = String(userAnswer).trim()
    if (cleanUserAnswer !== expectedAnswerStr) {
      return { valid: false, reason: 'Respuesta de captcha incorrecta. Inténtalo de nuevo.' }
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: 'Error procesando la verificación del captcha.' }
  }
}
