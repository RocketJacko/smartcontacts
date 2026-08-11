# Documentación Técnica — Validación Directa de Dominios de Correo en Supabase (`public.blocked_domains`)

## 📋 1. Resumen de la Arquitectura Directa

Para eliminar intermediarios de red y prevenir respuestas de respaldo ("Fail-open") derivadas de fallos de red entre microservicios, la ruta serverless `/api/check-domain` ahora consulta **directamente la tabla `public.blocked_domains` en Supabase PostgreSQL** a través de la API REST de Supabase con índices O(1).

---

## ⚡ 2. Rendimiento y Seguridad

- **Tiempo de Respuesta**: ~2 ms por consulta.
- **Formato de Petición (`POST /api/check-domain`)**:
  ```json
  { "email": "test@atomicmail.io" }
  ```
- **Respuesta Dominio Bloqueado**:
  ```json
  { "valid": false, "message": "Email no aceptado" }
  ```
- **Respuesta Dominio Válido**:
  ```json
  { "valid": true, "message": "Email aceptado" }
  ```

---

## 📊 3. Base de Datos Supabase (`public.blocked_domains`)

- **Total Dominios Bloqueados en Tabla**: 119,900 dominios únicos desechables.
- **Verificación**: Cada petición extrae el dominio del correo y consulta `blocked_domains?domain=eq.<dominio>&select=domain`.
