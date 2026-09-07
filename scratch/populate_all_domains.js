const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const sqlPath = 'supabase/seed_blocked_domains_full.sql';
  console.log('Leyendo dominios desde:', sqlPath);
  const content = fs.readFileSync(sqlPath, 'utf8');
  const domains = [...content.matchAll(/\('([^']+)'\)/g)].map(m => ({ domain: m[1] }));
  console.log(`Total dominios encontrados en SQL: ${domains.length}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const BATCH_SIZE = 1000;
  const totalBatches = Math.ceil(domains.length / BATCH_SIZE);
  console.log(`Iniciando inserción de ${totalBatches} lotes (${BATCH_SIZE} registros por lote)...`);

  let insertedBatches = 0;
  let errorsCount = 0;

  for (let i = 0; i < domains.length; i += BATCH_SIZE) {
    const batch = domains.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    let retries = 3;
    let success = false;

    while (retries > 0 && !success) {
      const { error } = await supabase
        .from('blocked_domains')
        .upsert(batch, { onConflict: 'domain', ignoreDuplicates: true });

      if (error) {
        retries--;
        console.warn(`[Lote ${batchNum}/${totalBatches}] Error: ${error.message}. Reintentando (${retries} restantes)...`);
        await new Promise(r => setTimeout(r, 1000));
      } else {
        success = true;
        insertedBatches++;
      }
    }

    if (!success) {
      errorsCount++;
      console.error(`[Lote ${batchNum}/${totalBatches}] Falló definitivamente.`);
    }

    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`Progreso: Lote ${batchNum}/${totalBatches} (${Math.min(i + BATCH_SIZE, domains.length)} dominios procesados)`);
    }
  }

  console.log('\n--- Inserción finalizada ---');
  console.log(`Lotes exitosos: ${insertedBatches}/${totalBatches}, Errores: ${errorsCount}`);

  const { count, error: countErr } = await supabase
    .from('blocked_domains')
    .select('*', { count: 'exact', head: true });

  console.log(`Conteo final verificado en base de datos destino: ${count} dominios.`);
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
