import { IRateLimiter } from '@/lib/domain/interfaces/i-rate-limiter'

export class MemoryRateLimiter implements IRateLimiter {
  private ipMap = new Map<string, { count: number; resetTime: number }>()

  public checkLimit(ip: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const rateData = this.ipMap.get(ip) || { count: 0, resetTime: now + windowMs }

    if (now > rateData.resetTime) {
      rateData.count = 1
      rateData.resetTime = now + windowMs
    } else {
      rateData.count += 1
    }

    this.ipMap.set(ip, rateData)
    return rateData.count <= maxRequests
  }
}
