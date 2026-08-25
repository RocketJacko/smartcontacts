import { NextResponse } from "next/server"

interface CodeConfig {
  priceCop: number
  formattedPrice: string
  duration: string
  planName: string
  discountLabel: string
}

const DISCOUNT_CODES: Record<string, CodeConfig> = {
  COMPUESTUDIOS: {
    priceCop: 0,
    formattedPrice: "$0 COP",
    duration: "1 año",
    planName: "Plan Compuestudios",
    discountLabel: "¡Descuento del 100% — Acceso Gratis!",
  },
  "PLAN AS": {
    priceCop: 180000,
    formattedPrice: "$180.000 COP",
    duration: "1 año",
    planName: "Plan AS",
    discountLabel: "Descuento Especial Plan AS",
  },
  "PLAN BS": {
    priceCop: 160000,
    formattedPrice: "$160.000 COP",
    duration: "1 año",
    planName: "Plan BS",
    discountLabel: "Descuento Especial Plan BS",
  },
  "PLAN CS": {
    priceCop: 90000,
    formattedPrice: "$90.000 COP",
    duration: "5 meses",
    planName: "Plan CS",
    discountLabel: "Descuento Especial Plan CS (5 meses)",
  },
  CODIFICANDOANDO: {
    priceCop: 75000,
    formattedPrice: "$75.000 COP",
    duration: "1 año",
    planName: "Plan CodificandoAndo",
    discountLabel: "Descuento Especial CodificandoAndo",
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rawCode = String(body?.code || "").trim().toUpperCase()

    if (!rawCode) {
      return NextResponse.json(
        {
          valid: false,
          priceCop: 400909.75,
          formattedPrice: "$400.909,75 COP",
          duration: "1 año",
          planName: "Plan Basic",
          discountLabel: "",
        },
        { status: 200 }
      )
    }

    const config = DISCOUNT_CODES[rawCode]

    if (config) {
      return NextResponse.json(
        {
          valid: true,
          code: rawCode,
          ...config,
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        valid: false,
        code: rawCode,
        priceCop: 400909.75,
        formattedPrice: "$400.909,75 COP",
        duration: "1 año",
        planName: "Plan Basic",
        discountLabel: "",
        message: "El código no otorgó descuento adicional (se aplicará tarifa estándar Plan Basic).",
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        priceCop: 400909.75,
        formattedPrice: "$400.909,75 COP",
        duration: "1 año",
        planName: "Plan Basic",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
