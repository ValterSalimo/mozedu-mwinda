export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number
}

const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty',
  'abc123', 'monkey', 'master', 'dragon', 'admin', 'letmein'
]

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  } else if (password.length >= 12) {
    score += 25
  } else {
    score += 15
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else { score += 20 }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else { score += 20 }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  } else { score += 15 }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/`~]/.test(password)) {
    errors.push('Password must contain at least one special character')
  } else { score += 20 }

  if (COMMON_PASSWORDS.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common')
    score = Math.max(0, score - 30)
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password should not contain repeated characters')
    score = Math.max(0, score - 10)
  }

  const strength: 'weak' | 'medium' | 'strong' = score >= 80 ? 'strong' : score >= 50 ? 'medium' : 'weak'

  return { isValid: errors.length === 0, errors, strength, score: Math.min(100, score) }
}
