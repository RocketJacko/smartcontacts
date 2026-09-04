import { getEmailSupabaseConfig } from './infrastructure/supabase/supabase-client'

// Lista estática instantánea de dominios temporales, desechables y typos comunes
const KNOWN_BLOCKED_DOMAINS = new Set([
  'yopmail.com',
  'guerrillamail.com',
  'tempmail.com',
  '10minutemail.com',
  'mailinator.com',
  'trashmail.com',
  'dispostable.com',
  'getnada.com',
  'throwawaymail.com',
  'temp-mail.org',
  'sharklasers.com',
  'guerrillamailblock.com',
  'bccto.me',
  'chacuo.net',
  '027168.com',
  'asdasd.com',
  'test.com',
  'fake.com',
  'invalid.com',
  'gamil.com',
  'hotmial.com',
  'outlok.com',
  'yahou.com',
])

/**
 * Verifica si el dominio de un correo electrónico está bloqueado en la lista o en Supabase (public.blocked_domains).
 * Retorna true si el dominio está en la lista negra, false si es válido.
 */
export async function isDomainBlocked(email: string): Promise<boolean> {
  if (!email || !email.includes('@')) return false

  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false

  // 1. Verificación instantánea contra la lista estática local
  if (KNOWN_BLOCKED_DOMAINS.has(domain)) {
    return true
  }

  // 2. Verificación dinámica contra Supabase (public.blocked_domains en BD pesada)
  const { url, anonKey } = getEmailSupabaseConfig()
  if (!url || !anonKey || anonKey.includes('dummy')) {
    return false
  }

  try {
    const endpoint = `${url}/rest/v1/blocked_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}
