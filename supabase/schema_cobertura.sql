-- ==============================================================================
-- DEFINICIÓN DDL Y SEED DEL ESQUEMA `cobertura` (COBERTURA NACIONAL COLOMBIA)
-- ==============================================================================
-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (schema.nombre_tabla)
-- Total de departamentos: 34
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS cobertura;

CREATE TABLE IF NOT EXISTS cobertura.departamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento TEXT UNIQUE NOT NULL,
  personas_naturales BIGINT NOT NULL DEFAULT 0,
  personas_juridicas BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  naturales_camaras BIGINT NOT NULL DEFAULT 0,
  naturales_libranza BIGINT NOT NULL DEFAULT 0,
  actualizado_el TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE BÚSQUEDA Y ORDENAMIENTO
CREATE INDEX IF NOT EXISTS idx_cobertura_departamento ON cobertura.departamentos(departamento);
CREATE INDEX IF NOT EXISTS idx_cobertura_total ON cobertura.departamentos(total DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE cobertura.departamentos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'cobertura' 
      AND tablename = 'departamentos' 
      AND policyname = 'Lectura publica de cobertura'
  ) THEN
    CREATE POLICY "Lectura publica de cobertura"
      ON cobertura.departamentos FOR SELECT
      USING (true);
  END IF;
END $$;

-- ==============================================================================
-- PROCEDIMIENTO ALMACENADO RPC: public.obtener_cobertura()
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.obtener_cobertura()
RETURNS TABLE (
  departamento TEXT,
  personas_naturales BIGINT,
  personas_juridicas BIGINT,
  total BIGINT,
  naturales_camaras BIGINT,
  naturales_libranza BIGINT
) AS $$
  SELECT
    d.departamento,
    d.personas_naturales,
    d.personas_juridicas,
    d.total,
    d.naturales_camaras,
    d.naturales_libranza
  FROM cobertura.departamentos d
  ORDER BY d.total DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- ==============================================================================
-- SEED DATA: 34 DEPARTAMENTOS DE COLOMBIA
-- ==============================================================================
INSERT INTO cobertura.departamentos (departamento, personas_naturales, personas_juridicas, total, naturales_camaras, naturales_libranza)
VALUES
  ('BOGOTA D.C.', 310739, 212284, 523023, 228047, 82692),
  ('ANTIOQUIA', 189926, 105280, 295206, 144530, 45396),
  ('VALLE DEL CAUCA', 134878, 49751, 184629, 102549, 32329),
  ('SANTANDER', 100282, 25188, 125470, 78417, 21865),
  ('CUNDINAMARCA', 96947, 26658, 123605, 77395, 19552),
  ('ATLANTICO', 55725, 39445, 95170, 35412, 20313),
  ('TOLIMA', 61481, 9606, 71087, 45660, 15821),
  ('NORTE DE SANTANDER', 57390, 10005, 67395, 47699, 9691),
  ('BOLIVAR', 44075, 20253, 64328, 28552, 15523),
  ('BOYACA', 50913, 6552, 57465, 36340, 14573),
  ('RISARALDA', 40708, 10555, 51263, 32041, 8667),
  ('NARINO', 44797, 5339, 50136, 31915, 12882),
  ('HUILA', 41146, 7651, 48797, 31093, 10053),
  ('CALDAS', 37498, 7554, 45052, 25915, 11583),
  ('CAUCA', 36786, 4248, 41034, 22774, 14012),
  ('MAGDALENA', 31863, 8763, 40626, 21232, 10631),
  ('CORDOBA', 26223, 7558, 33781, 16243, 9980),
  ('QUINDIO', 27533, 4966, 32499, 20799, 6734),
  ('META', 26783, 4495, 31278, 19163, 7620),
  ('SUCRE', 17338, 3709, 21047, 11576, 5762),
  ('CESAR', 17863, 2521, 20384, 11470, 6393),
  ('LA GUAJIRA', 13273, 2992, 16265, 9928, 3345),
  ('CAQUETA', 13623, 2015, 15638, 10855, 2768),
  ('CHOCO', 11612, 2032, 13644, 7353, 4259),
  ('PUTUMAYO', 10584, 1562, 12146, 8897, 1687),
  ('ARAUCA', 7624, 1277, 8901, 6324, 1300),
  ('CASANARE', 7522, 1300, 8822, 5610, 1912),
  ('SAN ANDRES Y PROVIDENCIA', 4559, 1312, 5871, 3840, 719),
  ('GUAVIARE', 4001, 745, 4746, 3749, 252),
  ('AMAZONAS', 2596, 475, 3071, 2197, 399),
  ('VICHADA', 1847, 362, 2209, 1669, 178),
  ('GUAINIA', 1420, 187, 1607, 1332, 88),
  ('OTRO/EXTRANJERO', 692, 0, 692, 0, 692),
  ('VAUPES', 553, 138, 691, 505, 48)
ON CONFLICT (departamento) DO UPDATE SET
  personas_naturales = EXCLUDED.personas_naturales,
  personas_juridicas = EXCLUDED.personas_juridicas,
  total = EXCLUDED.total,
  naturales_camaras = EXCLUDED.naturales_camaras,
  naturales_libranza = EXCLUDED.naturales_libranza,
  actualizado_el = NOW();
