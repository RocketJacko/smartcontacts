import { NextResponse } from 'next/server'
import { generateCaptcha, verifyCaptcha } from '@/lib/auth/captcha'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const challenge = generateCaptcha()
    return NextResponse.json(challenge, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Error al generar desafío de seguridad',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, answer } = body

    const check = verifyCaptcha(token, answer)
    if (!check.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: check.reason || 'El resultado del captcha de seguridad es incorrecto.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        valid: true,
        message: 'Captcha verificado exitosamente.',
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Error al verificar el captcha de seguridad.',
      },
      { status: 400 }
    )
  }
}
