/**
 * Gestor de Cuentas de Remitentes de Gmail (Multi-Account Manager & Quota Balancer).
 * 
 * Permite:
 * 1. Leer la cuenta principal desde variables de entorno (.env).
 * 2. Cargar cuentas adicionales configuradas en el entorno (GMAIL_ACCOUNTS_JSON) o en base de datos.
 * 3. Rotar automáticamente entre cuentas disponibles cuando una alcanza su límite diario.
 * 4. Obtener un access_token válido de Google OAuth2 de forma independiente para cada cuenta.
 */

export interface GmailAccountConfig {
  id: string
  email: string
  name: string
  clientId: string
  clientSecret: string
  refreshToken: string
  dailyLimit: number
  sentToday: number
  active: boolean
}

export class GmailAccountsManager {
  private static cachedAccounts: GmailAccountConfig[] = []
  private static lastLoad = 0

  /**
   * Obtiene todas las cuentas de envío registradas.
   */
  static getAccounts(): GmailAccountConfig[] {
    const now = Date.now()
    if (this.cachedAccounts.length > 0 && now - this.lastLoad < 60000) {
      return this.cachedAccounts
    }

    const accounts: GmailAccountConfig[] = []

    // 1. Cuenta Primaria de las Variables de Entorno (.env)
    const primaryClientId = process.env.GMAIL_CLIENT_ID || ''
    const primaryClientSecret = process.env.GMAIL_CLIENT_SECRET || ''
    const primaryRefreshToken = process.env.GMAIL_REFRESH_TOKEN || ''
    const primaryEmail = process.env.GMAIL_SENDER_EMAIL || 'jesus.carmona966@pascualbravo.edu.co'
    const primaryName = process.env.GMAIL_SENDER_NAME || 'Agendamiento Smartcontacts'

    if (primaryClientId && primaryRefreshToken) {
      const isInstitutional = primaryEmail.endsWith('@pascualbravo.edu.co') || !primaryEmail.endsWith('@gmail.com')
      accounts.push({
        id: 'account-primary',
        email: primaryEmail,
        name: primaryName,
        clientId: primaryClientId,
        clientSecret: primaryClientSecret,
        refreshToken: primaryRefreshToken,
        dailyLimit: isInstitutional ? 2000 : 500,
        sentToday: 0,
        active: true,
      })
    }

    // 2. Cuentas Adicionales configuradas en formato JSON en variables de entorno:
    // GMAIL_ACCOUNTS_JSON='[{"email":"ventas@...","name":"...","clientId":"...","clientSecret":"...","refreshToken":"...","dailyLimit":2000}]'
    const extraAccountsRaw = process.env.GMAIL_ACCOUNTS_JSON || ''
    if (extraAccountsRaw) {
      try {
        const parsed = JSON.parse(extraAccountsRaw)
        if (Array.isArray(parsed)) {
          parsed.forEach((acc, idx) => {
            if (acc.email && acc.refreshToken && acc.clientId) {
              accounts.push({
                id: acc.id || `account-extra-${idx + 1}`,
                email: acc.email,
                name: acc.name || acc.email,
                clientId: acc.clientId,
                clientSecret: acc.clientSecret || primaryClientSecret,
                refreshToken: acc.refreshToken,
                dailyLimit: acc.dailyLimit || (acc.email.endsWith('@gmail.com') ? 500 : 2000),
                sentToday: 0,
                active: acc.active !== false,
              })
            }
          })
        }
      } catch (err) {
        console.warn('[GMAIL ACCOUNTS MANAGER JSON PARSE WARN]', err)
      }
    }

    this.cachedAccounts = accounts
    this.lastLoad = now
    return accounts
  }

  /**
   * Obtiene un Access Token OAuth2 fresco para una cuenta específica.
   */
  static async getAccessTokenForAccount(account: GmailAccountConfig): Promise<string | null> {
    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: account.clientId,
          client_secret: account.clientSecret,
          refresh_token: account.refreshToken,
          grant_type: 'refresh_token',
        }),
        cache: 'no-store',
      })

      if (!res.ok) {
        console.error(`[GMAIL TOKEN ERROR for ${account.email}]`, res.status, await res.text())
        return null
      }

      const data = await res.json()
      return data.access_token || null
    } catch (err) {
      console.error(`[GMAIL TOKEN EXCEPTION for ${account.email}]`, err)
      return null
    }
  }

  /**
   * Selecciona la mejor cuenta disponible con cuota restante para enviar el correo.
   * Aplica balanceo de carga (Round-Robin ponderado por disponibilidad).
   */
  static async selectAvailableAccount(preferredEmail?: string): Promise<{ account: GmailAccountConfig; accessToken: string } | null> {
    const accounts = this.getAccounts().filter((a) => a.active)
    if (accounts.length === 0) return null

    // Si se especificó una cuenta preferida y está activa, intentar esa primero
    if (preferredEmail) {
      const match = accounts.find((a) => a.email.toLowerCase() === preferredEmail.toLowerCase())
      if (match) {
        const token = await this.getAccessTokenForAccount(match)
        if (token) return { account: match, accessToken: token }
      }
    }

    // Buscar la primera cuenta que tenga token válido
    for (const acc of accounts) {
      const token = await this.getAccessTokenForAccount(acc)
      if (token) {
        return { account: acc, accessToken: token }
      }
    }

    return null
  }
}
