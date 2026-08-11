import { NextResponse } from 'next/server'
import { isDomainBlocked } from '@/lib/blocked-domains'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ valid: true, message: 'Email incompleto' }, { status: 200 })
    }

    // Consulta directa O(1) a la base de datos Supabase (public.blocked_domains)
    const isBlocked = await isDomainBlocked(email)

    if (isBlocked) {
      return NextResponse.json(
        { valid: false, message: 'Email no aceptado' },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { valid: true, message: 'Email aceptado' },
      { status: 200 }
    )

  } catch (error) {
    console.error('[API CHECK DOMAIN ROUTE ERROR]', error)
    return NextResponse.json(
      { valid: true, message: 'Fail-open' },
      { status: 200 }
    )
  }
}
