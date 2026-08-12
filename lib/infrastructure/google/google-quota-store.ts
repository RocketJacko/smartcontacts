import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

export interface QuotaInfo {
  dailyLimit: number
  sentToday: number
  remaining: number
  isLearned: boolean
}

/**
 * Gestor de Cuotas y Aprendizaje Dinámico por Dominio en Supabase (`automatizacion`).
 */
export class GoogleQuotaStore {
  /**
   * Determina el límite diario de un remitente.
   * 1. Dominio institucional @pascualbravo.edu.co -> 2,000 correos/día.
   * 2. Dominio gratuito @gmail.com -> 500 correos/día.
   * 3. Dominio con límite aprendido previo -> Usar limite_real.
   * 4. Dominio desconocido -> Límite estimado inicial 2,000.
   */
  static async obtenerLimiteDiario(senderEmail: string): Promise<{ dailyLimit: number; isLearned: boolean }> {
    const emailLower = senderEmail.toLowerCase()
    const domain = emailLower.split('@')[1] || ''

    if (domain === 'pascualbravo.edu.co') {
      return { dailyLimit: 2000, isLearned: false }
    }
    if (domain === 'gmail.com') {
      return { dailyLimit: 500, isLearned: false }
    }

    // Consultar si existe un límite real aprendido en Supabase
    try {
      const { url, anonKey } = getSupabaseConfig()
      if (url && anonKey) {
        const res = await fetch(`${url}/rest/v1/limites_aprendidos?dominio=eq.${encodeURIComponent(domain)}`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Accept-Profile': 'automatizacion',
          },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0) {
            return { dailyLimit: data[0].limite_real, isLearned: true }
          }
        }
      }
    } catch (err) {
      console.warn('[QUOTA STORE DB WARN]', err)
    }

    // Estimado inicial para dominios empresariales Workspace no confirmados
    return { dailyLimit: 2000, isLearned: false }
  }

  /**
   * Registra un límite aprendido cuando la API de Gmail retorna un error de cuotas HTTP 429/403.
   */
  static async guardarLimiteAprendido(domain: string, limiteReal: number): Promise<void> {
    try {
      const { url, anonKey } = getSupabaseConfig()
      if (!url || !anonKey) return

      await fetch(`${url}/rest/v1/limites_aprendidos`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'automatizacion',
          'Content-Profile': 'automatizacion',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          dominio: domain.toLowerCase(),
          limite_real: limiteReal,
          actualizado_en: new Date().toISOString(),
        }),
      })
    } catch (err) {
      console.error('[GUARDAR LIMITE APRENDIDO ERROR]', err)
    }
  }

  /**
   * Obtiene la cantidad de correos despachados el día de hoy por el remitente.
   */
  static async obtenerEnviadosHoy(senderEmail: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    try {
      const { url, anonKey } = getSupabaseConfig()
      if (!url || !anonKey) return 0

      const res = await fetch(
        `${url}/rest/v1/control_envios?sender_email=eq.${encodeURIComponent(senderEmail)}&fecha=eq.${today}`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Accept-Profile': 'automatizacion',
          },
          cache: 'no-store',
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data && data.length > 0) {
          return data[0].enviados_hoy || 0
        }
      }
    } catch (err) {
      console.warn('[OBTENER ENVIADOS HOY WARN]', err)
    }
    return 0
  }

  /**
   * Incrementa atómicamente el contador de envíos del día.
   */
  static async incrementarEnviadosHoy(senderEmail: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0]
    const current = await this.obtenerEnviadosHoy(senderEmail)
    const newTotal = current + 1

    try {
      const { url, anonKey } = getSupabaseConfig()
      if (url && anonKey) {
        await fetch(`${url}/rest/v1/control_envios`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Accept-Profile': 'automatizacion',
            'Content-Profile': 'automatizacion',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({
            sender_email: senderEmail.toLowerCase(),
            fecha: today,
            enviados_hoy: newTotal,
          }),
        })
      }
    } catch (err) {
      console.error('[INCREMENTAR ENVIADOS HOY ERROR]', err)
    }

    return newTotal
  }
}
