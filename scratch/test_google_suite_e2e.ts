import dotenv from 'dotenv'
import path from 'path'
import { createGoogleCalendarEvent } from '../lib/infrastructure/calendar/google-calendar-service'
import { appendBookingToGoogleSheet } from '../lib/infrastructure/sheets/google-sheets-service'
import { GmailEmailService } from '../lib/infrastructure/email/gmail-email-service'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

interface TestCita {
  nombre: string
  email: string
  telefono: string
  empresa: string
  servicio: string
  fecha: string
  hora: string
  descripcion: string
}

const CITAS_DE_PRUEBA: TestCita[] = [
  {
    nombre: 'Sofía Restrepo',
    email: 'sofia.restrepo.antioquia@gmail.com',
    telefono: '+57 310 445 8821',
    empresa: 'Inversiones Antioquia S.A.S',
    servicio: 'Agentes de IA & Arquitectura RAG',
    fecha: '2026-09-10',
    hora: '09:00 AM',
    descripcion: 'Evaluación de viabilidad para implementar agentes autónomos en departamento comercial.',
  },
  {
    nombre: 'Carlos Mendoza',
    email: 'carlos.mendoza.logistica@gmail.com',
    telefono: '+57 320 612 9944',
    empresa: 'Logística Integral Andina',
    servicio: 'Prospección B2B & Base de Datos',
    fecha: '2026-09-10',
    hora: '02:30 PM',
    descripcion: 'Adquisición de base de datos segmentada B2B con +200k contactos para outbound.',
  },
  {
    nombre: 'Valeria Duque',
    email: 'valeria.duque.salud@gmail.com',
    telefono: '+57 301 773 1155',
    empresa: 'Tecnología Médica IPS',
    servicio: 'Automatización & Software a Medida',
    fecha: '2026-09-11',
    hora: '11:00 AM',
    descripcion: 'Automatización integral de agendamiento y confirmación de pacientes por WhatsApp y Correo.',
  },
]

