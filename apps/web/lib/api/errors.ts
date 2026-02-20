/**
 * Status codes where the backend sends meaningful, user-safe messages
 * (e.g. "Student number already exists", "user with this email already exists").
 * For these we always prefer the original backend message.
 */
const PASS_THROUGH_STATUSES = new Set([400, 403, 409, 422])

const SAFE_ERROR_MESSAGES: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Please log in to continue.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'The provided data is invalid.',
  429: 'Too many requests. Please try again later.',
  500: 'An unexpected error occurred. Please try again.',
  502: 'Service temporarily unavailable.',
  503: 'Service temporarily unavailable.',
}

export function getSafeErrorMessage(status: number, originalMessage?: string): string {
  // In development, always show the raw backend message
  if (process.env.NODE_ENV === 'development') {
    return originalMessage || SAFE_ERROR_MESSAGES[status] || 'An error occurred'
  }

  // CSRF errors → actionable user message
  if (status === 403 && originalMessage?.toLowerCase().includes('csrf')) {
    return 'Your session has expired. Please refresh the page and try again.'
  }

  // For actionable status codes, pass through the backend message so the user
  // understands what went wrong (e.g. duplicate email, constraint violation).
  // Fall back to the generic message only if the backend didn't provide one.
  if (PASS_THROUGH_STATUSES.has(status) && originalMessage) {
    return originalMessage
  }

  return SAFE_ERROR_MESSAGES[status] || 'An error occurred'
}

export default getSafeErrorMessage
