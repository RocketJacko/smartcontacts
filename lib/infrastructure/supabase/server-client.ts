import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase en el servidor para Server Components, Route Handlers y Server Actions.
 * Administra cookies de sesión seguras de Supabase Auth (tokens de acceso y refresco).
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se puede ignorar cuando se llama desde un Server Component
            // si el middleware ya refresca las sesiones de usuario.
          }
        },
      },
    }
  )
}
