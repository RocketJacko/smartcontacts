# Documentación Técnica — Módulo de Integración Gmail API REST v1 (OAuth2)

## 📋 1. Resumen de la Implementación

Se ha implementado y verificado al 100% el servicio transaccional de correo [`lib/gmail-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/gmail-service.ts), utilizando la API REST v1 oficial de Gmail con autenticación **OAuth2** y actualización automática de token (`refresh_token`).

---

## 🚀 2. Pruebas y Resultados de Envío

Se realizó una prueba real de envío usando la cuenta `jesus.carmona966@pascualbravo.edu.co`:

- **Estado de Envío**: `success: true`
- **ID del Mensaje en Gmail API**: `19fefa71765b1cbd`
- **Máscara de Remitente**: `Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>`
- **Destinatario**: `jesus.carmona966@pascualbravo.edu.co`
- **Asunto**: `Confirmación de tu Agendamiento — Smartcontacts`

---

## 🛠️ 3. Arquitectura del Servicio ([`lib/gmail-service.ts`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/lib/gmail-service.ts))

- **Endpoint**: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
- **OAuth2 Token Refresh**: `https://oauth2.googleapis.com/token`
- **Codificación**: MIME RFC 822 en **Base64 URL-Safe** (`raw`).
- **Plantilla HTML Responsiva**: Inyección dinámica de `name`, `date`, `time`, `topicTitle`, `company` y `meetLink`.

---

## 🔒 4. Variables de Entorno en Servidor (`AGENTS.md` Regla 6)

Para habilitar el envío automático en Dokploy / servidor de producción, se deben agregar las siguientes variables de entorno:

```env
GMAIL_CLIENT_ID=your-google-oauth2-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-your-google-oauth2-client-secret
GMAIL_REFRESH_TOKEN=1//04your-google-oauth2-refresh-token
GMAIL_SENDER_EMAIL=jesus.carmona966@pascualbravo.edu.co
GMAIL_SENDER_NAME=Agendamiento Smartcontacts
```