async function runGoogleSuiteE2ETest() {
  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('🧪 PRUEBA INTEGRAL DE GOOGLE CLOUD & GOOGLE WORKSPACE APIS')
  console.log('   1. Google Calendar (Eventos + Salas Google Meet)')
  console.log('   2. Google Sheets (Registro y persistencia de filas)')
  console.log('   3. Gmail API v1 (Despacho real con Bento Cards)')
  console.log('═══════════════════════════════════════════════════════════════════\n')

  const emailService = new GmailEmailService()
  const results: any[] = []

  for (let i = 0; i < CITAS_DE_PRUEBA.length; i++) {
    const cita = CITAS_DE_PRUEBA[i]
    console.log(`───────────────────────────────────────────────────────────────────`)
    console.log(`📌 Procesando Cita ${i + 1}/${CITAS_DE_PRUEBA.length}: ${cita.nombre} (${cita.empresa})`)
    console.log(`   Fecha: ${cita.fecha} | Hora: ${cita.hora} | Tema: ${cita.servicio}`)

    const stepResult: any = {
      cita: cita.nombre,
      empresa: cita.empresa,
      calendar: null,
      meetLink: null,
      googleSheets: null,
      gmail: null,
    }

    // PASO 1: GOOGLE CALENDAR
    console.log(`\n   [1/3] Creando evento en Google Calendar...`)
    try {
      const calRes = await createGoogleCalendarEvent({
        summary: `Asesoría Estratégica: ${cita.servicio} - ${cita.nombre}`,
        description: `Agendamiento comercial Smartcontacts.\nEmpresa: ${cita.empresa}\nTeléfono: ${cita.telefono}\nNotas: ${cita.descripcion}`,
        date: cita.fecha,
        time: cita.hora,
        attendeeEmail: cita.email,
        attendeeName: cita.nombre,
      })

      if (calRes.success) {
        console.log(`   ✅ Google Calendar Event Creado: ID ${calRes.eventId}`)
        console.log(`   🔗 Google Meet Link: ${calRes.meetLink}`)
        stepResult.calendar = { success: true, eventId: calRes.eventId, htmlLink: calRes.htmlLink }
        stepResult.meetLink = calRes.meetLink
      } else {
        console.error(`   ❌ Falló Google Calendar:`, calRes.error)
        stepResult.calendar = { success: false, error: calRes.error }
        stepResult.meetLink = `https://meet.google.com/smc-${Date.now()}`
      }
    } catch (calErr: any) {
      console.error(`   ❌ Excepción en Google Calendar:`, calErr.message)
      stepResult.calendar = { success: false, error: calErr.message }
      stepResult.meetLink = `https://meet.google.com/smc-${Date.now()}`
    }

    // PASO 2: GOOGLE SHEETS
    console.log(`\n   [2/3] Almacenando fila en Google Sheets API v4...`)
    try {
      const sheetRes = await appendBookingToGoogleSheet({
        id: `CITA-${Date.now().toString().slice(-6)}-0${i + 1}`,
        fecha: cita.fecha,
        hora: cita.hora,
        nombre: cita.nombre,
        email: cita.email,
        telefono: cita.telefono,
        empresa: cita.empresa,
        servicio: cita.servicio,
        meetLink: stepResult.meetLink,
        googleEventId: stepResult.calendar?.eventId || 'N/A',
        estado: 'Confirmada',
        fechaRegistro: new Date().toISOString(),
      })

      if (sheetRes.success) {
        console.log(`   ✅ Google Sheet Actualizado: ${sheetRes.updatedRange}`)
        console.log(`   📊 Spreadsheet URL: ${sheetRes.spreadsheetUrl}`)
        stepResult.googleSheets = { success: true, updatedRange: sheetRes.updatedRange, url: sheetRes.spreadsheetUrl }
      } else {
        console.error(`   ❌ Falló Google Sheets:`, sheetRes.error)
        stepResult.googleSheets = { success: false, error: sheetRes.error }
      }
    } catch (sheetErr: any) {
      console.error(`   ❌ Excepción en Google Sheets:`, sheetErr.message)
      stepResult.googleSheets = { success: false, error: sheetErr.message }
    }

    // PASO 3: GMAIL API v1
    console.log(`\n   [3/3] Despachando correo de confirmación vía Gmail API...`)
    try {
      const emailSent = await emailService.sendBookingConfirmation({
        toEmail: cita.email,
        toName: cita.nombre,
        date: cita.fecha,
        time: cita.hora,
        topicTitle: cita.servicio,
        company: cita.empresa,
        meetLink: stepResult.meetLink,
      })

      if (emailSent) {
        console.log(`   ✅ Correo de Confirmación Bento Card Despachado a ${cita.email}`)
        stepResult.gmail = { success: true, to: cita.email }
      } else {
        console.error(`   ❌ Falló el envío de correo`)
        stepResult.gmail = { success: false }
      }
    } catch (emailErr: any) {
      console.error(`   ❌ Excepción en Gmail API:`, emailErr.message)
      stepResult.gmail = { success: false, error: emailErr.message }
    }

    results.push(stepResult)
    console.log(`\n`)
  }

  console.log('═══════════════════════════════════════════════════════════════════')
  console.log('📊 RESUMEN FINAL DE LA VALIDACIÓN GOOGLE WORKSPACE')
  console.log('═══════════════════════════════════════════════════════════════════')
  console.table(
    results.map((r) => ({
      Cita: r.cita,
      Empresa: r.empresa,
      'Calendar Event ID': r.calendar?.eventId || 'FALLÓ',
      'Google Meet': r.meetLink || 'FALLÓ',
      'Google Sheet Range': r.googleSheets?.updatedRange || (r.googleSheets?.success ? 'OK' : 'ERROR SCOPES'),
      'Gmail Despachado': r.gmail?.success ? 'SÍ (200 OK)' : 'NO',
    }))
  )

  const allCalendarOk = results.every((r) => r.calendar?.success)
  const allGmailOk = results.every((r) => r.gmail?.success)
  const allSheetsOk = results.every((r) => r.googleSheets?.success)

  console.log('\nResultados globales:')
  console.log(`- Google Calendar: ${allCalendarOk ? '✅ 100% OPERATIVO' : '❌ Con fallos'}`)
  console.log(`- Gmail API:       ${allGmailOk ? '✅ 100% OPERATIVO' : '❌ Con fallos'}`)
  console.log(`- Google Sheets:   ${allSheetsOk ? '✅ 100% OPERATIVO' : '❌ Requiere scope spreadsheets'}`)

  return { allCalendarOk, allGmailOk, allSheetsOk, results }
}

runGoogleSuiteE2ETest().catch(console.error)
