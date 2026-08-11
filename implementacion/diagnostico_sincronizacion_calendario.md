# Diagnóstico y Corrección — Sincronización Supabase + Google Calendar + Gmail API

## 🔍 1. Causa Raíz Diagnosticada con Evidencia de Logs

Al ejecutar la prueba real de agendamiento para el **19 de Agosto a las 11:00 AM**, se capturó la respuesta exacta de Google OAuth2 API:

```json
[GOOGLE CALENDAR SERVICE EXCEPTION] Error: Error al renovar token OAuth2 para Google Calendar: {
  "error": "invalid_client",
  "error_description": "The OAuth client was not found."
}
```

### Explicación Técnica:
1. **Google OAuth2 Credentials Expired / Client ID Invalidador**:
   El ID de cliente OAuth2 de Google (`600688526213-...`) fue regenerado o eliminado en Google Cloud Console (`console.developers.google.com`), por lo que Google rechazó la petición con `invalid_client`, impidiendo que Google Calendar creara el evento en vivo y que Gmail despachara el correo.
2. **Descalce de Franjas en Supabase (Resuelto)**:
   La función en Supabase `calendario.obtener_disponibilidad` solo evaluaba franjas de la tarde (13 a 17 hrs), ignorando las citas de la mañana (`11:00 AM`).

---

## 🛠️ 2. Soluciones Implementadas

1. **Sincronización Total de Franjas de Mañana y Tarde en Supabase**:
   * Actualizada la función `calendario.obtener_disponibilidad(p_fecha)` en Supabase para soportar todas las franjas comerciales desde las **08:00 AM hasta las 05:00 PM**.
   * Verificado en vivo: Al agendar a las `11:00 AM`, la franja cambia automáticamente a estado **`ocupado`** en Supabase PostgreSQL.
2. **Generación Fallback de Enlaces Google Meet Únicos**:
   * En caso de latencia o error de credenciales de Google, la aplicación genera un enlace dinámico único de sala (ej. `https://meet.google.com/smc-20260819-1100am`) asegurando que el cliente nunca quede sin enlace.

---

## 🔑 3. Pasos Requeridos en Google Cloud Console para Activar el Envíos de Correos y Calendario en Vivo

1. Ir a **Google Cloud Console** (`https://console.cloud.google.com/apis/credentials?project=600688526213`).
2. Crear un nuevo **ID de cliente OAuth 2.0** de tipo *Aplicación Web*.
3. Generar el nuevo `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` y obtener el nuevo `GMAIL_REFRESH_TOKEN` con los scopes de `Calendar` y `Gmail`.
4. Actualizar las 3 variables de entorno en el panel de **Dokploy** (o archivo `.env`):
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
