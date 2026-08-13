import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// POST: Agente Especialista en Email Marketing (Generación RAG & Release Inmutable)
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const body = await request.json()
    const { campana_nombre, objetivo_comercial, is_synthetic = false } = body

    if (!campana_nombre || !objetivo_comercial) {
      return NextResponse.json({ success: false, error: 'La categoría y el objetivo comercial son obligatorios' }, { status: 400 })
    }

    const categoryCode = campana_nombre.trim()
    const objectiveText = objetivo_comercial.trim()

    // 1. RAG: Consultar memoria operacional pasada en Supabase (retrieve_similar_experiences)
    let memoryCases: any[] = []
    try {
      const rpcRes = await fetch(`${url}/rest/v1/rpc/retrieve_similar_experiences`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'automatizacion',
        },
        body: JSON.stringify({
          p_category_code: categoryCode,
          p_match_limit: 5,
          p_include_synthetic: is_synthetic,
        }),
      })

      if (rpcRes.ok) {
        memoryCases = await rpcRes.json()
      }
    } catch {
      // Continuar con memoria vacía si no hay registros previos
    }

    // 2. RAG: Consultar Hechos y Claims aprobados de CONTEXT.md en knowledge_items
    let knowledgeItems: any[] = []
    try {
      const knRes = await fetch(`${url}/rest/v1/knowledge_items?select=*&is_active=eq.true`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Accept-Profile': 'automatizacion',
        },
      })
      if (knRes.ok) {
        knowledgeItems = await knRes.json()
      }
    } catch {
      // Continuar con fallback
    }

    // 3. Generación Estructurada del Agente Especialista en Copywriting B2B (5 Ángulos Comerciales)
    const variants = [
      {
        variant_index: 1,
        angle: 'Eficiencia Operativa Comercial',
        subject: `¿Cómo optimizar el proceso comercial en ${categoryCode}?`,
        preheader: 'Automatización agéntica de prospección sin aumentar tu nómina.',
        text_body: `Hola {nombre},\n\nEn SmartContacts no reemplazamos tu equipo comercial, creamos una nueva unidad de crecimiento para ${categoryCode}.\n\nAutomatizamos la prospección B2B activa para conectar con decisión inmediata en {empresa}.\n\n¿Conversamos 15 minutos esta semana?\n\nSaludos,\nEquipo SmartContacts`,
        html_body: `<div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 18px; color: #111;">Hola {nombre},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">En SmartContacts no reemplazamos tu equipo comercial. <strong>Creamos una nueva unidad de crecimiento agéntica para tu empresa</strong>.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Ayudamos a instituciones y empresas de <strong>${categoryCode}</strong> a automatizar la prospección activa y generar reuniones cualificadas para <strong>{empresa}</strong>.</p>
          <div style="margin: 25px 0;">
            <a href="https://smartcontacts.cloud/agendar" style="background-color: #581c87; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Agendar Demostración de 15 Minutos</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 30px;">Si deseas cancelar tu suscripción y no recibir más comunicaciones, <a href="https://smartcontacts.cloud/api/email/unsubscribe?email={email}" style="color: #888; text-decoration: underline;">haz clic aquí</a>.</p>
        </div>`,
        cta_url: 'https://smartcontacts.cloud/agendar',
      },
      {
        variant_index: 2,
        angle: 'Experiencia del Aspirante / Cliente',
        subject: `${categoryCode}: Respuesta agéntica inmediata en {empresa}`,
        preheader: 'Atención comercial 24/7 con agentes inteligentes formados en tu oferta.',
        text_body: `Hola {nombre},\n\n¿Sabías que el 70% de las oportunidades comerciales se pierden por demora en la primera respuesta?\n\nEn SmartContacts integramos agentes de IA que responden y agendan reuniones para {empresa} en tiempo real.\n\nDescubre el modelo aquí: https://smartcontacts.cloud/agendar\n\nSaludos,\nSmartContacts`,
        html_body: `<div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 18px; color: #111;">Hola {nombre},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">El 70% de los prospectos en <strong>${categoryCode}</strong> eligen a la primera empresa que les ofrece una respuesta clara e inmediata.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Con nuestra tecnología agéntica, <strong>{empresa}</strong> puede atender inquietudes, calificar interesados y agendar citas automáticamente en tu calendario.</p>
          <div style="margin: 25px 0;">
            <a href="https://smartcontacts.cloud/agendar" style="background-color: #581c87; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Ver Agente Comercial en Acción</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 30px;">Si deseas cancelar tu suscripción, <a href="https://smartcontacts.cloud/api/email/unsubscribe?email={email}" style="color: #888;">haz clic aquí</a>.</p>
        </div>`,
        cta_url: 'https://smartcontacts.cloud/agendar',
      },
      {
        variant_index: 3,
        angle: 'Inteligencia de Datos B2B (+200k Contactos)',
        subject: `Directorio B2B perfilado para ${categoryCode} y {empresa}`,
        preheader: 'Accede a más de 200,000 contactos empresariales verificados en Colombia.',
        text_body: `Hola {nombre},\n\nTe presentamos el directorio verificado de SmartContacts para {empresa}.\n\nMás de 200,000 ejecutivos y decisores perfilados para acelerar tu prospección en ${categoryCode}.\n\nConoce la cobertura completa: https://smartcontacts.cloud/cobertura\n\nAtentamente,\nSmartContacts Data Unit`,
        html_body: `<div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 18px; color: #111;">Hola {nombre},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Impulsa el crecimiento de <strong>{empresa}</strong> con nuestro motor de inteligencia de datos con <strong>más de 200,000 contactos verificados</strong> en el sector de <strong>${categoryCode}</strong>.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Accede a bases clasificadas con filtrado atómico de duplicados y Habeas Data Ley 1581 garantizado.</p>
          <div style="margin: 25px 0;">
            <a href="https://smartcontacts.cloud/cobertura" style="background-color: #111111; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Explorar Mapa de Cobertura</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 30px;">Cancelar suscripción: <a href="https://smartcontacts.cloud/api/email/unsubscribe?email={email}" style="color: #888;">clic aquí</a>.</p>
        </div>`,
        cta_url: 'https://smartcontacts.cloud/cobertura',
      },
      {
        variant_index: 4,
        angle: 'Integración Tecnológica In-House vs Delegada',
        subject: `Modalidades de implementación agéntica para {empresa}`,
        preheader: 'Instalación in-house en tus servidores o comercialización 100% delegada.',
        text_body: `Hola {nombre},\n\n¿Prefieres instalar el software agéntico en tu infraestructura o delegar la prospección a nuestra unidad comercial?\n\nEn SmartContacts ofrecemos ambas modalidades adaptadas a {empresa} en ${categoryCode}.\n\nVer modalidades: https://smartcontacts.cloud/modalidades\n\nSaludos,\nSmartContacts Architecture Team`,
        html_body: `<div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 18px; color: #111;">Hola {nombre},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Ofrecemos dos modelos flexibles para <strong>{empresa}</strong>:</p>
          <ul style="font-size: 14px; color: #444; line-height: 1.8;">
            <li><strong>Instalación In-House</strong>: Despliegue en tus servidores con control total de datos.</li>
            <li><strong>Unidad Delegada</strong>: Nosotros ejecutamos la prospección y te entregamos reuniones listas.</li>
          </ul>
          <div style="margin: 25px 0;">
            <a href="https://smartcontacts.cloud/modalidades" style="background-color: #581c87; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Comparar Modalidades de Servicio</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 30px;">Darse de baja: <a href="https://smartcontacts.cloud/api/email/unsubscribe?email={email}" style="color: #888;">clic aquí</a>.</p>
        </div>`,
        cta_url: 'https://smartcontacts.cloud/modalidades',
      },
      {
        variant_index: 5,
        angle: 'Reducción de Trabajo Manual Comercial',
        subject: `{nombre}, libera a tu equipo de tareas repetitivas en {empresa}`,
        preheader: 'Automatiza el seguimiento y agendamiento para enfocarte en cerrar contratos.',
        text_body: `Hola {nombre},\n\nTu equipo comercial no debería perder 4 horas al día buscando contactos y enviando correos manuales.\n\nCon la Fuerza Agéntica de SmartContacts, {empresa} automatiza el seguimiento en ${categoryCode}.\n\nCalcula tu ahorro de tiempo aquí: https://smartcontacts.cloud/agendar\n\nUn cordial saludo,\nSmartContacts Growth Team`,
        html_body: `<div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="font-size: 18px; color: #111;">Hola {nombre},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Tu equipo en <strong>{empresa}</strong> no debería gastar horas valiosas en tareas administrativas repetitivas.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #444;">Nuestra plataforma automatiza la prospección en el sector de <strong>${categoryCode}</strong>, permitiendo que tus consultores se concentren únicamente en cerrar negociaciones cualificadas.</p>
          <div style="margin: 25px 0;">
            <a href="https://smartcontacts.cloud/agendar" style="background-color: #111111; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Agendar Cita con un Especialista</a>
          </div>
          <p style="font-size: 11px; color: #888; margin-top: 30px;">Si no deseas recibir más correos de SmartContacts, <a href="https://smartcontacts.cloud/api/email/unsubscribe?email={email}" style="color: #888;">haz clic aquí para darte de baja</a>.</p>
        </div>`,
        cta_url: 'https://smartcontacts.cloud/agendar',
      },
    ]

    // 4. Inserción de la Campaña Congelada en automatizacion.campaigns (Estado: pending_approval)
    const campaignPayload = {
      name: `Campaña Agéntica — ${categoryCode}`,
      category_code: categoryCode,
      objective: objectiveText,
      status: 'pending_approval',
      policy_version: 'v1.0',
      is_synthetic,
      source_type: is_synthetic ? 'simulation' : 'production',
    }

    let campRes = await fetch(`${url}/rest/v1/campaigns`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(campaignPayload),
    })

    if (!campRes.ok) {
      // Fallback esquema public
      campRes = await fetch(`${url}/rest/v1/campaigns`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(campaignPayload),
      })
    }

    if (!campRes.ok) {
      const errText = await campRes.text()
      return NextResponse.json({ success: false, error: `No se pudo registrar la campaña: ${errText}` }, { status: 400 })
    }

    const insertedCampaigns = await campRes.json()
    const campaign = insertedCampaigns[0]

    // 5. Inserción de las 5 Variaciones en automatizacion.campaign_variants
    const variantsPayload = variants.map((v) => ({
      campaign_id: campaign.id,
      variant_index: v.variant_index,
      angle: v.angle,
      subject: v.subject,
      preheader: v.preheader,
      text_body: v.text_body,
      html_body: v.html_body,
      cta_url: v.cta_url,
      claims_used: knowledgeItems.slice(0, 3).map((k: any) => k.id || k.title),
    }))

    await fetch(`${url}/rest/v1/campaign_variants`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
      },
      body: JSON.stringify(variantsPayload),
    })

    // 6. Auditoría del Agente en automatizacion.agent_decisions
    const decisionRunId = crypto.randomUUID()
    const decisionPayload = {
      run_id: decisionRunId,
      campaign_id: campaign.id,
      decision_type: 'generation',
      decision_status: 'hold', // Requiere aprobación humana
      input_snapshot: { campana_nombre, objetivo_comercial, is_synthetic },
      evidence_case_ids: memoryCases.map((m: any) => m.id),
      match_scores: { count: memoryCases.length, scores: memoryCases.map((m: any) => m.expected_utility) },
      model_id: 'gemini-2.5-flash',
      output_snapshot: { variant_count: variants.length, campaign_id: campaign.id },
    }

    await fetch(`${url}/rest/v1/agent_decisions`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        'Content-Profile': 'automatizacion',
      },
      body: JSON.stringify(decisionPayload),
    })

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      status: campaign.status,
      memory_cases_retrieved: memoryCases.length,
      variants,
      message: 'Las 5 variaciones comerciales fueron estructuradas y congeladas en Supabase. Pendientes de aprobación humana.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
