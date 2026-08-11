# Documentación Técnica — Migración de Cobertura Nacional a Supabase (`cobertura.departamentos`)

## 📋 1. Resumen de la Arquitectura

Se ha migrado el 100% de la información de cobertura nacional de personas naturales y jurídicas desde el archivo JSON estático a la base de datos **PostgreSQL en Supabase** (`fxhemyrjetpwtmjxmftk`), desacoplando por completo los datos del cliente web y protegiendo el servicio mediante un endpoint proxy en Next.js.

---

## 🗄️ 2. Base de Datos en Supabase (`cobertura.departamentos`)

### A. Estructura de la Tabla
```sql
CREATE SCHEMA IF NOT EXISTS cobertura;

CREATE TABLE IF NOT EXISTS cobertura.departamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  departamento text UNIQUE NOT NULL,
  personas_naturales bigint NOT NULL DEFAULT 0,
  personas_juridicas bigint NOT NULL DEFAULT 0,
  total bigint NOT NULL DEFAULT 0,
  naturales_camaras bigint NOT NULL DEFAULT 0,
  naturales_libranza bigint NOT NULL DEFAULT 0,
  actualizado_el timestamp with time zone DEFAULT now()
);
```

### B. Políticas RLS (Row Level Security)
```sql
ALTER TABLE cobertura.departamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica de cobertura"
  ON cobertura.departamentos FOR SELECT
  USING (true);
```

### C. Wrapper RPC público (`public.obtener_cobertura()`)
```sql
CREATE OR REPLACE FUNCTION public.obtener_cobertura()
RETURNS TABLE (
  departamento text,
  personas_naturales bigint,
  personas_juridicas bigint,
  total bigint,
  naturales_camaras bigint,
  naturales_libranza bigint
) AS $$
  SELECT
    d.departamento,
    d.personas_naturales,
    d.personas_juridicas,
    d.total,
    d.naturales_camaras,
    d.naturales_libranza
  FROM cobertura.departamentos d
  ORDER BY d.total DESC;
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 🔒 3. Seguridad y Endpoint Proxy Serverless (`/api/coverage`)

- **Ruta Serverless**: [`app/api/coverage/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/coverage/route.ts)
- **Rate Limiting por IP**: Máximo 30 peticiones por minuto para prevenir denegación de servicio o scraping.
- **Caché en Memoria (5 min TTL)**: Elimina la carga repetitiva a la base de datos y entrega respuestas a ~2 ms.

---

## 🎨 4. Desacoplamiento del Frontend ([`components/colombia-map-section.tsx`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/components/colombia-map-section.tsx))

- **JSON Purgado**: Se eliminó la importación del archivo estático `consolidado_total_personas_departamento.json`.
- **Carga Dinámica**: El componente consulta `/api/coverage` al montar la vista y renderiza dinámicamente el desglose de métricas al pasar el mouse por cada departamento.
