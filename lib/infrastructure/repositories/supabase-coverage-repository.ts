import { ICoverageRepository } from '@/lib/domain/interfaces/i-coverage-repository'
import { CoverageResult, DepartmentCoverage } from '@/lib/domain/entities/coverage'
import { getSupabaseConfig } from '../supabase/supabase-client'

export class SupabaseCoverageRepository implements ICoverageRepository {
  private cacheData: CoverageResult | null = null
  private cacheTime = 0
  private readonly CACHE_TTL_MS = 5 * 60 * 1000

  public async getCoverage(): Promise<CoverageResult> {
    const now = Date.now()
    if (this.cacheData && (now - this.cacheTime) < this.CACHE_TTL_MS) {
      return this.cacheData
    }

    const { url, anonKey } = getSupabaseConfig()
    const rpcUrl = `${url}/rest/v1/rpc/obtener_cobertura`

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Error consultando obtener_cobertura (${response.status})`)
    }

    const departamentos: DepartmentCoverage[] = await response.json()

    let totalNaturales = 0
    let totalJuridicas = 0
    let totalPersonas = 0

    departamentos.forEach((d) => {
      totalNaturales += Number(d.personas_naturales || 0)
      totalJuridicas += Number(d.personas_juridicas || 0)
      totalPersonas += Number(d.total || 0)
    })

    const result: CoverageResult = {
      success: true,
      totales: {
        personas_naturales: totalNaturales,
        personas_juridicas: totalJuridicas,
        total_personas: totalPersonas,
      },
      departamentos,
    }

    this.cacheData = result
    this.cacheTime = now
    return result
  }
}
