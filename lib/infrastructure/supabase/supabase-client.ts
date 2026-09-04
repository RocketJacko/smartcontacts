/**
 * Helper unificado para resolver la URL y Anon Key de Supabase en runtime.
 * Cumplimiento de Regla 6 (AGENTS.md).
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  const secretKey = process.env.CHECK_DOMAIN_SECRET || ''

  return { url, anonKey, secretKey }
}

/**
 * Helper específico para resolver la conexión a la base de datos pesada de Email Marketing
 * (Supabase auto-hospedado / BD pesada con contactos, listas negras y auditoría de envíos).
 */
export function getEmailSupabaseConfig() {
  const url = process.env.EMAIL_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.EMAIL_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const secretKey = process.env.CHECK_DOMAIN_SECRET || ''

  return { url, anonKey, secretKey }
}

