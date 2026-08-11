const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Verifica si el dominio de un correo electrónico está bloqueado en Supabase (public.blocked_domains).
 * Retorna true si el dominio está en la lista negra, false si es válido.
 */
export async function isDomainBlocked(email: string): Promise<boolean> {
  if (!email || !email.includes('@')) return false

  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return false

  try {
    const endpoint = `${SUPABASE_URL}/rest/v1/blocked_domains?domain=eq.${encodeURIComponent(domain)}&select=domain`
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      // Fast timeout to prevent blocking legimate users if network fails
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
