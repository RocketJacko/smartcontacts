# Proyecto: Sistema de Comunicación y Agendamiento Estudiantil con Google Workspace API

## 📋 Estructura del Proyecto

```text
python_app/
├── app.py                   # Servidor Flask principal y lógica de las 6 APIs de Google
├── requirements.txt         # Librerías de Python necesarias
├── .env.example             # Documentación de variables de entorno (Regla 6)
├── credentials.json         # (Colocar aquí el archivo de Google Cloud Console)
├── token.json               # (Se genera automáticamente tras el primer inicio de sesión)
└── templates/
    └── index.html           # Dashboard Web moderno en HTML5/CSS (Bootstrap 5)
```

## 🚀 Pasos de Instalación y Ejecución

1. Abrir la terminal en la carpeta `python_app`:
   ```bash
   cd python_app
   ```
2. Dar formato e instalar las librerías con `pip`:
   ```bash
   pip install -r requirements.txt
   ```
3. Colocar el archivo `credentials.json` descargado de Google Cloud Console dentro de la carpeta `python_app/`.
4. Iniciar el servidor Flask:
   ```bash
   python app.py
   ```
5. Abrir el navegador en `http://localhost:5000` e iniciar sesión en Google.
