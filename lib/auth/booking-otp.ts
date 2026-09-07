import crypto from 'crypto'

/**
 * Obtiene la llave secreta para firma HMAC de tokens OTP de agendamiento.
 * Utiliza una clave de entorno dedicada o deriva una clave segura del servidor.
 */
function getOtpSecret(): string {
  return (
    process.env.BOOKING_OTP_SECRET ||
    process.env.CHECK_DOMAIN_SECRET ||
    process.env.GMAIL_CLIENT_SECRET ||
    'smartcontacts-secure-booking-otp-key-2026'
  )
}

export interface BookingOtpPayload {
  email: string
  code: string
  otpToken: string
  expiresAt: number
}

/**
 * Genera un código OTP de 6 dígitos numéricos y un token firmado criptográficamente con HMAC-SHA256.
 * El token tiene una validez de 10 minutos.
 */
export function generateBookingOtp(email: string): { code: string; otpToken: string; expiresAt: number } {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Generar código de 6 dígitos numéricos criptográficamente seguro
  const randomNum = crypto.randomInt(100000, 1000000)
  const code = randomNum.toString()
  
  // Expiración a los 10 minutos
  const expiresAt = Date.now() + 10 * 60 * 1000
  
  // Hash del código combinado con el email y la fecha de expiración
  const secret = getOtpSecret()
  const payloadToSign = `${normalizedEmail}:${code}:${expiresAt}`
  const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex')
  
  // Construir token base64URL: base64(email:expiresAt:signature)
  const tokenData = JSON.stringify({ email: normalizedEmail, expiresAt, signature })
  const otpToken = Buffer.from(tokenData, 'utf-8').toString('base64url')
  
  return { code, otpToken, expiresAt }
}

/**
 * Verifica un código OTP ingresado por el usuario contra el token firmado.
 */
export function verifyBookingOtp(
  email: string,
  inputCode: string,
  otpToken: string
): { valid: boolean; reason?: string } {
  if (!email || !inputCode || !otpToken) {
    return { valid: false, reason: 'El código de verificación y el token son obligatorios.' }
  }

  try {
    const rawData = Buffer.from(otpToken, 'base64url').toString('utf-8')
    const parsed = JSON.parse(rawData)

    const { email: tokenEmail, expiresAt, signature } = parsed

    if (!tokenEmail || !expiresAt || !signature) {
      return { valid: false, reason: 'El token de verificación es inválido o está corrupto.' }
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (normalizedEmail !== tokenEmail) {
      return { valid: false, reason: 'El correo electrónico no coincide con el código de verificación solicitado.' }
    }

    if (Date.now() > expiresAt) {
      return { valid: false, reason: 'El código de verificación ha expirado (validez de 10 minutos). Solicita uno nuevo.' }
    }

    const cleanInputCode = inputCode.trim()
    const secret = getOtpSecret()
    const expectedPayload = `${normalizedEmail}:${cleanInputCode}:${expiresAt}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(expectedPayload).digest('hex')

    // Comparación segura en tiempo constante para prevenir timing attacks
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedSigBuffer = Buffer.from(expectedSignature, 'hex')

    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return { valid: false, reason: 'El código ingresado es incorrecto. Por favor verifica los 6 dígitos recibidos en tu correo.' }
    }

    return { valid: true }
  } catch (err) {
    return { valid: false, reason: 'Error validando el código de seguridad.' }
  }
}
