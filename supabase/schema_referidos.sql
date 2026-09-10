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

-- ==============================================================================
-- PROCEDIMIENTOS ALMACENADOS RPC PARA ADMINISTRACIÓN DE SUPER ADMIN
-- ==============================================================================

-- RPC 4: Listar Afiliados con Enlaces, Métricas y Saldos
CREATE OR REPLACE FUNCTION public.admin_obtener_afiliados()
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    email VARCHAR,
    telefono VARCHAR,
    estado VARCHAR,
    saldo_pendiente NUMERIC,
    saldo_liquidado NUMERIC,
    total_referidos_agendados INT,
    total_referidos_cerrados INT,
    creado_en TIMESTAMPTZ,
    enlace_id UUID,
    codigo_referido VARCHAR,
    url_destino TEXT,
    clics_totales INT,
    enlace_activo BOOLEAN,
    banco VARCHAR,
    tipo_cuenta VARCHAR,
    numero_cuenta VARCHAR,
    titular_cuenta VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nombre,
        a.email,
        a.telefono,
        a.estado,
        a.saldo_pendiente,
        a.saldo_liquidado,
        a.total_referidos_agendados,
        a.total_referidos_cerrados,
        a.creado_en,
        e.id AS enlace_id,
        e.codigo_referido,
        e.url_destino,
        COALESCE(e.clics_totales, 0) AS clics_totales,
        COALESCE(e.activo, true) AS enlace_activo,
        dp.banco,
        dp.tipo_cuenta,
        dp.numero_cuenta,
        dp.titular_cuenta
    FROM referidos.afiliados a
    LEFT JOIN referidos.enlaces e ON e.afiliado_id = a.id
    LEFT JOIN referidos.datos_pago dp ON dp.afiliado_id = a.id
    ORDER BY a.creado_en DESC;
END;
$$;

-- RPC 5: Cambiar Estado de Afiliado (Activo / Suspendido)
CREATE OR REPLACE FUNCTION public.admin_cambiar_estado_afiliado(
    p_afiliado_id UUID,
    p_estado VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referidos.afiliados
    SET estado = p_estado,
        actualizado_en = NOW()
    WHERE id = p_afiliado_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Afiliado no encontrado');
    END IF;

    IF p_estado = 'suspendido' THEN
        UPDATE referidos.enlaces
        SET activo = false
        WHERE afiliado_id = p_afiliado_id;
    ELSIF p_estado = 'activo' THEN
        UPDATE referidos.enlaces
        SET activo = true
        WHERE afiliado_id = p_afiliado_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'estado', p_estado);
END;
$$;

-- RPC 6: Liquidar Comisiones de Afiliado
CREATE OR REPLACE FUNCTION public.admin_liquidar_afiliado(
    p_afiliado_id UUID,
    p_monto NUMERIC,
    p_metodo VARCHAR DEFAULT 'Transferencia Bancaria',
    p_referencia VARCHAR DEFAULT NULL,
    p_notas TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo_actual NUMERIC;
BEGIN
    SELECT saldo_pendiente INTO v_saldo_actual
    FROM referidos.afiliados
    WHERE id = p_afiliado_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Afiliado no encontrado');
    END IF;

    IF p_monto <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'El monto a liquidar debe ser mayor a 0');
    END IF;

    INSERT INTO referidos.liquidaciones (
        afiliado_id, monto_total, estado, metodo_pago_utilizado, referencia_bancaria, notas
    ) VALUES (
        p_afiliado_id, p_monto, 'pagada', p_metodo, p_referencia, p_notas
    );

    UPDATE referidos.afiliados
    SET saldo_pendiente = GREATEST(0, saldo_pendiente - p_monto),
        saldo_liquidado = saldo_liquidado + p_monto,
        actualizado_en = NOW()
    WHERE id = p_afiliado_id;

    RETURN jsonb_build_object(
        'success', true,
        'monto_liquidado', p_monto,
        'nuevo_saldo_pendiente', GREATEST(0, v_saldo_actual - p_monto)
    );
END;
$$;

