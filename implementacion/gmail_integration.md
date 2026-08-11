# Documentación Técnica — Módulo de Integración Gmail API REST v1 (OAuth2)

## 📋 1. Resumen de la Implementación

Se ha creado el módulo transaccional [`lib/gmail-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/gmail-service.ts) que permite el envío automático no bloqueante de correos electrónicos de confirmación cuando un prospecto o cliente agenda una cita estratégica.

---

## 🛠️ 2. Arquitectura del Servicio ([`lib/gmail-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/gmail-service.ts))

- **Protocolo**: HTTPS REST OAuth2 de Google API v1 (`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`).
- **Refresco de Access Token**: Intercambio dinámico en `https://oauth2.googleapis.com/token` usando `GMAIL_REFRESH_TOKEN`, `GMAIL_CLIENT_ID` y `GMAIL_CLIENT_SECRET`.
- **Formato del Mensaje**: MIME RFC 822 con codificación **Base64 URL-Safe** (`raw`).
- **Máscara del Remitente**: `Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>`.
- **Variables Dinámicas en Plantilla HTML**:
  - `{{name}}`: Nombre completo del prospecto.
  - `{{date}}`: Fecha agendada.
  - `{{time}}`: Hora del agendamiento.
  - `{{topicTitle}}`: Área de consultoría seleccionada.
  - `{{company}}`: Nombre de la empresa (si aplica).
  - `{{meetLink}}`: Enlace directo de la reunión.

---

## 🔒 3. Variables de Entorno y Seguridad (`AGENTS.md` Regla 6)

Documentadas en [`.env.example`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/.env.example):

```env
GMAIL_CLIENT_ID=your-google-oauth2-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-google-oauth2-client-secret
GMAIL_REFRESH_TOKEN=1//04your-google-oauth2-refresh-token
GMAIL_SENDER_EMAIL=jesus.carmona966@pascualbravo.edu.co
GMAIL_SENDER_NAME=Agendamiento Smartcontacts
```

---

## 🎨 4. Confirmación Visual en Interfaz (Paso 4 — Éxito)

Al completar la reserva, [`components/booking-section.tsx`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/components/booking-section.tsx) muestra:

> **¡Asesoría Agendada con Éxito!**  
> Te hemos enviado un correo electrónico con la confirmación de la cita y el enlace de la reunión. Nuestro equipo consultor se pondrá en contacto muy pronto.
