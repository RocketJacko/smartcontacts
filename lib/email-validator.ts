import { isDomainBlocked } from './blocked-domains'

interface GoogleDNSRecord {
  name: string
  type: number
  TTL: number
  data: string
}

const fetchConTimeout = (url: string, timeoutMs = 2000): Promise<Response> => {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado (Timeout)')), timeoutMs)
    ),
  ])
}

/**
 * Valida la estructura sintáctica básica de un correo electrónico.
 */
export const validarEstructuraEmail = (email: string): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Comprueba si un dominio de correo existe realmente en Internet (registros DNS MX o A via Google DNS)
 * y verifica que no esté bloqueado en la base de datos de Supabase.
 * Retorna true si es válido o si la API falla/tarda (Fail-Open), y false si el dominio es inexistente (NXDOMAIN).
 */
export const verificarDominioCorreoValido = async (domainOrEmail: string): Promise<{ valid: boolean; reason?: string }> => {
  try {
    const email = domainOrEmail.trim().toLowerCase()
    
    // 1. Validar sintaxis previa
    if (!validarEstructuraEmail(email)) {
      return { valid: false, reason: "Formato de correo inválido." }
    }

    const domain = email.includes('@') ? email.split('@')[1]?.toLowerCase().trim() : email
    if (!domain || !domain.includes('.')) {
      return { valid: false, reason: "Dominio de correo no válido." }
    }

    // 2. Verificar lista de dominios bloqueados en Supabase
    const isBlocked = await isDomainBlocked(email)
    if (isBlocked) {
      return { valid: false, reason: "El dominio de correo ingresado no está permitido." }
    }

    // 3. Consultar registros MX (Mail Exchange) usando la API Google DNS Over HTTPS
    const responseMX = await fetchConTimeout(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      2000
    )

    if (responseMX.ok) {
      const dataMX = await responseMX.json()

      // Status 3 = NXDOMAIN (el dominio NO existe en los servidores raíz de Internet)
      if (dataMX.Status === 3) {
        return { valid: false, reason: `El dominio "@${domain}" no existe en Internet.` }
      }

      // Si tiene registros MX (tipo 15), es un dominio activo para recibir correos
      if (dataMX.Answer && Array.isArray(dataMX.Answer)) {
        const tieneMX = dataMX.Answer.some((record: GoogleDNSRecord) => record.type === 15)
        if (tieneMX) return { valid: true }
      }
    }

    // 4. Fallback: Si no tiene registros MX, consultar si al menos tiene un registro A (servidor de host)
    const responseA = await fetchConTimeout(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`,
      2000
    )

    if (responseA.ok) {
      const dataA = await responseA.json()
      if (dataA.Status === 3) {
        return { valid: false, reason: `El dominio "@${domain}" no existe en Internet.` }
      }
      if (dataA.Answer && Array.isArray(dataA.Answer)) {
        const tieneA = dataA.Answer.some((record: GoogleDNSRecord) => record.type === 1)
        if (tieneA) return { valid: true }
      }
    }

    // Si no tiene ni MX ni A, el dominio no puede recibir correos
    return { valid: false, reason: `El dominio "@${domain}" no tiene servidores de correo activos.` }
  } catch {
    // Fail-open: si falla el DNS por timeout o red, permitimos pasar para no bloquear usuarios legítimos
    return { valid: true }
  }
}
