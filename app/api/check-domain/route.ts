import { NextResponse } from 'next/server'
import { SupabaseDomainValidator } from '@/lib/infrastructure/repositories/supabase-domain-validator'
import { CheckDomainUseCase } from '@/lib/use-cases/check-domain-use-case'

const validator = new SupabaseDomainValidator()
const checkDomainUseCase = new CheckDomainUseCase(validator)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const result = await checkDomainUseCase.execute(email)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[API CHECK DOMAIN ERROR]', error)
    return NextResponse.json({ valid: true, message: 'Fail-open' }, { status: 200 })
  }
}
