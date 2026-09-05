-- ==============================================================================
-- DEFINICIÓN DDL DEL ESQUEMA `calendario` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- Incluye DDL de tablas, índices, políticas RLS y funciones RPC oficiales:
--   - public.obtener_disponibilidad(p_fecha DATE)
--   - public.crear_agendamiento(...)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS calendario;

-- 1. TABLA DE PROSPECTOS Y CLIENTES
CREATE TABLE IF NOT EXISTS calendario.prospectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) DEFAULT 'Empresa Privada',
    phone VARCHAR(50),
    topic VARCHAR(255) DEFAULT 'Consultoría IA Agéntica 45M',
    acepta_tratamiento_datos BOOLEAN NOT NULL DEFAULT true,
    ip_registro VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE EVENTOS Y CITAS
CREATE TABLE IF NOT EXISTS calendario.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    meet_link VARCHAR(255),
    google_event_id VARCHAR(255),
    inicio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '45 minutes'),
    estado VARCHAR(50) NOT NULL DEFAULT 'agendado', -- 'agendado', 'cumplida', 'no_asistio', 'cancelada'
    resultado_comercial VARCHAR(100) DEFAULT 'pendiente',
    recordatorio_30m_enviado BOOLEAN DEFAULT false,
    fecha_cita DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_cita VARCHAR(50) NOT NULL DEFAULT '10:00 AM',
    prospecto_id UUID NOT NULL REFERENCES calendario.prospectos(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE DISPONIBILIDAD HORARIA
CREATE TABLE IF NOT EXISTS calendario.disponibilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_semana INT NOT NULL, -- 1=Lunes, 5=Viernes
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES RELACIONALES
CREATE INDEX IF NOT EXISTS idx_prospectos_email ON calendario.prospectos(email);
CREATE INDEX IF NOT EXISTS idx_eventos_prospecto_id ON calendario.eventos(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON calendario.eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_cita ON calendario.eventos(fecha_cita);
CREATE INDEX IF NOT EXISTS idx_eventos_inicio ON calendario.eventos(inicio);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE calendario.prospectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendario.disponibilidad ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PROCEDIMIENTOS ALMACENADOS (RPC)
-- ==============================================================================

-- RPC 1: Consulta de Disponibilidad de Horarios (1:00 PM a 5:30 PM)
CREATE OR REPLACE FUNCTION calendario.obtener_disponibilidad(p_fecha DATE)
RETURNS TABLE (
  slot text,
  status text,
  label text
) AS $$
DECLARE
  v_day_of_week int;
  v_seed int;
  v_rand_slot1 int;
  v_rand_slot2 int;
BEGIN
  v_day_of_week := extract(dow from p_fecha);

  -- Fines de semana: Todos los horarios ocupados
  IF v_day_of_week = 0 OR v_day_of_week = 6 THEN
    RETURN QUERY VALUES
      ('01:00 PM', 'ocupado', '01:00 PM - 02:00 PM (Fin de semana)'),
      ('02:00 PM', 'ocupado', '02:00 PM - 03:00 PM (Fin de semana)'),
      ('03:00 PM', 'ocupado', '03:00 PM - 04:00 PM (Fin de semana)'),
      ('04:00 PM', 'ocupado', '04:00 PM - 05:00 PM (Fin de semana)'),
      ('05:00 PM', 'ocupado', '05:00 PM - 05:30 PM (Fin de semana)');
    RETURN;
  END IF;

  -- Semilla determinista para 2 franjas de alta demanda (1 a 5)
  v_seed := (extract(day from p_fecha)::int * 17 + extract(month from p_fecha)::int * 31 + extract(year from p_fecha)::int);
  v_rand_slot1 := (v_seed % 5) + 1;
  v_rand_slot2 := ((v_seed + 2) % 5) + 1;
  IF v_rand_slot2 = v_rand_slot1 THEN
    v_rand_slot2 := (v_rand_slot1 % 5) + 1;
  END IF;

  RETURN QUERY
  WITH slots_def (slot_id, slot_name, slot_label, slot_start_hour) AS (
    VALUES
      (1, '01:00 PM', '01:00 PM - 02:00 PM', 13),
      (2, '02:00 PM', '02:00 PM - 03:00 PM', 14),
      (3, '03:00 PM', '03:00 PM - 04:00 PM', 15),
      (4, '04:00 PM', '04:00 PM - 05:00 PM', 16),
      (5, '05:00 PM', '05:00 PM - 05:30 PM', 17)
  )
  SELECT
    s.slot_name AS slot,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM calendario.eventos e
        WHERE e.fecha_cita = p_fecha
          AND e.hora_cita = s.slot_name
          AND e.estado != 'cancelada'
      ) THEN 'ocupado'
      WHEN s.slot_id = v_rand_slot1 OR s.slot_id = v_rand_slot2 THEN 'ocupado'
      ELSE 'disponible'
    END AS status,
    s.slot_label AS label
  FROM slots_def s
  ORDER BY s.slot_id ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wrapper público para consumo PostgREST
CREATE OR REPLACE FUNCTION public.obtener_disponibilidad(p_fecha DATE)
RETURNS TABLE (
  slot text,
  status text,
  label text
) AS $$
  SELECT * FROM calendario.obtener_disponibilidad(p_fecha);
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC 2: Creación Atómica de Agendamiento (Prospecto + Evento)
CREATE OR REPLACE FUNCTION public.crear_agendamiento(
    p_nombre text,
    p_telefono text,
    p_email text,
    p_empresa text DEFAULT NULL,
    p_es_empresa boolean DEFAULT true,
    p_servicio text DEFAULT NULL,
    p_tema text DEFAULT NULL,
    p_descripcion text DEFAULT NULL,
    p_inicio timestamptz DEFAULT now(),
    p_fin timestamptz DEFAULT (now() + interval '45 minutes'),
    p_google_event_id text DEFAULT NULL,
    p_meet_link text DEFAULT NULL,
    p_acepta_tratamiento_datos boolean DEFAULT true
)
RETURNS json AS $$
DECLARE
    v_prospecto_id uuid;
    v_evento_id uuid;
    v_fecha date;
    v_hora text;
BEGIN
    v_fecha := (p_inicio AT TIME ZONE 'America/Bogota')::date;
    v_hora := to_char(p_inicio AT TIME ZONE 'America/Bogota', 'HH12:MI AM');

    INSERT INTO calendario.prospectos (
        name,
        email,
        phone,
        company,
        topic,
        acepta_tratamiento_datos
    )
    VALUES (
        p_nombre,
        p_email,
        p_telefono,
        COALESCE(p_empresa, 'Empresa Privada'),
        COALESCE(p_tema, p_servicio, 'Consultoría IA Agéntica 45M'),
        p_acepta_tratamiento_datos
    )
    RETURNING id INTO v_prospecto_id;

    INSERT INTO calendario.eventos (
        titulo,
        descripcion,
        meet_link,
        google_event_id,
        inicio,
        fin,
        estado,
        resultado_comercial,
        fecha_cita,
        hora_cita,
        prospecto_id
    )
    VALUES (
        'Asesoría Estratégica: ' || COALESCE(p_tema, 'Smartcontacts') || ' - ' || p_nombre,
        p_descripcion,
        p_meet_link,
        p_google_event_id,
        p_inicio,
        p_fin,
        'agendado',
        'pendiente',
        v_fecha,
        v_hora,
        v_prospecto_id
    )
    RETURNING id INTO v_evento_id;

    RETURN json_build_object(
        'prospecto_id', v_prospecto_id,
        'evento_id', v_evento_id,
        'status', 'ok'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
