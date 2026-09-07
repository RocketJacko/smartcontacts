import { NextResponse } from "next/server"
import { Pool } from "pg"

export const dynamic = "force-dynamic"
export const revalidate = 0

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.N8N_POSTGRES_URL || process.env.PLATZI_POSTGRES_URL

    if (!connectionString) {
      throw new Error("N8N_POSTGRES_URL environment variable is not defined")
    }

    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
      max: 5,
    })
  }
  return pool
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || body?.discountCode || "").trim().toUpperCase()
    const currency = String(body?.currency || "COP").trim().toUpperCase()

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, error: "Por favor ingresa un código de descuento." },
        { status: 400 }
      )
    }

    let client
    try {
      client = await getPool().connect()
    } catch (poolErr: any) {
      console.error("Error conectando al pool de postgres de n8n:", poolErr?.message)
      return NextResponse.json(
        {
          valid: false,
          error: "No se pudo verificar el código en este momento. Por favor intenta nuevamente.",
        },
        { status: 503 }
      )
    }

    try {
      const res = await client.query(
        `SELECT "id", "Codigo", "Vigente", "Valor", "Caracteriscica"
         FROM "data_table_user_8xq1TWQ0hSO0TobU"
         WHERE UPPER(TRIM("Codigo")) = $1
         LIMIT 1`,
        [rawCode]
      )

      if (res.rows.length === 0) {
        return NextResponse.json(
          {
            valid: false,
            error: "El código de descuento ingresado no existe en nuestro sistema.",
          },
          { status: 400 }
        )
      }

      const row = res.rows[0]

      if (!row.Vigente) {
        return NextResponse.json(
          {
            valid: false,
            error: "El código de descuento ingresado no se encuentra vigente.",
          },
          { status: 400 }
        )
      }

      const numValor = Number(row.Valor) || 0
      const formattedPrice =
        "$" + numValor.toLocaleString("es-CO") + " " + currency

      return NextResponse.json(
        {
          valid: true,
          success: true,
          code: row.Codigo,
          planName: row.Caracteriscica || "Plan Basic",
          duration: row.Caracteriscica || "1 año",
          price: numValor,
          formattedPrice,
          message: "Código de descuento verificado exitosamente.",
        },
        { status: 200 }
      )
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Ocurrió un error inesperado al validar el código.",
      },
      { status: 500 }
    )
  }
}
