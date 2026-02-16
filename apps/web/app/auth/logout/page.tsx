'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function LogoutPage() {
  const router = useRouter()
  const t = useTranslations('auth')

  useEffect(() => {
    // Clear all auth cookies on client side
    const cookies = [
      'mozedu-authenticated',
      'mozedu-user-role',
      'mozedu-token',
      'mozedu-refresh-token'
    ]

    cookies.forEach(name => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })

    // Clear localStorage if any auth data
    try {
      localStorage.removeItem('mozedu-user')
      localStorage.removeItem('mozedu-token')
    } catch (e) {
      // Ignore localStorage errors
    }

    // Redirect to login
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('loggingOut')}</p>
      </div>
    </div>
  )
}
