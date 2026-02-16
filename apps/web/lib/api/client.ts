/**
 * API Client for Mwinda Backend
 * Following FRONTEND_PROMPT.md pattern with fetch wrapper
 */

import type { ApiResponse, LoginResponse, RoleSelectionRequiredResponse } from '@mozedu/types'
import { getSafeErrorMessage } from './errors'
import { sanitizeObject } from './sanitize'

// ==================== CONFIGURATION ====================

const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && url.includes('api.mozedu.org')) {
    console.warn('[API] Detected production URL on localhost. Forcing localhost endpoint.')
    return 'http://localhost:8080'
  }
  return url
}

const API_BASE_URL = getApiBaseUrl()
console.log('[API] Client configured with Base URL:', API_BASE_URL)

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ==================== TOKEN MANAGEMENT ====================

let accessToken: string | null = null
let tokenExpiresAt: number | null = null
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler
}

export function setTokens(tokens: { accessToken: string; expiresIn: number }): void {
  accessToken = tokens.accessToken
  // Store expiration time (subtract 30 seconds buffer)
  tokenExpiresAt = Date.now() + (tokens.expiresIn * 1000) - 30000
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearTokens(): void {
  accessToken = null
  tokenExpiresAt = null
}

function isTokenExpired(): boolean {
  if (!tokenExpiresAt) return true
  return Date.now() >= tokenExpiresAt
}

function subscribeToTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

async function getFreshAccessToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true
    try {
      const token = await refreshAccessToken()
      onTokenRefreshed(token)
      return token
    } finally {
      isRefreshing = false
    }
  }

  // Wait for the ongoing refresh to complete
  return new Promise<string>(resolve => {
    subscribeToTokenRefresh(resolve)
  })
}

async function refreshAccessToken(): Promise<string> {
  // Backend reads refresh_token from HttpOnly cookie automatically
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send HttpOnly cookie with request
  })

  if (!response.ok) {
    clearTokens()
    if (onSessionExpired) onSessionExpired()
    throw new ApiError(401, 'Token refresh failed')
  }

  const data = await response.json()
  const tokenData = data.data || data

  setTokens({
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in || 900,
  })

  return tokenData.access_token
}

// ==================== FETCH OPTIONS TYPE ====================

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown> | FormData
  requiresAuth?: boolean
  skipRefresh?: boolean
}

// ==================== MAIN API CLIENT ====================

