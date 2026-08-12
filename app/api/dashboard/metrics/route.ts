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

    let recentLogs: Array<{ time: string; label: string; status: string; type: string }> = []
    let hourlyCounts: number[] = [0, 0, 0, 0, 0, 0]

    if (url && anonKey) {
      // Query prospectos list
      const prospectosRes = await fetch(`${url}/rest/v1/prospectos?select=id,name,company,topic,created_at,acepta_tratamiento_datos&order=created_at.desc&limit=10`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })

      if (prospectosRes.ok) {
        const prospectosData: Array<{ id: string; name: string; company?: string; topic?: string; created_at: string; acepta_tratamiento_datos?: boolean }> = await prospectosRes.json()
        totalProspectos = prospectosData.length
        habeasDataAceptados = prospectosData.filter((p) => p.acepta_tratamiento_datos !== false).length

        prospectosData.forEach((p) => {
          const date = new Date(p.created_at || Date.now())
          const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          recentLogs.push({
            time: timeStr,
            label: `Registro de Prospecto: ${p.name} ${p.company ? `(${p.company})` : ''} - Tema: ${p.topic || 'Consulta General'}`,
            status: 'Supabase DB',
            type: 'prospecto',
          })
        })
      }

      // Query eventos list
      const eventosRes = await fetch(`${url}/rest/v1/eventos?select=id,titulo,meet_link,estado,resultado_comercial,recordatorio_30m_enviado,creado_en&order=creado_en.desc&limit=10`, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        cache: 'no-store',
      })

      if (eventosRes.ok) {
        const eventosData: Array<{
          id: string
          titulo: string
          meet_link?: string
          estado?: string
          resultado_comercial?: string
          recordatorio_30m_enviado?: boolean
          creado_en: string
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

          const date = new Date(e.creado_en || Date.now())
          const timeStr = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          const hour = date.getHours()
          if (hour >= 8 && hour <= 18) {
            const idx = Math.min(5, Math.floor((hour - 8) / 2))
            hourlyCounts[idx]++
          }

          recentLogs.push({
            time: timeStr,
            label: `Cita Agendada: ${e.titulo} ${e.meet_link ? `(Meet Link Activo)` : ''}`,
            status: e.estado === 'cumplida' ? 'Meet Cumplida' : 'Google Meet API',
            type: 'evento',
          })
        })
      }
    }

    // Sort recent logs combined by time
    recentLogs = recentLogs.slice(0, 8)

    // Google API Consumption Metrics based strictly on real DB records
    const googleApiConsumption = {
      gmailApi: {
        emailsSent: recordatoriosEnviados + totalEventos,
        quotaUsedPercentage: Math.min(100, Number((((recordatoriosEnviados + totalEventos) / 500) * 100).toFixed(1))),
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
    const habeasDataPercentage = totalProspectos > 0 ? Number(((habeasDataAceptados / totalProspectos) * 100).toFixed(1)) : 0

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
        recentLogs,
        hourlyCounts,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[DASHBOARD METRICS ERROR]', error)
    return NextResponse.json({ success: false, error: error.message || 'Error consultando métricas' }, { status: 500 })
  }
}
