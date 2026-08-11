import { NextResponse } from 'next/server'
import { MemoryRateLimiter } from '@/lib/infrastructure/security/memory-rate-limiter'
import { SupabaseCoverageRepository } from '@/lib/infrastructure/repositories/supabase-coverage-repository'
import { GetCoverageUseCase } from '@/lib/use-cases/get-coverage-use-case'

const rateLimiter = new MemoryRateLimiter()
const coverageRepo = new SupabaseCoverageRepository()
const getCoverageUseCase = new GetCoverageUseCase(coverageRepo)

export async function GET(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     '127.0.0.1'

    if (!rateLimiter.checkLimit(clientIp, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Reintenta en un minuto.' }, { status: 429 })
    }

    const coverage = await getCoverageUseCase.execute()
    return NextResponse.json(coverage, { status: 200 })

  } catch (error: any) {
    console.error('[API COVERAGE ERROR]', error)
    return NextResponse.json({ error: error.message || 'Error procesando cobertura' }, { status: 500 })
  }
}
