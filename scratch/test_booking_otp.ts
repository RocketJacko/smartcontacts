import { generateBookingOtp, verifyBookingOtp } from '../lib/auth/booking-otp'

console.log('🧪 Iniciando prueba de verificación OTP para agendamiento...')

const testEmail = 'prospecto.test@empresa.com'
const { code, otpToken, expiresAt } = generateBookingOtp(testEmail)

console.log(`✓ OTP generado: ${code} (6 dígitos numéricos)`)
console.log(`✓ Token firmado (base64url): ${otpToken.substring(0, 30)}...`)
console.log(`✓ Expira en: ${new Date(expiresAt).toISOString()}`)

// 1. Verificación exitosa
const validCheck = verifyBookingOtp(testEmail, code, otpToken)
console.log('Test 1 (Código válido):', validCheck.valid ? 'PASÓ ✅' : 'FALLÓ ❌', validCheck.reason || '')

// 2. Verificación código incorrecto
const wrongCodeCheck = verifyBookingOtp(testEmail, '999999', otpToken)
console.log('Test 2 (Código incorrecto):', !wrongCodeCheck.valid ? 'PASÓ ✅' : 'FALLÓ ❌', wrongCodeCheck.reason)

// 3. Verificación email alterado
const wrongEmailCheck = verifyBookingOtp('otro@empresa.com', code, otpToken)
console.log('Test 3 (Email modificado):', !wrongEmailCheck.valid ? 'PASÓ ✅' : 'FALLÓ ❌', wrongEmailCheck.reason)

if (validCheck.valid && !wrongCodeCheck.valid && !wrongEmailCheck.valid) {
  console.log('🎉 Todas las pruebas criptográficas de OTP fueron superadas al 100%.')
} else {
  console.error('❌ Error en pruebas de OTP')
  process.exit(1)
}
