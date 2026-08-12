#!/usr/bin/env python3
"""
==============================================================================
SMARTCONTACTS — MOTOR DE AUTOMATIZACIÓN Y SISTEMA DE GOTEO DE CORREOS (GMAIL API)
==============================================================================
Cumplimiento de Reglas de Negocio & Antispam:
1. Dominio Institucional (@pascualbravo.edu.co / Workspace): Límite de 2,000 envíos/día.
2. Dominio Gmail Gratuito (@gmail.com): Límite de 500 envíos/día.
3. Sistema de Goteo Aleatorio (Drip Sending): Retardo aleatorio de 3 a 5 segundos entre envíos.
   Evita ser marcado como spam por filtros de velocidad de Google Workspace.
==============================================================================
"""

import os
import time
import random
import datetime
from email.mime.text import MIMEText
import base64
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

def obtener_limite_diario(sender_email):
    """
    Retorna el límite máximo diario según el dominio de la cuenta remitente.
    - Workspace / Institucional (@pascualbravo.edu.co): 2,000/día
    - Gmail Gratuito / Personal (@gmail.com): 500/día
    """
    if sender_email and sender_email.lower().endswith('@pascualbravo.edu.co'):
        return 2000
    return 500

class EmailDripAutomation:
    def __init__(self):
        self.client_id = os.environ.get('GMAIL_CLIENT_ID')
        self.client_secret = os.environ.get('GMAIL_CLIENT_SECRET')
        self.refresh_token = os.environ.get('GMAIL_REFRESH_TOKEN')
        self.sender_email = os.environ.get('GMAIL_SENDER_EMAIL', 'jesus.carmona966@pascualbravo.edu.co')
        self.sender_name = os.environ.get('GMAIL_SENDER_NAME', 'Agendamiento Smartcontacts')
        
        self.daily_limit = obtener_limite_diario(self.sender_email)
        self.emails_sent_today = 0
        self.last_reset_date = datetime.date.today()
        self.service = self._init_gmail_service()

    def _init_gmail_service(self):
        """Inicializa el cliente de Gmail API usando OAuth 2.0"""
        scopes = ['https://www.googleapis.com/auth/gmail.send']
        creds = Credentials(
            token=None,
            refresh_token=self.refresh_token,
            token_uri='https://oauth2.googleapis.com/token',
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=scopes
        )
        return build('gmail', 'v1', credentials=creds)

    def _check_and_reset_daily_counter(self):
        """Reinicia el contador si ha cambiado de fecha (UTC / Hora Local)"""
        today = datetime.date.today()
        if today != self.last_reset_date:
            self.emails_sent_today = 0
            self.last_reset_date = today

    def enviar_correo_con_goteo(self, to_email, subject, body_html):
        """
        Envía un correo individual aplicando el Sistema de Goteo Aleatorio (3-5 segundos).
        """
        self._check_and_reset_daily_counter()

        # Verificar cuota diaria
        if self.emails_sent_today >= self.daily_limit:
            raise Exception(f"Límite diario alcanzado ({self.emails_sent_today}/{self.daily_limit} correos enviados hoy). Petición pausada.")

        # Construir mensaje MIME
        message = MIMEText(body_html, 'html', 'utf-8')
        message['to'] = to_email
        message['from'] = f"{self.sender_name} <{self.sender_email}>"
        message['subject'] = subject

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        
        # Enviar vía Gmail REST API
        result = self.service.users().messages().send(userId='me', body={'raw': raw}).execute()
        
        self.emails_sent_today += 1
        
        # ──────── SISTEMA DE GOTEO ALEATORIO (DRIP RATE-LIMITING) ────────
        # Genera una pausa aleatoria entre 3.0 y 5.0 segundos para evitar trampas de spam
        drip_delay = round(random.uniform(3.0, 5.0), 2)
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Correo {self.emails_sent_today}/{self.daily_limit} enviado a {to_email}. Pausa de goteo: {drip_delay}s...")
        time.sleep(drip_delay)

        return {
            "success": True,
            "message_id": result.get('id'),
            "emails_sent_today": self.emails_sent_today,
            "daily_limit": self.daily_limit,
            "drip_delay_seconds": drip_delay
        }

# Ejemplo de Uso Directo
if __name__ == '__main__':
    automation = EmailDripAutomation()
    print(f"Motor de Goteo Iniciado para {automation.sender_email}. Límite Diario: {automation.daily_limit} correos/día.")
