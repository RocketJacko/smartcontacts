-- ==============================================================================
-- MIGRACIÓN DDL: UNIFICACIÓN DE PLANES PLATZI, OFERTAS ESPECIALES Y CUOTAS
-- ==============================================================================
-- Cumplimiento estricto de Regla 5 (AGENTS.md): Nomenclatura por Esquemas (`schema.nombre_tabla`)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS platzi;
CREATE SCHEMA IF NOT EXISTS referidos;

-- ==============================================================================
-- 1. EXTENDER `platzi.planes` CON SOPORTE DE OFERTAS ESPECIALES Y CUOTAS
-- ==============================================================================
ALTER TABLE platzi.planes 
    ADD COLUMN IF NOT EXISTS es_oferta_especial BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS codigo_oferta VARCHAR(100) UNIQUE,
    ADD COLUMN IF NOT EXISTS institucion_empresa VARCHAR(255),
    ADD COLUMN IF NOT EXISTS admite_cuotas BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS max_cuotas INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS cupos_maximos INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS cupos_usados INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMPTZ;

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_platzi_planes_oferta ON platzi.planes(es_oferta_especial);
CREATE INDEX IF NOT EXISTS idx_platzi_planes_codigo_oferta ON platzi.planes(codigo_oferta);

-- Migrar datos históricos de referidos.ofertas_especiales si la tabla existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'referidos' AND table_name = 'ofertas_especiales') THEN
        INSERT INTO platzi.planes (
            nombre_plan,
            codigo_oferta,
            institucion_empresa,
            meses_cubrimiento,
            precio,
            moneda,
            es_oferta_especial,
            admite_cuotas,
            max_cuotas,
            pago_anticipado,
            cupos_maximos,
            cupos_usados,
            vigente,
            fecha_inicio,
            fecha_fin
        )
        SELECT 
            titulo,
            codigo_oferta,
            institucion_empresa,
            meses_cubrimiento,
            precio_cop,
            'COP',
            true,
            (tipo_pago = 'cuotas' OR numero_cuotas > 1),
            COALESCE(numero_cuotas, 1),
            pago_anticipado,
            cupos_maximos,
            cupos_usados,
            activo,
            fecha_inicio,
            fecha_fin
        FROM referidos.ofertas_especiales
        ON CONFLICT (codigo_oferta) DO UPDATE SET
            institucion_empresa = EXCLUDED.institucion_empresa,
            precio = EXCLUDED.precio,
            cupos_maximos = EXCLUDED.cupos_maximos;
    END IF;
END $$;

-- ==============================================================================
-- 2. ASOCIAR `referidos.enlaces` CON `platzi.planes`
-- ==============================================================================
-- plan_id = NULL: Enlace de catálogo estándar tradicional
-- plan_id = UUID: Enlace específico para un plan de convenio / oferta especial
ALTER TABLE referidos.enlaces
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES platzi.planes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_referidos_enlaces_plan ON referidos.enlaces(plan_id);

