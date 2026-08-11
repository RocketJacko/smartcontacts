# Documentación Técnica — Integración Unificada de Google Workspace API & Cloud Monitoring

## 📋 1. Resumen del Proyecto

Se ha estructurado la solución completa para el **Sistema de Comunicación y Agendamiento Estudiantil (Pascual Bravo)** integrando las 6 APIs de Google bajo autenticación OAuth 2.0 unificada:

1. **`google.cloud.monitoring_v3` (Cloud Monitoring API)**: Lectura de cuota y solicitudes diarias en tiempo real.
2. **`people_service` (People API / Directory)**: Descarga paginada de 1,000 en 1,000 estudiantes (`nextPageToken`) a CSV `alumnos.csv`.
3. **`calendar_service` (Google Calendar API + Google Meet)**: Creación de eventos con `conferenceDataVersion=1` y generación automática de enlace `hangoutLink`.
4. **`gmail_service` (Gmail API)**: Envío seguro con máscara `"Agendamiento Smartcontacts <mi_correo@pascualbravo.edu.co>"` y retardo de 2 segundos entre envíos (`time.sleep(2)`).
5. **Google Sheets & Drive API**.

---

## 📂 2. Archivos Creados

- [`python_app/app.py`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/python_app/app.py) (Servidor Flask completo y lógica de las 6 APIs)
- [`python_app/templates/index.html`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/python_app/templates/index.html) (Frontend Dashboard en Bootstrap 5)
- [`python_app/requirements.txt`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/python_app/requirements.txt) (Librerías de Python)
- [`python_app/.env.example`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/python_app/.env.example) (Documentación de variables sin secretos)
- [`python_app/README.md`](file:///c:/Users/JesusAlexisCarmonaCa/Downloads/agentic-build-and-orchestrate-ai-agents-while-you-sleep/python_app/README.md) (Instrucciones paso a paso)
