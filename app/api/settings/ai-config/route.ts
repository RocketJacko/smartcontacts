import { NextResponse } from 'next/server'

// POST: Validar y Conectar la llave de API de Google Gemini / OpenAI
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider = 'gemini', apiKey, model = 'gemini-2.5-flash' } = body

    if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
      return NextResponse.json({ success: false, error: 'Ingresa una llave de API válida' }, { status: 400 })
    }

    const cleanKey = apiKey.trim()

    if (provider === 'gemini') {
      // Probar conexión real enviando una petición de ping a Google Gemini API
      const pingUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`
      const testRes = await fetch(pingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Responde únicamente con OK.' }] }],
        }),
      })

      if (!testRes.ok) {
        const errJson = await testRes.json().catch(() => null)
        const errMsg = errJson?.error?.message || 'La llave de API de Google Gemini fue rechazada.'
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        provider: 'Google Gemini',
        model,
        status: 'CONNECTED',
        message: `Conexión exitosa con el modelo ${model} de Google Gemini.`,
      })
    } else if (provider === 'openai') {
      const testRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Ping' }],
        }),
      })

      if (!testRes.ok) {
        const errJson = await testRes.json().catch(() => null)
        const errMsg = errJson?.error?.message || 'La llave de OpenAI fue rechazada.'
        return NextResponse.json({ success: false, error: errMsg }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        provider: 'OpenAI',
        model,
        status: 'CONNECTED',
        message: 'Conexión exitosa con OpenAI API.',
      })
    }

    return NextResponse.json({ success: false, error: 'Proveedor no soportado' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
