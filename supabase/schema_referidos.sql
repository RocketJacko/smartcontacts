-- ==============================================================================
-- DEFINICIÓN DDL DEL ESQUEMA `referidos` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- Cumplimiento estricto de Regla 6 (AGENTS.md): Protección de datos sensibles y RLS
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS referidos;

-- 1. TABLA DE AFILIADOS / REFERIDORES
CREATE TABLE IF NOT EXISTS referidos.afiliados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50),
    estado VARCHAR(50) NOT NULL DEFAULT 'activo', -- 'activo', 'suspendido', 'en_revision'
    saldo_pendiente NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    saldo_liquidado NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_referidos_agendados INT NOT NULL DEFAULT 0,
    total_referidos_cerrados INT NOT NULL DEFAULT 0,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA SATÉLITE DE DATOS BANCARIOS (Aislamiento de Datos Financieros Sensibles)
CREATE TABLE IF NOT EXISTS referidos.datos_pago (
    afiliado_id UUID PRIMARY KEY REFERENCES referidos.afiliados(id) ON DELETE CASCADE,
    tipo_documento VARCHAR(50) NOT NULL DEFAULT 'CC', -- 'CC', 'NIT', 'CE', 'PASAPORTE'
    numero_documento VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'ahorros', -- 'ahorros', 'corriente', 'billetera_digital'
    banco VARCHAR(150) NOT NULL,
    numero_cuenta VARCHAR(100) NOT NULL,
    titular_cuenta VARCHAR(255) NOT NULL,
    llave_transferencia_rapida VARCHAR(100), -- Nequi, Daviplata, Transfiya
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE ENLACES Y CÓDIGOS DE REFERIDOS
CREATE TABLE IF NOT EXISTS referidos.enlaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    afiliado_id UUID NOT NULL REFERENCES referidos.afiliados(id) ON DELETE CASCADE,
    codigo_referido VARCHAR(100) NOT NULL UNIQUE, -- Ej: 'ALEXIS24', 'VENTAS-VIP'
    slug_personalizado VARCHAR(100) UNIQUE,
    url_destino TEXT NOT NULL DEFAULT '/#agendar',
    clics_totales INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE ATRIBUCIONES TEMPORALES (Cookies y Sesiones First-Touch / Last-Touch)
CREATE TABLE IF NOT EXISTS referidos.atribuciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enlace_id UUID NOT NULL REFERENCES referidos.enlaces(id) ON DELETE CASCADE,
    token_sesion VARCHAR(255) NOT NULL UNIQUE,
    ip_hash VARCHAR(128),
    user_agent TEXT,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '45 days'),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE CONVERSIONES Y COMISIONES (Vinculación con `calendario.prospectos`)
CREATE TABLE IF NOT EXISTS referidos.conversiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    afiliado_id UUID NOT NULL REFERENCES referidos.afiliados(id) ON DELETE CASCADE,
    enlace_primer_toque_id UUID REFERENCES referidos.enlaces(id) ON DELETE SET NULL,
    enlace_ultimo_toque_id UUID REFERENCES referidos.enlaces(id) ON DELETE SET NULL,
    prospecto_id UUID REFERENCES calendario.prospectos(id) ON DELETE SET NULL,
    tipo_atribucion VARCHAR(50) NOT NULL DEFAULT 'enlace_cookie', -- 'enlace_cookie', 'manual_admin'
    tipo_comision VARCHAR(50) NOT NULL DEFAULT 'monto_fijo', -- 'monto_fijo', 'porcentaje', 'personalizado'
    monto_transaccion NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    porcentaje_aplicado NUMERIC(5, 2) DEFAULT 0.00,
    valor_comision_calculado NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    estado_liquidacion VARCHAR(50) NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'en_garantia', 'aprobada', 'liquidada', 'cancelada', 'rechazada_autoreferido'
    motivo_atribucion_manual TEXT,
    autor_admin VARCHAR(100),
    fecha_adquisicion TIMESTAMP WITH TIME ZONE,
    fecha_fin_garantia TIMESTAMP WITH TIME ZONE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA DE LIQUIDACIONES Y PAGOS
