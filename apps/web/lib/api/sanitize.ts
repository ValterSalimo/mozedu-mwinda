import DOMPurify from 'dompurify'

/**
 * Sanitize a string value using DOMPurify to prevent XSS attacks.
 * Falls back to basic regex stripping if DOMPurify is unavailable (e.g., SSR without jsdom).
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''
  
  // DOMPurify requires a DOM environment; in SSR it may not be available
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
  }
  
  // SSR fallback: basic strip of script/style tags
  return input
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

/**
 * Sanitize an HTML string, keeping safe HTML tags but removing dangerous ones.
 * Use this when you need to preserve formatting (e.g., rich text content).
 */
export function sanitizeHtml(input: unknown): string {
  if (typeof input !== 'string') return ''
  
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(input).trim()
  }

  // SSR fallback
  return input
    .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
    .trim()
}

export function sanitizeObject(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'object' && item !== null ? sanitizeObject(item as Record<string, unknown>) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export default sanitizeObject
