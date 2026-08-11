import { ICoverageRepository } from '@/lib/domain/interfaces/i-coverage-repository'
import { CoverageResult } from '@/lib/domain/entities/coverage'

export class GetCoverageUseCase {
  constructor(private coverageRepo: ICoverageRepository) {}

  public async execute(): Promise<CoverageResult> {
    return this.coverageRepo.getCoverage()
  }
}
