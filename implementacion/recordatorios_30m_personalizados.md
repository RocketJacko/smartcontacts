# Documentación Técnica — Sistema de Recordatorios Personalizados 30m Antes (Supabase + Cron)

## 📋 1. Resumen de la Arquitectura

Se ha implementado el sistema automático de recordatorios por correo electrónico **30 minutos antes** de cada cita agendada en la plataforma **Smartcontacts**, utilizando una plantilla HTML personalizada con la marca oficial, previniendo correos duplicados de Google Calendar y registrando el marcado en Supabase PostgreSQL.

---

## 🗄️ 2. Base de Datos Supabase (`calendario.eventos`)

1. **Columna de Estado**: `recordatorio_30m_enviado boolean DEFAULT false` en la tabla `calendario.eventos`.
2. **Función de Consulta RPC (`public.obtener_eventos_pendientes_recordatorio()`)**:
   * Selecciona únicamente las citas cuyo `inicio` se encuentre en los próximos 45 minutos y cuyo `recordatorio_30m_enviado` sea `false`.
3. **Función de Marcado RPC (`public.marcar_recordatorio_enviado(p_evento_id)`)**:
   * Actualiza `recordatorio_30m_enviado = true` garantizando que **jamás se envíe más de 1 solo correo**.

---

## ⚡ 3. Endpoint Cron Serverless (`/api/cron/reminders`)

- **Ruta**: [`app/api/cron/reminders/route.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/app/api/cron/reminders/route.ts)
- **Seguridad**: Autenticada con el token `CRON_SECRET` en la cabecera `Authorization: Bearer ...` o parámetro `?secret=...`.
- **Plantilla HTML**:
  - Asunto: `⏰ Recordatorio: Tu Asesoría Inicia en 30 Minutos — Smartcontacts`
  - Incluye nombre del cliente, hora exacta en Colombia y botón de llamado a la acción (CTA) directo a la reunión de **Google Meet**.

---

## 🔔 4. Desactivación de Correos Duplicados en Google Calendar

En [`lib/infrastructure/calendar/google-calendar-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/infrastructure/calendar/google-calendar-service.ts), se removió el recordatorio por correo genérico de Google, dejando únicamente la notificación emergente (`popup: 15 min`) para no saturar la bandeja de entrada del usuario.
