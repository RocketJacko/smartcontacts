# Documentación Técnica — Refactorización Arquitectónica Clean Architecture & SOLID

## 📋 1. Resumen de la Refactorización

Se ha estructurado y limpiado el código del proyecto aplicando la arquitectura en capas **Clean Architecture** y los principios **SOLID**, independizando las reglas de negocio de la infraestructura y de los controladores de la capa de presentación.

---

## 🏛️ 2. Estructura de Capas Creadas

```text
lib/
├── domain/                      # Capa de Dominio (Entidades e Interfaces puras)
│   ├── entities/                # Definen la estructura fundamental del negocio
│   │   ├── booking.ts
│   │   ├── coverage.ts
│   │   └── domain-security.ts
│   └── interfaces/              # Contratos de dependencias (DIP)
│       ├── i-rate-limiter.ts
│       ├── i-domain-validator.ts
│       ├── i-calendar-repository.ts
│       ├── i-coverage-repository.ts
│       └── i-email-service.ts
│
├── infrastructure/              # Capa de Infraestructura (Implementaciones concretas)
│   ├── supabase/                # Cliente unificado y helpers REST/RPC
│   │   └── supabase-client.ts
│   ├── security/                # Rate limiter inmutable en memoria
│   │   └── memory-rate-limiter.ts
│   ├── repositories/            # Implementación concreta de repositorios
│   │   ├── supabase-calendar-repository.ts
│   │   ├── supabase-coverage-repository.ts
│   │   └── supabase-domain-validator.ts
│   └── email/                   # Cliente Gmail OAuth2 REST v1
│       └── gmail-email-service.ts
│
└── use-cases/                   # Capa de Casos de Uso (Orquestación de Negocio)
    ├── check-domain-use-case.ts
    ├── get-availability-use-case.ts
    ├── get-coverage-use-case.ts
    └── process-booking-use-case.ts
```

---

## 🛠️ 3. Principios SOLID Aplicados

1. **SRP (Single Responsibility Principle)**:
   - `MemoryRateLimiter`: Únicamente responsable del control de frecuencia por IP.
   - `GmailEmailService`: Únicamente responsable de la construcción de mensajes MIME y comunicación con Gmail API v1.
   - `SupabaseCalendarRepository`: Únicamente gestiona firmas y consultas RPC sobre `calendario`.
2. **OCP (Open/Closed Principle)**:
   - Los Casos de Uso aceptan cualquier implementación de `IDomainValidator` o `IEmailService` sin modificar su lógica interna.
3. **LSP (Liskov Substitution Principle)**:
   - Cualquier implementación de `ICalendarRepository` o `ICoverageRepository` es totalmente sustituible en pruebas unitarias.
4. **ISP (Interface Segregation Principle)**:
   - Contratos específicos e independientes (`IRateLimiter`, `IDomainValidator`, `IEmailService`).
5. **DIP (Dependency Inversion Principle)**:
   - Los controladores en `app/api/*` dependen de interfaces abstractas e inyecciones de casos de uso, desacoplándose de Supabase o Google API directos.

---

## 🎨 4. Controladores HTTP Ultra-Limpios (`app/api/*`)

Cada controlador HTTP en Next.js fue reducido a menos de 20 líneas de código con responsabilidad exclusiva de recepción y entrega de peticiones JSON:

* [`app/api/check-domain/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/check-domain/route.ts) (13 líneas)
* [`app/api/calendar/availability/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/calendar/availability/route.ts) (26 líneas)
* [`app/api/coverage/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/coverage/route.ts) (21 líneas)
* [`app/api/booking/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/booking/route.ts) (55 líneas)
