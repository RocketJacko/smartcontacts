import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { sendInformationRequestReceiptEmail } from '../lib/gmail-service'

async function testLeadInfoRequest() {
  console.log('Probando envío de acuse de recibo para Solicitud de Información (Web Lead)...')
  
  const recipient = process.env.GMAIL_SENDER_EMAIL || 'jesus.carmona966@pascualbravo.edu.co'
  
  const res = await sendInformationRequestReceiptEmail({
    toEmail: recipient,
    toName: 'Santiago Morales',
    phone: '+57 312 752 9629',
    company: 'Distribuciones Antioquia S.A.',
    message: 'Queremos implementar una fuerza agéntica para comercializar nuestros productos con su base de datos propia.',
    topic: 'Comercialización Directa Delegada',
  })

  console.log('Resultado:', res)
  if (res.success) {
    console.log('✓ Acuse de recibo para persona que solicita información entregado con éxito en Gmail API.')
    console.log('✓ MessageId:', res.messageId)
  } else {
    console.error('✗ Fallo:', res.error)
  }
}

testLeadInfoRequest()