-- ==============================================================================
-- 3. MEJORAR `platzi.ventas` CON CLAVES FORÁNEAS REALES
-- ==============================================================================
ALTER TABLE platzi.ventas
    ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES platzi.planes(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS afiliado_id UUID REFERENCES referidos.afiliados(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enlace_id UUID REFERENCES referidos.enlaces(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS token_sesion_atribucion VARCHAR(255),
    ADD COLUMN IF NOT EXISTS monto_total NUMERIC(14, 2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS moneda VARCHAR(10) DEFAULT 'COP';

CREATE INDEX IF NOT EXISTS idx_platzi_ventas_plan ON platzi.ventas(plan_id);
CREATE INDEX IF NOT EXISTS idx_platzi_ventas_afiliado ON platzi.ventas(afiliado_id);
CREATE INDEX IF NOT EXISTS idx_platzi_ventas_enlace ON platzi.ventas(enlace_id);

-- ==============================================================================
-- 4. CREAR TABLA ATÓMICA DE CUOTAS (`platzi.pagos_cuotas`)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS platzi.pagos_cuotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES platzi.ventas(id) ON DELETE CASCADE,
    numero_cuota INT NOT NULL DEFAULT 1,
    monto NUMERIC(14, 2) NOT NULL,
    moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMPTZ,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'pagado', 'en_mora', 'anulado')),
    metodo_pago VARCHAR(50),
    referencia_pago VARCHAR(100),
    comprobante_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platzi_pagos_cuotas_venta ON platzi.pagos_cuotas(venta_id);
CREATE INDEX IF NOT EXISTS idx_platzi_pagos_cuotas_estado ON platzi.pagos_cuotas(estado);
CREATE INDEX IF NOT EXISTS idx_platzi_pagos_cuotas_vencimiento ON platzi.pagos_cuotas(fecha_vencimiento);

-- ==============================================================================
-- 5. MEJORAR `referidos.conversiones` PARA VINCULAR DIRECTAMENTE A VENTAS
-- ==============================================================================
ALTER TABLE referidos.conversiones
    ADD COLUMN IF NOT EXISTS venta_id UUID UNIQUE REFERENCES platzi.ventas(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS enlace_id UUID REFERENCES referidos.enlaces(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS valor_comision NUMERIC(14, 2) DEFAULT 0.00;

-- Permitir que prospecto_id sea opcional si existía la columna
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'referidos' AND table_name = 'conversiones' AND column_name = 'prospecto_id'
    ) THEN
        ALTER TABLE referidos.conversiones ALTER COLUMN prospecto_id DROP NOT NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_referidos_conversiones_venta ON referidos.conversiones(venta_id);

-- ==============================================================================
-- 6. PROCEDIMIENTO ALMACENADO OFICIAL DE REGISTRO DE VENTA PLATZI (RPC)
-- ==============================================================================
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
    p_pago_anticipado BOOLEAN DEFAULT false,
    p_plan_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta_id UUID;
    v_afiliado_id UUID := NULL;
    v_enlace_id UUID := NULL;
    v_plan_id UUID := p_plan_id;
    v_num_cuotas INT := GREATEST(COALESCE(p_numero_cuotas, 1), 1);
    v_tipo_pago VARCHAR := COALESCE(NULLIF(TRIM(p_tipo_pago), ''), 'pago_unico');
    v_monto_cuota NUMERIC;
    v_i INT;
BEGIN
    -- 1. Resolver enlace y afiliado si se proporcionó código de revendedor
    IF p_cod_revendedor IS NOT NULL AND TRIM(p_cod_revendedor) <> '' THEN
        SELECT e.id, e.afiliado_id, e.plan_id
        INTO v_enlace_id, v_afiliado_id, v_plan_id
        FROM referidos.enlaces e
        WHERE UPPER(TRIM(e.codigo_referido)) = UPPER(TRIM(p_cod_revendedor))
           OR UPPER(TRIM(e.slug_personalizado)) = UPPER(TRIM(p_cod_revendedor))
        LIMIT 1;

        -- Si el enlace tiene un plan específico asignado y no se pasó explícitamente uno, adoptarlo
        IF p_plan_id IS NULL AND v_plan_id IS NOT NULL THEN
            -- v_plan_id ya fue tomado de e.plan_id
        ELSE
            v_plan_id := COALESCE(p_plan_id, v_plan_id);
        END IF;
    END IF;

    -- 2. Si aún no hay plan_id pero hay un discount_code de oferta especial, buscar en platzi.planes
    IF v_plan_id IS NULL AND p_discount_code IS NOT NULL AND TRIM(p_discount_code) <> '' THEN
        SELECT id INTO v_plan_id
        FROM platzi.planes
        WHERE UPPER(TRIM(codigo_oferta)) = UPPER(TRIM(p_discount_code))
        LIMIT 1;
    END IF;

    -- 3. Fallback: Si no hay plan_id, tomar el primer plan vigente
    IF v_plan_id IS NULL THEN
        SELECT id INTO v_plan_id
        FROM platzi.planes
        WHERE vigente = true
        ORDER BY precio ASC
        LIMIT 1;
    END IF;

    -- 4. Insertar venta en platzi.ventas con claves foráneas
    INSERT INTO platzi.ventas (
        name, phone, email, platzi_account_email, country_name,
        cod_revendedor, discount_code, tipo_pago, numero_cuotas, pago_anticipado,
        cod_generado, fecha_registro, plan_id, afiliado_id, enlace_id, monto_total
    ) VALUES (
        TRIM(p_name), TRIM(p_phone), LOWER(TRIM(p_email)), LOWER(TRIM(p_platzi_account_email)),
        COALESCE(p_country_name, 'Colombia'),
        NULLIF(UPPER(TRIM(p_cod_revendedor)), ''),
        NULLIF(UPPER(TRIM(p_discount_code)), ''),
        v_tipo_pago,
        v_num_cuotas,
        COALESCE(p_pago_anticipado, false),
        p_cod_generado,
        NOW(),
        v_plan_id,
        v_afiliado_id,
        v_enlace_id,
        COALESCE(p_precio_venta, 0.00)
    )
    RETURNING id INTO v_venta_id;

    -- 5. Generar desglose interactivo en platzi.pagos_cuotas
    IF p_precio_venta > 0 THEN
        v_monto_cuota := ROUND(p_precio_venta / v_num_cuotas, 2);
        
        FOR v_i IN 1..v_num_cuotas LOOP
            INSERT INTO platzi.pagos_cuotas (
                venta_id,
                numero_cuota,
                monto,
                moneda,
                fecha_vencimiento,
                fecha_pago,
                estado,
                metodo_pago
            ) VALUES (
                v_venta_id,
                v_i,
                CASE WHEN v_i = v_num_cuotas 
                     THEN p_precio_venta - (v_monto_cuota * (v_num_cuotas - 1)) 
                     ELSE v_monto_cuota 
                END,
                'COP',
                (CURRENT_DATE + ((v_i - 1) * INTERVAL '30 days'))::DATE,
                CASE WHEN v_i = 1 AND p_pago_anticipado THEN NOW() ELSE NULL END,
                CASE WHEN v_i = 1 AND p_pago_anticipado THEN 'pagado' ELSE 'pendiente' END,
                'Acuerdo inicial'
            );
        END LOOP;
    END IF;

    -- 6. Si el plan es oferta especial, incrementar cupos_usados
    IF v_plan_id IS NOT NULL THEN
        UPDATE platzi.planes
        SET cupos_usados = cupos_usados + 1,
            updated_at = NOW()
        WHERE id = v_plan_id AND es_oferta_especial = true;
    END IF;

    -- 7. Registrar conversión para el afiliado si existe
    IF v_afiliado_id IS NOT NULL THEN
        -- Incrementar contador de ventas cerradas del afiliado
        UPDATE referidos.afiliados
        SET total_referidos_cerrados = total_referidos_cerrados + 1,
            actualizado_en = NOW()
        WHERE id = v_afiliado_id;

        -- Registrar en referidos.conversiones (1:1 con la venta)
        INSERT INTO referidos.conversiones (
            afiliado_id,
            enlace_id,
            venta_id,
            tipo_atribucion,
            monto_transaccion,
            valor_comision_calculado,
            estado_liquidacion,
            fecha_adquisicion
        ) VALUES (
            v_afiliado_id,
            v_enlace_id,
            v_venta_id,
            'enlace_o_codigo',
            COALESCE(p_precio_venta, 0.00),
            0.00,
            'aprobada',
            NOW()
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'venta_id', v_venta_id,
        'plan_id', v_plan_id,
        'afiliado_id', v_afiliado_id,
        'cuotas_generadas', v_num_cuotas
    );
END;
$$;

-- ==============================================================================
-- 7. PROCEDIMIENTOS ALMACENADOS DE OFERTAS ESPECIALES UNIFICADAS SOBRE `platzi.planes`
-- ==============================================================================

-- RPC: Listar Ofertas Especiales desde platzi.planes
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
            'id', p.id,
            'codigo_oferta', p.codigo_oferta,
            'titulo', p.nombre_plan,
            'descripcion', p.caracteristicas,
            'institucion_empresa', p.institucion_empresa,
            'precio_cop', p.precio,
            'precio_usd', ROUND(p.precio / 4000.0, 2),
            'meses_cubrimiento', p.meses_cubrimiento,
            'tipo_pago', CASE WHEN p.admite_cuotas OR p.max_cuotas > 1 THEN 'cuotas' ELSE 'pago_unico' END,
            'numero_cuotas', COALESCE(p.max_cuotas, 1),
            'pago_anticipado', COALESCE(p.pago_anticipado, false),
            'caracteristicas', jsonb_build_array(COALESCE(p.caracteristicas, '')),
            'afiliado_id', e.afiliado_id,
            'afiliado_nombre', a.nombre,
            'afiliado_email', a.email,
            'codigo_referido', e.codigo_referido,
            'fecha_inicio', p.fecha_inicio,
            'fecha_fin', p.fecha_fin,
            'cupos_maximos', p.cupos_maximos,
            'cupos_usados', p.cupos_usados,
            'activo', p.vigente,
            'creado_en', p.created_at,
            'actualizado_en', p.updated_at
        ) ORDER BY p.created_at DESC
    ) INTO v_result
    FROM platzi.planes p
    LEFT JOIN referidos.enlaces e ON e.plan_id = p.id AND e.activo = true
    LEFT JOIN referidos.afiliados a ON e.afiliado_id = a.id
    WHERE p.es_oferta_especial = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- RPC: Crear Oferta Especial (guardando en platzi.planes y asociando a referidos.enlaces si hay afiliado)
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
    p_numero_cuotas INT DEFAULT 1,
    p_pago_anticipado BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_code TEXT := UPPER(TRIM(p_codigo_oferta));
    v_plan_id UUID;
    v_caract_str TEXT;
BEGIN
    IF v_clean_code IS NULL OR v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código de oferta es requerido.');
    END IF;

    IF EXISTS (SELECT 1 FROM platzi.planes WHERE UPPER(codigo_oferta) = v_clean_code) THEN
        RETURN jsonb_build_object('success', false, 'error', 'El código de oferta ya se encuentra registrado.');
    END IF;

    -- Extraer texto de características
    IF p_caracteristicas IS NOT NULL AND jsonb_typeof(p_caracteristicas) = 'array' THEN
        SELECT string_agg(elem::text, ' | ') INTO v_caract_str
        FROM jsonb_array_elements_text(p_caracteristicas) AS elem;
    ELSE
        v_caract_str := p_descripcion;
    END IF;

    INSERT INTO platzi.planes (
        nombre_plan,
        codigo_oferta,
        institucion_empresa,
        meses_cubrimiento,
        precio,
        moneda,
        es_oferta_especial,
        admite_cuotas,
        max_cuotas,
        tipo_pago,
        numero_cuotas,
        pago_anticipado,
        cupos_maximos,
        caracteristicas,
        vigente,
        fecha_fin
    ) VALUES (
        TRIM(p_titulo),
        v_clean_code,
        TRIM(p_institucion_empresa),
        COALESCE(p_meses_cubrimiento, 12),
        p_precio_cop,
        'COP',
        true,
        (p_tipo_pago = 'cuotas' OR p_numero_cuotas > 1),
        COALESCE(p_numero_cuotas, 1),
        COALESCE(p_tipo_pago, 'pago_unico'),
        COALESCE(p_numero_cuotas, 1),
        COALESCE(p_pago_anticipado, false),
        p_cupos_maximos,
        COALESCE(v_caract_str, p_descripcion),
        true,
        p_fecha_fin
    )
    RETURNING id INTO v_plan_id;

    -- Si se asignó un afiliado, crear o actualizar enlace asociado
    IF p_afiliado_id IS NOT NULL THEN
        INSERT INTO referidos.enlaces (
            afiliado_id,
            plan_id,
            codigo_referido,
            slug_personalizado,
            url_destino,
            activo
        ) VALUES (
            p_afiliado_id,
            v_plan_id,
            v_clean_code,
            LOWER(v_clean_code),
            'https://smartcontacts.cloud/beneficios/platzi?oferta=' || v_clean_code,
            true
        )
        ON CONFLICT (codigo_referido) DO UPDATE SET
            plan_id = v_plan_id,
            afiliado_id = p_afiliado_id,
            activo = true;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', v_plan_id, 'codigo_oferta', v_clean_code);
END;
$$;

-- RPC: Actualizar Oferta Especial
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
    p_numero_cuotas INT DEFAULT 1,
    p_pago_anticipado BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caract_str TEXT;
BEGIN
    IF p_caracteristicas IS NOT NULL AND jsonb_typeof(p_caracteristicas) = 'array' THEN
        SELECT string_agg(elem::text, ' | ') INTO v_caract_str
        FROM jsonb_array_elements_text(p_caracteristicas) AS elem;
    ELSE
        v_caract_str := p_descripcion;
    END IF;

    UPDATE platzi.planes
    SET nombre_plan = TRIM(p_titulo),
        caracteristicas = COALESCE(v_caract_str, p_descripcion),
        institucion_empresa = TRIM(p_institucion_empresa),
        precio = p_precio_cop,
        meses_cubrimiento = COALESCE(p_meses_cubrimiento, 12),
        admite_cuotas = (p_tipo_pago = 'cuotas' OR p_numero_cuotas > 1),
        max_cuotas = COALESCE(p_numero_cuotas, 1),
        tipo_pago = COALESCE(p_tipo_pago, 'pago_unico'),
        numero_cuotas = COALESCE(p_numero_cuotas, 1),
        pago_anticipado = COALESCE(p_pago_anticipado, false),
        cupos_maximos = p_cupos_maximos,
        fecha_fin = p_fecha_fin,
        updated_at = NOW()
    WHERE id = p_id;

    -- Actualizar enlace de afiliado si fue especificado
    IF p_afiliado_id IS NOT NULL THEN
        UPDATE referidos.enlaces
        SET afiliado_id = p_afiliado_id
        WHERE plan_id = p_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$;

-- RPC: Alternar Vigencia de Oferta
CREATE OR REPLACE FUNCTION public.admin_toggle_oferta(
    p_id UUID,
    p_activo BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE platzi.planes
    SET vigente = p_activo,
        updated_at = NOW()
    WHERE id = p_id;

    -- Sincronizar estado de enlaces vinculados
    UPDATE referidos.enlaces
    SET activo = p_activo
    WHERE plan_id = p_id;

    RETURN jsonb_build_object('success', true, 'id', p_id, 'activo', p_activo);
END;
$$;

-- RPC: Eliminar Oferta Especial
CREATE OR REPLACE FUNCTION public.admin_eliminar_oferta(
    p_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Desasociar enlaces primero
    DELETE FROM referidos.enlaces WHERE plan_id = p_id;
    
    -- Eliminar plan de oferta especial
    DELETE FROM platzi.planes WHERE id = p_id AND es_oferta_especial = true;

    RETURN jsonb_build_object('success', true, 'id', p_id);
END;
$$;

-- RPC: Obtener Oferta Pública
CREATE OR REPLACE FUNCTION public.obtener_oferta_publica(p_codigo TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clean_code TEXT := UPPER(TRIM(p_codigo));
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'id', p.id,
        'codigo_oferta', p.codigo_oferta,
        'titulo', p.nombre_plan,
        'descripcion', p.caracteristicas,
        'institucion_empresa', p.institucion_empresa,
        'precio_cop', p.precio,
        'precio_usd', ROUND(p.precio / 4000.0, 2),
        'meses_cubrimiento', p.meses_cubrimiento,
        'tipo_pago', CASE WHEN p.admite_cuotas OR p.max_cuotas > 1 THEN 'cuotas' ELSE 'pago_unico' END,
        'numero_cuotas', COALESCE(p.max_cuotas, 1),
        'pago_anticipado', COALESCE(p.pago_anticipado, false),
        'caracteristicas', jsonb_build_array(COALESCE(p.caracteristicas, '')),
        'cupos_maximos', p.cupos_maximos,
        'cupos_usados', p.cupos_usados,
        'cupos_disponibles', CASE 
            WHEN p.cupos_maximos IS NULL THEN NULL 
            ELSE GREATEST(0, p.cupos_maximos - p.cupos_usados) 
        END,
        'es_vigente', (
            p.vigente = true 
            AND (p.fecha_fin IS NULL OR p.fecha_fin > NOW())
            AND (p.cupos_maximos IS NULL OR p.cupos_usados < p.cupos_maximos)
        )
    ) INTO v_result
    FROM platzi.planes p
    WHERE UPPER(p.codigo_oferta) = v_clean_code
    LIMIT 1;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Oferta especial no encontrada o inactiva');
    END IF;

    RETURN jsonb_build_object('valido', true, 'oferta', v_result);
END;
$$;

-- Permisos RPC
GRANT USAGE ON SCHEMA platzi TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA referidos TO anon, authenticated, service_role;
GRANT ALL ON TABLE platzi.pagos_cuotas TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_venta_platzi TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_listar_ofertas TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_crear_oferta TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_actualizar_oferta TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_eliminar_oferta TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_oferta_publica TO anon, authenticated, service_role;

-- ==============================================================================
-- 8. PLAN OFICIAL DE OFERTA ESPECIAL PYTHONCODE (1 AÑO - PAGO ANTICIPADO)
-- ==============================================================================
INSERT INTO platzi.planes (
    nombre_plan,
    codigo_oferta,
    institucion_empresa,
    meses_cubrimiento,
    precio,
    moneda,
    es_oferta_especial,
    admite_cuotas,
    max_cuotas,
    tipo_pago,
    numero_cuotas,
    pago_anticipado,
    vigente,
    caracteristicas
) VALUES (
    'Plan Platzi 1 Año — Oferta PYTHONCODE',
    'PYTHONCODE',
    'Comunidad Python & Convenio Especial',
    12,
    95000,
    'COP',
    true,
    false,
    1,
    'pago_unico',
    1,
    true,
    true,
    'Acceso completo por 1 año a todas las rutas de aprendizaje y escuelas de Platzi'
) ON CONFLICT (codigo_oferta) DO UPDATE SET
    pago_anticipado = true,
    meses_cubrimiento = 12,
    vigente = true;
