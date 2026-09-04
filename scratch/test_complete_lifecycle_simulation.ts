import { config } from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno locales
config({ path: resolve(process.cwd(), '.env.local') })

import { 
  sendBookingConfirmationEmail, 
  send8AMMorningReminderEmail, 
  send30MinReminderEmail,
  sendGmailCustomEmail 
} from '../lib/gmail-service'
import { isDomainBlocked } from '../lib/blocked-domains'
import { GmailAccountsManager } from '../lib/gmail-accounts-manager'

// Si se define TEST_RECIPIENT_OVERRIDE, se usa esa dirección para no rebotar correos en bandejas inexistentes.
// Por defecto se usa la cuenta autenticada del entorno para que los correos lleguen a la bandeja real de prueba.
const SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL || 'jesus.carmona966@pascualbravo.edu.co'

interface TestProspect {
  id: string
  name: string
  email: string
  company: string
  topic: string
  date: string
  time: string
  meetLink: string
}

async function runCompleteLifecycleSimulation() {
  console.log('='.repeat(80))
  console.log('SIMULACIÓN INTEGRAL EN VIVO: CICLO DE AGENDAMIENTO (3 FASES) & CAMPAÑA DE MARKETING')
  console.log('='.repeat(80))
  console.log(`Remitente autenticado: ${SENDER_EMAIL}`)
  console.log(`Fecha de ejecución: ${new Date().toLocaleString('es-CO')}\n`)

  let totalEmailsAttempted = 0
  let totalEmailsSuccess = 0
  let totalEmailsAntiSpamBlocked = 0
  let totalEmailsFailed = 0

  // ============================================================================
  // PARTE 1: SIMULACIÓN DE 3 PERSONAS QUE SOLICITAN AGENDAMIENTO (3 FASES C/U)
  // ============================================================================
  console.log('┌────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ PARTE 1: AGENDAMIENTO CONSULTIVO — 3 PERSONAS × 3 FASES DE CORREO          │')
  console.log('└────────────────────────────────────────────────────────────────────────────┘\n')

  const prospects: TestProspect[] = [
    {
      id: 'prospect-01',
      name: 'Carlos Mendoza',
      email: SENDER_EMAIL, // Se dirige a la bandeja real del remitente como prueba verificable
      company: 'InnovaTech Colombia S.A.S.',
      topic: 'Unidad Agéntica de Prospección Comercial con IA',
      date: 'Viernes 5 de Septiembre 2026',
      time: '10:00 AM',
      meetLink: 'https://meet.google.com/sc-carlos-10am',
    },
    {
      id: 'prospect-02',
      name: 'Diana Restrepo',
      email: SENDER_EMAIL,
      company: 'Logística & Envíos Andinos',
      topic: 'Automatización Consultiva & RAG Corporativo',
      date: 'Viernes 5 de Septiembre 2026',
      time: '02:30 PM',
      meetLink: 'https://meet.google.com/sc-diana-2pm',
    },
    {
      id: 'prospect-03',
      name: 'Alejandro Soto',
      email: SENDER_EMAIL,
      company: 'Finanzas Globales Digitales',
      topic: 'Inteligencia de Datos y Calificación de Leads B2B',
      date: 'Lunes 8 de Septiembre 2026',
      time: '11:15 AM',
      meetLink: 'https://meet.google.com/sc-alejandro-11am',
    },
  ]

  for (let i = 0; i < prospects.length; i++) {
    const p = prospects[i]
    console.log(`\n👤 [PERSONA ${i + 1}/3]: ${p.name} (${p.company})`)
    console.log(`   Cita solicitada: ${p.date} a las ${p.time}`)
    console.log(`   Tema: ${p.topic}`)
    console.log(`   Enlace Meet: ${p.meetLink}`)

    // ------------------------------------------------------------------------
    // FASE 1: Correo de Confirmación Inmediata de Reserva
    // ------------------------------------------------------------------------
    console.log(`\n   📨 -> FASE 1: Enviando Confirmación Inmediata de Agendamiento...`)
    totalEmailsAttempted++
    try {
      const resConfirm = await sendBookingConfirmationEmail({
        toEmail: p.email,
        toName: p.name,
        date: p.date,
        time: p.time,
        topicTitle: p.topic,
        company: p.company,
        meetLink: p.meetLink,
      })

      if (resConfirm.success) {
        totalEmailsSuccess++
        console.log(`      ✓ [FASE 1 ENTREGADA] MessageId: ${resConfirm.messageId} (Goteo: ${resConfirm.dripDelaySeconds || '3.2'}s)`)
      } else {
        totalEmailsFailed++
        console.log(`      ✗ [FASE 1 FALLIDA]: ${resConfirm.error}`)
      }
    } catch (e: any) {
      totalEmailsFailed++
      console.log(`      ✗ [FASE 1 EXCEPCIÓN]: ${e.message}`)
    }

    // ------------------------------------------------------------------------
    // FASE 2: Correo de Recordatorio Matutino (8:00 AM del día de la cita)
    // ------------------------------------------------------------------------
    console.log(`   ⏰ -> FASE 2: Enviando Recordatorio Matutino (Regla 8:00 AM)...`)
    totalEmailsAttempted++
    try {
      const res8AM = await send8AMMorningReminderEmail({
        toEmail: p.email,
        toName: p.name,
        title: p.topic,
        timeStr: p.time,
        meetLink: p.meetLink,
      })

      if (res8AM.success) {
        totalEmailsSuccess++
        console.log(`      ✓ [FASE 2 ENTREGADA] MessageId: ${res8AM.messageId}`)
      } else {
        totalEmailsFailed++
        console.log(`      ✗ [FASE 2 FALLIDA]: ${res8AM.error}`)
      }
    } catch (e: any) {
      totalEmailsFailed++
      console.log(`      ✗ [FASE 2 EXCEPCIÓN]: ${e.message}`)
    }

    // ------------------------------------------------------------------------
    // FASE 3: Correo de Alerta Inminente (30 Minutos antes de la sala)
    // ------------------------------------------------------------------------
    console.log(`   🚨 -> FASE 3: Enviando Recordatorio de Última Hora (30 Minutos antes)...`)
    totalEmailsAttempted++
    try {
      const res30M = await send30MinReminderEmail({
        toEmail: p.email,
        toName: p.name,
        title: p.topic,
        timeStr: p.time,
        meetLink: p.meetLink,
      })

      if (res30M.success) {
        totalEmailsSuccess++
        console.log(`      ✓ [FASE 3 ENTREGADA] MessageId: ${res30M.messageId}`)
      } else {
        totalEmailsFailed++
        console.log(`      ✗ [FASE 3 FALLIDA]: ${res30M.error}`)
      }
    } catch (e: any) {
      totalEmailsFailed++
      console.log(`      ✗ [FASE 3 EXCEPCIÓN]: ${e.message}`)
    }

    // Pausa breve de goteo entre personas
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  // ============================================================================
  // PARTE 2: SIMULACIÓN DE CAMPAÑA DE EMAIL MARKETING (PROSPECCIÓN & ANTI-SPAM)
  // ============================================================================
  console.log('\n\n┌────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ PARTE 2: CAMPAÑA DE EMAIL MARKETING — ROTACIÓN ROUND-ROBIN & ANTI-SPAM     │')
  console.log('└────────────────────────────────────────────────────────────────────────────┘\n')

  const campaignAudience = [
    {
      name: 'Santiago Morales',
      email: SENDER_EMAIL, // Válido corporativo
      company: 'TechSolutions Medellín',
    },
    {
      name: 'Trampa Temporal',
      email: 'bot-invalido@yopmail.com', // Correo trampa anti-spam (debe ser bloqueado)
      company: 'Spam Corp',
    },
    {
      name: 'Valeria Cárdenas',
      email: SENDER_EMAIL, // Válido corporativo
      company: 'Grupo Retail Colombia',
    },
    {
      name: 'Correo Basura 2',
      email: 'fake-lead@mailinator.com', // Correo trampa anti-spam (debe ser bloqueado)
      company: 'Inexistente',
    },
  ]

  // Pool Round-Robin de Asuntos Anti-Spam
  const poolAsuntos = [
    'Nueva unidad de crecimiento con IA para {{empresa}} — Smartcontacts',
    '{{nombre}}, propuesta estratégica de prospección B2B',
    'Escalamiento comercial automatizado para el equipo de {{empresa}}',
  ]

  // Pool de Cuerpos
  const poolCuerpos = [
    '<p>Hola <strong>{{nombre}}</strong>,</p><p>Analizamos las operaciones comerciales de <strong>{{empresa}}</strong> y estructuramos una estrategia de prospección activa con IA agéntica.</p><p><a href="https://smartcontacts.cloud/agendar" style="background:#111;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Agendar Sesión de 45 Minutos</a></p>',
    '<p>Estimado/a <strong>{{nombre}}</strong>,</p><p>En Smartcontacts creamos nuevas unidades de crecimiento para empresas como <strong>{{empresa}}</strong> sin reemplazar a tu departamento actual.</p><p><a href="https://smartcontacts.cloud/agendar" style="background:#10b981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Conocer Modelo Consultivo</a></p>',
  ]

  console.log(`🎯 Audiencia de la Campaña: ${campaignAudience.length} prospectos en lista`)
  console.log(`🔄 Variantes de Asunto configuradas: ${poolAsuntos.length}`)
  console.log(`📝 Variantes de Cuerpo configuradas: ${poolCuerpos.length}\n`)

  for (let i = 0; i < campaignAudience.length; i++) {
    const contact = campaignAudience[i]
    totalEmailsAttempted++
    console.log(`👉 Despachando a contacto [${i + 1}/${campaignAudience.length}]: ${contact.name} <${contact.email}>`)

    // 1. FILTRO ANTI-SPAM PREVENTIVO
    const isBlocked = await isDomainBlocked(contact.email)
    if (isBlocked) {
      totalEmailsAntiSpamBlocked++
      console.log(`   🛡️ [ANTI-SPAM ATIVADO] Correo bloqueado preventivamente: dominio temporal o desechable detectado. No se consume cuota de Gmail.`)
      continue
    }

    // 2. ROTACIÓN ROUND-ROBIN
    const rawAsunto = poolAsuntos[i % poolAsuntos.length]
    const rawCuerpo = poolCuerpos[i % poolCuerpos.length]

    const asuntoFinal = rawAsunto
      .replace(/\{\{nombre\}\}/g, contact.name)
      .replace(/\{\{empresa\}\}/g, contact.company)

    const cuerpoFinal = rawCuerpo
      .replace(/\{\{nombre\}\}/g, contact.name)
      .replace(/\{\{empresa\}\}/g, contact.company)

    console.log(`   🔄 Asunto Asignado: "${asuntoFinal}"`)

    // 3. ENVÍO REAL MEDIANTE GMAIL API
    try {
      const resDispatch = await sendGmailCustomEmail({
        toEmail: contact.email,
        toName: contact.name,
        subject: asuntoFinal,
        htmlBody: cuerpoFinal,
        senderEmail: SENDER_EMAIL,
        senderMask: `Smartcontacts Prospección <${SENDER_EMAIL}>`,
      })

      if (resDispatch.success) {
        totalEmailsSuccess++
        console.log(`   ✓ [CAMPAÑA ENTREGADA] MessageId: ${resDispatch.messageId} | Remitente: ${resDispatch.senderUsed || SENDER_EMAIL}`)
      } else {
        totalEmailsFailed++
        console.log(`   ✗ [CAMPAÑA ERROR]: ${resDispatch.error}`)
      }
    } catch (err: any) {
      totalEmailsFailed++
      console.log(`   ✗ [CAMPAÑA EXCEPCIÓN]: ${err.message}`)
    }

    // Goteo entre envíos
    await new Promise((resolve) => setTimeout(resolve, 2500))
  }

  // ============================================================================
  // REPORTE CONSOLIDADO FINAL
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('RESUMEN Y MÉTRICAS GLOBALES DEL TEST')
  console.log('='.repeat(80))
  console.log(`Total de correos procesados:           ${totalEmailsAttempted}`)
  console.log(`Correos entregados con éxito (Gmail):  ${totalEmailsSuccess}`)
  console.log(`Correos bloqueados por Anti-Spam:      ${totalEmailsAntiSpamBlocked}`)
  console.log(`Correos fallidos:                      ${totalEmailsFailed}`)
  console.log(`Efectividad global del sistema:        ${((totalEmailsSuccess / (totalEmailsAttempted - totalEmailsAntiSpamBlocked)) * 100).toFixed(1)}%`)
  console.log('='.repeat(80) + '\n')
}

runCompleteLifecycleSimulation().catch((err) => {
  console.error('ERROR CRÍTICO EN LA SIMULACIÓN:', err)
  process.exit(1)
})
