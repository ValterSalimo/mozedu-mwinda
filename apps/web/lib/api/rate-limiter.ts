interface RateLimitEntry {
  count: number
  resetTime: number
}

const requestCounts = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000, // 1 minute
}

const authConfig: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60000,
}

export function checkRateLimit(
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = endpoint.split('?')[0]
  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) }
  }

  entry.count++
  return { allowed: true }
}

export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  if (endpoint.includes('/auth/')) {
    return authConfig
  }
  return defaultConfig
}
