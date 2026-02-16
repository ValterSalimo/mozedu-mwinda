'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated, initializeAuth } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    
    // In case hydration already finished
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }
    
    return () => unsubscribe()
  }, [])

  // After hydration, initialize auth (refresh token if needed)
  useEffect(() => {
    if (!isHydrated) return

    const init = async () => {
      // If the user is marked authenticated (persisted), ensure we have an access token.
      if (isAuthenticated) {
        await initializeAuth()
      }
      setIsInitialized(true)
    }

    init()
  }, [isHydrated, isAuthenticated, initializeAuth])

  useEffect(() => {
    if (!isInitialized) return

    // Re-check auth state after initialization (it may have changed if refresh failed)
    const currentState = useAuthStore.getState()
    
    if (!currentState.isAuthenticated) {
      setRedirectTo('/auth/login')
      return
    }

    if (requiredRole && !requiredRole.includes(currentState.user?.role || '')) {
      setRedirectTo('/unauthorized')
      return
    }

    setRedirectTo(null)
  }, [isInitialized, requiredRole])

  useEffect(() => {
    if (!redirectTo) return
    router.replace(redirectTo)
  }, [redirectTo, router])

  // Show loading while hydrating or initializing
  if (!isHydrated || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (redirectTo) return null

  return <>{children}</>
}
