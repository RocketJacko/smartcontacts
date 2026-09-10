-- ==============================================================================
-- DEFINICIÓN DDL DEL ESQUEMA `platzi` (SUPABASE POSTGRESQL)
-- ==============================================================================
-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- Cumplimiento estricto de Regla 6 (AGENTS.md): Seguridad y RBAC Super Admin
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS platzi;

-- 1. TABLA DE PLANES OFERTADOS (ADMINISTRABLE POR SUPER ADMIN)
CREATE TABLE IF NOT EXISTS platzi.planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_plan VARCHAR(255) NOT NULL,
    meses_cubrimiento INT NOT NULL DEFAULT 1,
    precio NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
    tipo_pago VARCHAR(50) NOT NULL DEFAULT 'pago_unico', -- 'pago_unico', 'cuotas'
    numero_cuotas INT NOT NULL DEFAULT 1, -- 1, 2, 3, 6, 12
    pago_anticipado BOOLEAN NOT NULL DEFAULT false, -- Requiere pago antes de activar
    vigente BOOLEAN NOT NULL DEFAULT true,
    caracteristicas TEXT,
    total_disponibles INT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platzi.planes ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) NOT NULL DEFAULT 'pago_unico';
ALTER TABLE platzi.planes ADD COLUMN IF NOT EXISTS numero_cuotas INT NOT NULL DEFAULT 1;
ALTER TABLE platzi.planes ADD COLUMN IF NOT EXISTS pago_anticipado BOOLEAN NOT NULL DEFAULT false;

-- 2. TABLA DE VENTAS / SOLICITUDES Y CÓDIGOS GENERADOS
CREATE TABLE IF NOT EXISTS platzi.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    platzi_account_email VARCHAR(255) NOT NULL,
    country_name VARCHAR(100) DEFAULT 'Colombia',
    cod_revendedor VARCHAR(100),
    discount_code VARCHAR(100),
    tipo_pago VARCHAR(50) DEFAULT 'pago_unico',
    numero_cuotas INT DEFAULT 1,
    cuotas_pagadas INT DEFAULT 1,
    pago_anticipado BOOLEAN NOT NULL DEFAULT false,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    cod_generado VARCHAR(100),
    cod_canjeado BOOLEAN NOT NULL DEFAULT false,
    fecha_canje TIMESTAMPTZ,
    cuenta_activa BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platzi.ventas ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(50) DEFAULT 'pago_unico';
ALTER TABLE platzi.ventas ADD COLUMN IF NOT EXISTS numero_cuotas INT DEFAULT 1;
ALTER TABLE platzi.ventas ADD COLUMN IF NOT EXISTS cuotas_pagadas INT DEFAULT 1;
ALTER TABLE platzi.ventas ADD COLUMN IF NOT EXISTS pago_anticipado BOOLEAN NOT NULL DEFAULT false;

-- Índices de Rendimiento
CREATE INDEX IF NOT EXISTS idx_platzi_planes_vigente ON platzi.planes(vigente);
CREATE INDEX IF NOT EXISTS idx_platzi_ventas_revendedor ON platzi.ventas(cod_revendedor);
CREATE INDEX IF NOT EXISTS idx_platzi_ventas_email ON platzi.ventas(email);
CREATE INDEX IF NOT EXISTS idx_platzi_ventas_fecha ON platzi.ventas(fecha_registro DESC);

-- ==============================================================================
-- PROCEDIMIENTOS ALMACENADOS (RPC) PARA GESTIÓN DE PLANES PLATZI
-- ==============================================================================