CREATE TABLE IF NOT EXISTS referidos.liquidaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    afiliado_id UUID NOT NULL REFERENCES referidos.afiliados(id) ON DELETE CASCADE,
    monto_total NUMERIC(14, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'pagada', -- 'solicitada', 'en_proceso', 'pagada', 'rechazada'
    metodo_pago_utilizado VARCHAR(100) DEFAULT 'Transferencia Bancaria',
    referencia_bancaria VARCHAR(255),
    comprobante_url TEXT,
    notas TEXT,
    pagado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES DE RENDIMIENTO Y CONSULTA
CREATE INDEX IF NOT EXISTS idx_referidos_afiliados_email ON referidos.afiliados(email);
CREATE INDEX IF NOT EXISTS idx_referidos_afiliados_estado ON referidos.afiliados(estado);
CREATE INDEX IF NOT EXISTS idx_referidos_enlaces_codigo ON referidos.enlaces(codigo_referido);
CREATE INDEX IF NOT EXISTS idx_referidos_atribuciones_token ON referidos.atribuciones(token_sesion);
CREATE INDEX IF NOT EXISTS idx_referidos_conversiones_afiliado ON referidos.conversiones(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_referidos_conversiones_prospecto ON referidos.conversiones(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_referidos_conversiones_estado ON referidos.conversiones(estado_liquidacion);

-- POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE referidos.afiliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos.datos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos.enlaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos.atribuciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos.conversiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE referidos.liquidaciones ENABLE ROW LEVEL SECURITY;

-- Política para lectura anónima de enlaces activos (requerida por el Middleware)
CREATE POLICY "Permitir lectura publica de enlaces activos"
    ON referidos.enlaces
    FOR SELECT
    TO anon, authenticated
    USING (activo = true);

-- RPC 1: Registro Atómico de Clics
CREATE OR REPLACE FUNCTION referidos.registrar_clic(
    p_codigo VARCHAR,
    p_token_sesion VARCHAR,
    p_ip_hash VARCHAR,
    p_user_agent TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_enlace RECORD;
BEGIN
    SELECT * INTO v_enlace FROM referidos.enlaces 
    WHERE (LOWER(codigo_referido) = LOWER(p_codigo) OR LOWER(slug_personalizado) = LOWER(p_codigo)) 
      AND activo = true 
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Codigo de referido no encontrado o inactivo');
    END IF;

    -- Incrementar contador de clics
    UPDATE referidos.enlaces 
    SET clics_totales = clics_totales + 1 
    WHERE id = v_enlace.id;

    -- Insertar o actualizar atribución de sesión
    INSERT INTO referidos.atribuciones (enlace_id, token_sesion, ip_hash, user_agent, expira_en)
    VALUES (v_enlace.id, p_token_sesion, p_ip_hash, p_user_agent, NOW() + INTERVAL '45 days')
    ON CONFLICT (token_sesion) DO UPDATE 
    SET enlace_id = v_enlace.id,
        expira_en = NOW() + INTERVAL '45 days';

    RETURN jsonb_build_object(
        'success', true, 
        'enlace_id', v_enlace.id,
        'afiliado_id', v_enlace.afiliado_id,
        'codigo', v_enlace.codigo_referido,
        'url_destino', v_enlace.url_destino
    );
END;
$$;

-- RPC 2: Vinculación Automática al Agendar Cita
CREATE OR REPLACE FUNCTION referidos.vincular_prospecto_agendado(
    p_token_sesion VARCHAR,
    p_prospecto_id UUID,
    p_email VARCHAR,
    p_telefono VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_atribucion RECORD;
    v_afiliado RECORD;
    v_es_autoreferido BOOLEAN := false;
BEGIN
    IF p_token_sesion IS NULL OR p_token_sesion = '' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Sin token de referido');
    END IF;

    -- Obtener atribución válida
    SELECT a.*, e.afiliado_id INTO v_atribucion
    FROM referidos.atribuciones a
    JOIN referidos.enlaces e ON a.enlace_id = e.id
    WHERE a.token_sesion = p_token_sesion
      AND a.expira_en > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Atribucion expirada o inexistente');
    END IF;

    -- Obtener datos del afiliado para chequeo anti-fraude
    SELECT * INTO v_afiliado FROM referidos.afiliados WHERE id = v_atribucion.afiliado_id;

    IF LOWER(TRIM(v_afiliado.email)) = LOWER(TRIM(p_email)) THEN
        v_es_autoreferido := true;
    END IF;

    -- Insertar conversión en estado agendado/pendiente
    INSERT INTO referidos.conversiones (
        afiliado_id,
        enlace_primer_toque_id,
        enlace_ultimo_toque_id,
        prospecto_id,
        tipo_atribucion,
        tipo_comision,
        valor_comision_calculado,
        estado_liquidacion
    ) VALUES (
        v_afiliado.id,
        v_atribucion.enlace_id,
        v_atribucion.enlace_id,
        p_prospecto_id,
        'enlace_cookie',
        'monto_fijo',
        0.00,
        CASE WHEN v_es_autoreferido THEN 'rechazada_autoreferido' ELSE 'pendiente' END
    );

    -- Incrementar contador de prospectos agendados para el afiliado
    UPDATE referidos.afiliados 
    SET total_referidos_agendados = total_referidos_agendados + 1
    WHERE id = v_afiliado.id;

    RETURN jsonb_build_object(
        'success', true,
        'afiliado_id', v_afiliado.id,
        'afiliado_nombre', v_afiliado.nombre,
        'es_autoreferido', v_es_autoreferido
    );
END;
$$;

-- RPC 3: Atribución Manual Administrativa (Respaldo B2B)
CREATE OR REPLACE FUNCTION referidos.atribucion_manual_admin(
    p_afiliado_id UUID,
    p_prospecto_id UUID,
    p_monto NUMERIC,
    p_motivo TEXT,
    p_tipo_comision VARCHAR,
    p_porcentaje NUMERIC,
    p_valor_comision NUMERIC,
    p_autor VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO referidos.conversiones (
        afiliado_id,
        prospecto_id,
        tipo_atribucion,
        tipo_comision,
        monto_transaccion,
        porcentaje_aplicado,
        valor_comision_calculado,
        estado_liquidacion,
        motivo_atribucion_manual,
        autor_admin,
        fecha_adquisicion
    ) VALUES (
        p_afiliado_id,
        p_prospecto_id,
        'manual_admin',
        COALESCE(p_tipo_comision, 'monto_fijo'),
        COALESCE(p_monto, 0.00),
        COALESCE(p_porcentaje, 0.00),
        p_valor_comision,
        'aprobada',
        p_motivo,
        p_autor,
        NOW()
    );

    -- Actualizar saldo pendiente del afiliado
    UPDATE referidos.afiliados
    SET saldo_pendiente = saldo_pendiente + p_valor_comision,
        total_referidos_cerrados = total_referidos_cerrados + 1
    WHERE id = p_afiliado_id;

    RETURN jsonb_build_object('success', true, 'comision_agregada', p_valor_comision);
END;
$$;
