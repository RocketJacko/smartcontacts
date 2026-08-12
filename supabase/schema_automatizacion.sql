-- ==============================================================================
-- DEFINICIÓN DDL DEL ESQUEMA `automatizacion` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS automatizacion;

-- 1. INVENTARIO DE CONTACTOS Y FUENTE DE CAMPAÑAS
CREATE TABLE IF NOT EXISTS automatizacion.inventario_contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    nombre TEXT,
    empresa TEXT,
    telefono TEXT,
    campana_nombre TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'enviado', 'omitido_duplicado', 'fallido'
    fecha_ultimo_envio TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_email_campana UNIQUE (email, campana_nombre)
);

-- 2. CONTROL ATÓMICO DE ENVIOS DIARIOS POR REMITENTE
CREATE TABLE IF NOT EXISTS automatizacion.control_envios (
    sender_email TEXT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    enviados_hoy INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (sender_email, fecha)
);

-- 3. APRENDIZAJE DINÁMICO DE LÍMITES POR DOMINIO
CREATE TABLE IF NOT EXISTS automatizacion.limites_aprendidos (
    dominio TEXT PRIMARY KEY,
    limite_real INTEGER NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. POOL ROUND-ROBIN DE ASUNTOS
CREATE TABLE IF NOT EXISTS automatizacion.pool_asuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_correo TEXT NOT NULL DEFAULT 'campana', -- 'confirmacion', 'recordatorio_8am', 'recordatorio_30m', 'campana'
    asunto TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. POOL ROUND-ROBIN DE CUERPOS HTML
CREATE TABLE IF NOT EXISTS automatizacion.pool_cuerpos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_correo TEXT NOT NULL DEFAULT 'campana',
    cuerpo_html TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. PLANTILLAS PREDETERMINADAS CONFIGURABLES POR USUARIO
CREATE TABLE IF NOT EXISTS automatizacion.plantillas_predeterminadas (
    tipo TEXT PRIMARY KEY, -- 'confirmacion', 'recordatorio_8am', 'recordatorio_30m'
    mascara_remitente TEXT NOT NULL,
    asunto TEXT NOT NULL,
    cuerpo_html TEXT NOT NULL,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LOG DETALLADO DE DESPACHOS DE CAMPAÑA Y GOTEO
CREATE TABLE IF NOT EXISTS automatizacion.log_despachos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contacto_id UUID REFERENCES automatizacion.inventario_contactos(id) ON DELETE SET NULL,
    campana_nombre TEXT NOT NULL,
    asunto_usado TEXT NOT NULL,
    cuerpo_usado TEXT,
    message_id TEXT,
    drip_delay_aplicado NUMERIC(4,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ÍNDICES DE ALTO RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_inventario_campana_estado ON automatizacion.inventario_contactos(campana_nombre, estado);
CREATE INDEX IF NOT EXISTS idx_log_despachos_campana ON automatizacion.log_despachos(campana_nombre);
