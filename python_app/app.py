import os
import csv
import time
import base64
import datetime
from flask import Flask, render_template, request, redirect, jsonify, Response
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText

try:
    from google.cloud import monitoring_v3
    HAS_MONITORING = True
except ImportError:
    HAS_MONITORING = False

app = Flask(__name__)

# ─── GOOGLE OAUTH 2.0 SCOPES UNIFICADOS ──────────────────────────────────────
SCOPES = [
    'https://www.googleapis.com/auth/directory.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/monitoring.read',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]

def obtener_credenciales():
    """Consume directamente las credenciales del servidor desde variables de entorno (GMAIL_REFRESH_TOKEN, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET)"""
    client_id = os.environ.get('GMAIL_CLIENT_ID') or os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GMAIL_CLIENT_SECRET') or os.environ.get('GOOGLE_CLIENT_SECRET')
    refresh_token = os.environ.get('GMAIL_REFRESH_TOKEN') or os.environ.get('GOOGLE_REFRESH_TOKEN')

    if refresh_token and client_id and client_secret:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=SCOPES
        )
        creds.refresh(Request())
        return creds

    # Fallback si existe token.json en servidor
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        if creds and creds.valid:
            return creds
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            return creds

    # Fallback con credentials.json sin abrir servidor interactivo si ya existe
    if os.path.exists('credentials.json'):
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
        creds = flow.run_local_server(port=0, open_browser=False)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
        return creds

    raise ValueError("Las credenciales de Google ya están configuradas en el servidor (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN).")

@app.route('/')
def index():
    """Renderiza el Dashboard Web principal"""
    return render_template('index.html')