-- ==============================================================================
-- 7. TABLA DE OFERTAS ESPECIALES Y CONVENIOS TEMPORALES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS referidos.ofertas_especiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_oferta TEXT UNIQUE NOT NULL, -- Código / Slug (ej: 'UNAL-2026', 'PLATZI-EDU')
    titulo TEXT NOT NULL, -- Título de la oferta / convenio
    descripcion TEXT, -- Descripción o condiciones
    institucion_empresa TEXT, -- Nombre de la institución o empresa aliada
    precio_cop NUMERIC(14, 2) NOT NULL, -- Precio en COP
    precio_usd NUMERIC(10, 2) NOT NULL, -- Precio en USD
    meses_cubrimiento INT NOT NULL DEFAULT 12, -- Duración del plan
    tipo_pago VARCHAR(50) NOT NULL DEFAULT 'pago_unico', -- 'pago_unico', 'cuotas'
    numero_cuotas INT NOT NULL DEFAULT 1, -- 1, 2, 3, 6, 12
    caracteristicas JSONB DEFAULT '[]'::jsonb, -- Array con puntos clave
    afiliado_id UUID REFERENCES referidos.afiliados(id) ON DELETE SET NULL, -- Revendedor atribuido
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ, -- Vencimiento opcional
    cupos_maximos INT, -- Límite de activaciones
    cupos_usados INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true, -- Toggle de activación
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE referidos.ofertas_especiales ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) NOT NULL DEFAULT 'pago_unico';
ALTER TABLE referidos.ofertas_especiales ADD COLUMN IF NOT EXISTS numero_cuotas INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_referidos_ofertas_codigo ON referidos.ofertas_especiales(codigo_oferta);
CREATE INDEX IF NOT EXISTS idx_referidos_ofertas_afiliado ON referidos.ofertas_especiales(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_referidos_ofertas_activo ON referidos.ofertas_especiales(activo);

-- RPC 7: Obtener Oferta Pública (Landing y Modal de Activación)
CREATE OR REPLACE FUNCTION public.obtener_oferta_publica(p_codigo TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_oferta RECORD;
    v_afiliado RECORD;
    v_enlace RECORD;
    v_valida BOOLEAN := true;
    v_motivo TEXT := 'valida';
BEGIN
    SELECT * INTO v_oferta
    FROM referidos.ofertas_especiales
    WHERE UPPER(TRIM(codigo_oferta)) = UPPER(TRIM(p_codigo));

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'valida', false,
            'motivo', 'no_encontrada',
            'error', 'La oferta o convenio especificado no existe.'
        );
    END IF;

    IF NOT v_oferta.activo THEN
        v_valida := false;
        v_motivo := 'pausada';
    ELSIF v_oferta.fecha_inicio IS NOT NULL AND v_oferta.fecha_inicio > NOW() THEN
        v_valida := false;
        v_motivo := 'no_iniciada';
    ELSIF v_oferta.fecha_fin IS NOT NULL AND v_oferta.fecha_fin < NOW() THEN
        v_valida := false;
        v_motivo := 'vencida';
    ELSIF v_oferta.cupos_maximos IS NOT NULL AND v_oferta.cupos_usados >= v_oferta.cupos_maximos THEN
        v_valida := false;
        v_motivo := 'agotada';
    END IF;

    IF v_oferta.afiliado_id IS NOT NULL THEN
        SELECT id, nombre, email, estado INTO v_afiliado
        FROM referidos.afiliados
        WHERE id = v_oferta.afiliado_id;

        SELECT codigo_referido INTO v_enlace
        FROM referidos.enlaces
        WHERE afiliado_id = v_oferta.afiliado_id AND activo = true
        LIMIT 1;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'valida', v_valida,
        'motivo', v_motivo,
        'oferta', jsonb_build_object(
            'id', v_oferta.id,
            'codigo_oferta', v_oferta.codigo_oferta,
            'titulo', v_oferta.titulo,
            'descripcion', v_oferta.descripcion,
            'institucion_empresa', v_oferta.institucion_empresa,
            'precio_cop', v_oferta.precio_cop,
            'precio_usd', v_oferta.precio_usd,
            'meses_cubrimiento', v_oferta.meses_cubrimiento,
            'tipo_pago', COALESCE(v_oferta.tipo_pago, 'pago_unico'),
            'numero_cuotas', COALESCE(v_oferta.numero_cuotas, 1),
            'caracteristicas', v_oferta.caracteristicas,
            'cupos_maximos', v_oferta.cupos_maximos,
            'cupos_usados', v_oferta.cupos_usados,
            'fecha_fin', v_oferta.fecha_fin,
            'activo', v_oferta.activo,
            'afiliado_id', v_oferta.afiliado_id,
            'afiliado_nombre', v_afiliado.nombre,
            'codigo_referido', v_enlace.codigo_referido
        )
    );
