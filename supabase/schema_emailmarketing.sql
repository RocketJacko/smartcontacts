-- ==============================================================================
-- DEFINICIÓN DDL CANÓNICA DEL ESQUEMA `emailmarketing` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS emailmarketing;

-- 1. CATÁLOGO DE DIRECTORIOS
CREATE TABLE IF NOT EXISTS emailmarketing.directorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INVENTARIO CANÓNICO DE CONTACTOS (DEDUPLICADO)
CREATE TABLE IF NOT EXISTS emailmarketing.contactos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    email_normalizado TEXT GENERATED ALWAYS AS (lower(btrim(email))) STORED UNIQUE,
    nombre TEXT,
    estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'inactivo', 'bloqueado'
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ASOCIACIÓN N:M ENTRE DIRECTORIOS Y CONTACTOS
CREATE TABLE IF NOT EXISTS emailmarketing.directorio_contactos (
    directorio_id UUID NOT NULL REFERENCES emailmarketing.directorios(id) ON DELETE CASCADE,
    contacto_id UUID NOT NULL REFERENCES emailmarketing.contactos(id) ON DELETE CASCADE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (directorio_id, contacto_id)
);

-- 4. CAMPAÑAS ASOCIADAS A UN DIRECTORIO
CREATE TABLE IF NOT EXISTS emailmarketing.campanas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'borrador', -- 'borrador', 'programada', 'enviando', 'finalizada', 'pausada'
    directorio_id UUID REFERENCES emailmarketing.directorios(id) ON DELETE SET NULL,
    remitente TEXT DEFAULT 'jesus.carmona966@pascualbravo.edu.co',
    mascara_remitente TEXT DEFAULT 'Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>',
    drip_min NUMERIC(4,2) DEFAULT 3.0,
    drip_max NUMERIC(4,2) DEFAULT 5.0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    programada_en TIMESTAMP WITH TIME ZONE,
    iniciada_en TIMESTAMP WITH TIME ZONE,
    finalizada_en TIMESTAMP WITH TIME ZONE
);

-- 5. DESTINATARIOS CONGELADOS Y ESTADO POR CAMPAÑA
CREATE TABLE IF NOT EXISTS emailmarketing.campana_contactos (
    campana_id UUID NOT NULL REFERENCES emailmarketing.campanas(id) ON DELETE CASCADE,
    contacto_id UUID NOT NULL REFERENCES emailmarketing.contactos(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'procesando', 'enviado', 'fallido', 'omitido'
    ultimo_intento_en TIMESTAMP WITH TIME ZONE,
    enviado_en TIMESTAMP WITH TIME ZONE,
    error_mensaje TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (campana_id, contacto_id)
);

-- 6. POOL ROUND-ROBIN DE ASUNTOS POR CAMPAÑA
CREATE TABLE IF NOT EXISTS emailmarketing.campana_asuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID REFERENCES emailmarketing.campanas(id) ON DELETE CASCADE,
    asunto TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. POOL ROUND-ROBIN DE CUERPOS HTML POR CAMPAÑA
CREATE TABLE IF NOT EXISTS emailmarketing.campana_cuerpos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID REFERENCES emailmarketing.campanas(id) ON DELETE CASCADE,
    cuerpo_html TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. HISTORIAL AUDITADO DE ENTREGAS
CREATE TABLE IF NOT EXISTS emailmarketing.envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campana_id UUID REFERENCES emailmarketing.campanas(id) ON DELETE CASCADE,
    contacto_id UUID REFERENCES emailmarketing.contactos(id) ON DELETE CASCADE,
    estado TEXT NOT NULL DEFAULT 'entregado', -- 'entregado', 'rebotado', 'queja'
    asunto_usado TEXT,
    proveedor_id TEXT,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_mensaje TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. DOMINIOS BLOQUEADOS
CREATE TABLE IF NOT EXISTS emailmarketing.blocked_domains (
    domain TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_contactos_email_norm ON emailmarketing.contactos(email_normalizado);
CREATE INDEX IF NOT EXISTS idx_directorio_contactos_dir ON emailmarketing.directorio_contactos(directorio_id);
CREATE INDEX IF NOT EXISTS idx_campana_contactos_estado ON emailmarketing.campana_contactos(campana_id, estado);
CREATE INDEX IF NOT EXISTS idx_envios_campana ON emailmarketing.envios(campana_id);

-- ==============================================================================
-- PROCEDIMIENTOS ALMACENADOS EN `emailmarketing`
-- ==============================================================================

-- Ingesta idempotente de contacto y vinculación a directorio
CREATE OR REPLACE FUNCTION emailmarketing.ingestar_contacto(
    p_email text,
    p_nombre text DEFAULT NULL,
    p_directorio_nombre text DEFAULT 'General'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_directorio_id uuid;
    v_contacto_id uuid;
    v_clean_email text;
BEGIN
    v_clean_email := lower(btrim(p_email));
    IF v_clean_email IS NULL OR v_clean_email = '' THEN
        RAISE EXCEPTION 'El correo electrónico no puede estar vacío';
    END IF;

    -- 1. Garantizar existencia del directorio
    INSERT INTO emailmarketing.directorios (nombre)
    VALUES (btrim(p_directorio_nombre))
    ON CONFLICT (nombre) DO UPDATE SET nombre = EXCLUDED.nombre
    RETURNING id INTO v_directorio_id;

    -- 2. Upsert idempotente de contacto
    INSERT INTO emailmarketing.contactos (email, nombre)
    VALUES (v_clean_email, p_nombre)
    ON CONFLICT (email_normalizado) DO UPDATE
    SET nombre = COALESCE(EXCLUDED.nombre, emailmarketing.contactos.nombre),
        actualizado_en = NOW()
    RETURNING id INTO v_contacto_id;

    -- 3. Vincular a directorio sin duplicados
    INSERT INTO emailmarketing.directorio_contactos (directorio_id, contacto_id)
    VALUES (v_directorio_id, v_contacto_id)
    ON CONFLICT DO NOTHING;

    RETURN v_contacto_id;
END;
$$;

-- Sincronización de destinatarios congelados para una campaña
CREATE OR REPLACE FUNCTION emailmarketing.sincronizar_destinatarios_campana(p_campana_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_directorio_id uuid;
    v_count integer;
BEGIN
    SELECT directorio_id INTO v_directorio_id
    FROM emailmarketing.campanas
    WHERE id = p_campana_id;

    IF v_directorio_id IS NULL THEN
        RETURN 0;
    END IF;

    INSERT INTO emailmarketing.campana_contactos (campana_id, contacto_id, estado)
    SELECT p_campana_id, dc.contacto_id, 'pendiente'
    FROM emailmarketing.directorio_contactos dc
    JOIN emailmarketing.contactos c ON c.id = dc.contacto_id
    WHERE dc.directorio_id = v_directorio_id
      AND c.estado = 'activo'
    ON CONFLICT (campana_id, contacto_id) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
