async function inspectDatabase() {
  const url = 'https://fxhemyrjetpwtmjxmftk.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs';

  const schemas = ['public', 'calendario', 'cobertura', 'referidos', 'dominios', 'emailmarketing'];
  const candidates = [
    'blocked_domains', 'departamentos', 'cobertura', 'prospectos', 'eventos', 'disponibilidad',
    'participantes', 'excepciones', 'calendarios', 'permisos', 'afiliados', 'datos_pago',
    'enlaces', 'atribuciones', 'conversiones', 'liquidaciones', 'contactos', 'directorios',
    'campanas', 'campana_contactos', 'campana_asuntos', 'campana_cuerpos', 'envios', 'plantillas_predeterminadas'
  ];

  console.log('=== ESCUDRIÑANDO TABLAS EN fxhemyrjetpwtmjxmftk ===');
  
  for (const s of schemas) {
    for (const table of candidates) {
      try {
        const res = await fetch(url + '/rest/v1/' + table + '?limit=1', {
          headers: {
            'apikey': anonKey,
            'Authorization': 'Bearer ' + anonKey,
            'Accept-Profile': s
          }
        });
        if (res.status === 200 || res.status === 206) {
          const data = await res.json();
          const cols = data.length > 0 ? Object.keys(data[0]).join(', ') : 'Tabla vacía';
          console.log(`[EXISTE LECTURA PUBLICA] ${s}.${table} (HTTP ${res.status}) -> Columnas: ${cols}`);
        } else if (res.status === 401 || res.status === 403) {
          console.log(`[EXISTE CON RLS RESTRINGIDO] ${s}.${table} (HTTP ${res.status}: Requiere service_role o authenticated)`);
        }
      } catch (e) {}
    }
  }

  // Comprobar RPCs conocidas
  console.log('\n=== PROCEDIMIENTOS ALMACENADOS (RPC) ===');
  const rpcs = [
    { name: 'obtener_cobertura', body: {} },
    { name: 'obtener_disponibilidad', body: { p_fecha: '2026-09-08' } },
    { name: 'crear_agendamiento', body: {} },
    { name: 'registrar_clic', body: {} },
    { name: 'vincular_prospecto_agendado', body: {} },
    { name: 'crear_afiliado_con_enlace', body: {} }
  ];

  for (const r of rpcs) {
    const res = await fetch(url + '/rest/v1/rpc/' + r.name, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(r.body)
    });
    console.log(`RPC public.${r.name} -> Status: ${res.status} (${res.status !== 404 ? 'EXISTE' : 'NO EXISTE'})`);
  }
}

inspectDatabase().catch(console.error);
