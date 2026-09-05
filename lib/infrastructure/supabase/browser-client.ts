import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente de Supabase en el navegador para Client Components.
 * Comparte automáticamente las cookies de sesión con el servidor.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
