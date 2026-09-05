-- ==============================================================================
-- ESQUEMA DE SEGURIDAD, PERFILES Y CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Proyecto: SmartContacts AI Agents
-- Cumplimiento estricto de Regla 5 (Nomenclatura por Esquemas: `seguridad.*`)
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS seguridad;

-- 1. TABLA DE PERFILES DE USUARIO
-- Extiende los datos nativos de `auth.users` sin modificar el esquema interno de Supabase
CREATE TABLE IF NOT EXISTS seguridad.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT,
    rol TEXT NOT NULL CHECK (rol IN ('super_admin', 'admin', 'user')) DEFAULT 'user',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda para optimización O(1)
CREATE INDEX IF NOT EXISTS idx_seguridad_perfiles_email ON seguridad.perfiles(email);
CREATE INDEX IF NOT EXISTS idx_seguridad_perfiles_rol ON seguridad.perfiles(rol);

-- 2. FUNCIÓN Y TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA DESDE auth.users
-- Asigna automáticamente 'super_admin' a jesus.carmona966@pascualbravo.edu.co
CREATE OR REPLACE FUNCTION seguridad.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_rol TEXT;
    v_nombre TEXT;
BEGIN
    -- Determinar rol inicial
    IF LOWER(NEW.email) = 'jesus.carmona966@pascualbravo.edu.co' THEN
        v_rol := 'super_admin';
    ELSE
        v_rol := 'user';
    END IF;

    -- Extraer nombre de los metadatos o prefijo del correo
    v_nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', SPLIT_PART(NEW.email, '@', 1));

    INSERT INTO seguridad.perfiles (id, email, nombre, rol, activo, created_at, updated_at)
    VALUES (NEW.id, LOWER(NEW.email), v_nombre, v_rol, TRUE, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger asociado a la tabla nativa auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION seguridad.handle_new_user();

-- 3. TABLA DE AUDITORÍA Y CONTROL DE RATE LIMITING (ANTI-FUERZA BRUTA)
CREATE TABLE IF NOT EXISTS seguridad.intentos_login (
    id BIGSERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    email TEXT,
    exitoso BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seguridad_intentos_ip_created ON seguridad.intentos_login(ip, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seguridad_intentos_email_created ON seguridad.intentos_login(email, created_at DESC);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE seguridad.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguridad.intentos_login ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura de perfil propio para cualquier usuario autenticado
DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON seguridad.perfiles;
CREATE POLICY "Usuarios leen su propio perfil"
    ON seguridad.perfiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Política 2: Actualización de datos propios básicos (nombre)
DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil basico" ON seguridad.perfiles;
CREATE POLICY "Usuarios actualizan su propio perfil basico"
    ON seguridad.perfiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política 3: Gobernanza Total para el Super Admin
-- El super_admin puede ver, crear, actualizar roles y desactivar cualquier perfil
DROP POLICY IF EXISTS "Super Admin tiene acceso total a perfiles" ON seguridad.perfiles;
CREATE POLICY "Super Admin tiene acceso total a perfiles"
    ON seguridad.perfiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM seguridad.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'super_admin' AND p.activo = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM seguridad.perfiles p
            WHERE p.id = auth.uid() AND p.rol = 'super_admin' AND p.activo = TRUE
        )
    );

-- Política 4: Service Role puede gestionar auditoría y perfiles en el backend
DROP POLICY IF EXISTS "Service Role administra perfiles e intentos" ON seguridad.perfiles;
CREATE POLICY "Service Role administra perfiles e intentos"
    ON seguridad.perfiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service Role administra intentos login" ON seguridad.intentos_login;
CREATE POLICY "Service Role administra intentos login"
    ON seguridad.intentos_login FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 5. FUNCIONES RPC DE SEGURIDAD Y PERFILES
-- Permite acceso seguro y controlado desde el cliente y backend
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.obtener_mi_perfil()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_perfil RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('error', 'No autenticado');
    END IF;

    SELECT id, email, nombre, rol, activo, ultimo_login, created_at
    INTO v_perfil
    FROM seguridad.perfiles
    WHERE id = v_user_id;

    IF NOT FOUND THEN
        INSERT INTO seguridad.perfiles (id, email, nombre, rol, activo)
        SELECT id, LOWER(email), SPLIT_PART(email, '@', 1),
               CASE WHEN LOWER(email) = 'jesus.carmona966@pascualbravo.edu.co' THEN 'super_admin' ELSE 'user' END,
               TRUE
        FROM auth.users
        WHERE id = v_user_id
        RETURNING id, email, nombre, rol, activo, ultimo_login, created_at INTO v_perfil;
    END IF;

    RETURN to_jsonb(v_perfil);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.registrar_login_exitoso(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE seguridad.perfiles
    SET ultimo_login = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.obtener_todos_los_perfiles()
RETURNS JSONB AS $$
DECLARE
    v_rol TEXT;
    v_resultado JSONB;
BEGIN
    SELECT rol INTO v_rol
    FROM seguridad.perfiles
    WHERE id = auth.uid();

    IF v_rol != 'super_admin' THEN
        RETURN jsonb_build_object('error', 'Acceso denegado: se requiere rol super_admin');
    END IF;

    SELECT jsonb_agg(to_jsonb(p))
    INTO v_resultado
    FROM (
        SELECT id, email, nombre, rol, activo, ultimo_login, created_at
        FROM seguridad.perfiles
        ORDER BY created_at DESC
    ) p;

    RETURN COALESCE(v_resultado, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.actualizar_rol_usuario(p_target_id UUID, p_nuevo_rol TEXT)
RETURNS JSONB AS $$
DECLARE
    v_rol_solicitante TEXT;
BEGIN
    SELECT rol INTO v_rol_solicitante
    FROM seguridad.perfiles
    WHERE id = auth.uid();

    IF v_rol_solicitante != 'super_admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'No autorizado: se requiere super_admin');
    END IF;

    IF p_nuevo_rol NOT IN ('super_admin', 'admin', 'user') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Rol inválido');
    END IF;

    UPDATE seguridad.perfiles
    SET rol = p_nuevo_rol,
        updated_at = NOW()
    WHERE id = p_target_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.obtener_mi_perfil() TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_login_exitoso(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.obtener_todos_los_perfiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.actualizar_rol_usuario(UUID, TEXT) TO authenticated;