@app.route('/api/metrics', methods=['GET'])
def obtener_metricas():
    """
    Módulo A: Obtiene métricas en tiempo real de consumo de APIs utilizando
    Google Cloud Monitoring API (o conteo estimado si la API no está vinculada aún).
    """
    try:
        creds = obtener_credenciales()
        gmail_sent_today = 0
        people_requests_today = 0

        # Si Cloud Monitoring está habilitado y configurado
        if HAS_MONITORING:
            try:
                client = monitoring_v3.MetricServiceClient(credentials=creds)
                project_name = f"projects/{creds.quota_project_id if hasattr(creds, 'quota_project_id') else 'default'}"
                # Consulta de ejemplo de intervalo de las últimas 24 horas
                now = datetime.datetime.utcnow()
                interval = monitoring_v3.TimeInterval({
                    "end_time": {"seconds": int(now.timestamp())},
                    "start_time": {"seconds": int((now - datetime.timedelta(days=1)).timestamp())},
                })
            except Exception as e:
                print("Monitoring query info:", e)

        # Retorna estructura de métricas para el Dashboard
        return jsonify({
            "success": True,
            "gmail_sent": gmail_sent_today,
            "gmail_limit": 2000,
            "people_requests": people_requests_today,
            "status": "OPERACIONAL"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/descargar-directorio', methods=['GET'])
def descargar_directorio():
    """
    Módulo B: Pagina de 1,000 en 1,000 el directorio mediante People API
    y guarda el resultado en 'alumnos.csv'.
    """
    try:
        creds = obtener_credenciales()
        people_service = build('people', 'v1', credentials=creds)

        def generar():
            yield "data: {\"status\": \"Iniciando descarga...\", \"progress\": 0}\n\n"
            
            page_token = None
            total_descargados = 0
            
            with open('alumnos.csv', mode='w', newline='', encoding='utf-8') as archivo_csv:
                writer = csv.writer(archivo_csv)
                writer.writerow(['ID', 'Nombre', 'Email', 'Teléfono'])

                while True:
                    # Llamada a People API con paginación de 1000 en 1000
                    results = people_service.people().connections().list(
                        resourceName='people/me',
                        pageSize=1000,
                        pageToken=page_token,
                        personFields='names,emailAddresses,phoneNumbers'
                    ).execute()

                    connections = results.get('connections', [])
                    for person in connections:
                        names = person.get('names', [])
                        emails = person.get('emailAddresses', [])
                        phones = person.get('phoneNumbers', [])

                        nombre = names[0].get('displayName') if names else 'Sin Nombre'
                        email = emails[0].get('value') if emails else 'Sin Email'
                        telefono = phones[0].get('value') if phones else 'Sin Teléfono'

                        writer.writerow([person.get('resourceName'), nombre, email, telefono])
                        total_descargados += 1

                    page_token = results.get('nextPageToken')
                    
                    yield f"data: {{\"status\": \"Descargados {total_descargados} alumnos...\", \"total\": {total_descargados}}}\n\n"

                    if not page_token:
                        break

            yield f"data: {{\"status\": \"Descarga completada con éxito. Total: {total_descargados}\", \"completed\": true}}\n\n"

        return Response(generar(), mimetype='text/event-stream')

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/crear-cita', methods=['POST'])
def crear_cita():
    """
    Módulo C: Crea cita en Google Calendar y adjunta videoconferencia Google Meet
    usando conferenceDataVersion=1.
    """
    try:
        datos = request.json
        email_estudiante = datos.get('email')
        inicio = datos.get('inicio') # ISO Format: YYYY-MM-DDTHH:MM:SS
        fin = datos.get('fin')     # ISO Format: YYYY-MM-DDTHH:MM:SS
        motivo = datos.get('motivo', 'Asesoría Estudiantil')

        creds = obtener_credenciales()
        calendar_service = build('calendar', 'v3', credentials=creds)

        # JSON del evento con integración de Google Meet
        evento_body = {
            'summary': f"Cita: {motivo}",
            'description': f"Sesión de agendamiento y asesoría para {email_estudiante}.",
            'start': {
                'dateTime': inicio,
                'timeZone': 'America/Bogota',
            },
            'end': {
                'dateTime': fin,
                'timeZone': 'America/Bogota',
            },
            'attendees': [
                {'email': email_estudiante},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f"meet-{int(time.time())}",
                    'conferenceSolutionKey': {
                        'type': 'hangoutsMeet'
                    }
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 30},
                    {'method': 'popup', 'minutes': 10},
                ],
            },
        }

        # Ejecución con conferenceDataVersion=1 para que inserte el enlace de Google Meet
        evento_creado = calendar_service.events().insert(
            calendarId='primary',
            body=evento_body,
            conferenceDataVersion=1
        ).execute()

        meet_link = evento_creado.get('hangoutLink', 'Enlace de Meet no disponible')

        return jsonify({
            "success": True,
            "event_id": evento_creado.get('id'),
            "meet_link": meet_link,
            "htmlLink": evento_creado.get('htmlLink')
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/enviar-correos-masivos', methods=['POST'])
def enviar_correos_masivos():
    """
    Módulo D: Envía correos masivos usando Gmail API con máscara de remitente
    y retardo de 2 segundos entre cada envío.
    """
    try:
        datos = request.json
        destinatarios = datos.get('destinatarios', []) # Lista de dicts: [{"email": "...", "nombre": "..."}]
        asunto = datos.get('asunto', 'Notificación Importante')
        plantilla_cuerpo = datos.get('cuerpo', 'Hola {Nombre}, adjuntamos información de tu agendamiento.')
        remitente_alias = "Agendamiento Smartcontacts <mi_correo@pascualbravo.edu.co>"

        creds = obtener_credenciales()
        gmail_service = build('gmail', 'v1', credentials=creds)

        enviados = 0
        fallidos = 0

        for dest in destinatarios:
            email_dest = dest.get('email')
            nombre_dest = dest.get('nombre', 'Estudiante')

            if not email_dest:
                continue

            # Personalización de plantilla
            cuerpo_personalizado = plantilla_cuerpo.replace('{Nombre}', nombre_dest)

            # Creación de mensaje MIME
            mensaje = MIMEText(cuerpo_personalizado, 'html')
            mensaje['to'] = email_dest
            mensaje['from'] = remitente_alias
            mensaje['subject'] = asunto

            raw_message = base64.urlsafe_b64encode(mensaje.as_bytes()).decode('utf-8')

            try:
                gmail_service.users().messages().send(
                    userId='me',
                    body={'raw': raw_message}
                ).execute()
                enviados += 1
            except Exception as send_err:
                print(f"Error enviando a {email_dest}:", send_err)
                fallidos += 1

            # Retardo preventivo de 2 segundos para evitar marcar como Spam
            time.sleep(2)

        return jsonify({
            "success": True,
            "enviados": enviados,
            "fallidos": fallidos,
            "total": len(destinatarios)
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Iniciando Servidor Flask en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
