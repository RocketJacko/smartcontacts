import dotenv from 'dotenv'
import path from 'path'
import { ensureSpreadsheetHeaders, appendBookingToGoogleSheet } from '../lib/infrastructure/sheets/google-sheets-service'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

async function updateHeadersAndAddTestRow() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1wrjZ4OGByOuopahIuCBQj6WbMUS3A4v67Ykcp6HXiIo'
  console.log('Actualizando encabezados en Google Sheet:', spreadsheetId)

  const headersOk = await ensureSpreadsheetHeaders(spreadsheetId)
  console.log('Encabezados actualizados:', headersOk ? '✅ ÉXITO (13 columnas incluyendo Resultado Comercial)' : '❌ Error')

  console.log('\nInsertando cita de prueba con Resultado Comercial específico...')
  const res = await appendBookingToGoogleSheet({
    id: `CITA-${Date.now().toString().slice(-6)}`,
    fecha: '2026-09-12',
    hora: '04:00 PM',
    nombre: 'Mauricio Gómez',
    email: 'mauricio.gomez.holding@gmail.com',
    telefono: '+57 315 889 2200',
    empresa: 'Gómez & Asociados Holding',
    servicio: 'Consultoría IA Agéntica 45M',
    meetLink: 'https://meet.google.com/gma-meet-lead',
    googleEventId: 'gma-event-9948',
    estado: 'Agendada (Pendiente)',
    resultadoComercial: 'En Negociación / Propuesta',
    fechaRegistro: new Date().toISOString(),
  })

  console.log('Resultado de inserción:', res)
}

updateHeadersAndAddTestRow().catch(console.error)
