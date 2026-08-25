const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

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

  // 2. Verificación dinámica contra Supabase (public.blocked_domains)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('dummy')) {
    return false
  }

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/blocked_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      console.warn('[SUPABASE DOMAIN CHECK WARNING]', response.statusText)
      return false
    }

    const data = await response.json()
    return Array.isArray(data) && data.length > 0
  } catch (err) {
    console.error('[SUPABASE DOMAIN CHECK ERROR]', err)
    return false
  }
}
