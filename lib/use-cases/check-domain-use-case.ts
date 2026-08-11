import { IDomainValidator } from '@/lib/domain/interfaces/i-domain-validator'
import { DomainCheckResult } from '@/lib/domain/entities/domain-security'

export class CheckDomainUseCase {
  constructor(private domainValidator: IDomainValidator) {}

  public async execute(email?: string): Promise<DomainCheckResult> {
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return { valid: true, message: 'Email incompleto' }
    }

    const isBlocked = await this.domainValidator.isDomainBlocked(email)
    if (isBlocked) {
      return { valid: false, message: 'Email no aceptado' }
    }

    return { valid: true, message: 'Email aceptado' }
  }
}
