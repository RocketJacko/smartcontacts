import { NextResponse } from 'next/server'
import { verificarDominioCorreoValido } from '@/lib/email-validator'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ valid: false, message: 'Correo no proporcionado.' }, { status: 400 })
    }

    const domainValidation = await verificarDominioCorreoValido(email)
    return NextResponse.json({
      valid: domainValidation.valid,
      message: domainValidation.reason || (domainValidation.valid ? 'Dominio de correo válido' : 'Dominio de correo no válido'),
    }, { status: 200 })
  } catch {
    return NextResponse.json({ valid: true, message: 'Fail-open' }, { status: 200 })
  }
}
