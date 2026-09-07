import os
import sys
import json
from pathlib import Path
from google_auth_oauthlib.flow import InstalledAppFlow

# Cargar .env.local
env_path = Path(os.getcwd()) / '.env.local'
client_id = None
client_secret = None

if env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith('GMAIL_CLIENT_ID='):
                client_id = line.split('=', 1)[1].strip().strip('"').strip("'")
            elif line.startswith('GMAIL_CLIENT_SECRET='):
                client_secret = line.split('=', 1)[1].strip().strip('"').strip("'")

if not client_id or not client_secret:
    print("ERROR: No se encontraron GMAIL_CLIENT_ID o GMAIL_CLIENT_SECRET en .env.local")
    sys.exit(1)

SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
]

client_config = {
    "installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "redirect_uris": ["http://localhost"]
    }
}

print("Iniciando flujo de autorización OAuth2 de Google...")
print(f"Client ID: {client_id}")
print(f"Scopes solicitados: {len(SCOPES)} (Calendar + Gmail + Spreadsheets + Drive)")

flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
creds = flow.run_local_server(port=0, prompt='consent')

new_refresh_token = creds.refresh_token
print("\n¡Autorización exitosa!")
print(f"Nuevo Refresh Token: {new_refresh_token}")

if new_refresh_token:
    # Actualizar .env.local
    with open(env_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'GMAIL_REFRESH_TOKEN=' in content:
        import re
        content = re.sub(r'GMAIL_REFRESH_TOKEN=.*', f'GMAIL_REFRESH_TOKEN={new_refresh_token}', content)
    else:
        content += f'\nGMAIL_REFRESH_TOKEN={new_refresh_token}\n'

    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(".env.local actualizado con el nuevo GMAIL_REFRESH_TOKEN.")
else:
    print("Google no devolvió un nuevo refresh_token porque ya existía una sesión previa activa.")
