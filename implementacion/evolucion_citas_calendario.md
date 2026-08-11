# Documentación Técnica — Evolución de Citas y Limpieza del Esquema Calendario

## 📋 1. Resumen de la Migración

Se ha implementado el seguimiento de **evolución y ciclo de vida de la agenda** en el esquema `calendario` de PostgreSQL en Supabase, y se han limpiado los registros de prueba previos.

---

## ⚙️ 2. Estructura de Evolución (`calendario.estado_evento`)

Se creó el tipo ENUM `calendario.estado_evento` y la columna `estado` en `calendario.eventos`:

- `agendado`: Cita creada exitosamente con link de Google Meet generado.
- `recordatorio_enviado`: Notificación de 30 minutos antes despachada.
- `en_progreso`: Videollamada activa durante la franja de 45 minutos.
- `cumplida`: Asesoría consultiva realizada y finalizada con éxito.
- `no_asistio`: Cliente no se presentó (No-Show).
- `cancelada`: Cita cancelada.
- `reprogramada`: Cita trasladada a nuevo horario.

---

## 🧹 3. Limpieza de Tablas

Se ejecutó la limpieza de prueba con preservación de llaves foráneas (`CASCADE`):
- `calendario.participantes`
- `calendario.eventos`
- `calendario.prospectos`

---

## 🤖 4. Funciones Almacenadas Creadas & Actualizadas
- `calendario.crear_agendamiento`: Asigna `estado = 'agendado'`.
- `calendario.marcar_recordatorio_enviado`: Asigna `estado = 'recordatorio_enviado'`.
- `calendario.actualizar_estados_eventos_transcurridos()`: Transiciona automáticamente a `'en_progreso'` y `'cumplida'` cuando el tiempo transcurre.
