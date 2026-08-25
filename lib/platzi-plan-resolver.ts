export interface PlanResolution {
  valid: boolean
  codeKey: string
  planName: string
  duration: string
  priceCop: number
  formattedPrice: string
  discountLabel: string
}

export function resolveDiscountPlan(rawCode: string, currency: string = "COP"): PlanResolution {
  const cleanCode = String(rawCode || "").trim()
  const normalized = cleanCode.toUpperCase().replace(/\s+/g, "")

  // Si no se ingresa ningún código, se aplica el Plan Basic estándar
  if (!cleanCode) {
    return {
      valid: true,
      codeKey: "",
      planName: "Plan Basic",
      duration: "1 año",
      priceCop: 400909.75,
      formattedPrice: currency === "USD" ? "$105 USD" : "$400.909,75 COP",
      discountLabel: "",
    }
  }

  // Coincidencias estrictas según la tabla oficial
  if (normalized === "COMPUESTUDIO" || normalized === "COMPUESTUDIOS" || normalized === "COMPU") {
    return {
      valid: true,
      codeKey: "COMPUESTUDIO",
      planName: "Plan Compuestudio",
      duration: "1 año",
      priceCop: 0,
      formattedPrice: "$0 COP",
      discountLabel: "¡Descuento del 100% — Acceso Gratis!",
    }
  }

  if (normalized === "PLANA" || normalized === "PLANAS" || normalized === "A") {
    return {
      valid: true,
      codeKey: "PLAN A",
      planName: "Plan A",
      duration: "1 año",
      priceCop: 180000,
      formattedPrice: currency === "USD" ? "$48 USD" : "$180.000 COP",
      discountLabel: "Descuento Especial Plan A",
    }
  }

  if (normalized === "PLANB" || normalized === "PLANBS" || normalized === "B") {
    return {
      valid: true,
      codeKey: "PLAN B",
      planName: "Plan B",
      duration: "1 año",
      priceCop: 160000,
      formattedPrice: currency === "USD" ? "$43 USD" : "$160.000 COP",
      discountLabel: "Descuento Especial Plan B",
    }
  }

  if (normalized === "PLANC" || normalized === "PLANCS" || normalized === "C") {
    return {
      valid: true,
      codeKey: "PLAN C",
      planName: "Plan C",
      duration: "5 meses",
      priceCop: 90000,
      formattedPrice: currency === "USD" ? "$25 USD" : "$90.000 COP",
      discountLabel: "Descuento Especial Plan C (5 meses)",
    }
  }

  if (normalized === "CODIFICANDOANDO" || normalized === "CODIFICANDO") {
    return {
      valid: true,
      codeKey: "CODIFICANDOANDO",
      planName: "Plan CodificandoAndo",
      duration: "1 año",
      priceCop: 75000,
      formattedPrice: currency === "USD" ? "$20 USD" : "$75.000 COP",
      discountLabel: "Descuento Especial CodificandoAndo",
    }
  }

  // SI EL CÓDIGO NO COINCIDE CON NINGUNO DE LA TABLA, ES INVÁLIDO (valid = false)
  return {
    valid: false,
    codeKey: cleanCode.toUpperCase(),
    planName: "Plan Invalido",
    duration: "1 año",
    priceCop: 400909.75,
    formattedPrice: currency === "USD" ? "$105 USD" : "$400.909,75 COP",
    discountLabel: "",
  }
}
