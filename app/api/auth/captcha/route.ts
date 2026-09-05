import { NextResponse } from 'next/server'
import { generateCaptcha } from '@/lib/auth/captcha'

export const dynamic = 'force-dynamic'

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
    return NextResponse.json({
      error: 'Error al generar desafío de seguridad',
    }, { status: 500 })
  }
}
