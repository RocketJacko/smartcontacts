import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: '.env.local' });

const CAPTCHA_SECRET = process.env.CHECK_DOMAIN_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'smartcontacts-captcha-secret-salt-2026';

function generateValidCaptcha(): { token: string; answer: string } {
  const answer = 7;
  const timestamp = Date.now();
  const payload = `${answer}:${timestamp}`;
  const signature = crypto.createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex');
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return { token, answer: String(answer) };
}

async function runSecuritySuite() {
  console.log('================================================================');
  console.log(' SUITE DE PRUEBAS DE SEGURIDAD, RBAC, RATE LIMITING Y RLS');
  console.log(' Servidor activo en: http://localhost:3000');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(` [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 1: PROTECCIÓN DE RUTAS EN MIDDLEWARE (USUARIO NO AUTENTICADO)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST 1: Blindaje de Rutas en Middleware ---');

  // 1.1 Acceso no autenticado a /dashboard
  const resDashboard = await fetch('http://localhost:3000/dashboard', {
    redirect: 'manual',
  });
  assert(
    resDashboard.status === 307 || resDashboard.status === 302,
    'Acceso sin sesión a /dashboard es interceptado con redirección 307',
    `Status recibido: ${resDashboard.status}`
  );
  const locDashboard = resDashboard.headers.get('location') || '';
  assert(
    locDashboard.includes('/login?redirect=%2Fdashboard') || locDashboard.includes('/login?redirect=/dashboard'),
    'Redirección apunta a /login con redirect=/dashboard',
    `Location: ${locDashboard}`
  );

  // 1.2 Acceso no autenticado a /referidos
  const resReferidos = await fetch('http://localhost:3000/referidos', {
    redirect: 'manual',
  });
  assert(
    resReferidos.status === 307 || resReferidos.status === 302,
    'Acceso sin sesión a /referidos es interceptado con redirección 307',
    `Status recibido: ${resReferidos.status}`
  );

  // 1.3 Acceso no autenticado a APIs privadas (/api/dashboard/metrics)
  const resApi = await fetch('http://localhost:3000/api/dashboard/metrics');
  assert(
    resApi.status === 401,
    'Llamada API privada sin sesión devuelve HTTP 401 Unauthorized',
    `Status recibido: ${resApi.status}`
  );

  // 1.4 Cabeceras de Seguridad HTTP (Security Headers)
  const resPublic = await fetch('http://localhost:3000/');
  assert(
    resPublic.headers.get('x-frame-options') === 'DENY',
    'Cabecera X-Frame-Options: DENY activa (Protección Anti-Clickjacking)'
  );
  assert(
    resPublic.headers.get('x-content-type-options') === 'nosniff',
    'Cabecera X-Content-Type-Options: nosniff activa (Protección Anti-MIME sniffing)'
  );
  assert(
    resPublic.headers.get('x-xss-protection') === '1; mode=block',
    'Cabecera X-XSS-Protection activa'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 2: RATE LIMITING CONTRA FUERZA BRUTA (POST /api/auth/login)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2: Mitigación de Fuerza Bruta (Rate Limiting) ---');
  const testIp = `10.200.50.${Math.floor(Math.random() * 200) + 10}`; // IP única y aislada para cada corrida

  for (let i = 1; i <= 5; i++) {
    const c = generateValidCaptcha();
    const fakeRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': testIp,
      },
      body: JSON.stringify({
        email: 'usuario.inexistente@empresa.com',
        password: 'PasswordErronea123!',
        captchaToken: c.token,
        captchaAnswer: c.answer,
      }),
    });
    const fakeData = await fakeRes.json();
    if (i < 5) {
      assert(
        fakeRes.status === 401,
        `Intento fallido ${i}/5 devuelve HTTP 401 con aviso de intentos restantes`,
        `Status: ${fakeRes.status}, Error: ${fakeData.error}`
      );
    }
  }

  // El 6to intento debe bloquearse inmediatamente con HTTP 429
  const c6 = generateValidCaptcha();
  const blockedRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': testIp,
    },
    body: JSON.stringify({
      email: 'usuario.inexistente@empresa.com',
      password: 'PasswordErronea123!',
      captchaToken: c6.token,
      captchaAnswer: c6.answer,
    }),
  });
  const blockedData = await blockedRes.json();
  assert(
    blockedRes.status === 429,
    'Sexto intento consecutivo devuelve HTTP 429 Too Many Requests (Rate Limit activado)',
    `Status: ${blockedRes.status}`
  );
  assert(
    blockedData.error && blockedData.error.includes('bloqueado temporalmente'),
    'Mensaje explícito de bloqueo de seguridad presente',
    blockedData.error
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 3: RECHAZO DE DOMINIOS DESECHABLES EN REGISTRO
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3: Rechazo de Dominios Desechables en Registro ---');
  const regSpamRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Spammer Bot',
      email: 'bot@mailinator.com',
      password: 'PasswordFuerte123!',
    }),
  });
  const regSpamData = await regSpamRes.json();
  assert(
    regSpamRes.status === 400 && regSpamData.error.includes('no está permitido'),
    'Registro con dominio temporal (mailinator.com) rechazado de inmediato con HTTP 400',
    regSpamData.error
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 4: REGISTRO REAL DE SUPER ADMIN (jesus.carmona966@pascualbravo.edu.co)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4: Aprovisionamiento de Super Admin en Supabase ---');
  const superAdminEmail = 'jesus.carmona966@pascualbravo.edu.co';
  const superAdminPass = 'SuperAdmin2026!#Seguro';

  const regAdminRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Jesús Alexis Carmona',
      email: superAdminEmail,
      password: superAdminPass,
    }),
  });
  const regAdminData = await regAdminRes.json();
  // Puede ser 201 (creado) o 400 si ya existe en Supabase
  const isCreatedOrExists = regAdminRes.status === 201 || (regAdminData.error && regAdminData.error.includes('already registered'));
  assert(
    isCreatedOrExists,
    'Registro de super_admin procesado correctamente en Supabase Auth',
    JSON.stringify(regAdminData)
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 5: LOGIN DEL SUPER ADMIN Y VERIFICACIÓN DE SESIÓN Y ROL
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5: Login del Super Admin y Verificación de Rol ---');
  const cAdmin = generateValidCaptcha();
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: superAdminEmail,
      password: superAdminPass,
      captchaToken: cAdmin.token,
      captchaAnswer: cAdmin.answer,
    }),
  });
  const loginData = await loginRes.json();
  assert(
    loginRes.status === 200 && loginData.success === true,
    'Login de super_admin exitoso con HTTP 200',
    JSON.stringify(loginData)
  );
  assert(
    loginData.user && loginData.user.rol === 'super_admin',
    'Rol asignado verificado: super_admin',
    `Rol recibido: ${loginData.user?.rol}`
  );

  // Extraer las cookies de sesión (sb-*-auth-token)
  const setCookieHeader = loginRes.headers.get('set-cookie') || '';
  assert(
    setCookieHeader.includes('auth-token') || setCookieHeader.includes('sb-'),
    'Cookies de sesión HTTP inyectadas en la respuesta de autenticación'
  );

  console.log('\n================================================================');
  console.log(` RESULTADOS FINALES: ${passed} PASADOS, ${failed} FALLIDOS`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error('Error fatal en suite de pruebas:', err);
  process.exit(1);
});
