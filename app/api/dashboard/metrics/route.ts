import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export async function GET() {
  try {
    const { url, anonKey } = getSupabaseConfig()

    let totalProspectos = 0
    let totalEventos = 0
    let recordatoriosEnviados = 0
    let habeasDataAceptados = 0
    let estadoCounts: Record<string, number> = {
      agendado: 0,
      recordatorio_enviado: 0,
      en_progreso: 0,
      cumplida: 0,
      no_asistio: 0,
      cancelada: 0,
    }
    let resultadoCounts: Record<string, number> = {
      cerrado_ganado: 0,
      cierre_segundo_contacto: 0,
      llamar_futuro: 0,
      no_interesa: 0,
      no_cumple_agendamiento: 0,
    }

    if (url && anonKey) {
      // Query prospectos count & Habeas Data consent count
      const prospectosRes = await fetch(`${url}/rest/v1/prospectos?select=id,acepta_tratamiento_datos`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })

      if (prospectosRes.ok) {
        const prospectosData: Array<{ id: string; acepta_tratamiento_datos?: boolean }> = await prospectosRes.json()
        totalProspectos = prospectosData.length
        habeasDataAceptados = prospectosData.filter((p) => p.acepta_tratamiento_datos !== false).length
      }

      // Query eventos count, estados & resultados comerciales
      const eventosRes = await fetch(`${url}/rest/v1/eventos?select=id,estado,resultado_comercial,recordatorio_30m_enviado`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })

      if (eventosRes.ok) {
        const eventosData: Array<{
          id: string
          estado?: string
          resultado_comercial?: string
          recordatorio_30m_enviado?: boolean
        }> = await eventosRes.json()

        totalEventos = eventosData.length
        recordatoriosEnviados = eventosData.filter((e) => e.recordatorio_30m_enviado === true).length

        eventosData.forEach((e) => {
          if (e.estado && estadoCounts[e.estado] !== undefined) {
            estadoCounts[e.estado]++
          }
          if (e.resultado_comercial && resultadoCounts[e.resultado_comercial] !== undefined) {
            resultadoCounts[e.resultado_comercial]++
          }
        })
      }
    }

    // Google API Consumption Metrics & System SLA
    const googleApiConsumption = {
      gmailApi: {
        emailsSent: recordatoriosEnviados + totalEventos, // Confirmations + Reminders
        quotaUsedPercentage: Math.min(100, Number(((recordatoriosEnviados + totalEventos) / 500 * 100).toFixed(1))),
        status: 'OPERACIONAL',
      },
      meetApi: {
        linksGenerated: totalEventos,
        activeRooms: estadoCounts.en_progreso || 0,
        status: 'OPERACIONAL',
      },
      calendarApi: {
        eventsSynced: totalEventos,
        lastSync: new Date().toISOString(),
        status: 'OPERACIONAL',
      },
    }

    const showUpRate = totalEventos > 0 ? Number(((estadoCounts.cumplida / totalEventos) * 100).toFixed(1)) : 0
    const habeasDataPercentage = totalProspectos > 0 ? Number(((habeasDataAceptados / totalProspectos) * 100).toFixed(1)) : 100

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          totalProspectos,
          totalEventos,
          recordatoriosEnviados,
          habeasDataAceptados,
          habeasDataPercentage,
          showUpRate,
        },
        estadoCounts,
        resultadoCounts,
        googleApiConsumption,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[DASHBOARD METRICS ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error consultando métricas' }, { status: 500 })
  }
}
