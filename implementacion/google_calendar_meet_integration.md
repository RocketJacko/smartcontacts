# Documentación Técnica — Integración Google Calendar API v3 y Google Meet Automático

## 📋 1. Resumen de la Implementación

Se ha desarrollado e integrado el módulo [`lib/infrastructure/calendar/google-calendar-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/infrastructure/calendar/google-calendar-service.ts) que interactúa directamente con la **Google Calendar API v3**.

Al momento de agendar una cita:
1. Se crea automáticamente el evento en la agenda oficial de `jesus.carmona966@pascualbravo.edu.co` en zona horaria **America/Bogota**.
2. Se genera automáticamente una sala de videollamada **Google Meet** (`hangoutsMeet`).
3. El enlace real generado (`meetLink`) se inyecta en el correo de confirmación de Gmail en el botón **"Unirse a la Reunión con Google Meet"**.

---

## 🛠️ 2. Arquitectura de Creación de Eventos (`google-calendar-service.ts`)

- **Endpoint Google API**: `POST https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`
- **Configuración de Google Meet**:
```json
{
  "conferenceData": {
    "createRequest": {
      "requestId": "meet-1786432000-abcde",
      "conferenceSolutionKey": { "type": "hangoutsMeet" }
    }
  }
}
```
- **Recordatorios**: Correo electrónico 60 minutos antes y notificación emergente 15 minutos antes.

---

## 🔑 3. Activación Necesaria en Google Cloud Console

Para habilitar el servicio en Google Cloud:
1. Haz clic en 👉 [**Habilitar Google Calendar API en Google Cloud Console**](https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=600688526213).
2. Presiona el botón azul **"Habilitar"** ("Enable").

---

## 🔒 4. Variables de Entorno de Producción (`.env`)

En Dokploy / servidor de producción, asegúrate de tener el `GMAIL_REFRESH_TOKEN` actualizado con los alcances de Calendar:

```env
GMAIL_CLIENT_ID=your-google-oauth2-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-google-oauth2-client-secret
GMAIL_REFRESH_TOKEN=1//05your-google-oauth2-refresh-token
GMAIL_SENDER_EMAIL=jesus.carmona966@pascualbravo.edu.co
GMAIL_SENDER_NAME=Agendamiento Smartcontacts
```