export async function apiClient<T = unknown>(
  endpoint: string,
  { body, requiresAuth = true, skipRefresh = false, ...options }: FetchOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  // Add Content-Type for JSON (unless FormData)
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  // Add CSRF token header for state-changing requests
  if (typeof document !== 'undefined') {
    const csrfHeaderMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
    const method = (options.method || 'GET').toUpperCase()
    if (csrfHeaderMethods.includes(method)) {
      const match = document.cookie.match(/csrf_token=([^;]+)/)
      if (match) headers['X-CSRF-Token'] = match[1]
    }
  }

  // Handle authentication
  if (requiresAuth) {
    let token = getAccessToken()

    // Check if token is expired and needs refresh
    if (token && isTokenExpired() && !skipRefresh) {
      token = await getFreshAccessToken()
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const payload = body instanceof FormData ? body : (body ? (typeof body === 'object' ? JSON.stringify(sanitizeObject(body as Record<string, unknown>)) : JSON.stringify(body)) : undefined)

  const response = await fetch(url, {
    ...options,
    headers,
    body: payload,
    credentials: 'include',
  })

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    const message = retryAfter
      ? `Rate limited. Try again in ${retryAfter} seconds.`
      : 'Too many requests. Please slow down.'
    throw new ApiError(429, message, 'RATE_LIMITED')
  }

  // Handle unauthorized - attempt token refresh
  if (response.status === 401 && requiresAuth && !skipRefresh) {
    try {
      const newToken = await getFreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`

      // Retry the original request
      const retryResponse = await fetch(url, {
        ...options,
        headers,
        body: payload,
        credentials: 'include',
      })

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ message: 'Request failed' }))
        throw new ApiError(retryResponse.status, error.message || 'Request failed', error.code)
      }

      return retryResponse.json()
    } catch (error) {
      clearTokens()
      throw error
    }
  }

  // Handle other errors
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    // Map to safe user-facing messages in production
    const msg = getSafeErrorMessage(response.status, error.message || error.error)
    throw new ApiError(response.status, msg, error.code)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// ==================== USERS API ====================

export const usersApi = {
  getAll: (params?: { schoolId?: string }) => { // School users list
    const searchParams = new URLSearchParams()
    if (params?.schoolId) searchParams.set('school_id', params.schoolId)
    const query = searchParams.toString()
    return apiClient<unknown[]>(`/api/v1/users${query ? `?${query}` : ''}`)
  },

  create: (data: {
    email: string
    password: string
    phone_number: string
    role: string
    first_name: string
    last_name: string
    school_id?: string
  }) =>
    apiClient<{ user: any; message: string }>('/api/v1/users', {
      method: 'POST',
      body: data,
    }),

  updateRole: (userId: string, role: string) =>
    apiClient<{ message: string }>(`/api/v1/users/${userId}/role`, {
      method: 'PATCH',
      body: { role },
    }),
}

// ==================== AUTH API ====================

// Backend response types (what the backend actually returns)
// Backend response types (what the backend actually returns)
interface BackendLoginResponse {
  access_token: string
  refresh_token: string
  expires_in?: number
  message: string
  csrf_token?: string // Added CSRF token
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
    phone_number?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

interface BackendTwoFactorResponse {
  requires_2fa: true
  session_token: string
  email: string
  expires_at: string
  message: string
}

// Backend role selection response
interface BackendRoleSelectionResponse {
  requires_selection: true
  available_roles: string[] // Backend sends plain role strings: ["TEACHER", "PARENT"]
  message: string
}

// Frontend 2FA response type
export interface TwoFactorResponse {
  success: true
  requires2FA: true
  sessionToken: string
  email: string
  expiresAt: string
}

interface BackendRefreshResponse {
  access_token: string
  refresh_token: string
  expires_in?: number
  user?: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
    phone_number?: string
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
}

// Helper to normalize backend role to frontend format
// Backend returns UPPERCASE roles which match our UserRole enum
function normalizeRole(backendRole: string): string {
  // Keep uppercase to match UserRole enum values (SCHOOL_ADMIN, STUDENT, etc.)
  return backendRole.toUpperCase()
}

// Helper to set CSRF cookie manually if needed
// Helper to set CSRF cookie manually if needed
function setCsrfCookie(token?: string) {
  if (token && typeof document !== 'undefined') {
    const hostname = window.location.hostname
    let domainAttr = ''

    // Set cookie on root domain for production to share with api.mozedu.org
    // Skip for localhost/IPs
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      const parts = hostname.split('.')
      if (parts.length >= 2) {
        // e.g. "www.mozedu.org" -> ".mozedu.org"
        // This ensures the cookie is sent to "api.mozedu.org"
        const rootDomain = parts.slice(-2).join('.')
        domainAttr = `; Domain=.${rootDomain}`
      }
    }

    // Set cookie valid for session
    // SameSite=Lax allows it to be sent on top-level navigations, but for XHR/Fetch to subdomain it's fine if Secure
    // Note: We use priority to ensure this one takes precedence if duplicates exist
    document.cookie = `csrf_token=${token}; path=/; SameSite=Lax; Secure${domainAttr}`
  }
}

export const authApi = {
  login: async (credentials: { email: string; password: string; active_role?: string }): Promise<LoginResponse | TwoFactorResponse | RoleSelectionRequiredResponse> => {
    const response = await apiClient<BackendLoginResponse | BackendTwoFactorResponse | BackendRoleSelectionResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: credentials,
      requiresAuth: false,
    })

    // Check if role selection is required
    if ('requires_selection' in response && response.requires_selection) {
      const roleResponse = response as BackendRoleSelectionResponse
      return {
        success: true,
        requiresSelection: true,
        availableRoles: roleResponse.available_roles.map(r => normalizeRole(r)) as any,
        message: roleResponse.message,
      }
    }

    // Check if 2FA is required
    if ('requires_2fa' in response && response.requires_2fa) {
      const twoFactorResponse = response as BackendTwoFactorResponse
      return {
        success: true,
        requires2FA: true,
        sessionToken: twoFactorResponse.session_token,
        email: twoFactorResponse.email,
        expiresAt: twoFactorResponse.expires_at,
      }
    }

    // Standard login response
    const loginResponse = response as BackendLoginResponse

    // Store access token in memory (refresh token set via HttpOnly cookie)
    setTokens({ accessToken: loginResponse.access_token, expiresIn: loginResponse.expires_in || 900 })

    // Manually set CSRF token cookie ensuring frontend can see it
    setCsrfCookie(loginResponse.csrf_token)

    // Transform backend response to expected LoginResponse format
    // Backend returns UPPERCASE roles, frontend expects lowercase
    return {
      success: true,
      requires2FA: false,
      data: {
        accessToken: loginResponse.access_token,
        refreshToken: undefined as any,
        expiresIn: loginResponse.expires_in || 900,
        user: {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          firstName: loginResponse.user.first_name,
          lastName: loginResponse.user.last_name,
          role: normalizeRole(loginResponse.user.role) as any,
          phone: loginResponse.user.phone_number,
          createdAt: loginResponse.user.created_at || new Date().toISOString(),
          updatedAt: loginResponse.user.updated_at || new Date().toISOString(),
        },
      },
    }
  },

  verifyOTP: async (sessionToken: string, otp: string): Promise<LoginResponse> => {
    const response = await apiClient<BackendLoginResponse>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { session_token: sessionToken, otp_code: otp },
      requiresAuth: false,
    })

    // Store access token in memory
    setTokens({ accessToken: response.access_token, expiresIn: response.expires_in || 900 })

    // Manually set CSRF token cookie ensuring frontend can see it
    setCsrfCookie(response.csrf_token)

    return {
      success: true,
      data: {
        accessToken: response.access_token,
        refreshToken: undefined as any,
        expiresIn: response.expires_in || 900,
        user: {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          role: normalizeRole(response.user.role) as any,
          phone: response.user.phone_number,
          createdAt: response.user.created_at || new Date().toISOString(),
          updatedAt: response.user.updated_at || new Date().toISOString(),
        },
      },
    }
  },

  resendOTP: (sessionToken: string) =>
    apiClient<ApiResponse<{ expires_at: string }>>('/api/v1/auth/resend-otp', {
      method: 'POST',
      body: { session_token: sessionToken },
      requiresAuth: false,
    }),

  forgotPassword: (email: string) =>
    apiClient<ApiResponse>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { email },
      requiresAuth: false,
    }),

  validateResetToken: (token: string) =>
    apiClient<ApiResponse<{ email: string; expires_at: string }>>('/api/v1/auth/validate-reset-token', {
      method: 'POST',
      body: { token },
      requiresAuth: false,
    }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient<ApiResponse>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: { token, new_password: newPassword },
      requiresAuth: false,
    }),

  register: (data: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone_number?: string
    role?: string
    school_code?: string
  }) =>
    apiClient<ApiResponse<{ user: { id: string; email: string } }>>('/api/v1/auth/register', {
      method: 'POST',
      body: data,
      requiresAuth: false,
    }),

  me: () =>
    apiClient<ApiResponse<{ user: unknown }>>('/api/v1/auth/me', {
      method: 'GET',
    }),

  logout: () =>
    apiClient<ApiResponse>('/api/v1/auth/logout', {
      method: 'POST',
    }),

  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient<ApiResponse>('/api/v1/auth/change-password', {
      method: 'POST',
      body: data,
    }),

  refresh: async (): Promise<LoginResponse> => {
    // Request refresh — backend will use HttpOnly refresh cookie
    const response = await apiClient<BackendRefreshResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      requiresAuth: false,
      skipRefresh: true, // Prevent infinite loop
    })

    // Update local memory access token
    setTokens({ accessToken: response.access_token, expiresIn: response.expires_in || 900 })

    // Transform backend response to expected format, including user data
    return {
      success: true,
      data: {
        accessToken: response.access_token,
        refreshToken: undefined as any,
        expiresIn: response.expires_in || 900,
        user: response.user ? {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          role: normalizeRole(response.user.role) as any,
          phone: response.user.phone_number,
          createdAt: response.user.created_at || new Date().toISOString(),
          updatedAt: response.user.updated_at || new Date().toISOString(),
        } : null as any,
      },
    }
  },
}

// ==================== STUDENTS API ====================

export const studentsApi = {
  getAll: (params?: { page?: number; pageSize?: number; schoolId?: string; classId?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString())
    if (params?.schoolId) searchParams.set('school_id', params.schoolId)
    if (params?.classId) searchParams.set('class_id', params.classId)

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/students${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/students/${id}`),

  create: (data: {
    school_id: string
    class_id?: string
    first_name: string
    last_name: string
    student_number?: string
    grade_level: number
    enrollment_date: string
    email?: string
    date_of_birth?: string
    gender?: 'Male' | 'Female'
    address?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    medical_info?: string
    parent_email?: string
    parent_first_name?: string
    parent_last_name?: string
    parent_phone?: string
    parent_relationship?: 'FATHER' | 'MOTHER' | 'GUARDIAN'
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/students', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/students/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/students/${id}`, {
      method: 'DELETE',
    }),

  // Parent management
  addParent: (studentId: string, parentId: string) =>
    apiClient<ApiResponse>(`/api/v1/students/${studentId}/parents`, {
      method: 'POST',
      body: { parent_id: parentId },
    }),

  removeParent: (studentId: string, parentId: string) =>
    apiClient<ApiResponse>(`/api/v1/students/${studentId}/parents/${parentId}`, {
      method: 'DELETE',
    }),

  getParents: (studentId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/students/${studentId}/parents`),

  // Profile image upload
  uploadProfileImage: async (studentId: string, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiClient<{ image_url: string }>(`/api/v1/students/${studentId}/profile-image`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for multipart/form-data
    })
    return response.image_url
  },
}

// ==================== PARENTS API ====================

export const parentsApi = {
  // Standalone Parent Creation
  create: (data: {
    school_id: string
    email: string
    first_name: string
    last_name: string
    phone?: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/parents', {
      method: 'POST',
      body: data,
    }),

  // Link Student
  addStudent: (parentId: string, studentId: string) =>
    apiClient<ApiResponse>(`/api/v1/parents/${parentId}/students`, {
      method: 'POST',
      body: { student_id: studentId },
    }),

  // Unlink Student
  removeStudent: (parentId: string, studentId: string) =>
    apiClient<ApiResponse>(`/api/v1/parents/${parentId}/students/${studentId}`, {
      method: 'DELETE',
    }),
}

// ==================== TEACHERS API ====================

export const teachersApi = {
  // Basic CRUD
  getAll: (params?: {
    page?: number
    limit?: number
    schoolId?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    department?: string
    specialization?: string
    search?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('page_size', params.limit.toString())
    if (params?.schoolId) searchParams.set('school_id', params.schoolId)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.department) searchParams.set('department', params.department)
    if (params?.specialization) searchParams.set('specialization', params.specialization)
    if (params?.search) searchParams.set('search', params.search)

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${id}`),

  create: (data: {
    first_name: string
    last_name: string
    email: string
    phone_number?: string
    school_id: string
    employee_id?: string
    department?: string
    specialization?: string
    qualifications?: string
    years_of_experience?: number
    hire_date: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/teachers', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: {
    employee_id?: string
    department?: string
    specialization?: string
    qualifications?: string
    years_of_experience?: number
    hire_date?: string
    status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
    max_periods_per_day?: number
    max_periods_per_week?: number
    notes?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/teachers/${id}`, {
      method: 'DELETE',
    }),

  // Class assignments
  getClasses: (teacherId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers/${teacherId}/classes`),

  assignClass: (teacherId: string, data: {
    class_id: string
    subject_id: string
    is_main?: boolean
    periods_per_week?: number
    academic_year?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/classes`, {
      method: 'POST',
      body: data,
    }),

  unassignClass: (teacherId: string, classId: string, subjectId: string) =>
    apiClient<ApiResponse>(`/api/v1/teachers/${teacherId}/classes/${classId}/subjects/${subjectId}`, {
      method: 'DELETE',
    }),

  // Subject qualifications
  getSubjects: (teacherId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers/${teacherId}/subjects`),

  addSubject: (teacherId: string, data: {
    subject_id: string
    is_primary?: boolean
    certification?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/subjects`, {
      method: 'POST',
      body: data,
    }),

  removeSubject: (teacherId: string, subjectId: string) =>
    apiClient<ApiResponse>(`/api/v1/teachers/${teacherId}/subjects/${subjectId}`, {
      method: 'DELETE',
    }),

  // Availability management
  getAvailability: (teacherId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers/${teacherId}/availability`),

  setAvailability: (teacherId: string, data: {
    day_of_week: string
    start_time: string
    end_time: string
    is_available: boolean
    reason?: string
    is_preference?: boolean
    priority?: number
    is_recurring?: boolean
    specific_date?: string
    academic_year?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/availability`, {
      method: 'POST',
      body: data,
    }),

  updateAvailability: (teacherId: string, availabilityId: string, data: {
    day_of_week?: string
    start_time?: string
    end_time?: string
    is_available?: boolean
    reason?: string
    is_preference?: boolean
    priority?: number
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/availability/${availabilityId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteAvailability: (teacherId: string, availabilityId: string) =>
    apiClient<ApiResponse>(`/api/v1/teachers/${teacherId}/availability/${availabilityId}`, {
      method: 'DELETE',
    }),

  approveAvailability: (teacherId: string, availabilityId: string, data: {
    approved: boolean
    admin_notes?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/availability/${availabilityId}/approve`, {
      method: 'POST',
      body: data,
    }),

  // Schedule
  getSchedule: (teacherId: string, date?: string) => {
    const query = date ? `?date=${date}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers/${teacherId}/schedule${query}`)
  },

  // Profile image upload
  uploadProfileImage: async (teacherId: string, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiClient<{ image_url: string }>(`/api/v1/teachers/${teacherId}/profile-image`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for multipart/form-data
    })
    return response.image_url
  },
}

// ==================== CLASSES API ====================

export const classesApi = {
  getAll: (params?: { schoolId?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.schoolId) searchParams.set('school_id', params.schoolId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString())

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/classes${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/classes/${id}`),

  create: (data: {
    school_id: string
    name: string
    grade_level: number
    academic_year: string
    class_teacher_id?: string
    max_students?: number
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/classes', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: {
    name?: string
    grade_level?: number
    academic_year?: string
    class_teacher_id?: string
    max_students?: number
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/classes/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/classes/${id}`, {
      method: 'DELETE',
    }),
}


// ==================== SUBJECTS API ====================

export const subjectsApi = {
  getAll: (params?: { page?: number; pageSize?: number; gradeLevel?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString())
    if (params?.gradeLevel) searchParams.set('grade_level', params.gradeLevel.toString())

    const query = searchParams.toString()
    return apiClient<ApiResponse<{ data: unknown[]; total: number }>>(`/api/v1/subjects${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/subjects/${id}`),

  create: (data: {
    name: string
    code: string
    description?: string
    grade_level: number
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/subjects', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: {
    name?: string
    code?: string
    description?: string
    grade_level?: number
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/subjects/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/subjects/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== ATTENDANCE API ====================

export const attendanceApi = {
  // Session management
  createSession: (data: {
    teacher_id: string
    class_id: string
    subject_id?: string
    date: string
    duration_minutes?: number
    latitude?: number
    longitude?: number
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/attendance/sessions', {
      method: 'POST',
      body: data,
    }),

  getSession: (sessionId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/attendance/sessions/${sessionId}`),

  endSession: (sessionId: string) =>
    apiClient<ApiResponse>(`/api/v1/attendance/sessions/${sessionId}/end`, {
      method: 'POST',
    }),

  listSessions: (params?: { classId?: string; teacherId?: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.classId) searchParams.set('class_id', params.classId)
    if (params?.teacherId) searchParams.set('teacher_id', params.teacherId)
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.pageSize) searchParams.set('page_size', params.pageSize.toString())

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/attendance/sessions${query ? `?${query}` : ''}`)
  },

  // Check-in
  checkIn: (data: {
    session_id: string
    student_id: string
    latitude?: number
    longitude?: number
    facial_image?: string
    check_in_method?: 'FACIAL_RECOGNITION' | 'MANUAL' | 'QR_CODE' | 'BIOMETRIC'
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/attendance/check-in', {
      method: 'POST',
      body: data,
    }),

  // List attendance for session
  getSessionAttendance: (sessionId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/attendance/sessions/${sessionId}/attendances`),

  // Student attendance history
  getStudentAttendance: (params: { studentId: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    if (params.startDate) searchParams.set('start_date', params.startDate)
    if (params.endDate) searchParams.set('end_date', params.endDate)

    return apiClient<ApiResponse<unknown[]>>(`/api/v1/attendance/student?${searchParams.toString()}`)
  },

  // Attendance statistics
  getStats: (params: { studentId: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    if (params.startDate) searchParams.set('start_date', params.startDate)
    if (params.endDate) searchParams.set('end_date', params.endDate)

    return apiClient<ApiResponse<{
      total_sessions: number
      present_count: number
      absent_count: number
      late_count: number
      excused_count: number
      attendance_rate: number
    }>>(`/api/v1/attendance/stats?${searchParams.toString()}`)
  },
}

// ==================== GRADES API ====================

export const gradesApi = {
  // Create a new grade
  create: (data: {
    student_id: string
    subject_id: string
    teacher_id: string
    class_id: string
    academic_year: string
    term: string
    grade_type: 'QUIZ' | 'ASSIGNMENT' | 'MIDTERM' | 'FINAL' | 'EXAM' | 'PROJECT'
    score: number
    max_score: number
    weight?: number
    comments?: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/grades', {
      method: 'POST',
      body: data,
    }),

  // Get a specific grade
  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/grades/${id}`),

  // Update a grade
  update: (id: string, data: { score?: number; max_score?: number; comments?: string }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/grades/${id}`, {
      method: 'PUT',
      body: data,
    }),

  // Delete a grade
  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/grades/${id}`, {
      method: 'DELETE',
    }),

  // Publish a grade
  publish: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/grades/${id}/publish`, {
      method: 'POST',
    }),

  // List student grades
  getStudentGrades: (params: { studentId: string; academicYear?: string; term?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    if (params.academicYear) searchParams.set('academic_year', params.academicYear)
    if (params.term) searchParams.set('term', params.term)

    return apiClient<ApiResponse<unknown[]>>(`/api/v1/grades/student?${searchParams.toString()}`)
  },

  // List class grades
  getClassGrades: (params: { classId: string; subjectId?: string; academicYear?: string; term?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('class_id', params.classId)
    if (params.subjectId) searchParams.set('subject_id', params.subjectId)
    if (params.academicYear) searchParams.set('academic_year', params.academicYear)
    if (params.term) searchParams.set('term', params.term)

    return apiClient<ApiResponse<unknown[]>>(`/api/v1/grades/class?${searchParams.toString()}`)
  },

  // Get student GPA
  getStudentGPA: (params: { studentId: string; academicYear?: string; term?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    if (params.academicYear) searchParams.set('academic_year', params.academicYear)
    if (params.term) searchParams.set('term', params.term)

    return apiClient<{ gpa: number }>(`/api/v1/grades/gpa?${searchParams.toString()}`)
  },

  // Get class average
  getClassAverage: (params: { classId: string; subjectId: string; academicYear?: string; term?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('class_id', params.classId)
    searchParams.set('subject_id', params.subjectId)
    if (params.academicYear) searchParams.set('academic_year', params.academicYear)
    if (params.term) searchParams.set('term', params.term)

    return apiClient<{ average: number }>(`/api/v1/grades/class-average?${searchParams.toString()}`)
  },
}

// ==================== PAYMENTS API ====================

export const paymentsApi = {
  // Initiate a payment
  create: (data: {
    student_id: string
    fee_structure_id?: string
    payer_id?: string
    amount: number
    currency: string
    payment_method: 'STRIPE' | 'FLUTTERWAVE' | 'CASH' | 'BANK_TRANSFER'
    notes?: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/payments', {
      method: 'POST',
      body: data,
    }),

  // Get a specific payment
  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/payments/${id}`),

  // Update payment status (webhook endpoint)
  updateStatus: (id: string, status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED') =>
    apiClient<ApiResponse<unknown>>(`/api/v1/payments/${id}/status`, {
      method: 'PUT',
      body: { status },
    }),

  // List student payments
  getStudentPayments: (params: { studentId: string; page?: number; pageSize?: number }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.pageSize) searchParams.set('page_size', params.pageSize.toString())

    return apiClient<ApiResponse<unknown[]>>(`/api/v1/payments/student?${searchParams.toString()}`)
  },

  // Get student balance
  getStudentBalance: (params: { studentId: string; academicYear: string; term: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('student_id', params.studentId)
    searchParams.set('academic_year', params.academicYear)
    searchParams.set('term', params.term)

    return apiClient<{ balance: number }>(`/api/v1/payments/balance?${searchParams.toString()}`)
  },

  // Get payment statistics (for school admin)
  getStats: (params: { schoolId: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('school_id', params.schoolId)
    if (params.startDate) searchParams.set('start_date', params.startDate)
    if (params.endDate) searchParams.set('end_date', params.endDate)

    return apiClient<ApiResponse<{
      total_amount: number
      completed_amount: number
      pending_amount: number
      failed_amount: number
      total_transactions: number
      completion_rate: number
    }>>(`/api/v1/payments/stats?${searchParams.toString()}`)
  },

  // Fee structures
  createFeeStructure: (data: {
    school_id: string
    grade_level: number
    academic_year: string
    fee_name: string
    amount: number
    currency: string
    due_date: string
    description?: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/fee-structures', {
      method: 'POST',
      body: data,
    }),

  listFeeStructures: (schoolId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/fee-structures?school_id=${schoolId}`),
}

// ==================== SCHOOLS API ====================

export const schoolsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools${query ? `?${query}` : ''}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${id}`),

  update: (id: string, data: {
    name?: string
    country?: string
    preferred_language?: string
    curriculum_systems?: string[]
    address?: string
    city?: string
    province?: string
    phone?: string
    email?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${id}`, {
      method: 'PUT',
      body: data,
    }),

  // Grade System Configuration
  getGradeSystemConfig: (schoolId: string) =>
    apiClient<ApiResponse<{
      id: string
      school_id: string
      system_type: 'MOZAMBIQUE' | 'CAMBRIDGE' | 'PERCENTAGE' | 'GPA' | 'CUSTOM'
      min_score: number
      max_score: number
      passing_score: number
      grade_boundaries: Record<string, {
        min_score: number
        max_score: number
        letter_grade: string
        gpa: number
        description: string
      }>
      show_percentage: boolean
      show_letter_grade: boolean
      show_gpa: boolean
      decimal_places: number
      rounding_mode: string
    }>>(`/api/v1/schools/${schoolId}/grade-system`),

  createGradeSystemConfig: (schoolId: string, data: {
    system_type: 'MOZAMBIQUE_NATIONAL' | 'CAMBRIDGE' | 'ANGOLA_NATIONAL' | 'SOUTH_AFRICA_CAPS' | 'CONGO_NATIONAL' | 'PERCENTAGE' | 'GPA' | 'CUSTOM'
    min_score?: number
    max_score: number
    passing_score: number
    grade_boundaries?: Record<string, {
      min_score: number
      max_score: number
      letter_grade: string
      gpa: number
      description: string
    }>
    show_percentage?: boolean
    show_letter_grade?: boolean
    show_gpa?: boolean
    decimal_places?: number
    rounding_mode?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/grade-system`, {
      method: 'POST',
      body: data,
    }),

  updateGradeSystemConfig: (schoolId: string, data: {
    system_type?: 'MOZAMBIQUE_NATIONAL' | 'CAMBRIDGE' | 'ANGOLA_NATIONAL' | 'SOUTH_AFRICA_CAPS' | 'CONGO_NATIONAL' | 'PERCENTAGE' | 'GPA' | 'CUSTOM'
    min_score?: number
    max_score?: number
    passing_score?: number
    grade_boundaries?: Record<string, {
      min_score: number
      max_score: number
      letter_grade: string
      gpa: number
      description: string
    }>
    show_percentage?: boolean
    show_letter_grade?: boolean
    show_gpa?: boolean
    decimal_places?: number
    rounding_mode?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/grade-system`, {
      method: 'PUT',
      body: data,
    }),

  getDefaultGradeSystem: (schoolId: string, systemType: string) =>
    apiClient<ApiResponse<{
      system_type: string
      boundaries: Record<string, {
        min_score: number
        max_score: number
        letter_grade: string
        gpa: number
        description: string
      }>
    }>>(`/api/v1/schools/${schoolId}/grade-system/defaults/${systemType}`),

  // Logo upload
  uploadLogo: async (schoolId: string, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('logo', file)

    const response = await apiClient<{ image_url: string }>(`/api/v1/schools/${schoolId}/logo`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for multipart/form-data
    })
    return response.image_url
  },
}

// ==================== ROOMS API ====================

export const roomsApi = {
  // Basic CRUD
  getAll: (schoolId: string, params?: {
    page?: number
    limit?: number
    type?: string
    status?: string
    floor?: number
    min_capacity?: number
    has_projector?: boolean
    has_computer?: boolean
    is_accessible?: boolean
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('page_size', params.limit.toString())
    if (params?.type) searchParams.set('type', params.type)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.floor !== undefined) searchParams.set('floor', params.floor.toString())
    if (params?.min_capacity) searchParams.set('min_capacity', params.min_capacity.toString())
    if (params?.has_projector) searchParams.set('has_projector', 'true')
    if (params?.has_computer) searchParams.set('has_computer', 'true')
    if (params?.is_accessible) searchParams.set('is_accessible', 'true')

    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/rooms${query ? `?${query}` : ''}`)
  },

  getById: (schoolId: string, roomId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}`),

  create: (schoolId: string, data: {
    code: string
    name: string
    type: string
    building?: string
    floor?: number
    capacity: number
    description?: string
    has_projector?: boolean
    has_whiteboard?: boolean
    has_computers?: boolean
    computer_count?: number
    has_ac?: boolean
    has_internet?: boolean
    is_accessible?: boolean
    equipment?: string[]
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms`, {
      method: 'POST',
      body: data,
    }),

  update: (schoolId: string, roomId: string, data: {
    name?: string
    type?: string
    building?: string
    floor?: number
    capacity?: number
    description?: string
    has_projector?: boolean
    has_whiteboard?: boolean
    has_computers?: boolean
    computer_count?: number
    has_ac?: boolean
    has_internet?: boolean
    is_accessible?: boolean
    equipment?: string[]
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (schoolId: string, roomId: string) =>
    apiClient<ApiResponse>(`/api/v1/schools/${schoolId}/rooms/${roomId}`, {
      method: 'DELETE',
    }),

  updateStatus: (schoolId: string, roomId: string, status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLOSED') =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  // Availability
  getAvailability: (schoolId: string, roomId: string, date?: string) => {
    const query = date ? `?date=${date}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/availability${query}`)
  },

  setAvailability: (schoolId: string, roomId: string, data: {
    day_of_week: number
    start_time: string
    end_time: string
    is_available: boolean
    reason?: string
    is_recurring?: boolean
    specific_date?: string
    academic_year?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/availability`, {
      method: 'POST',
      body: data,
    }),

  updateAvailability: (schoolId: string, roomId: string, availabilityId: string, data: {
    is_available?: boolean
    reason?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/availability/${availabilityId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteAvailability: (schoolId: string, roomId: string, availabilityId: string) =>
    apiClient<ApiResponse>(`/api/v1/schools/${schoolId}/rooms/${roomId}/availability/${availabilityId}`, {
      method: 'DELETE',
    }),

  // Reservations
  getReservations: (schoolId: string, roomId: string, startDate?: string, endDate?: string) => {
    const searchParams = new URLSearchParams()
    if (startDate) searchParams.set('start_date', startDate)
    if (endDate) searchParams.set('end_date', endDate)
    const query = searchParams.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/reservations${query ? `?${query}` : ''}`)
  },

  createReservation: (schoolId: string, roomId: string, data: {
    title: string
    description?: string
    date: string
    start_time: string
    end_time: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/reservations`, {
      method: 'POST',
      body: data,
    }),

  updateReservation: (schoolId: string, roomId: string, reservationId: string, status: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms/${roomId}/reservations/${reservationId}`, {
      method: 'PUT',
      body: { status },
    }),

  deleteReservation: (schoolId: string, roomId: string, reservationId: string) =>
    apiClient<ApiResponse>(`/api/v1/schools/${schoolId}/rooms/${roomId}/reservations/${reservationId}`, {
      method: 'DELETE',
    }),

  // Scheduling helpers
  getAvailableRooms: (schoolId: string, params: {
    day_of_week: number
    start_time: string
    end_time: string
    min_capacity?: number
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('day_of_week', params.day_of_week.toString())
    searchParams.set('start_time', params.start_time)
    searchParams.set('end_time', params.end_time)
    if (params.min_capacity) searchParams.set('min_capacity', params.min_capacity.toString())
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/scheduling/available-rooms?${searchParams.toString()}`)
  },

  getSuitableRooms: (schoolId: string, params: {
    subject_name: string
    min_capacity?: number
  }) => {
    const searchParams = new URLSearchParams()
    searchParams.set('subject_name', params.subject_name)
    if (params.min_capacity) searchParams.set('min_capacity', params.min_capacity.toString())
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/scheduling/suitable-rooms?${searchParams.toString()}`)
  },
}

// ==================== SCHEDULE API ====================

export const scheduleApi = {
  // Schedule generation
  generate: (schoolId: string, data: {
    name: string
    academic_year: string
    term: string
    curriculum_type: 'national' | 'cambridge' | 'combined'
    start_date: string
    end_date: string
    algorithm?: 'genetic' | 'constraint' | 'hybrid'
    class_ids?: string[]
    options?: {
      max_iterations?: number
      population_size?: number
      mutation_rate?: number
      respect_preferences?: boolean
      balance_workload?: boolean
      minimize_gaps?: boolean
      prioritize_morning?: boolean
    }
  }) =>
    apiClient<ApiResponse<{
      timetable_id: string
      status: string
      optimization_score: number
      conflicts: unknown[]
      warnings: unknown[]
    }>>(`/api/v1/schools/${schoolId}/schedules/generate`, {
      method: 'POST',
      body: data,
    }),

  // Templates
  getTemplates: (schoolId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/schedules/templates`),

  createTemplate: (schoolId: string, data: {
    name: string
    description?: string
    settings: Record<string, unknown>
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/schedules/templates`, {
      method: 'POST',
      body: data,
    }),

  // Constraints
  getConstraints: (schoolId: string) =>
    apiClient<ApiResponse<{
      teachers: { id: string; name: string; constraints: unknown }[]
      rooms: { id: string; name: string; constraints: unknown }[]
      subjects: { id: string; name: string; constraints: unknown }[]
      global: unknown
    }>>(`/api/v1/schools/${schoolId}/schedules/constraints`),

  // Availability summary
  getAvailabilitySummary: (schoolId: string) =>
    apiClient<ApiResponse<{
      teachers: {
        total: number
        with_availability: number
        without_availability: number
        pending_approval: number
      }
      rooms: {
        total: number
        available: number
        maintenance: number
        closed: number
      }
      subjects: {
        total: number
        with_requirements: number
        without_requirements: number
      }
    }>>(`/api/v1/schools/${schoolId}/schedules/availability-summary`),
}

// ==================== TIMETABLE API ====================

export const timetableApi = {
  // School Configuration
  createSchoolConfiguration: (schoolId: string, data: {
    academic_year: string
    curriculum_type: 'national' | 'cambridge'
    school_start_time: string
    school_end_time: string
    national_periods_per_day: number
    cambridge_periods_per_day: number
    period_duration_minutes: number
    cambridge_period_duration_minutes: number
    break_duration_minutes: number
    lunch_duration_minutes: number
    morning_break_after_period: number
    lunch_break_after_period: number
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/configuration`, {
      method: 'POST',
      body: data,
    }),

  getSchoolConfiguration: (schoolId: string, academicYear: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/configuration?academic_year=${academicYear}`),

  updateSchoolConfiguration: (schoolId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/configuration`, {
      method: 'PUT',
      body: data,
    }),

  // Rooms
  createRoom: (schoolId: string, data: {
    code: string
    name: string
    capacity: number
    room_type?: string
    floor?: number
    building?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/rooms`, {
      method: 'POST',
      body: data,
    }),

  getRoomsBySchool: (schoolId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/rooms`),

  getRoom: (roomId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/rooms/${roomId}`),

  updateRoom: (roomId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/rooms/${roomId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteRoom: (roomId: string) =>
    apiClient<ApiResponse>(`/api/v1/rooms/${roomId}`, {
      method: 'DELETE',
    }),

  // Timetable Templates
  generateTimetable: (data: {
    school_id: string
    name: string
    academic_year: string
    term: string
    curriculum_type: string
    start_date: string
    end_date: string
    algorithm: 'genetic' | 'basic'
    constraints?: Record<string, unknown>
    generated_by: string
  }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/timetables/generate', {
      method: 'POST',
      body: data,
    }),

  getTimetable: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/timetables/${id}`),

  getTimetablesBySchool: (schoolId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/timetables/school/${schoolId}`),

  updateTimetable: (id: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/timetables/${id}`, {
      method: 'PUT',
      body: data,
    }),

  activateTimetable: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/timetables/${id}/activate`, {
      method: 'POST',
    }),

  validateTimetable: (id: string) =>
    apiClient<ApiResponse<{
      is_valid: boolean
      teacher_conflicts: unknown[]
      room_conflicts: unknown[]
      class_conflicts: unknown[]
      total_conflicts: number
      suggestions: string[]
    }>>(`/api/v1/timetables/${id}/validate`),

  // Teacher Availability
  setTeacherAvailability: (teacherId: string, data: {
    day_of_week: string
    start_time: string
    end_time: string
    is_available: boolean
    reason?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/availability`, {
      method: 'POST',
      body: data,
    }),

  getTeacherAvailability: (teacherId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/teachers/${teacherId}/availability`),

  updateTeacherAvailability: (teacherId: string, availabilityId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/teachers/${teacherId}/availability/${availabilityId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteTeacherAvailability: (teacherId: string, availabilityId: string) =>
    apiClient<ApiResponse>(`/api/v1/teachers/${teacherId}/availability/${availabilityId}`, {
      method: 'DELETE',
    }),

  // Subject Requirements
  setSubjectRequirement: (subjectId: string, data: {
    class_id: string
    weekly_hours: number
    requires_lab?: boolean
    requires_double_period?: boolean
    preferred_time_slots?: string[]
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/subjects/${subjectId}/requirements`, {
      method: 'POST',
      body: data,
    }),

  getSubjectRequirement: (subjectId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/subjects/${subjectId}/requirements`),

  updateSubjectRequirement: (subjectId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/subjects/${subjectId}/requirements`, {
      method: 'PUT',
      body: data,
    }),

  // View timetables
  getTeacherTimetable: (schoolId: string, teacherId: string, date?: string) => {
    const query = date ? `?date=${date}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/timetables/teacher/${teacherId}${query}`)
  },

  getClassTimetable: (schoolId: string, classId: string, date?: string) => {
    const query = date ? `?date=${date}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/timetables/class/${classId}${query}`)
  },

  getRoomTimetable: (schoolId: string, roomId: string, date?: string) => {
    const query = date ? `?date=${date}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/timetables/room/${roomId}${query}`)
  },

  // Timetable Constraints
  getTimetableConstraints: (schoolId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/timetable-constraints`),

  createTimetableConstraint: (schoolId: string, data: {
    constraint_type: string
    constraint_data: Record<string, unknown>
    priority: number
    is_hard_constraint: boolean
    description?: string
  }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/timetable-constraints`, {
      method: 'POST',
      body: data,
    }),

  updateTimetableConstraint: (constraintId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/timetable-constraints/${constraintId}`, {
      method: 'PUT',
      body: data,
    }),

  deleteTimetableConstraint: (constraintId: string) =>
    apiClient<ApiResponse>(`/api/v1/timetable-constraints/${constraintId}`, {
      method: 'DELETE',
    }),
}

// ==================== TIMETABLE-ATTENDANCE INTEGRATION API ====================

export const timetableAttendanceApi = {
  // Create sessions from timetable
  createSessionsForDate: (schoolId: string, date: string) =>
    apiClient<ApiResponse<{ message: string; count: number; date: string }>>(
      `/api/v1/timetable-attendance/schools/${schoolId}/create-sessions`,
      {
        method: 'POST',
        body: { date },
      }
    ),

  createSessionsForWeek: (schoolId: string, startDate: string) =>
    apiClient<ApiResponse<{ message: string; count: number; start_date: string }>>(
      `/api/v1/timetable-attendance/schools/${schoolId}/create-sessions/week`,
      {
        method: 'POST',
        body: { start_date: startDate },
      }
    ),

  createSessionsForDateRange: (schoolId: string, startDate: string, endDate: string) =>
    apiClient<ApiResponse<{ message: string; count: number; start_date: string; end_date: string }>>(
      `/api/v1/timetable-attendance/schools/${schoolId}/create-sessions/range`,
      {
        method: 'POST',
        body: { start_date: startDate, end_date: endDate },
      }
    ),

  // Get scheduled sessions
  getScheduledSessionsByClass: (classId: string, date: string) =>
    apiClient<ApiResponse<unknown[]>>(
      `/api/v1/timetable-attendance/classes/${classId}/scheduled?date=${date}`
    ),

  getScheduledSessionsByTeacher: (teacherId: string, date: string) =>
    apiClient<ApiResponse<unknown[]>>(
      `/api/v1/timetable-attendance/teachers/${teacherId}/scheduled?date=${date}`
    ),

  // Get attendance comparison
  getAttendanceComparison: (classId: string, startDate: string, endDate: string) =>
    apiClient<ApiResponse<{
      scheduled_sessions: number
      actual_sessions: number
      missed_sessions: number
      unscheduled_sessions: number
      details: unknown[]
    }>>(
      `/api/v1/timetable-attendance/classes/${classId}/comparison?start_date=${startDate}&end_date=${endDate}`
    ),
}

// ==================== MESSAGING API ====================

export type ConversationType = 'DIRECT' | 'GROUP' | 'CLASS_GROUP'

export interface MessagingUserSummary {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
  phone_number?: string
  avatar_url?: string | null
  school_id?: string | null
}

export interface MessagingConversationParticipant {
  id: string
  conversation_id: string
  user_id: string
  role: string
  is_muted: boolean
  muted_until?: string | null
  last_read_at?: string | null
  joined_at: string
  left_at?: string | null
  user?: MessagingUserSummary
}

export interface MessagingChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  content_type: string
  reply_to_id?: string | null
  is_edited: boolean
  edited_at?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  created_at: string
  updated_at: string
  sender?: MessagingUserSummary
}

export interface MessagingConversation {
  id: string
  type: ConversationType
  name?: string | null
  description?: string | null
  avatar_url?: string | null
  class_id?: string | null
  max_members: number
  school_id?: string | null
  created_by: string
  is_active: boolean
  last_message_at?: string | null
  created_at: string
  updated_at: string
  participants?: MessagingConversationParticipant[]
  last_message?: MessagingChatMessage | null
  unread_count?: number
  other_participant?: MessagingUserSummary | null
}

export interface ConversationListResponse {
  conversations: Array<MessagingConversation & { unread_count: number }>
  total: number
  page: number
  page_size: number
}

export type BulkTargetType =
  | 'ALL_STUDENTS'
  | 'ALL_TEACHERS'
  | 'ALL_PARENTS'
  | 'CLASS'
  | 'GRADE'
  | string

export type DeliveryChannel = 'IN_APP' | 'EMAIL' | 'SMS' | string

export type BulkMessageStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'CANCELLED' | string

export interface MessagingBulkMessage {
  id: string
  sender_id: string
  school_id: string
  subject?: string | null
  content: string
  target_type: BulkTargetType
  target_value?: string | null
  channel: DeliveryChannel
  status: BulkMessageStatus
  scheduled_at?: string | null
  sent_at?: string | null
  total_recipients: number
  delivered_count: number
  read_count: number
  created_at: string
  updated_at: string
  sender?: MessagingUserSummary
}

export interface BulkMessageListResponse {
  messages: MessagingBulkMessage[]
  total: number
  page: number
  page_size: number
}

export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'VIOLENCE' | 'OTHER' | string
export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTION_TAKEN' | 'DISMISSED' | string

export interface MessagingMessageReport {
  id: string
  message_id: string
  reporter_id: string
  reason: ReportReason
  description?: string | null
  status: ReportStatus
  reviewed_by?: string | null
  reviewed_at?: string | null
  action_taken?: string | null
  created_at: string
  updated_at: string
}

export interface MessageReportListResponse {
  reports: MessagingMessageReport[]
  total: number
  page: number
  page_size: number
}

export const messagingApi = {
  // Recipients
  getEligibleRecipients: () =>
    apiClient<MessagingUserSummary[]>('/api/v1/messaging/recipients'),

  // Conversations
  listConversations: (params?: { page?: number; pageSize?: number }) => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 50
    return apiClient<ConversationListResponse>(
      `/api/v1/messaging/conversations?page=${page}&page_size=${pageSize}`
    )
  },

  getConversation: (conversationId: string) =>
    apiClient<MessagingConversation>(`/api/v1/messaging/conversations/${conversationId}`),

  createDirectConversation: (userId: string) =>
    apiClient<MessagingConversation>(`/api/v1/messaging/conversations/direct/${userId}`, {
      method: 'POST',
    }),

  createGroupConversation: (data: { name: string; member_ids: string[] }) =>
    apiClient<MessagingConversation>(`/api/v1/messaging/conversations/group`, {
      method: 'POST',
      body: data,
    }),

  leaveConversation: (conversationId: string) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/leave`, { method: 'POST' }),

  updateGroup: (conversationId: string, data: { name?: string; description?: string }) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/group`, {
      method: 'PUT',
      body: data,
    }),

  addMember: (conversationId: string, userId: string) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/members/${userId}`, { method: 'POST' }),

  removeMember: (conversationId: string, userId: string) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/members/${userId}`, { method: 'DELETE' }),

  // Messages
  getMessages: (conversationId: string, params?: { before?: string; limit?: number }) => {
    const search = new URLSearchParams()
    if (params?.before) search.set('before', params.before)
    if (params?.limit) search.set('limit', String(params.limit))
    const qs = search.toString()
    return apiClient<MessagingChatMessage[]>(
      `/api/v1/messaging/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`
    )
  },

  sendMessage: (conversationId: string, data: { content: string; content_type?: string; reply_to_id?: string }) =>
    apiClient<MessagingChatMessage>(`/api/v1/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: {
        content: data.content,
        content_type: data.content_type ?? 'TEXT',
        ...(data.reply_to_id ? { reply_to_id: data.reply_to_id } : {}),
      },
    }),

  editMessage: (messageId: string, content: string) =>
    apiClient(`/api/v1/messaging/messages/${messageId}`, {
      method: 'PUT',
      body: { content },
    }),

  deleteMessage: (messageId: string) =>
    apiClient(`/api/v1/messaging/messages/${messageId}`, { method: 'DELETE' }),

  reportMessage: (messageId: string, data: { reason: string; description?: string }) =>
    apiClient(`/api/v1/messaging/messages/${messageId}/report`, {
      method: 'POST',
      body: { reason: data.reason, description: data.description ?? '' },
    }),

  // Read status
  markConversationRead: (conversationId: string) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/read`, { method: 'POST' }),

  getUnreadCounts: () => apiClient<Record<string, number>>(`/api/v1/messaging/unread`),

  // Bulk messages
  listBulkMessages: (params?: { page?: number; pageSize?: number }) => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    return apiClient<BulkMessageListResponse>(`/api/v1/messaging/bulk?page=${page}&page_size=${pageSize}`)
  },

  createBulkMessage: (data: {
    subject?: string
    content: string
    target_type: string
    target_value?: string
    channel?: string
    scheduled_at?: string
  }) =>
    apiClient<MessagingBulkMessage>(`/api/v1/messaging/bulk`, {
      method: 'POST',
      body: data,
    }),

  sendBulkMessage: (bulkMessageId: string) =>
    apiClient(`/api/v1/messaging/bulk/${bulkMessageId}/send`, { method: 'POST' }),

  listReceivedBulkMessages: (params?: { unreadOnly?: boolean; page?: number; pageSize?: number }) => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const unreadOnly = params?.unreadOnly ? 'true' : 'false'
    return apiClient<BulkMessageListResponse>(
      `/api/v1/messaging/bulk/received?unread_only=${unreadOnly}&page=${page}&page_size=${pageSize}`
    )
  },

  markBulkMessageRead: (bulkMessageId: string) =>
    apiClient(`/api/v1/messaging/bulk/${bulkMessageId}/read`, { method: 'POST' }),

  // Blocking
  listBlockedUsers: () => apiClient<string[]>(`/api/v1/messaging/block`),
  blockUser: (userId: string, reason?: string) =>
    apiClient(`/api/v1/messaging/block/${userId}`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),
  unblockUser: (userId: string) => apiClient(`/api/v1/messaging/block/${userId}`, { method: 'DELETE' }),

  // Reports (admin only)
  listPendingReports: (params?: { page?: number; pageSize?: number }) => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    return apiClient<MessageReportListResponse>(`/api/v1/messaging/reports?page=${page}&page_size=${pageSize}`)
  },

  reviewReport: (reportId: string, data: { status: string; action_taken?: string }) =>
    apiClient(`/api/v1/messaging/reports/${reportId}`, {
      method: 'PUT',
      body: data,
    }),

  // Real-time signals (REST triggers for GraphQL subscriptions)
  setTypingIndicator: (conversationId: string, isTyping: boolean) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/typing`, {
      method: 'POST',
      body: { is_typing: isTyping },
    }),

  setPresence: (conversationId: string, isOnline: boolean) =>
    apiClient(`/api/v1/messaging/conversations/${conversationId}/presence`, {
      method: 'POST',
      body: { is_online: isOnline },
    }),
}

// ==================== CURRICULUM TRACKS API ====================

export const curriculumTracksApi = {
  list: (schoolId?: string) => {
    const query = schoolId ? `?school_id=${schoolId}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/curriculum-tracks${query}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/curriculum-tracks/${id}`),

  getSubjects: (trackId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/curriculum-tracks/${trackId}/subjects`),

  create: (data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>('/api/v1/curriculum-tracks', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/curriculum-tracks/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/curriculum-tracks/${id}`, {
      method: 'DELETE',
    }),

  addSubject: (trackId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/curriculum-tracks/${trackId}/subjects`, {
      method: 'POST',
      body: data,
    }),

  removeSubject: (trackId: string, subjectId: string) =>
    apiClient<ApiResponse>(`/api/v1/curriculum-tracks/${trackId}/subjects/${subjectId}`, {
      method: 'DELETE',
    }),

  assignToClass: (data: { classId: string; trackId: string; isPrimary?: boolean }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/curriculum-tracks/class-assignments', {
      method: 'POST',
      body: data,
    }),

  assignToStudent: (data: { studentId: string; trackId: string; startDate?: string }) =>
    apiClient<ApiResponse<unknown>>('/api/v1/curriculum-tracks/student-assignments', {
      method: 'POST',
      body: data,
    }),
}

// ==================== ACTIVITIES API ====================

export const activitiesApi = {
  list: (schoolId?: string) => {
    const query = schoolId ? `?school_id=${schoolId}` : ''
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/activities${query}`)
  },

  getById: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activities/${id}`),

  getEnrollments: (activityId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/activities/${activityId}/enrollments`),

  getSessions: (activityId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/activities/${activityId}/sessions`),

  getStudentActivities: (studentId: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/students/${studentId}/activities`),

  create: (data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>('/api/v1/activities', {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activities/${id}`, {
      method: 'PUT',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/activities/${id}`, {
      method: 'DELETE',
    }),

  // Enrollments
  enroll: (activityId: string, data: { studentId: string; enrolledBy?: string }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activities/${activityId}/enrollments`, {
      method: 'POST',
      body: data,
    }),

  updateEnrollment: (activityId: string, enrollmentId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activities/${activityId}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: data,
    }),

  removeEnrollment: (activityId: string, enrollmentId: string) =>
    apiClient<ApiResponse>(`/api/v1/activities/${activityId}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    }),

  // Sessions
  createSession: (activityId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activities/${activityId}/sessions`, {
      method: 'POST',
      body: data,
    }),

  cancelSession: (activityId: string, sessionId: string, reason?: string) =>
    apiClient<ApiResponse>(`/api/v1/activities/${activityId}/sessions/${sessionId}/cancel`, {
      method: 'POST',
      body: { reason },
    }),

  // Attendance
  recordAttendance: (sessionId: string, data: { studentId: string; status: string; notes?: string }) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/activity-sessions/${sessionId}/attendance`, {
      method: 'POST',
      body: data,
    }),

  bulkRecordAttendance: (sessionId: string, records: Array<{ studentId: string; status: string; notes?: string }>) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/activity-sessions/${sessionId}/attendance/bulk`, {
      method: 'POST',
      body: { records },
    }),
}

// ============================================================================
// Student Cards API
// ============================================================================

export const studentCardsApi = {
  // Templates
  listTemplates: () =>
    apiClient<ApiResponse<unknown[]>>('/api/v1/student-card-templates'),

  getTemplate: (id: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/student-card-templates/${id}`),

  createTemplate: (data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>('/api/v1/student-card-templates', {
      method: 'POST',
      body: data,
    }),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/student-card-templates/${id}`, {
      method: 'PUT',
      body: data,
    }),

  deleteTemplate: (id: string) =>
    apiClient<ApiResponse>(`/api/v1/student-card-templates/${id}`, {
      method: 'DELETE',
    }),

  // School card settings
  getSchoolSettings: (schoolId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/student-cards/settings`),

  updateSchoolSettings: (schoolId: string, data: Record<string, unknown>) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/student-cards/settings`, {
      method: 'PUT',
      body: data,
    }),

  // Card generation
  generateForStudent: (studentId: string, academicYear: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/students/${studentId}/card`, {
      method: 'POST',
      body: { academic_year: academicYear },
    }),

  generateForClass: (classId: string, academicYear: string) =>
    apiClient<ApiResponse<unknown[]>>(`/api/v1/classes/${classId}/student-cards/generate`, {
      method: 'POST',
      body: { academic_year: academicYear },
    }),

  generateForSchool: (schoolId: string, academicYear: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/schools/${schoolId}/student-cards/generate`, {
      method: 'POST',
      body: { academic_year: academicYear },
    }),

  // Card listing
  listBySchool: (schoolId: string, params?: { year?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams()
    if (params?.year) sp.set('year', params.year)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const query = sp.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/schools/${schoolId}/student-cards${query ? `?${query}` : ''}`)
  },

  listByClass: (classId: string, params?: { year?: string; page?: number; page_size?: number }) => {
    const sp = new URLSearchParams()
    if (params?.year) sp.set('year', params.year)
    if (params?.page) sp.set('page', String(params.page))
    if (params?.page_size) sp.set('page_size', String(params.page_size))
    const query = sp.toString()
    return apiClient<ApiResponse<unknown[]>>(`/api/v1/classes/${classId}/student-cards${query ? `?${query}` : ''}`)
  },

  // Individual card operations
  getCard: (cardId: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/student-cards/${cardId}`),

  getStudentCard: (studentId: string, year: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/students/${studentId}/card?year=${year}`),

  downloadPDF: (cardId: string) =>
    apiClient<Blob>(`/api/v1/student-cards/${cardId}/download`, {
      headers: { Accept: 'application/pdf' },
    }),

  revokeCard: (cardId: string) =>
    apiClient<ApiResponse>(`/api/v1/student-cards/${cardId}/revoke`, {
      method: 'POST',
    }),

  deleteCard: (cardId: string) =>
    apiClient<ApiResponse>(`/api/v1/student-cards/${cardId}`, {
      method: 'DELETE',
    }),

  // Email
  emailToParent: (cardId: string) =>
    apiClient<ApiResponse>(`/api/v1/student-cards/${cardId}/email`, {
      method: 'POST',
    }),

  emailForClass: (classId: string, year: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/classes/${classId}/student-cards/email`, {
      method: 'POST',
      body: { year },
    }),

  // Numbering
  updateClassNumber: (cardId: string, classNumber: number) =>
    apiClient<ApiResponse>(`/api/v1/student-cards/${cardId}/class-number`, {
      method: 'PUT',
      body: { class_number: classNumber },
    }),

  renumberClass: (classId: string, method: string) =>
    apiClient<ApiResponse>(`/api/v1/classes/${classId}/student-cards/renumber`, {
      method: 'POST',
      body: { method },
    }),

  // Renewal
  renewForSchool: (schoolId: string, academicYear: string) =>
    apiClient<ApiResponse<unknown>>(`/api/v1/admin/student-cards/renew`, {
      method: 'POST',
      body: { school_id: schoolId, academic_year: academicYear },
    }),

  // HTML Card Preview
  renderCardHTML: (cardId: string, side: 'front' | 'back' = 'front') =>
    apiClient<string>(`/api/v1/student-cards/${cardId}/html?side=${side}`, {
      headers: { Accept: 'text/html' },
    }),

  previewTemplate: (templateId: string, schoolId?: string, side: 'front' | 'back' = 'front') =>
    apiClient<{ html: string; side: string }>(`/api/v1/student-cards/template-preview`, {
      method: 'POST',
      body: { template_id: templateId, school_id: schoolId || '', side },
    }),

  previewCustomHTML: (data: {
    front_html: string;
    back_html: string;
    side: 'front' | 'back';
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  }) =>
    apiClient<{ html: string; side: string }>(`/api/v1/student-cards/custom-preview`, {
      method: 'POST',
      body: data,
    }),
}
