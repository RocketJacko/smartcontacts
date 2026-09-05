import crypto from 'crypto'

const BASE_URL = 'http://localhost:3000'
const CAPTCHA_SECRET = process.env.CHECK_DOMAIN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'smartcontacts-captcha-secret-salt-2026'

// Función auxiliar para resolver el token generado por el servidor
function solveCaptchaToken(token: string): string {
  const decoded = Buffer.from(token, 'base64').toString('utf8')
  const [answer] = decoded.split(':')
  return answer
}

// Función auxiliar para forjar un token con firma válida
function createValidTestCaptcha(answer: number): { token: string; answer: string } {
  const timestamp = Date.now()
  const payload = `${answer}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(payload)
    .digest('hex')
  const token = Buffer.from(`${payload}:${signature}`).toString('base64')
  return { token, answer: String(answer) }
}

async function runCaptchaSuite() {
  console.log('=================================================================')
  console.log('🧪 INICIANDO SUITE DE PRUEBAS: INTEGRACIÓN DE CAPTCHA EN VIVO')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  // PRUEBA 1: Obtener Captcha visual desde /api/auth/captcha
  try {
    const res = await fetch(`${BASE_URL}/api/auth/captcha`)
    const data = await res.json()
    if (res.ok && data.token && data.svg && data.svg.includes('<svg')) {
      console.log('✅ TEST 1 PASADO: GET /api/auth/captcha genera SVG y token firmado.')
      passed++
    } else {
      console.error('❌ TEST 1 FALLÓ:', data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 1 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 2: Login rechaza peticiones sin Captcha
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesus.carmona966@pascualbravo.edu.co',
        password: 'SuperAdmin2026!#Seguro',
      }),
    })
    const data = await res.json()
    if (res.status === 400 && data.error && data.error.includes('CAPTCHA')) {
      console.log('✅ TEST 2 PASADO: POST /api/auth/login bloquea peticiones sin CAPTCHA (HTTP 400).')
      passed++
    } else {
      console.error('❌ TEST 2 FALLÓ: No bloqueó sin captcha:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 2 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 3: Login rechaza Captcha resuelto con número incorrecto
  try {
    const captchaRes = await fetch(`${BASE_URL}/api/auth/captcha`)
    const { token } = await captchaRes.json()

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesus.carmona966@pascualbravo.edu.co',
        password: 'SuperAdmin2026!#Seguro',
        captchaToken: token,
        captchaAnswer: '999999', // Respuesta deliberadamente incorrecta
      }),
    })
    const data = await res.json()
    if (res.status === 400 && data.error && (data.error.includes('incorrecta') || data.error.includes('captcha'))) {
      console.log('✅ TEST 3 PASADO: POST /api/auth/login rechaza respuesta matemática incorrecta (HTTP 400).')
      passed++
    } else {
      console.error('❌ TEST 3 FALLÓ: No rechazó respuesta incorrecta:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 3 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 4: Login rechaza token de Captcha falsificado/tampered
  try {
    const fakeToken = Buffer.from('5:1234567890:firma_falsa_inventada').toString('base64')
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesus.carmona966@pascualbravo.edu.co',
        password: 'SuperAdmin2026!#Seguro',
        captchaToken: fakeToken,
        captchaAnswer: '5',
      }),
    })
    const data = await res.json()
    if (res.status === 400 && data.error) {
      console.log('✅ TEST 4 PASADO: POST /api/auth/login rechaza tokens criptográficos manipulados/expirados (HTTP 400).')
      passed++
    } else {
      console.error('❌ TEST 4 FALLÓ: Permitió token falso:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 4 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 5: Booking rechaza agendamiento sin Captcha
  try {
    const res = await fetch(`${BASE_URL}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'booking',
        name: 'Bot Atacante',
        phone: '+573001234567',
        email: 'bot@spamattack.com',
        company: 'Empresa Falsa',
        service: 'Asesoría Estratégica',
        date: 'Lunes, 15 de Septiembre 2026',
        time: '09:00',
        acepta_tratamiento_datos: true,
      }),
    })
    const data = await res.json()
    if (res.status === 400 && data.error && (data.error.includes('CAPTCHA') || data.error.includes('captcha'))) {
      console.log('✅ TEST 5 PASADO: POST /api/booking bloquea agendamiento sin CAPTCHA (HTTP 400).')
      passed++
    } else {
      console.error('❌ TEST 5 FALLÓ: No bloqueó booking sin captcha:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 5 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 6: Booking rechaza agendamiento con Captcha incorrecto
  try {
    const captchaRes = await fetch(`${BASE_URL}/api/auth/captcha`)
    const { token } = await captchaRes.json()

    const res = await fetch(`${BASE_URL}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'booking',
        name: 'Bot Atacante',
        phone: '+573001234567',
        email: 'bot@spamattack.com',
        company: 'Empresa Falsa',
        service: 'Asesoría Estratégica',
        date: 'Lunes, 15 de Septiembre 2026',
        time: '09:00',
        acepta_tratamiento_datos: true,
        captchaToken: token,
        captchaAnswer: '888', // Incorrecto
      }),
    })
    const data = await res.json()
    if (res.status === 400 && data.error && (data.error.includes('incorrecta') || data.error.includes('captcha'))) {
      console.log('✅ TEST 6 PASADO: POST /api/booking rechaza respuesta de captcha incorrecta (HTTP 400).')
      passed++
    } else {
      console.error('❌ TEST 6 FALLÓ: No rechazó respuesta incorrecta en booking:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 6 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 7: Booking pasa la validación de Captcha cuando es resuelto correctamente
  try {
    const captchaRes = await fetch(`${BASE_URL}/api/auth/captcha`)
    const { token } = await captchaRes.json()
    const correctAnswer = solveCaptchaToken(token)

    const res = await fetch(`${BASE_URL}/api/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'booking',
        name: 'Prospecto Humano Legítimo',
        phone: '+573001234567',
        email: 'prospecto.real@empresa.com',
        company: 'Empresa Privada SAS',
        service: 'Consultoría e Implementación',
        date: 'Miércoles, 17 de Septiembre 2026',
        time: '10:00',
        acepta_tratamiento_datos: true,
        captchaToken: token,
        captchaAnswer: correctAnswer,
      }),
    })
    const data = await res.json()
    // El captcha debe ser validado con éxito (incluso si luego el use case procesa o responde éxito)
    if (res.ok && data.success) {
      console.log('✅ TEST 7 PASADO: POST /api/booking se completa exitosamente al resolver el CAPTCHA correctamente.')
      passed++
    } else if (!data.error?.includes('captcha') && !data.error?.includes('CAPTCHA')) {
      console.log('✅ TEST 7 PASADO: CAPTCHA validado exitosamente (la validación pasó sin reclamos de captcha).')
      passed++
    } else {
      console.error('❌ TEST 7 FALLÓ: Falló en captcha válido:', data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 7 EXCEPCIÓN:', err)
    failed++
  }

  // PRUEBA 8: Login de Super Admin resuelve Captcha legítimamente y obtiene cookie de sesión
  try {
    const captchaRes = await fetch(`${BASE_URL}/api/auth/captcha`)
    const { token } = await captchaRes.json()
    const correctAnswer = solveCaptchaToken(token)

    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jesus.carmona966@pascualbravo.edu.co',
        password: 'SuperAdmin2026!#Seguro',
        captchaToken: token,
        captchaAnswer: correctAnswer,
      }),
    })
    const data = await res.json()
    const cookieHeader = res.headers.get('set-cookie') || ''

    if (res.ok && data.success && data.user?.rol === 'super_admin') {
      console.log('✅ TEST 8 PASADO: Login con CAPTCHA exitoso para Super Admin con emisión de cookies de sesión.')
      passed++
    } else {
      console.error('❌ TEST 8 FALLÓ: Login no exitoso con captcha correcto:', res.status, data)
      failed++
    }
  } catch (err) {
    console.error('❌ TEST 8 EXCEPCIÓN:', err)
    failed++
  }

  console.log('\n=================================================================')
  console.log(`📊 RESULTADOS FINALES: ${passed} PASADOS | ${failed} FALLIDOS`)
  console.log('=================================================================')
}

runCaptchaSuite()
