-- ==============================================================================
-- DEFINICIÓN DDL DE LA TABLA `public.blocked_domains`
-- ==============================================================================
-- Tabla de lista negra de dominios temporales, desechables y fraudulentos.
-- Consumida en tiempo real por el endpoint serverless `/api/check-domain`.
-- En la base de datos previa (`fxhemyrjetpwtmjxmftk`) contiene 119.900 dominios.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_domains (
    domain TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICE B-TREE PARA BÚSQUEDA EXACTA O(1)
CREATE INDEX IF NOT EXISTS idx_blocked_domains_domain ON public.blocked_domains(domain);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.blocked_domains ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'blocked_domains' 
      AND policyname = 'Permitir lectura publica de blocked_domains'
  ) THEN
    CREATE POLICY "Permitir lectura publica de blocked_domains"
      ON public.blocked_domains FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'blocked_domains' 
      AND policyname = 'Permitir administracion de blocked_domains'
  ) THEN
    CREATE POLICY "Permitir administracion de blocked_domains"
      ON public.blocked_domains FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ==============================================================================
-- SEED DATA DE DOMINIOS TEMPORALES FRECUENTES
-- ==============================================================================
INSERT INTO public.blocked_domains (domain)
VALUES
  ('yopmail.com'),
  ('mailinator.com'),
  ('guerrillamail.com'),
  ('tempmail.com'),
  ('10minutemail.com'),
  ('trashmail.com'),
  ('dispostable.com'),
  ('getnada.com'),
  ('throwawaymail.com'),
  ('temp-mail.org'),
  ('sharklasers.com'),
  ('guerrillamailblock.com'),
  ('bccto.me'),
  ('chacuo.net'),
  ('027168.com'),
  ('0-mail.com'),
  ('0-00.usa.cc'),
  ('0-30-24.com'),
  ('0-attorney.com'),
  ('00-tv.com'),
  ('asdasd.com'),
  ('test.com'),
  ('fake.com'),
  ('invalid.com'),
  ('gamil.com'),
  ('hotmial.com'),
  ('outlok.com'),
  ('yahou.com')
ON CONFLICT (domain) DO NOTHING;
