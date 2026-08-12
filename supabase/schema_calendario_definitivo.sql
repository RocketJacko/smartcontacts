-- ==============================================================================
-- DEFINICIÓN DEFINITIVA Y LIMPIA DEL ESQUEMA `calendario` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento de Regla 5 (AGENTS.md): Organización Estricta de Esquemas (`schema.nombre_tabla`)
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

-- 2. TABLA DE EVENTOS Y CITAS (CON CLAVE FORÁNEA RELACIONAL EXPLÍCITA)
CREATE TABLE IF NOT EXISTS calendario.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    meet_link VARCHAR(255),
    estado VARCHAR(50) NOT NULL DEFAULT 'agendado', -- 'agendado', 'cumplida', 'no_asistio', 'cancelada'
    resultado_comercial VARCHAR(100) DEFAULT 'pendiente',
    recordatorio_30m_enviado BOOLEAN DEFAULT false,
    fecha_cita DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_cita VARCHAR(50) NOT NULL DEFAULT '10:00 AM',
    prospecto_id UUID NOT NULL REFERENCES calendario.prospectos(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE DISPONIBILIDAD HORARIA PARA AGENTES DE IA
CREATE TABLE IF NOT EXISTS calendario.disponibilidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia_semana INT NOT NULL, -- 1=Lunes, 5=Viernes
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ÍNDICES RELACIONALES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_prospectos_email ON calendario.prospectos(email);
CREATE INDEX IF NOT EXISTS idx_eventos_prospecto_id ON calendario.eventos(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON calendario.eventos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha_cita ON calendario.eventos(fecha_cita);
