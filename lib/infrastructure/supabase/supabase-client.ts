/**
 * Helper unificado para resolver la URL y Anon Key de Supabase en runtime.
 * Cumplimiento de Regla 6 (AGENTS.md).
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://fxhemyrjetpwtmjxmftk.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4aGVteXJqZXRwd3RtanhtZnRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzIwNzMsImV4cCI6MjEwMTMwODA3M30.bxCsvD7m4-pVKSDM2JABs_-EAkXYcveQ4xMQG0xARhs'
  const secretKey = process.env.CHECK_DOMAIN_SECRET || 'smartcontacts-booking-secret-2026'

  return { url, anonKey, secretKey }
}
