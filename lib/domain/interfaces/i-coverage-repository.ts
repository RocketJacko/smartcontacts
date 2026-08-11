import { CoverageResult } from '../entities/coverage'

export interface ICoverageRepository {
  getCoverage(): Promise<CoverageResult>
}
