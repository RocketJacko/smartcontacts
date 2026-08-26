/**
 * Platzi Plan Interface Definition
 * (Discount validation is handled 100% dynamically by the n8n webhook backend server)
 */
export interface PlanResolution {
  valid: boolean
  codeKey: string
  planName: string
  duration: string
  priceCop: number
  formattedPrice: string
  discountLabel: string
}