END;
$$;

-- RPC 8: Admin Listar Ofertas
CREATE OR REPLACE FUNCTION public.admin_listar_ofertas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', o.id,
            'codigo_oferta', o.codigo_oferta,
            'titulo', o.titulo,
            'descripcion', o.descripcion,
            'institucion_empresa', o.institucion_empresa,
            'precio_cop', o.precio_cop,
            'precio_usd', o.precio_usd,
            'meses_cubrimiento', o.meses_cubrimiento,
            'tipo_pago', COALESCE(o.tipo_pago, 'pago_unico'),
            'numero_cuotas', COALESCE(o.numero_cuotas, 1),
            'caracteristicas', o.caracteristicas,
            'afiliado_id', o.afiliado_id,
            'afiliado_nombre', a.nombre,
            'afiliado_email', a.email,
            'codigo_referido', e.codigo_referido,
            'fecha_inicio', o.fecha_inicio,
            'fecha_fin', o.fecha_fin,
            'cupos_maximos', o.cupos_maximos,
            'cupos_usados', o.cupos_usados,
            'activo', o.activo,
            'creado_en', o.creado_en,
            'actualizado_en', o.actualizado_en
        ) ORDER BY o.creado_en DESC
    ) INTO v_result
    FROM referidos.ofertas_especiales o
    LEFT JOIN referidos.afiliados a ON o.afiliado_id = a.id
    LEFT JOIN referidos.enlaces e ON a.id = e.afiliado_id AND e.activo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- RPC 9: Admin Crear Oferta Especial
