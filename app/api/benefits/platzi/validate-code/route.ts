import { NextResponse } from "next/server"
import { resolveDiscountPlan } from "@/lib/platzi-plan-resolver"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || "")
    const currency = String(body?.currency || "COP")

    const resolved = resolveDiscountPlan(rawCode, currency)

    return NextResponse.json(resolved, { status: 200 })
  } catch (error: any) {
    const fallback = resolveDiscountPlan("", "COP")
    return NextResponse.json(
      {
        ...fallback,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
