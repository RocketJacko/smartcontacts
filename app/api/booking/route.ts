import { NextResponse } from 'next/server'
import { z } from 'zod'

const bookingSchema = z.object({
  type: z.enum(['lead', 'booking']).default('booking'),
  name: z.string().min(2, 'Name is required').optional(),
  phone: z.string().min(5, 'Phone is required').optional(),
  email: z.string().email('Invalid email address'),
  date: z.string().optional(),
  time: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body)

    // Log the validated lead/booking for Vercel Logs / Console
    console.log('[SMARTCONTACTS LEAD RECEIVED]', {
      timestamp: new Date().toISOString(),
      ...validatedData,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Solicitud recibida exitosamente. Nuestro equipo comercial te contactará pronto.',
        data: validatedData,
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error procesando la solicitud' },
      { status: 500 }
    )
  }
}
