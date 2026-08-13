import { NextResponse } from 'next/server'
import { getSupabaseConfig } from '@/lib/infrastructure/supabase/supabase-client'

// GET & POST: Endpoint de Supresión Global (Habeas Data Ley 1581)
export async function GET(request: Request) {
  return handleUnsubscribe(request)
}

export async function POST(request: Request) {
  return handleUnsubscribe(request)
}

async function handleUnsubscribe(request: Request) {
  try {
    const { url, anonKey } = getSupabaseConfig()
    const { searchParams } = new URL(request.url)
    let email = searchParams.get('email')

    if (!email && request.method === 'POST') {
      try {
        const body = await request.json()
        email = body.email
      } catch {
        // Continuar
      }
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Se requiere una dirección de correo válida' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()

    if (url && anonKey) {
      // 1. Insertar evento inmutable de supresión global
      await fetch(`${url}/rest/v1/suppression_events`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'automatizacion',
          Prefer: 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          email: cleanEmail,
          reason: 'unsubscribe',
          source: 'web_unsubscribe_oneclick',
        }),
      })

      // 2. Actualizar estado del contacto en inventario_contactos
      await fetch(`${url}/rest/v1/inventario_contactos?email=eq.${cleanEmail}`, {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Accept-Profile': 'automatizacion',
        },
        body: JSON.stringify({
          estado: 'dado_de_baja',
        }),
      })
    }

    // 3. Devolver respuesta HTML limpia
    const htmlResponse = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Suscripción Cancelada — SmartContacts</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f5f4f0; color: #111; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 20px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 440px; text-align: center; }
        h1 { font-size: 20px; margin-bottom: 12px; color: #111; }
        p { font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 24px; }
        .badge { background: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 99px; font-weight: 600; font-size: 12px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">Habeas Data Ley 1581</div>
        <h1>Suscripción Cancelada Exitosamente</h1>
        <p>Tu correo <strong>${cleanEmail}</strong> ha sido dado de baja globalmente en nuestra base de datos. No volverás a recibir comunicaciones comerciales de SmartContacts.</p>
      </div>
    </body>
    </html>
    `

    return new Response(htmlResponse, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
