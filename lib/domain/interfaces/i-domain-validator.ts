export interface IDomainValidator {
  isDomainBlocked(email: string): Promise<boolean>
}
