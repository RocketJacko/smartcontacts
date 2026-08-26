import { NextResponse } from "next/server"
import { resolveDiscountPlan } from "@/lib/platzi-plan-resolver"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || "")
    const currency = String(body?.currency || "COP")
    const validarCupon = Boolean(body?.validarCupon ?? body?.VALIDARCUPON ?? true)

    const resolved = resolveDiscountPlan(rawCode, currency)

    return NextResponse.json(
      {
        ...resolved,
        validarCupon,
        VALIDARCUPON: validarCupon,
      },
      { status: 200 }
    )
  } catch (error: any) {
    const fallback = resolveDiscountPlan("", "COP")
    return NextResponse.json(
      {
        ...fallback,
        validarCupon: true,
        VALIDARCUPON: true,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
