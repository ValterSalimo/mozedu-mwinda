/**
 * React Query Hooks for Authentication
 * Following Context7 TanStack Query best practices
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore, LoginResult } from '../stores'
import { UserRole } from '@mozedu/types'

// ==================== QUERY KEYS ====================

export const authKeys = {
  user: ['auth', 'user'] as const,
  session: ['auth', 'session'] as const,
}

// ==================== TYPES ====================

export interface LoginCredentials {
  email: string
  password: string
  activeRole?: string
}

// ==================== HOOKS ====================

/**
 * Hook for login mutation with 2FA support
 */
export function useLogin() {
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResult> => {
      return await login(credentials.email, credentials.password, credentials.activeRole)
    },
    onSuccess: async (result: LoginResult) => {
      // If role selection is required, stay on page to show selection modal
      if (result.requiresSelection) {
        return
      }

      // If 2FA is required, redirect to verification page
      if (result.requires2FA) {
        // Small delay to ensure Zustand persist saves to localStorage
        await new Promise(resolve => setTimeout(resolve, 100))
        router.push('/auth/verify-otp/')
        return
      }

      // Otherwise, redirect to dashboard based on role
      const user = useAuthStore.getState().user

      // Map role to their home dashboard - only routes that exist
      // Roles are UPPERCASE to match UserRole enum values from backend
      const roleHomeRoutes: Record<string, string> = {
        'STUDENT': '/student',
        'PARENT': '/parent',
        'TEACHER': '/teacher',
        'TEACHER_ADMIN': '/teacher',
        'SCHOOL_ADMIN': '/school',
        'MINISTRY_OFFICIAL': '/school', // TODO: Create /ministry route
        'SUPER_ADMIN': '/school', // TODO: Create /admin route
      }

      const role = user?.role || ''
      const redirectPath = roleHomeRoutes[role]

      if (redirectPath) {
        router.push(redirectPath)
      } else {
        // Fallback: logout and show error if role is unknown
        console.error('Unknown user role:', role)
        router.push('/auth/login')
      }
    },
  })
}

/**
 * Hook for OTP verification mutation
 */
export function useVerifyOTP() {
  const router = useRouter()
  const verifyOTP = useAuthStore((state) => state.verifyOTP)

  return useMutation({
    mutationFn: async (otp: string) => {
      await verifyOTP(otp)
    },
    onSuccess: () => {
      const user = useAuthStore.getState().user

      const roleHomeRoutes: Record<string, string> = {
        'STUDENT': '/student',
        'PARENT': '/parent',
        'TEACHER': '/teacher',
        'TEACHER_ADMIN': '/teacher',
        'SCHOOL_ADMIN': '/school',
        'MINISTRY_OFFICIAL': '/school',
        'SUPER_ADMIN': '/school',
      }

      const role = user?.role || ''
      const redirectPath = roleHomeRoutes[role] || '/auth/login'
      router.push(redirectPath)
    },
  })
}

/**
 * Hook for resending OTP
 */
export function useResendOTP() {
  const resendOTP = useAuthStore((state) => state.resendOTP)

  return useMutation({
    mutationFn: async () => {
      await resendOTP()
    },
  })
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const logout = useAuthStore((state) => state.logout)

  return useMutation({
    mutationFn: async () => {
      await logout()
    },
    onSuccess: () => {
      // Clear all cached queries
      queryClient.clear()
      // Redirect to login
      router.push('/auth/login')
    },
  })
}

/**
 * Hook to check if user is authenticated
 */
export function useCheckAuth() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  return useMutation({
    mutationFn: async () => {
      await checkAuth()
    },
  })
}
