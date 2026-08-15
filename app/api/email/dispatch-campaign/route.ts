import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'
import { GoogleQuotaStore } from '@/lib/infrastructure/google/google-quota-store'
import { sendGmailCustomEmail } from '@/lib/gmail-service'

/**
 * API REST para Despacho de Campañas por Goteo con Rotación Round-Robin Anti-Spam
 * e Historial Canónico Auditado en emailmarketing.envios.
 */
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const body = await request.json()
    const {
      campana_id,
      campana_nombre,
      directorio_nombre,
      remitente = 'jesus.carmona966@pascualbravo.edu.co',
      mascara_remitente = 'Agendamiento Smartcontacts <jesus.carmona966@pascualbravo.edu.co>',
      drip_min = 3.0,
      drip_max = 5.0,
    } = body

    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const headers = {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Accept-Profile': 'emailmarketing',
      'Content-Profile': 'emailmarketing',
    }

    // 1. Obtener o resolver la Campaña canónica
    let activeCampana: any = null

    if (campana_id) {
      const resC = await fetch(`${url}/rest/v1/campanas?id=eq.${campana_id}&select=*`, { headers, cache: 'no-store' })
      if (resC.ok) {
        const rows = await resC.json()
        if (rows.length > 0) activeCampana = rows[0]
      }
    }

    if (!activeCampana && campana_nombre) {
      const resC = await fetch(`${url}/rest/v1/campanas?nombre=eq.${encodeURIComponent(campana_nombre.trim())}&select=*`, { headers, cache: 'no-store' })
      if (resC.ok) {
        const rows = await resC.json()
        if (rows.length > 0) activeCampana = rows[0]
      }
    }

    // Si la campaña no existe, crearla automáticamente asociada al directorio
    if (!activeCampana) {
      const targetName = campana_nombre || `Campaña ${directorio_nombre || 'General'}`
      
      let directorioId: string | null = null
      if (directorio_nombre) {
        const dirRes = await fetch(`${url}/rest/v1/directorios?nombre=eq.${encodeURIComponent(directorio_nombre.trim())}&select=id`, { headers, cache: 'no-store' })
        if (dirRes.ok) {
          const rows = await dirRes.json()
          if (rows.length > 0) directorioId = rows[0].id
        }
      }

      const createRes = await fetch(`${url}/rest/v1/campanas`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({
          nombre: targetName,
          directorio_id: directorioId,
          remitente,
          mascara_remitente,
          drip_min,
          drip_max,
          estado: 'enviando',
        }),
      })

      if (createRes.ok) {
        const created = await createRes.json()
        activeCampana = created[0]
      }
    }

    if (!activeCampana) {
      return NextResponse.json({ success: false, error: 'No se pudo inicializar la campaña para el despacho' }, { status: 400 })
    }

    // 2. Sincronizar los destinatarios del directorio a la campaña (evita omitir contactos)
    await fetch(`${url}/rest/v1/rpc/sincronizar_destinatarios_campana`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_campana_id: activeCampana.id }),
    })

    // 3. Obtener límite diario de Gmail y contador de envíos
    const { dailyLimit } = await GoogleQuotaStore.obtenerLimiteDiario(remitente)
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

    // 4. Obtener pool de asuntos y cuerpos para Round-Robin (específicos de la campaña o globales)
    let poolAsuntos: string[] = ['Asesoría Consultiva en IA Agéntica — Smartcontacts', 'Nueva Unidad Agéntica para tu Empresa — Smartcontacts']
    let poolCuerpos: string[] = [
      'Hola {{nombre}},\n\nTe invitamos a agendar tu sesión consultiva de 45 minutos.\n\nEnlace: https://smartcontacts.cloud/agendar',
      'Estimado/a {{nombre}},\n\nEstructuramos tu unidad de crecimiento comercial con Inteligencia Artificial.\n\nReserva aquí: https://smartcontacts.cloud/agendar',
    ]

    try {
      const resAsuntos = await fetch(`${url}/rest/v1/campana_asuntos?campana_id=eq.${activeCampana.id}&activo=eq.true&select=asunto`, { headers, cache: 'no-store' })
      if (resAsuntos.ok) {
        const rows = await resAsuntos.json()
        if (rows.length > 0) poolAsuntos = rows.map((r: any) => r.asunto)
      }

      const resCuerpos = await fetch(`${url}/rest/v1/campana_cuerpos?campana_id=eq.${activeCampana.id}&activo=eq.true&select=cuerpo_html`, { headers, cache: 'no-store' })
      if (resCuerpos.ok) {
        const rows = await resCuerpos.json()
        if (rows.length > 0) poolCuerpos = rows.map((r: any) => r.cuerpo_html)
      }
    } catch (poolErr) {
      console.warn('[POOL FETCH WARN]', poolErr)
    }

    // 5. Consultar contactos pendientes ESPECÍFICOS DE ESTA CAMPAÑA
    const pendingRes = await fetch(
      `${url}/rest/v1/campana_contactos?campana_id=eq.${activeCampana.id}&estado=eq.pendiente&select=contacto_id,contactos(id,email,nombre)&order=creado_en.asc`,
      { headers, cache: 'no-store' }
    )

    if (!pendingRes.ok) {
      return NextResponse.json({ success: false, error: 'Error al consultar inventario de destinatarios pendientes de la campaña' }, { status: 500 })
    }

    const pendingRows = await pendingRes.json()
    if (pendingRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay contactos pendientes por procesar en esta campaña.',
        enviados: 0,
        fallidos: 0,
      })
    }

    // 6. Ejecutar ciclo de despacho por goteo Round-Robin
    let enviados = 0
    let fallidos = 0
    let asuntoIndex = 0
    let cuerpoIndex = 0

    for (const item of pendingRows) {
      if (sentToday >= dailyLimit) break

      const contact = item.contactos
      if (!contact || !contact.email) continue

      const asunto = poolAsuntos[asuntoIndex % poolAsuntos.length]
      const cuerpoTemplate = poolCuerpos[cuerpoIndex % poolCuerpos.length]
      const cuerpoFinal = cuerpoTemplate.replace(/\{\{nombre\}\}/g, contact.nombre || 'Estimado/a')

      asuntoIndex++
      cuerpoIndex++

      // Enviar correo por servicio Gmail API
      const result = await sendGmailCustomEmail({
        toEmail: contact.email,
        toName: contact.nombre || '',
        subject: asunto,
        htmlBody: cuerpoFinal,
        senderEmail: remitente,
        senderMask: mascara_remitente,
      })

      if (result.success) {
        enviados++
        sentToday++

        // Actualizar estado en campana_contactos a 'enviado'
        await fetch(`${url}/rest/v1/campana_contactos?campana_id=eq.${activeCampana.id}&contacto_id=eq.${contact.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'enviado',
            enviado_en: new Date().toISOString(),
          }),
        })

        // Registrar en historial auditado de envíos
        await fetch(`${url}/rest/v1/envios`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campana_id: activeCampana.id,
            contacto_id: contact.id,
            estado: 'entregado',
            asunto_usado: asunto,
            proveedor_id: result.messageId || null,
          }),
        })

        // Goteo aleatorio
        const delayMs = Math.floor(Math.random() * (drip_max - drip_min) * 1000) + drip_min * 1000
        await new Promise((res) => setTimeout(res, delayMs))
      } else {
        fallidos++
        
        await fetch(`${url}/rest/v1/campana_contactos?campana_id=eq.${activeCampana.id}&contacto_id=eq.${contact.id}`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'fallido',
            error_mensaje: result.error || 'Error al despachar correo',
          }),
        })
      }
    }

    return NextResponse.json({
      success: true,
      enviados,
      fallidos,
      sentToday,
      dailyLimit,
      campana_id: activeCampana.id,
      message: `Despacho procesado: ${enviados} correos enviados limpiamente.`,
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
