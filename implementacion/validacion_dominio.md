# Documentación Técnica — Sistema de Validación y Bloqueo de Dominios Anti-Spam

## 📋 Resumen del Sistema

Este documento describe la arquitectura, implementación, seguridad y resolución de incidencias del sistema de validación de dominios de correo electrónico en tiempo real para **SmartContacts**. 

El objetivo principal es evitar agendamientos automáticos no deseados, spam y registros maliciosos utilizando una base de datos con **119,900+ dominios deschables y sospechosos**.

---

## 🗄️ 1. Creación de la Tabla en Supabase PostgreSQL

Se creó la tabla `public.blocked_domains` en el proyecto de Supabase `HerramientasPersonales` (`fxhemyrjetpwtmjxmftk`):

```sql
CREATE TABLE public.blocked_domains (
  domain text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone ('utc'::text, now()),
  CONSTRAINT blocked_domains_pkey PRIMARY KEY (domain)
) TABLESPACE pg_default;
```

### Características Técnicas:
* **Llave Primaria (`domain`)**: Al establecer `domain` como Primary Key, PostgreSQL crea automáticamente un índice único B-Tree. Esto permite realizar consultas en tiempo constante **$O(1)$** en sub-milisegundos, incluso con cientos de miles de registros.

---

## 📥 2. Inserción Masiva de Datos (Bulk Insert)

Para cargar el archivo CSV masivo (`blocked_domains_rows.csv`) de más de 120,000 líneas sin agotar el tiempo de espera ni colapsar la memoria del servidor, se construyó un script de automatización por lotes en Node.js:

```js
// Configuración del lote
const BATCH_SIZE = 5000;

// Envío en paquetes de 5,000 registros con cabecera de ignorar duplicados
const response = await fetch(`${SUPABASE_URL}/rest/v1/blocked_domains`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=ignore-duplicates'
  },
  body: JSON.stringify(payload)
});
```

### Resultados de la Carga:
* **Dominios Únicos e Insertados**: **119,900 dominios**
* **Lotes Ejecutados**: 24 paquetes de 5,000 registros.
* **Tiempo Total de Inserción**: ~22 segundos.

---

## ⚡ 3. Supabase Edge Function (`check-domain`)

Se desplegó una función Edge en Deno (`check-domain`) en la infraestructura serverless de Supabase:

* **Endpoint**: `https://fxhemyrjetpwtmjxmftk.supabase.co/functions/v1/check-domain`
* **Versión Activa**: 3
* **Caché en Memoria (TTL 5 min)**: Mantiene un `Map` interno en el Edge Runtime de Deno para responder a consultas repetidas sin necesidad de tocar la base de datos PostgreSQL.

### Código de la Edge Function (`index.ts`):

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const INTERNAL_APP_SECRET = "smartcontacts-internal-edge-secret-2026";
const domainCache = new Map<string, { valid: boolean; message: string; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Autenticación por Token Secreto
  const appSecret = req.headers.get("x-app-secret");
  if (appSecret !== INTERNAL_APP_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), { status: 401 });
  }

  try {
    const { email } = await req.json();
    const domain = email?.split("@")[1]?.toLowerCase().trim();
    if (!domain) return new Response(JSON.stringify({ valid: true }), { status: 200 });

    // Consulta en Caché de Memoria Edge
    const cached = domainCache.get(domain);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return new Response(JSON.stringify(cached), { status: 200 });
    }

    // Consulta en PostgreSQL
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data } = await supabase.from("blocked_domains").select("domain").eq("domain", domain).limit(1);

    const isBlocked = Array.isArray(data) && data.length > 0;
    const resObj = isBlocked ? { valid: false, message: "Email no aceptado" } : { valid: true, message: "Email aceptado" };

    domainCache.set(domain, { ...resObj, timestamp: Date.now() });
    return new Response(JSON.stringify(resObj), { status: 200 });
  } catch (err) {
    // Política Fail-Open: Si ocurre error, permite el acceso al usuario
    return new Response(JSON.stringify({ valid: true, message: "Fail-open" }), { status: 200 });
  }
});
```

---

## 🔒 4. Capa de Seguridad y Proxy Serverless (`/api/check-domain`)

Para evitar que los usuarios o atacantes puedan ver la URL pública de Supabase o las claves de API mediante las herramientas de desarrollo del navegador (F12), se creó la ruta proxy `/api/check-domain/route.ts` en Next.js.

```mermaid
flowchart LR
    A["Navegador Cliente"] -->|1. POST /api/check-domain| B["Servidor Next.js (Proxy)"]
    B -->|2. POST + x-app-secret| C["Supabase Edge Function"]
    C -->|3. Consulta O(1)| D[("PostgreSQL blocked_domains")]
    D -->|4. Resultado| C
    C -->|5. {valid: true/false}| B
    B -->|6. Respuesta limpia| A
```

### Escudo Defensivo:
1. **Ocultación Total**: El navegador únicamente conoce la ruta relativa `/api/check-domain`.
2. **Cabecera Secreta `x-app-secret`**: La Edge Function solo acepta peticiones que incluyan el token interno del servidor. Cualquier petición directa desde fuera recibe un **HTTP 401 Unauthorized**.

---

## 🎨 5. Validación e Interfaz de Usuario (UI)

Se integró la validación en tiempo real en los componentes [`components/booking-section.tsx`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/components/booking-section.tsx) y [`app/landing/page.tsx`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/landing/page.tsx):

* **Evento `onBlur`**: La verificación se dispara cuando el usuario sale del campo de correo electrónico.
* **Diseño Sutil de Alerta**:
  * El recuadro cambia a borde y fondo rojo (`border-rose-500 bg-rose-500/5`).
  * Se despliega el mensaje textual en rojo bajo el input:  
    `⚠️ Email no aceptado`
  * **Sin ventanas emergentes ni alertas intrusivas**: El formulario bloquea la transición o envío hasta corregir el correo.

---

## 🛠️ 6. Resolución de Falsos Positivos & Política "Fail-Open"

### Diagnóstico de Incidencia:
Al probar la aplicación detrás de servidores de producción (como Dokploy / Nginx / Docker Swarm), todas las peticiones entrantes compartían la dirección IP de la puerta de enlace del contenedor (`10.0.1.1`). 

Esto provocó que un límite de peticiones estricto marcara como "agotadas" las peticiones a los pocos segundos, retornando un error que provocaba que **correos válidos mostraran falsamente `Email no aceptado`**.

### Solución Aplicada:
1. **Ampliación de Límite**: Se elevó el umbral a **500 peticiones por minuto**.
2. **Estrategia "Fail-Open"**: Si por cualquier razón la conexión falla, se supera un límite o la base de datos se satura, el sistema responde por defecto `{ valid: true }`. Esto garantiza que **un usuario legítimo NUNCA será bloqueado por un fallo de infraestructura**.
