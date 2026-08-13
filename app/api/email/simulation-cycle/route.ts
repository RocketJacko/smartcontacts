import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// POST: Endpoint de Simulación del Circuito Cerrado de Aprendizaje (Observe -> Mature -> Learn)
export async function POST(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    if (!url || !anonKey) {
      return NextResponse.json({ success: false, error: 'Configuración de Supabase no encontrada' }, { status: 500 })
    }

    const body = await request.json()
    const { campana_nombre = 'Directorio - Universidades & Educación', objetivo_comercial = 'Simulación de prueba agéntica de admisiones' } = body

    // 1. Invocación del Agente de IA para generar la campaña de prueba (is_synthetic = true)
    const genRes = await fetch(`${request.headers.get('origin') || 'http://localhost:3000'}/api/email/ai-generator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campana_nombre,
        objetivo_comercial,
        is_synthetic: true,
      }),
    })

    const genData = await genRes.json()
    if (!genData.success) {
      return NextResponse.json({ success: false, error: `Error en generación agéntica: ${genData.error}` }, { status: 400 })
    }

    const campaignId = genData.campaign_id

    // 2. Simulación de Aprobación Humana -> Actualizar campaña a 'approved'
    await fetch(`${url}/rest/v1/campaigns?id=eq.${campaignId}`, {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
      },
      body: JSON.stringify({
        status: 'approved',
        approved_by: 'simulated_test_operator',
        approved_at: new Date().toISOString(),
      }),
    })

    // 3. Registrar Eventos Sintéticos de Prueba Inmutables (delivery_events)
    const variantId = genData.variants[0]?.variant_index || 1
    const eventPayloads = [
      {
        email: 'test.simulated1@universidad.edu.co',
        event_type: 'delivered',
        is_synthetic: true,
        idempotency_key: `sim_del_${campaignId}_1`,
      },
      {
        email: 'test.simulated2@universidad.edu.co',
        event_type: 'reply',
        is_synthetic: true,
        idempotency_key: `sim_rep_${campaignId}_2`,
      },
      {
        email: 'test.simulated3@universidad.edu.co',
        event_type: 'conversion',
        is_synthetic: true,
        idempotency_key: `sim_conv_${campaignId}_3`,
      },
    ]

    await fetch(`${url}/rest/v1/delivery_events`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
      },
      body: JSON.stringify(eventPayloads),
    })

    // 4. Crear la Candidatura de Aprendizaje (learning_candidates)
    const candidatePayload = {
      source_campaign_id: campaignId,
      proposed_by_model: 'gemini-2.5-flash',
      diagnostic_summary: `Respuesta cualificada positiva en el ángulo: ${genData.variants[0]?.angle || 'Eficiencia Operativa'}.`,
      outcome_class: 'positive',
      sample_size: 150,
      confidence_score: 0.88,
      status: 'pending_evaluation',
      is_synthetic: true,
    }

    const candRes = await fetch(`${url}/rest/v1/learning_candidates`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Accept-Profile': 'automatizacion',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(candidatePayload),
    })

    let candidateId = null
    if (candRes.ok) {
      const candidates = await candRes.json()
      candidateId = candidates[0]?.id
    }

    // 5. Promoción Determinista a experience_cases vía RPC
    let promotionResult = null
    if (candidateId) {
      const promRes = await fetch(`${url}/rest/v1/rpc/promover_candidato_a_experiencia`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'automatizacion',
        },
        body: JSON.stringify({
          p_candidate_id: candidateId,
        }),
      })

      if (promRes.ok) {
        promotionResult = await promRes.json()
      }
    }

    return NextResponse.json({
      success: true,
      circuit_simulation: {
        campaign_id: campaignId,
        is_synthetic: true,
        generated_variants: genData.variants.length,
        synthetic_events_logged: eventPayloads.length,
        learning_candidate_id: candidateId,
        promotion_result: promotionResult,
      },
      message: 'El circuito cerrado de simulación (Intake -> RAG -> Release -> Synthetic Events -> Learning Candidate -> Promote RPC) fue completado exitosamente.',
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
