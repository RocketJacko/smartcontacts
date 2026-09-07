const fs = require('fs');
const data = JSON.parse(fs.readFileSync('scratch/cobertura_data.json', 'utf8'));

let sql = '-- ==============================================================================\n';
sql += '-- DEFINICIÓN DDL Y SEED DEL ESQUEMA `cobertura` (COBERTURA NACIONAL COLOMBIA)\n';
sql += '-- ==============================================================================\n';
sql += '-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (schema.nombre_tabla)\n';
sql += '-- Total de departamentos: ' + data.length + '\n';
sql += '-- ==============================================================================\n\n';

sql += 'CREATE SCHEMA IF NOT EXISTS cobertura;\n\n';

sql += 'CREATE TABLE IF NOT EXISTS cobertura.departamentos (\n';
sql += '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n';
sql += '  departamento TEXT UNIQUE NOT NULL,\n';
sql += '  personas_naturales BIGINT NOT NULL DEFAULT 0,\n';
sql += '  personas_juridicas BIGINT NOT NULL DEFAULT 0,\n';
sql += '  total BIGINT NOT NULL DEFAULT 0,\n';
sql += '  naturales_camaras BIGINT NOT NULL DEFAULT 0,\n';
sql += '  naturales_libranza BIGINT NOT NULL DEFAULT 0,\n';
sql += '  actualizado_el TIMESTAMPTZ DEFAULT NOW()\n';
sql += ');\n\n';

sql += '-- ÍNDICES DE BÚSQUEDA Y ORDENAMIENTO\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_cobertura_departamento ON cobertura.departamentos(departamento);\n';
sql += 'CREATE INDEX IF NOT EXISTS idx_cobertura_total ON cobertura.departamentos(total DESC);\n\n';

sql += '-- ROW LEVEL SECURITY (RLS)\n';
sql += 'ALTER TABLE cobertura.departamentos ENABLE ROW LEVEL SECURITY;\n\n';

sql += 'DO $$\n';
sql += 'BEGIN\n';
sql += '  IF NOT EXISTS (\n';
sql += '    SELECT 1 FROM pg_policies \n';
sql += '    WHERE schemaname = \'cobertura\' \n';
sql += '      AND tablename = \'departamentos\' \n';
sql += '      AND policyname = \'Lectura publica de cobertura\'\n';
sql += '  ) THEN\n';
sql += '    CREATE POLICY "Lectura publica de cobertura"\n';
sql += '      ON cobertura.departamentos FOR SELECT\n';
sql += '      USING (true);\n';
sql += '  END IF;\n';
sql += 'END $$;\n\n';

sql += '-- ==============================================================================\n';
sql += '-- PROCEDIMIENTO ALMACENADO RPC: public.obtener_cobertura()\n';
sql += '-- ==============================================================================\n';
sql += 'CREATE OR REPLACE FUNCTION public.obtener_cobertura()\n';
sql += 'RETURNS TABLE (\n';
sql += '  departamento TEXT,\n';
sql += '  personas_naturales BIGINT,\n';
sql += '  personas_juridicas BIGINT,\n';
sql += '  total BIGINT,\n';
sql += '  naturales_camaras BIGINT,\n';
sql += '  naturales_libranza BIGINT\n';
sql += ') AS $$\n';
sql += '  SELECT\n';
sql += '    d.departamento,\n';
sql += '    d.personas_naturales,\n';
sql += '    d.personas_juridicas,\n';
sql += '    d.total,\n';
sql += '    d.naturales_camaras,\n';
sql += '    d.naturales_libranza\n';
sql += '  FROM cobertura.departamentos d\n';
sql += '  ORDER BY d.total DESC;\n';
sql += '$$ LANGUAGE sql SECURITY DEFINER;\n\n';

sql += '-- ==============================================================================\n';
sql += '-- SEED DATA: 34 DEPARTAMENTOS DE COLOMBIA\n';
sql += '-- ==============================================================================\n';
sql += 'INSERT INTO cobertura.departamentos (departamento, personas_naturales, personas_juridicas, total, naturales_camaras, naturales_libranza)\nVALUES\n';

const rows = data.map(d => {
  const safeName = d.departamento.split("'").join("''");
  return `  ('${safeName}', ${d.personas_naturales}, ${d.personas_juridicas}, ${d.total}, ${d.naturales_camaras}, ${d.naturales_libranza})`;
});

sql += rows.join(',\n') + '\n';
sql += 'ON CONFLICT (departamento) DO UPDATE SET\n';
sql += '  personas_naturales = EXCLUDED.personas_naturales,\n';
sql += '  personas_juridicas = EXCLUDED.personas_juridicas,\n';
sql += '  total = EXCLUDED.total,\n';
sql += '  naturales_camaras = EXCLUDED.naturales_camaras,\n';
sql += '  naturales_libranza = EXCLUDED.naturales_libranza,\n';
sql += '  actualizado_el = NOW();\n';

fs.writeFileSync('supabase/schema_cobertura.sql', sql, 'utf8');
console.log('Generado supabase/schema_cobertura.sql exitosamente.');