CREATE OR REPLACE FUNCTION public.admin_crear_oferta(
    p_codigo_oferta TEXT,
    p_titulo TEXT,
    p_descripcion TEXT,
    p_institucion_empresa TEXT,
    p_precio_cop NUMERIC,
    p_precio_usd NUMERIC,
    p_meses_cubrimiento INT,
    p_caracteristicas JSONB,
    p_afiliado_id UUID DEFAULT NULL,
    p_fecha_fin TIMESTAMPTZ DEFAULT NULL,
    p_cupos_maximos INT DEFAULT NULL,
    p_tipo_pago TEXT DEFAULT 'pago_unico',
    p_numero_cuotas INT DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_code TEXT := UPPER(TRIM(p_codigo_oferta));
    v_id UUID;
BEGIN
    IF v_clean_code IS NULL OR v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código de oferta es requerido.');
    END IF;

    IF EXISTS (SELECT 1 FROM referidos.ofertas_especiales WHERE UPPER(codigo_oferta) = v_clean_code) THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código de oferta ya se encuentra registrado.');
    END IF;

    INSERT INTO referidos.ofertas_especiales (
        codigo_oferta,
        titulo,
        descripcion,
        institucion_empresa,
        precio_cop,
        precio_usd,
        meses_cubrimiento,
        tipo_pago,
        numero_cuotas,
        caracteristicas,
        afiliado_id,
        fecha_fin,
        cupos_maximos,
        activo
    ) VALUES (
        v_clean_code,
        TRIM(p_titulo),
        TRIM(p_descripcion),
        TRIM(p_institucion_empresa),
        p_precio_cop,
        p_precio_usd,
        COALESCE(p_meses_cubrimiento, 12),
        COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico'),
        COALESCE(p_numero_cuotas, 1),
        COALESCE(p_caracteristicas, '[]'::jsonb),
        p_afiliado_id,
        p_fecha_fin,
        p_cupos_maximos,
        true
    ) RETURNING id INTO v_id;

    RETURN jsonb_build_object('success', true, 'id', v_id, 'codigo_oferta', v_clean_code);
END;
$$;

-- RPC 10: Admin Actualizar Oferta Especial
CREATE OR REPLACE FUNCTION public.admin_actualizar_oferta(
    p_id UUID,
    p_titulo TEXT,
    p_descripcion TEXT,
    p_institucion_empresa TEXT,
    p_precio_cop NUMERIC,
    p_precio_usd NUMERIC,
    p_meses_cubrimiento INT,
    p_caracteristicas JSONB,
    p_afiliado_id UUID DEFAULT NULL,
    p_fecha_fin TIMESTAMPTZ DEFAULT NULL,
    p_cupos_maximos INT DEFAULT NULL,
    p_tipo_pago TEXT DEFAULT 'pago_unico',
    p_numero_cuotas INT DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referidos.ofertas_especiales
    SET titulo = TRIM(p_titulo),
        descripcion = TRIM(p_descripcion),
        institucion_empresa = TRIM(p_institucion_empresa),
        precio_cop = p_precio_cop,
        precio_usd = p_precio_usd,
        meses_cubrimiento = COALESCE(p_meses_cubrimiento, 12),
        tipo_pago = COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico'),
        numero_cuotas = COALESCE(p_numero_cuotas, 1),
        caracteristicas = COALESCE(p_caracteristicas, '[]'::jsonb),
        afiliado_id = p_afiliado_id,
        fecha_fin = p_fecha_fin,
        cupos_maximos = p_cupos_maximos,
        actualizado_en = NOW()
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oferta no encontrada.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC 11: Admin Conmutar Toggle de Oferta Especial
CREATE OR REPLACE FUNCTION public.admin_toggle_oferta(
    p_id UUID,
    p_activo BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referidos.ofertas_especiales
    SET activo = p_activo,
        actualizado_en = NOW()
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oferta no encontrada.');
    END IF;

    RETURN jsonb_build_object('success', true, 'activo', p_activo);
END;
$$;

-- RPC 12: Admin Eliminar Oferta Especial
CREATE OR REPLACE FUNCTION public.admin_eliminar_oferta(
    p_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM referidos.ofertas_especiales
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Oferta no encontrada.');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC 13: Admin Actualizar Datos de Revendedor
CREATE OR REPLACE FUNCTION public.admin_actualizar_afiliado(
    p_afiliado_id UUID,
    p_nombre TEXT,
    p_email TEXT,
    p_telefono TEXT DEFAULT NULL,
    p_banco TEXT DEFAULT 'Bancolombia',
    p_tipo_cuenta TEXT DEFAULT 'ahorros',
    p_numero_cuenta TEXT DEFAULT NULL,
    p_titular_cuenta TEXT DEFAULT NULL,
    p_numero_documento TEXT DEFAULT '0'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE referidos.afiliados
    SET nombre = TRIM(p_nombre),
        email = LOWER(TRIM(p_email)),
        telefono = NULLIF(TRIM(p_telefono), ''),
        actualizado_en = NOW()
    WHERE id = p_afiliado_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Afiliado no encontrado.');
    END IF;

    INSERT INTO referidos.datos_pago (
        afiliado_id,
        banco,
        tipo_cuenta,
        numero_cuenta,
        titular_cuenta,
        numero_documento,
        actualizado_en
    ) VALUES (
        p_afiliado_id,
        COALESCE(NULLIF(TRIM(p_banco), ''), 'Bancolombia'),
        COALESCE(NULLIF(TRIM(p_tipo_cuenta), ''), 'ahorros'),
        COALESCE(NULLIF(TRIM(p_numero_cuenta), ''), '0'),
        COALESCE(NULLIF(TRIM(p_titular_cuenta), ''), TRIM(p_nombre)),
        COALESCE(NULLIF(TRIM(p_numero_documento), ''), '0'),
        NOW()
    )
    ON CONFLICT (afiliado_id) DO UPDATE
    SET banco = EXCLUDED.banco,
        tipo_cuenta = EXCLUDED.tipo_cuenta,
        numero_cuenta = EXCLUDED.numero_cuenta,
        titular_cuenta = EXCLUDED.titular_cuenta,
        numero_documento = EXCLUDED.numero_documento,
        actualizado_en = NOW();

    RETURN jsonb_build_object('success', true);
END;
$$;