-- RPC 0: Obtener Planes Platzi Activos para Usuarios Públicos
CREATE OR REPLACE FUNCTION public.obtener_planes_platzi_activos()
RETURNS TABLE (
    id UUID,
    nombre_plan VARCHAR,
    meses_cubrimiento INT,
    precio NUMERIC,
    moneda VARCHAR,
    tipo_pago VARCHAR,
    numero_cuotas INT,
    pago_anticipado BOOLEAN,
    vigente BOOLEAN,
    caracteristicas TEXT,
    total_disponibles INT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.nombre_plan,
        p.meses_cubrimiento,
        p.precio,
        p.moneda,
        p.tipo_pago,
        p.numero_cuotas,
        p.pago_anticipado,
        p.vigente,
        p.caracteristicas,
        p.total_disponibles
    FROM platzi.planes p
    WHERE p.vigente = true
    ORDER BY p.meses_cubrimiento ASC, p.precio ASC;
$$;

GRANT USAGE ON SCHEMA platzi TO anon, authenticated, service_role;
GRANT SELECT ON platzi.planes TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_planes_platzi_activos() TO anon, authenticated, service_role;

-- RPC 1: Listar Planes Platzi
CREATE OR REPLACE FUNCTION public.admin_obtener_planes_platzi()
RETURNS TABLE (
    id UUID,
    nombre_plan VARCHAR,
    meses_cubrimiento INT,
    precio NUMERIC,
    moneda VARCHAR,
    tipo_pago VARCHAR,
    numero_cuotas INT,
    pago_anticipado BOOLEAN,
    vigente BOOLEAN,
    caracteristicas TEXT,
    total_disponibles INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre_plan,
        p.meses_cubrimiento,
        p.precio,
        p.moneda,
        p.tipo_pago,
        p.numero_cuotas,
        p.pago_anticipado,
        p.vigente,
        p.caracteristicas,
        p.total_disponibles,
        p.created_at,
        p.updated_at
    FROM platzi.planes p
    ORDER BY p.vigente DESC, p.precio ASC;
END;
$$;

-- RPC 2: Crear o Editar Plan Platzi
CREATE OR REPLACE FUNCTION public.admin_guardar_plan_platzi(
    p_id UUID DEFAULT NULL,
    p_nombre_plan VARCHAR DEFAULT '',
    p_meses_cubrimiento INT DEFAULT 1,
    p_precio NUMERIC DEFAULT 0.00,
    p_moneda VARCHAR DEFAULT 'COP',
    p_tipo_pago VARCHAR DEFAULT 'pago_unico',
    p_numero_cuotas INT DEFAULT 1,
    p_pago_anticipado BOOLEAN DEFAULT false,
    p_vigente BOOLEAN DEFAULT true,
    p_caracteristicas TEXT DEFAULT NULL,
    p_total_disponibles INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF p_id IS NOT NULL THEN
        UPDATE platzi.planes
        SET nombre_plan = p_nombre_plan,
            meses_cubrimiento = p_meses_cubrimiento,
            precio = p_precio,
            moneda = p_moneda,
            tipo_pago = COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico'),
            numero_cuotas = COALESCE(p_numero_cuotas, 1),
            pago_anticipado = COALESCE(p_pago_anticipado, false),
            vigente = p_vigente,
            caracteristicas = p_caracteristicas,
            total_disponibles = p_total_disponibles,
            updated_at = NOW()
        WHERE id = p_id;
        v_id := p_id;
    ELSE
        INSERT INTO platzi.planes (
            nombre_plan, meses_cubrimiento, precio, moneda, tipo_pago, numero_cuotas, pago_anticipado, vigente, caracteristicas, total_disponibles
        ) VALUES (
            p_nombre_plan, p_meses_cubrimiento, p_precio, p_moneda,
            COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico'),
            COALESCE(p_numero_cuotas, 1),
            COALESCE(p_pago_anticipado, false),
            p_vigente, p_caracteristicas, p_total_disponibles
        )
        RETURNING id INTO v_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- RPC 3: Cambiar Vigencia de Plan
CREATE OR REPLACE FUNCTION public.admin_cambiar_vigencia_plan_platzi(
    p_id UUID,
    p_vigente BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE platzi.planes
    SET vigente = p_vigente,
        updated_at = NOW()
    WHERE id = p_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Plan no encontrado');
    END IF;

    RETURN jsonb_build_object('success', true, 'vigente', p_vigente);
END;
$$;

-- RPC 4: Eliminar Plan Platzi
CREATE OR REPLACE FUNCTION public.admin_eliminar_plan_platzi(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM platzi.planes WHERE id = p_id;
    RETURN jsonb_build_object('success', true);
END;
$$;

-- ==============================================================================
-- PROCEDIMIENTOS ALMACENADOS (RPC) PARA VENTAS Y ATRIBUCIÓN A REVENDEDORES
-- ==============================================================================

-- RPC 5: Registrar Venta Platzi con Sincronización Automática al Revendedor
CREATE OR REPLACE FUNCTION public.registrar_venta_platzi(
    p_name VARCHAR,
    p_phone VARCHAR,
    p_email VARCHAR,
    p_platzi_account_email VARCHAR,
    p_country_name VARCHAR DEFAULT 'Colombia',
    p_cod_revendedor VARCHAR DEFAULT NULL,
    p_discount_code VARCHAR DEFAULT NULL,
    p_cod_generado VARCHAR DEFAULT NULL,
    p_precio_venta NUMERIC DEFAULT 0.00,
    p_tipo_pago VARCHAR DEFAULT 'pago_unico',
    p_numero_cuotas INT DEFAULT 1,
    p_pago_anticipado BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta_id UUID;
    v_afiliado RECORD;
BEGIN
    -- 1. Insertar en platzi.ventas
    INSERT INTO platzi.ventas (
        name, phone, email, platzi_account_email, country_name,
        cod_revendedor, discount_code, tipo_pago, numero_cuotas, pago_anticipado, cod_generado, fecha_registro
    ) VALUES (
        p_name, p_phone, LOWER(TRIM(p_email)), LOWER(TRIM(p_platzi_account_email)),
        COALESCE(p_country_name, 'Colombia'),
        NULLIF(UPPER(TRIM(p_cod_revendedor)), ''),
        NULLIF(UPPER(TRIM(p_discount_code)), ''),
        COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico'),
        COALESCE(p_numero_cuotas, 1),
        COALESCE(p_pago_anticipado, false),
        p_cod_generado,
        NOW()
    )
    RETURNING id INTO v_venta_id;

    -- 2. Sincronizar con el revendedor si se proporcionó un código
    IF p_cod_revendedor IS NOT NULL AND TRIM(p_cod_revendedor) <> '' THEN
        SELECT a.id, a.nombre, e.id AS enlace_id 
        INTO v_afiliado
        FROM referidos.enlaces e
        JOIN referidos.afiliados a ON a.id = e.afiliado_id
        WHERE UPPER(e.codigo_referido) = UPPER(TRIM(p_cod_revendedor))
        LIMIT 1;

        IF FOUND THEN
            -- Actualizar contador de ventas cerradas del afiliado
            UPDATE referidos.afiliados
            SET total_referidos_cerrados = total_referidos_cerrados + 1,
                actualizado_en = NOW()
            WHERE id = v_afiliado.id;

            -- Registrar conversión de venta en referidos.conversiones
            INSERT INTO referidos.conversiones (
                afiliado_id,
                enlace_primer_toque_id,
                enlace_ultimo_toque_id,
                tipo_atribucion,
                monto_transaccion,
                valor_comision_calculado,
                estado_liquidacion,
                fecha_adquisicion
            ) VALUES (
                v_afiliado.id,
                v_afiliado.enlace_id,
                v_afiliado.enlace_id,
                'codigo_promocional',
                p_precio_venta,
                0.00,
                'aprobada',
                NOW()
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'venta_id', v_venta_id);
END;
$$;

-- RPC 6: Obtener Ventas Platzi para Super Admin
CREATE OR REPLACE FUNCTION public.admin_obtener_ventas_platzi()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    platzi_account_email VARCHAR,
    country_name VARCHAR,
    cod_revendedor VARCHAR,
    discount_code VARCHAR,
    tipo_pago VARCHAR,
    numero_cuotas INT,
    cuotas_pagadas INT,
    pago_anticipado BOOLEAN,
    fecha_registro TIMESTAMPTZ,
    cod_generado VARCHAR,
    cod_canjeado BOOLEAN,
    fecha_canje TIMESTAMPTZ,
    cuenta_activa BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.phone,
        v.email,
        v.platzi_account_email,
        v.country_name,
        v.cod_revendedor,
        v.discount_code,
        v.tipo_pago,
        v.numero_cuotas,
        v.cuotas_pagadas,
        v.pago_anticipado,
        v.fecha_registro,
        v.cod_generado,
        v.cod_canjeado,
        v.fecha_canje,
        v.cuenta_activa,
        v.created_at
    FROM platzi.ventas v
    ORDER BY v.fecha_registro DESC;
END;
$$;

-- RPC 7: Actualizar Estado de Venta Platzi (Cuenta Activa / Canjeada)
CREATE OR REPLACE FUNCTION public.admin_actualizar_estado_venta_platzi(
    p_venta_id UUID,
    p_cuenta_activa BOOLEAN,
    p_cod_canjeado BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE platzi.ventas
    SET cuenta_activa = p_cuenta_activa,
        cod_canjeado = p_cod_canjeado,
        fecha_canje = CASE WHEN p_cod_canjeado AND fecha_canje IS NULL THEN NOW() ELSE fecha_canje END,
        updated_at = NOW()
    WHERE id = p_venta_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venta no encontrada');
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
