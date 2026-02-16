/**
 * Auth Store using Zustand with Persist Middleware
 * Following Context7 best practices and FRONTEND_PROMPT.md pattern
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserRole } from '@mozedu/types'
import { setTokens, clearTokens, authApi, ApiError, getAccessToken, TwoFactorResponse, gql, setSessionExpiredHandler } from '../api'

let initializeAuthPromise: Promise<boolean> | null = null

// ==================== TYPES ====================

export interface AuthUser {
  id: string           // User ID from auth system
  email: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  avatar?: string
  profileImageUrl?: string
  entityId?: string    // Student/Teacher/Parent ID (role-specific entity)
  schoolId?: string    // School ID (for students/teachers)
}

// 2FA state for pending verification
export interface TwoFactorState {
  sessionToken: string
  email: string
  expiresAt: string
}

// Login result type
export interface LoginResult {
  requires2FA: boolean
  twoFactorState?: TwoFactorState
  requiresSelection?: boolean
  availableRoles?: UserRole[]
}

interface AuthState {
  // State
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionError: string | null // New state for session expiry messages
  twoFactorPending: TwoFactorState | null
  rolesPending: UserRole[] | null

  // Actions
  login: (email: string, password: string, activeRole?: string) => Promise<LoginResult>
  selectRole: (role: UserRole) => Promise<LoginResult>
  verifyOTP: (otp: string) => Promise<void>
  resendOTP: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: AuthUser) => void
  setEntityId: (entityId: string, schoolId?: string) => void
  setError: (error: string | null) => void
  clearError: () => void
  setSessionError: (error: string | null) => void
  clearSessionError: () => void
  clearTwoFactorState: () => void
  checkAuth: () => Promise<void>
  initializeAuth: () => Promise<boolean>
  handleSessionExpiry: () => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
}

// Backend user response type
interface BackendUser {
  id: string
  email: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  role: string
  phone?: string
  avatar?: string
}

// ==================== COOKIE HELPERS ====================

function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  // Add SameSite=Lax to ensure cookies are sent with navigation requests
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`
}

// Helper to map backend user to AuthUser
function mapBackendUserToAuthUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || user.firstName || '',
    lastName: user.last_name || user.lastName || '',
    role: user.role as UserRole,
    phone: user.phone,
    avatar: user.avatar,
    profileImageUrl: user.avatar,
  }
}

// ==================== STORE ====================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionError: null,
      twoFactorPending: null,
      rolesPending: null,

      // Actions
      login: async (email: string, password: string, activeRole?: string): Promise<LoginResult> => {
        set({ isLoading: true, error: null, twoFactorPending: null, rolesPending: null })

        try {
          const response = await authApi.login({ email, password, active_role: activeRole })

          // Check if Role Selection is required
          if ('requiresSelection' in response && response.requiresSelection === true) {
            set({
              isLoading: false,
              rolesPending: response.availableRoles,
            })
            return {
              requires2FA: false,
              requiresSelection: true,
              availableRoles: response.availableRoles
            }
          }

          // Check if 2FA is required
          if ('requires2FA' in response && response.requires2FA === true) {
            const twoFactorState: TwoFactorState = {
              sessionToken: response.sessionToken,
              email: response.email,
              expiresAt: response.expiresAt,
            }

            set({
              isLoading: false,
              twoFactorPending: twoFactorState,
            })

            return { requires2FA: true, twoFactorState }
          }

          // Standard login (no 2FA required)
          if (response.success && 'data' in response) {
            const { user: restUser, accessToken, expiresIn } = response.data

            // Set access token in API client (refresh token stored as HttpOnly cookie)
            setTokens({ accessToken, expiresIn })

            // 1. Create base AuthUser from REST response (we already have role and id)
            let authUser: AuthUser = {
              id: restUser.id,
              email: restUser.email,
              firstName: restUser.firstName || (restUser as any).first_name || '',
              lastName: restUser.lastName || (restUser as any).last_name || '',
              role: restUser.role as UserRole,
              phone: restUser.phone,
              // Fallback to school_id from REST if available
              schoolId: (restUser as any).schoolId || (restUser as any).school_id
            }

            // 2. Try to enrich with GraphQL profile, but don't block login if it fails
            try {
              const meData = await gql.me()
              const me = (meData as any).me

              if (me) {
                // Populate profileImageUrl
                authUser.profileImageUrl = me.profileImageUrl ||
                  me.student?.profileImageUrl ||
                  me.teacher?.profileImageUrl ||
                  authUser.profileImageUrl

                // Determine entity ID based on role
                if (authUser.role === 'STUDENT' && me.student) {
                  authUser.entityId = me.student.id
                  if (me.student.schoolId) authUser.schoolId = me.student.schoolId
                } else if ((authUser.role === 'TEACHER' || authUser.role === 'TEACHER_ADMIN') && me.teacher) {
                  authUser.entityId = me.teacher.id
                  if (me.teacher.schoolId) authUser.schoolId = me.teacher.schoolId
                } else if (authUser.role === 'PARENT' && me.parent) {
                  authUser.entityId = me.parent.id
                }
              }
            } catch (err) {
              console.warn('[Auth] GraphQL profile enrichment failed, proceeding with basic REST profile', err)
              // We proceed with the data we have from REST
            }

            // Set cookies for middleware
            setCookie('mozedu-authenticated', 'true')
            setCookie('mozedu-user-role', authUser.role)

            set({
              user: authUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              twoFactorPending: null,
            })

            return { requires2FA: false }
          } else {
            throw new Error('Login failed')
          }
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'An error occurred during login'

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
            twoFactorPending: null,
          })

          throw error
        }
      },


      selectRole: async (role: UserRole): Promise<LoginResult> => {
        // Deprecated: use login(email, password, role) instead
        throw new Error("Use login(email, password, role) instead")
      },

      verifyOTP: async (otp: string) => {
        const { twoFactorPending } = get()
        if (!twoFactorPending) {
          throw new Error('No 2FA session pending')
        }

        set({ isLoading: true, error: null })

        try {
          const response = await authApi.verifyOTP(twoFactorPending.sessionToken, otp)

          if (response.success && response.data) {
            const { user, accessToken, expiresIn } = response.data

            // Set access token in API client
            setTokens({ accessToken, expiresIn })

            // Map basic backend user to AuthUser
            let authUser = mapBackendUserToAuthUser(user as unknown as BackendUser)

            // Fetch rich profile from GraphQL
            try {
              const meData = await gql.me()
              const me = (meData as any).me

              if (me) {
                // Populate profileImageUrl
                authUser.profileImageUrl = me.profileImageUrl ||
                  me.student?.profileImageUrl ||
                  me.teacher?.profileImageUrl ||
                  authUser.profileImageUrl

                // Determine entity ID based on role
                let entityId: string | undefined
                let schoolId = me.student?.schoolId || me.teacher?.schoolId

                if (authUser.role === 'STUDENT' && me.student) {
                  entityId = me.student.id
                  schoolId = me.student.schoolId
                } else if ((authUser.role === 'TEACHER' || authUser.role === 'TEACHER_ADMIN') && me.teacher) {
                  entityId = me.teacher.id
                  schoolId = me.teacher.schoolId
                } else if (authUser.role === 'PARENT' && me.parent) {
                  entityId = me.parent.id
                }

                authUser = {
                  ...authUser,
                  entityId,
                  schoolId,
                }
              }
            } catch (err) {
              console.warn('[Auth] Failed to fetch GraphQL profile', err)
            }

            // Set cookies for middleware
            setCookie('mozedu-authenticated', 'true')
            setCookie('mozedu-user-role', authUser.role)

            set({
              user: authUser,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              twoFactorPending: null,
            })
          } else {
            throw new Error('OTP verification failed')
          }
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Invalid or expired OTP'

          set({
            isLoading: false,
            error: message,
          })

          throw error
        }
      },

      resendOTP: async () => {
        const { twoFactorPending } = get()
        if (!twoFactorPending) {
          throw new Error('No 2FA session pending')
        }

        set({ isLoading: true, error: null })

        try {
          const response = await authApi.resendOTP(twoFactorPending.sessionToken)

          // Response has data.expires_at wrapped in ApiResponse
          const expiresAt = (response as any).data?.expires_at || (response as any).expires_at
          if (expiresAt) {
            set({
              isLoading: false,
              twoFactorPending: {
                ...twoFactorPending,
                expiresAt: expiresAt,
              },
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : 'Failed to resend OTP'

          set({
            isLoading: false,
            error: message,
          })

          throw error
        }
      },

      clearTwoFactorState: () => {
        set({ twoFactorPending: null })
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null })

        try {
          const response = await authApi.register({
            email: data.email,
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phone,
            role: data.role || 'student',
          })

          if (response.success) {
            set({ isLoading: false, error: null })
            // After registration, user should login
          } else {
            throw new Error('Registration failed')
          }
        } catch (error) {
          const message = error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'An error occurred during registration'

          set({
            isLoading: false,
            error: message,
          })

          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          await authApi.logout()
        } catch (error) {
          // Ignore logout errors - we're logging out anyway
          console.warn('Logout API error:', error)
        } finally {
          // Clear tokens, cookies and state
          clearTokens()
          deleteCookie('mozedu-authenticated')
          deleteCookie('mozedu-user-role')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }
      },

      setUser: (user: AuthUser) => {
        set({ user, isAuthenticated: true })
      },

      setEntityId: (entityId: string, schoolId?: string) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              entityId,
              schoolId: schoolId || currentUser.schoolId,
            },
          })
        }
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

      setSessionError: (error: string | null) => {
        set({ sessionError: error })
      },

      clearSessionError: () => {
        set({ sessionError: null })
      },

      checkAuth: async () => {
        const { isAuthenticated } = get()

        if (!isAuthenticated) {
          return
        }

        set({ isLoading: true })

        try {
          // Try fetching me via REST first (or skip to GraphQL if token is valid)
          // Ideally, we just use GraphQL 'me' if we trust the token is there
          // But checkAuth usually validates the session

          const meData = await gql.me()
          const me = (meData as any).me

          if (me) {
            const authUser: AuthUser = {
              id: me.id,
              email: me.email,
              firstName: me.firstName,
              lastName: me.lastName,
              role: me.role as UserRole,
              phone: me.phoneNumber,
              profileImageUrl: me.profileImageUrl || me.student?.profileImageUrl || me.teacher?.profileImageUrl,
              entityId: undefined, // calculate below
              schoolId: undefined, // calculate below
            }

            // Determine entity ID
            if (authUser.role === 'STUDENT' && me.student) {
              authUser.entityId = me.student.id
              authUser.schoolId = me.student.schoolId
            } else if ((authUser.role === 'TEACHER' || authUser.role === 'TEACHER_ADMIN') && me.teacher) {
              authUser.entityId = me.teacher.id
              authUser.schoolId = me.teacher.schoolId
            } else if (authUser.role === 'PARENT' && me.parent) {
              authUser.entityId = me.parent.id
            }

            // Ensure cookies are set
            setCookie('mozedu-authenticated', 'true')
            setCookie('mozedu-user-role', authUser.role)

            set({
              user: authUser,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            throw new Error('Failed to fetch user profile')
          }
        } catch (error) {
          // Token is invalid or expired
          clearTokens()
          deleteCookie('mozedu-authenticated')
          deleteCookie('mozedu-user-role')
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionError: 'Your session has expired or is invalid. Please log in again.',
          })
        }
      },

      handleSessionExpiry: () => {
        clearTokens()
        deleteCookie('mozedu-authenticated')
        deleteCookie('mozedu-user-role')
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          sessionError: 'Your session has expired. Please log in again.',
        })
      },

      /**
       * Initialize auth on page load
       * Attempts to restore access token using refresh token (HttpOnly cookie)
       */
      initializeAuth: async () => {
        const { isAuthenticated } = get()

        // Only try to refresh if user was previously authenticated
        if (!isAuthenticated) {
          return false
        }

        // If we already have an access token in memory, don't refresh.
        if (getAccessToken()) {
          return true
        }

        // De-dupe concurrent callers (AuthGuard, hooks, etc.)
        if (initializeAuthPromise) {
          return initializeAuthPromise
        }

        initializeAuthPromise = (async () => {
          try {
            // Try to refresh access token using HttpOnly cookie
            const response = await authApi.refresh()
            if (response.success && response.data) {
              const { accessToken, expiresIn, user: userData } = response.data

              // Restore access token in memory
              setTokens({ accessToken, expiresIn })

              // Update user data - Fetch Rich Profile
              if (userData) {
                try {
                  const meData = await gql.me()
                  const me = (meData as any).me

                  if (me) {
                    let authUser = mapBackendUserToAuthUser(userData as unknown as BackendUser)

                    // Populate profileImageUrl
                    authUser.profileImageUrl = me.profileImageUrl ||
                      me.student?.profileImageUrl ||
                      me.teacher?.profileImageUrl ||
                      authUser.profileImageUrl

                    // Populate IDs
                    // Determine entity ID based on role
                    let entityId: string | undefined
                    let schoolId = me.student?.schoolId || me.teacher?.schoolId || (userData as any).school_id

                    if (authUser.role === 'STUDENT' && me.student) {
                      entityId = me.student.id
                      schoolId = me.student.schoolId
                    } else if ((authUser.role === 'TEACHER' || authUser.role === 'TEACHER_ADMIN') && me.teacher) {
                      entityId = me.teacher.id
                      schoolId = me.teacher.schoolId
                    } else if (authUser.role === 'PARENT' && me.parent) {
                      entityId = me.parent.id
                    }

                    authUser = {
                      ...authUser,
                      entityId,
                      schoolId,
                    }

                    set({ user: authUser, isAuthenticated: true })
                  }
                } catch (gqlErr) {
                  console.error('[Auth] Failed to fetch GraphQL profile on init', gqlErr)
                  // If we can't load the profile, we can't verify the session validity fully
                  // It's safer to require re-login or handle as error
                  clearTokens()
                  set({
                    user: null,
                    isAuthenticated: false,
                    error: null,
                    sessionError: 'Session verification failed. Please try logging in again.',
                  })
                  return false
                }
              }

              return true
            }
          } catch (error) {
            console.warn('[Auth] Token refresh failed on init:', error)
            // Clear auth state if refresh fails
            clearTokens()
            deleteCookie('mozedu-authenticated')
            deleteCookie('mozedu-user-role')
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              sessionError: 'Your session has expired. Please log in again.'
            })
          } finally {
            initializeAuthPromise = null
          }

          return false
        })()

        return initializeAuthPromise
      },
    }),
    {
      name: 'mozedu-auth', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user, auth status, and 2FA pending state
        user: state.user,
        sessionError: state.sessionError,
        isAuthenticated: state.isAuthenticated,
        twoFactorPending: state.twoFactorPending,
      }),
    }
  )
)

// Register the handler to link API client failures to Store state
setSessionExpiredHandler(() => {
  useAuthStore.getState().handleSessionExpiry()
})

export const selectSessionError = (state: AuthState) => state.sessionError

// ==================== SELECTORS ====================

export const selectUser = (state: AuthState) => state.user
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated
export const selectIsLoading = (state: AuthState) => state.isLoading
export const selectError = (state: AuthState) => state.error
export const selectUserRole = (state: AuthState) => state.user?.role

// ==================== UTILITY HOOKS ====================

export function useIsAuthenticated(): boolean {
  return useAuthStore(selectIsAuthenticated)
}

export function useUser(): AuthUser | null {
  return useAuthStore(selectUser)
}

export function useUserRole(): UserRole | undefined {
  return useAuthStore(selectUserRole)
}
