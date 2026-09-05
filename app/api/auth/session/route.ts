import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      }, { status: 401 })
    }

    const { data: perfilData } = await supabase.rpc('obtener_mi_perfil')
    const perfil = perfilData && !perfilData.error ? perfilData : {
      id: user.id,
      email: user.email,
      rol: user.email === 'jesus.carmona966@pascualbravo.edu.co' ? 'super_admin' : 'user',
      nombre: user.user_metadata?.nombre || user.email?.split('@')[0],
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: perfil.id,
        email: perfil.email,
        nombre: perfil.nombre,
        rol: perfil.rol,
      },
    }, { status: 200 })

  } catch {
    return NextResponse.json({
      authenticated: false,
      user: null,
    }, { status: 401 })
  }
}
