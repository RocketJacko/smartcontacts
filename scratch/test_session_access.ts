import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSessionAccess() {
  console.log('--- TEST: Acceso a sesión autenticada y dashboard ---');
  
  // 1. Iniciar sesión como super_admin
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'jesus.carmona966@pascualbravo.edu.co',
      password: 'SuperAdmin2026!#Seguro',
    }),
  });

  const cookiesHeader = loginRes.headers.get('set-cookie') || '';
  console.log('Set-Cookie recibido del login:', cookiesHeader ? 'Presente (Tokens Supabase)' : 'Vacio');

  // Convertir set-cookie en Cookie header
  const cookieString = cookiesHeader.split(',').map(c => c.split(';')[0].trim()).join('; ');

  // 2. Probar /api/auth/session con cookies
  const sessionRes = await fetch('http://localhost:3000/api/auth/session', {
    headers: { Cookie: cookieString },
  });
  const sessionData = await sessionRes.json();
  console.log('Respuesta /api/auth/session con cookie:', sessionData);

  // 3. Probar /dashboard con cookie (debe responder 200 y no redirigir)
  const dashboardRes = await fetch('http://localhost:3000/dashboard', {
    headers: { Cookie: cookieString },
    redirect: 'manual',
  });
  console.log('Status /dashboard con usuario autenticado (esperado: 200):', dashboardRes.status);
}

testSessionAccess().catch(console.error);
