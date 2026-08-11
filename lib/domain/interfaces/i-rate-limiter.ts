export interface IRateLimiter {
  checkLimit(ip: string, maxRequests: number, windowMs: number): boolean
}
