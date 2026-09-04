import { NextResponse } from 'next/server'
import { GmailAccountsManager } from '@/lib/gmail-accounts-manager'

/**
 * API REST para Administrar y Auditar Cuentas Remitentes de Gmail.
 * Permite visualizar el estado de cada cuenta, límite diario asignado y cuota disponible.
 */
export async function GET() {
  try {
    const accounts = GmailAccountsManager.getAccounts()

    // Ocultar secretos sensibles al serializar para la UI
    const safeAccounts = accounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      name: acc.name,
      dailyLimit: acc.dailyLimit,
      sentToday: acc.sentToday,
      active: acc.active,
      hasCredentials: Boolean(acc.clientId && acc.refreshToken),
    }))

    return NextResponse.json({
      success: true,
      accounts: safeAccounts,
      totalAccounts: safeAccounts.length,
      totalCapacityDaily: safeAccounts.reduce((sum, a) => sum + (a.active ? a.dailyLimit : 0), 0),
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error consultando cuentas de Gmail' }, { status: 500 })
  }
}
