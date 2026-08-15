import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { GoogleQuotaStore } from '@/lib/infrastructure/google/google-quota-store'
import { sendGmailCustomEmail } from '@/lib/gmail-service'

/**
 * API REST para Despacho de Campañas por Goteo con Rotación Round-Robin Anti-Spam
 * y Aprendizaje Dinámico de Cuotas de Gmail API.
 */
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const {
      campana_nombre,
      remitente = 'jesus.carmona966@pascualbravo.edu.co',
      mascara_remitente = 'Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>',
      drip_min = 3.0,
      drip_max = 5.0,
    } = body

    if (!campana_nombre || !remitente) {
      return NextResponse.json({ success: false, error: 'campana_nombre y remitente son obligatorios' }, { status: 400 })
    }

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    // 1. Obtener límite diario y contador de envíos del remitente
    const { dailyLimit, isLearned } = await GoogleQuotaStore.obtenerLimiteDiario(remitente)
    let sentToday = await GoogleQuotaStore.obtenerEnviadosHoy(remitente)

    if (sentToday >= dailyLimit) {
      return NextResponse.json({
        success: false,
        motivo_corte: 'pausado_por_limite_diario',
        message: `Cuota diaria alcanzada (${sentToday}/${dailyLimit}). Campaña pausada limpiamente.`,
        sentToday,
        dailyLimit,
      })
    }

    // 2. Obtener pool de asuntos y pool de cuerpos para Round-Robin
    let poolAsuntos: string[] = ['Asesoría Consultiva en IA Agéntica — Smartcontacts', 'Nueva Unidad Agéntica para tu Empresa — Smartcontacts']
    let poolCuerpos: string[] = [
      'Hola {{nombre}},\n\nTe invitamos a agendar tu sesión consultiva de 45 minutos.\n\nEnlace: https://smartcontacts.cloud/agendar',
      'Estimado/a {{nombre}},\n\nEstructuramos tu unidad de crecimiento comercial con Inteligencia Artificial.\n\nReserva aquí: https://smartcontacts.cloud/agendar',
    ]

    try {
      const resAsuntos = await fetch(`${url}/rest/v1/pool_asuntos?select=asunto&activo=eq.true`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Accept-Profile': 'automatizacion' },
      })
      if (resAsuntos.ok) {
        const rows = await resAsuntos.json()
        if (rows.length > 0) poolAsuntos = rows.map((r: any) => r.asunto)
      }

      const resCuerpos = await fetch(`${url}/rest/v1/pool_cuerpos?select=cuerpo_html&activo=eq.true`, {
        headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Accept-Profile': 'automatizacion' },
      })
      if (resCuerpos.ok) {
        const rows = await resCuerpos.json()
        if (rows.length > 0) poolCuerpos = rows.map((r: any) => r.cuerpo_html)
      }
    } catch (poolErr) {
      console.warn('[POOL FETCH WARN]', poolErr)
    }

    // 3. Consultar contactos pendientes en el directorio
    const cleanDirectory = campana_nombre.trim()
    const contactsRes = await fetch(
      `${url}/rest/v1/email?campana_nombre=eq.${encodeURIComponent(cleanDirectory)}&estado=eq.pendiente&select=*&order=creado_en.asc`,
      {
        headers: { 
          apikey: anonKey, 
          Authorization: `Bearer ${anonKey}`, 
          'Accept-Profile': 'emailmarketing',
          'Content-Profile': 'emailmarketing'
        },
        cache: 'no-store',
      }
    )

    if (!contactsRes.ok) {
      return NextResponse.json({ success: false, error: 'Error al consultar inventario de contactos del directorio' }, { status: 500 })
    }

    const pendingContacts = await contactsRes.json()
    if (pendingContacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay contactos pendientes por procesar en este directorio.',
        enviados: 0,
        omitidos_duplicado: 0,
        fallidos: 0,
      })
    }

    let enviadosCount = 0
    let fallidosCount = 0
    let motivoCorte: string | null = null

    // 4. Bucle de envío con goteo y Round-Robin
    for (let i = 0; i < pendingContacts.length; i++) {
      const contacto = pendingContacts[i]

      // Verificar cuota antes de cada envío individual
      if (sentToday >= dailyLimit) {
        motivoCorte = 'pausado_por_limite_diario'
        break
      }

      // Selección Round-Robin de Asunto y Cuerpo
      const rawAsunto = poolAsuntos[i % poolAsuntos.length]
      const rawCuerpo = poolCuerpos[i % poolCuerpos.length]

      // Reemplazo de variables dinámicas (solo nombre si existe, o reemplazo limpio)
      const asuntoFinal = rawAsunto.replace(/{{nombre}}/g, contacto.nombre || '')
      const cuerpoFinal = rawCuerpo.replace(/{{nombre}}/g, contacto.nombre || '')

      // Intento de envío vía Gmail API
      const result = await sendGmailCustomEmail({
        toEmail: contacto.email,
        subject: asuntoFinal,
        body: cuerpoFinal,
        fromMask: mascara_remitente || `Agendamiento Smartcontacts <${remitente}>`,
      })

      if (result.success) {
        enviadosCount++
        sentToday = await GoogleQuotaStore.incrementarEnviadosHoy(remitente)

        // Actualizar estado del contacto a 'enviado' en emailmarketing.email
        await fetch(`${url}/rest/v1/email?id=eq.${contacto.id}`, {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'emailmarketing',
            'Content-Profile': 'emailmarketing',
          },
          body: JSON.stringify({ estado: 'enviado', ultimo_envio: new Date().toISOString() }),
        })

        // Goteo Aleatorio Antispam (3.0s a 5.0s)
        const delaySeconds = parseFloat((Math.random() * (drip_max - drip_min) + drip_min).toFixed(2))
        await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000))
      } else {
        // Detectar si el error fue por exceso de cuota HTTP 429/403
        if (result.error && (result.error.includes('quotaExceeded') || result.error.includes('dailyLimitExceeded'))) {
          const domain = remitente.split('@')[1] || ''
          await GoogleQuotaStore.guardarLimiteAprendido(domain, sentToday)
          motivoCorte = 'pausado_por_limite_detectado_gmail'
          break
        }

        fallidosCount++
        await fetch(`${url}/rest/v1/email?id=eq.${contacto.id}`, {
          method: 'PATCH',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'emailmarketing',
            'Content-Profile': 'emailmarketing',
          },
          body: JSON.stringify({ estado: 'fallido' }),
        })
      }
    }

    return NextResponse.json({
      success: true,
      campana_nombre,
      enviados: enviadosCount,
      fallidos: fallidosCount,
      motivo_corte: motivoCorte,
      sentToday,
      dailyLimit,
      isLearnedQuota: isLearned,
    })
  } catch (error: any) {
    console.error('[API DISPATCH CAMPAIGN ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
