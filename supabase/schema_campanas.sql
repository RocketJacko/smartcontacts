-- ==============================================================================
-- DEFINICIÓN DDL DE LA TABLA `public.campanas`
-- ==============================================================================
-- Extraída directamente de la base de datos de producción (fxhemyrjetpwtmjxmftk).
-- Tabla de catálogo y gestión de campañas masivas de correo electrónico.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.campanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'activa', -- 'activa', 'borrador', 'pausada', 'finalizada'
    directorio_id UUID,
    remitente TEXT DEFAULT 'jesus.carmona966@pascualbravo.edu.co',
    mascara_remitente TEXT DEFAULT 'Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>',
    drip_min NUMERIC(4,2) DEFAULT 3.0,
    drip_max NUMERIC(4,2) DEFAULT 5.0,
    programada_en TIMESTAMPTZ,
    iniciada_en TIMESTAMPTZ,
    finalizada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_campanas_estado ON public.campanas(estado);
CREATE INDEX IF NOT EXISTS idx_campanas_creado_en ON public.campanas(creado_en DESC);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.campanas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'campanas' 
      AND policyname = 'Permitir lectura publica de campanas'
  ) THEN
    CREATE POLICY "Permitir lectura publica de campanas"
      ON public.campanas FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'campanas' 
      AND policyname = 'Permitir administracion de campanas'
  ) THEN
    CREATE POLICY "Permitir administracion de campanas"
      ON public.campanas FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- SEED DATA DE PRODUCCIÓN (3 CAMPAÑAS ACTIVAS REGISTRADAS)
-- ==============================================================================
INSERT INTO public.campanas (id, nombre, descripcion, estado, creado_en, directorio_id)
VALUES
  ('26c66eb3-7e12-438c-97c4-7748b7614d08', 'Directorio - Universidades & Educación', 'Categoría auto-registrada desde carga masiva', 'activa', '2026-08-13T14:06:51.239336+00:00', NULL),
  ('1e1ee9c6-64ba-44b4-887a-6a3407a5374e', 'Policia', 'Campaña creada desde el panel de automatizaciones', 'activa', '2026-08-15T13:16:47.201986+00:00', NULL),
  ('1dda124d-d401-426f-b2a0-642aac8873cb', 'Universidad Pascual Bravo', 'Directorio auto-registrado', 'activa', '2026-08-15T14:12:28.959258+00:00', NULL)
ON CONFLICT (nombre) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  estado = EXCLUDED.estado;
