import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/infrastructure/supabase/server-client'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error al cerrar sesión',
    }, { status: 500 })
  }
}
