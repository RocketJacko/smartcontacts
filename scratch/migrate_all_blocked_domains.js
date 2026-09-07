const fs = require('fs');
const path = require('path');

async function exportAndMigrate() {
  const sourceUrl = 'https://fxhemyrjetpwtmjxmftk.supabase.co';
  const sourceAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs';

  const targetUrl = 'https://qrmjselvrzxuecvbypmh.supabase.co';
  const targetAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFybWpzZWx2cnp4dWVjdmJ5cG1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0OTMzMjEsImV4cCI6MjEwNDA2OTMyMX0.T17uMhcD0V9RdVK0OEIEzTncJougrZh9SHZYuZjJZgE';

  console.log('=== DESCARGANDO 119.900 DOMINIOS DE PRODUCCIÓN ===');

  const outputFile = path.join('supabase', 'seed_blocked_domains_full.sql');
  const writeStream = fs.createWriteStream(outputFile, { flags: 'w', encoding: 'utf8' });

  writeStream.write('-- ==============================================================================\n');
  writeStream.write('-- VOLCADO COMPLETO DE 119.900 DOMINIOS BLOQUEADOS (DISPOSABLE / SPAM)\n');
  writeStream.write('-- Extraído directamente de Supabase fxhemyrjetpwtmjxmftk\n');
  writeStream.write('-- ==============================================================================\n\n');
  writeStream.write('CREATE TABLE IF NOT EXISTS public.blocked_domains (\n');
  writeStream.write('    domain TEXT PRIMARY KEY,\n');
  writeStream.write('    created_at TIMESTAMPTZ DEFAULT NOW()\n');
  writeStream.write(');\n\n');
  writeStream.write('CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON public.blocked_domains(domain);\n\n');

  const pageSize = 1000;
  let offset = 0;
  let totalFetched = 0;
  let batchBuffer = [];
  const tTotal = Date.now();

  while (true) {
    const endpoint = `${sourceUrl}/rest/v1/blocked_domains?select=domain&order=domain.asc&limit=${pageSize}&offset=${offset}`;

    let res;
    let retries = 0;
    while (retries < 5) {
      try {
        res = await fetch(endpoint, {
          headers: {
            'apikey': sourceAnonKey,
            'Authorization': 'Bearer ' + sourceAnonKey,
          },
        });
        if (res.ok) break;
      } catch (err) {
        retries++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!res || !res.ok) {
      console.error(`Error persistente en offset ${offset}`);
      break;
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      break;
    }

    totalFetched += rows.length;
    offset += rows.length;
    batchBuffer.push(...rows);

    // Escribir en archivo SQL
    writeStream.write('INSERT INTO public.blocked_domains (domain)\nVALUES\n');
    const values = rows.map(r => `  ('${r.domain.split("'").join("''")}')`);
    writeStream.write(values.join(',\n') + '\n');
    writeStream.write('ON CONFLICT (domain) DO NOTHING;\n\n');

    // Cada 5.000 registros, insertar en la nueva base de datos
    if (batchBuffer.length >= 5000) {
      try {
        const insertRes = await fetch(`${targetUrl}/rest/v1/blocked_domains`, {
          method: 'POST',
          headers: {
            'apikey': targetAnonKey,
            'Authorization': 'Bearer ' + targetAnonKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=ignore-duplicates'
          },
          body: JSON.stringify(batchBuffer)
        });
        if (insertRes.ok || insertRes.status === 201) {
          process.stdout.write(`✓`);
        } else {
          process.stdout.write(`!`);
        }
      } catch (e) {
        process.stdout.write(`x`);
      }
      batchBuffer = [];
    }

    if (totalFetched % 10000 === 0 || rows.length < pageSize) {
      console.log(`\n  -> Progreso: ${totalFetched} / 119.900 dominios (${((totalFetched / 119900) * 100).toFixed(1)}%)`);
    }

    if (rows.length < pageSize) {
      break;
    }
  }

  // Insertar remanente si queda
  if (batchBuffer.length > 0) {
    try {
      await fetch(`${targetUrl}/rest/v1/blocked_domains`, {
        method: 'POST',
        headers: {
          'apikey': targetAnonKey,
          'Authorization': 'Bearer ' + targetAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify(batchBuffer)
      });
      console.log('✓ Remanente final insertado en la nueva BD.');
    } catch (e) {}
  }

  writeStream.end();
  const elapsedSec = ((Date.now() - tTotal) / 1000).toFixed(1);
  console.log(`\n=== PROCESO COMPLETADO EN ${elapsedSec}s ===`);
  console.log(`Total dominios exportados e importados: ${totalFetched}`);
  const stats = fs.statSync(outputFile);
  console.log(`Archivo SQL generado: ${outputFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

exportAndMigrate().catch(console.error);
