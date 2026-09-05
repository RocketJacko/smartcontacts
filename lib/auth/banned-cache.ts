/**
 * Módulo de Caché y Detección de Baneos en Tiempo Real por IP y por Dispositivo.
 * Consulta la base de datos Supabase y mantiene una caché local ultrarrápida de 60 segundos.
 */

interface BanInfo {
  baneado: boolean
  motivo?: string
}

const banCache = new Map<string, { info: BanInfo; timestamp: number }>()
const CACHE_TTL_MS = 60 * 1000 // 60 segundos

export async function isIpOrDeviceBanned(
  ip: string,
  deviceId?: string
): Promise<BanInfo> {
  const now = Date.now()
  const cacheKey = `${ip}:${deviceId || 'nodevice'}`

  const cached = banCache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.info
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return { baneado: false }
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/verificar_baneo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        p_ip: ip,
        p_device_id: deviceId || null,
      }),
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return { baneado: false }
    }

    const data = await res.json()
    const info: BanInfo = data && data.baneado === true
      ? { baneado: true, motivo: data.motivo || 'Acceso revocado por seguridad.' }
      : { baneado: false }

    banCache.set(cacheKey, { info, timestamp: now })
    return info
  } catch {
    return { baneado: false }
  }
}

export function registerLocalBan(ipOrDevice: string, motivo = 'Bloqueo temporal inmediato') {
  banCache.set(ipOrDevice, {
    info: { baneado: true, motivo },
    timestamp: Date.now(),
  })
}
