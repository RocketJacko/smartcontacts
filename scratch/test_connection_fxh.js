const https = require('https');

async function testConnection() {
  const url = 'https://fxhemyrjetpwtmjxmftk.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs';

  console.log('=== VERIFICACIÓN DE CONEXIÓN CON SUPABASE fxhemyrjetpwtmjxmftk ===');
  
  // 1. Ping endpoint
  const t0 = Date.now();
  const resPing = await fetch(url + '/rest/v1/', {
    headers: { 'apikey': anonKey }
  });
  const msPing = Date.now() - t0;
  console.log('[1] API REST Ping:', resPing.status, `(${msPing} ms)`);

  // 2. Consulta de dominios
  const testDomains = ['yopmail.com', 'mailinator.com', 'tempmail.com', 'google.com', 'pascualbravo.edu.co'];
  console.log('\n[2] Consultando dominios de prueba:');
  for (const d of testDomains) {
    const tStart = Date.now();
    const res = await fetch(url + '/rest/v1/blocked_domains?domain=eq.' + encodeURIComponent(d) + '&select=domain,reason', {
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey
      }
    });
    const data = await res.json();
    const elapsed = Date.now() - tStart;
    const isBlocked = Array.isArray(data) && data.length > 0;
    console.log(`  - ${d}: ${isBlocked ? '🔴 BLOQUEADO (' + data[0].reason + ')' : '🟢 PERMITIDO / NO BLOQUEADO'} [${elapsed} ms]`);
  }

  // 3. Conteo total de dominios
  console.log('\n[3] Conteo de registros en public.blocked_domains:');
  const resCount = await fetch(url + '/rest/v1/blocked_domains?select=count', {
    headers: {
      'apikey': anonKey,
      'Authorization': 'Bearer ' + anonKey,
      'Range-Unit': 'items',
      'Prefer': 'count=exact'
    }
  });
  const total = resCount.headers.get('content-range');
  console.log(`  - Status: ${resCount.status}`);
  console.log(`  - Total dominios cargados en BD: ${total ? total.split('/')[1] : 'Desconocido'} dominios`);

  // 4. Ver otras tablas disponibles en public
  console.log('\n[4] Consultando qué otras tablas responden en public:');
  const tablesToCheck = ['blocked_domains', 'prospectos', 'eventos', 'disponibilidad', 'afiliados'];
  for (const t of tablesToCheck) {
    const res = await fetch(url + '/rest/v1/' + t + '?limit=1', {
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey
      }
    });
    console.log(`  - Tabla ${t}: Status ${res.status} (${res.ok ? 'Existe y accesible' : 'No accesible / no existe'})`);
  }
}

testConnection().catch(console.error);
