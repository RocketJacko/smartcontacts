import { IDomainValidator } from '@/lib/domain/interfaces/i-domain-validator'
import { isDomainBlocked } from '@/lib/blocked-domains'

export class SupabaseDomainValidator implements IDomainValidator {
  public async isDomainBlocked(email: string): Promise<boolean> {
    return isDomainBlocked(email)
  }
}
