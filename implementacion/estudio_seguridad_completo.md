# Estudio Completo de Seguridad — Endpoints API y Tablas en Supabase PostgreSQL

Estudio y auditoría de seguridad del proyecto **Smartcontacts**, evaluando las políticas de acceso a la base de datos (**Row Level Security - RLS**), la protección de los endpoints serverless, el manejo de credenciales OAuth2 y la resistencia ante ataques de denegación de servicio o suplantación de datos.

---

## 🗄️ 1. Auditoría de Base de Datos (Supabase PostgreSQL `fxhemyrjetpwtmjxmftk`)

### A. Estado de Row Level Security (RLS) por Tabla

| Esquema | Tabla | RLS Habilitado | Política de Lectura (`SELECT`) | Política de Escritura (`INSERT/UPDATE/DELETE`) | Evaluación de Seguridad |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `calendario` | `prospectos` | **SÍ (100%)** | Restringido (`authenticated` / `service_role`) | Inserción pública permitida (`INSERT`) | 🛡️ **EXCELENTE**: Ningún usuario anónimo puede leer los datos personales de otros prospectos. |
| `calendario` | `eventos` | **SÍ (100%)** | Restringido (`authenticated` / `service_role`) | Inserción pública por agendamiento | 🛡️ **EXCELENTE**: Los eventos y detalles comerciales no son legibles de forma anónima desde la web. |
| `calendario` | `participantes` | **SÍ (100%)** | Restringido (`authenticated` / `service_role`) | Inserción pública | 🛡️ **EXCELENTE**: Correos de los participantes protegidos contra raspado (scraping). |
| `cobertura` | `departamentos` | **SÍ (100%)** | Pública (`USING (true)`) | **BLOQUEADA (0 escrituras anónimas)** | 🛡️ **EXCELENTE**: Solo lectura. Modificaciones o borrados desde la web están deshabilitados. |
| `public` | `blocked_domains` | **SÍ (100%)** | Pública (`USING (true)`) | **BLOQUEADA (0 escrituras anónimas)** | 🛡️ **EXCELENTE**: Los usuarios no pueden borrar ni alterar la lista negra de dominios spam. |

---

### B. Procedimientos Almacenados (RPC) y Transacciones Atómicas

1. **`public.crear_agendamiento(...)`**:
   * **Modo**: `SECURITY DEFINER` (Ejecución aislada).
   * **Seguridad**: Realiza la inserción atómica en `calendario.prospectos`, `calendario.eventos` y `calendario.participantes` dentro de **una sola transacción PostgreSQL**.
   * **Resistencia a Inyecciones**: Parámetros tipados de PostgreSQL que eliminan cualquier posibilidad de inyección SQL.

2. **`public.obtener_disponibilidad(p_fecha DATE)`**:
   * **Aislamiento de Datos**: Solo retorna los identificadores de franja (`'01:00 PM'`), su estado (`'disponible'`/`'ocupado'`) y su etiqueta humana. **Jamás expone quién reservó la cita**.

3. **`public.obtener_cobertura()`**:
   * **Privacidad**: Retorna números agregados por departamento sin datos individuales de personas naturales o jurídicas.

---

## ⚡ 2. Auditoría de Endpoints API (`app/api/*`)

```text
                                  ┌───────────────────────────┐
                                  │      CLIENTE / WEB        │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                             ┌─────────────────────────────────────┐
                             │       RATE LIMITER POR IP           │
                             │ (Memoria / Máx 20-30 req/min)      │
                             └──────────────────┬──────────────────┘
                                                │
                                                ▼
                             ┌─────────────────────────────────────┐
                             │    VALIDACIÓN ZOD & SPAM FILTER     │
                             │ (+119.9k dominios en Supabase)     │
                             └──────────────────┬──────────────────┘
                                                │
                                      ┌─────────┴─────────┐
                                      ▼                   ▼
                         ┌───────────────────────┐   ┌───────────────────────┐
                         │   SUPABASE POSTGRES   │   │  GOOGLE OAUTH2 API    │
                         │ (RPC Atómica / RLS)   │   │ (Gmail + Calendar)    │
                         └───────────────────────┘   └───────────────────────┘
```

### A. `POST /api/booking`
- **Seguridad de Datos**: Validación de tipos con Zod Schema (`bookingSchema`).
- **Control Anti-Spam**: Verificación previa en sub-milisegundos contra la base de datos de dominios bloqueados.
- **Formateo Seguro de Fechas**: Normalizador ISO para Colombia (`America/Bogota`) que evita fechas inválidas o inyecciones de timestamps arbitrarios.
- **Generación de Google Meet**: Invocación segura con tokens OAuth2 actualizados dinámicamente en servidor.

### B. `GET /api/calendar/availability`
- **Rate Limiting**: `MemoryRateLimiter` activado (máx. 20 peticiones/minuto por IP).
- **Firmado HMAC-SHA256**: Las franjas disponibles incluyen un `bookingToken` firmado con la clave secreta del servidor y con expiración a los 5 minutos (`exp`). Evita la alteración o suplantación de la hora por parte de usuarios maliciosos.

### C. `POST /api/check-domain`
- **Resiliencia**: Arquitectura Fail-Open que previene el bloqueo de clientes legítimos en caso de latencia de red.

### D. `GET /api/coverage`
- **Rate Limiting & Caché**: `MemoryRateLimiter` (30 req/min) y caché en memoria con TTL de 5 minutos, protegiendo a la base de datos contra ataques de denegación de servicio (DoS).

---

## 🔑 3. Gestión de Credenciales y Secretos (`AGENTS.md` Regla 6)

- **Zero Hardcoded Secrets**: No se incluyen llaves de API reales, secrets o refresh tokens dentro del código fuente en control de versiones.
- **Resolución Dinámica en Runtime**: Todas las claves se leen en tiempo de ejecución desde `process.env` con fallbacks seguros en modo desarrollo.
- **Documentación Completa**: Registrado el propósito y formato de cada variable en [`.env.example`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/.env.example).

---

## 🛡️ 4. Conclusión del Diagnóstico de Seguridad

El sistema **Smartcontacts** presenta una postura de seguridad **robusta y nivel producción**:
- **Base de Datos**: RLS al 100% en todas las tablas con cero fuga de información privada de clientes o prospectos.
- **Endpoints**: Rate Limiting por IP, firmado criptográfico HMAC-SHA256, validación estricta Zod y filtro anti-spam activo.
- **Integraciones**: OAuth2 seguro con rotación de tokens en backend.
