'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@mozedu/ui'
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react'
import { useAuthStore, useUser } from '@/lib/stores'
import { useTranslations } from 'next-intl'

export default function UnauthorizedPage() {
  const router = useRouter()
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)
  const t = useTranslations('common')

  const handleGoBack = () => {
    router.back()
  }

  const handleGoHome = () => {
    // Redirect based on user role
    const roleRoutes: Record<string, string> = {
      'STUDENT': '/student',
      'PARENT': '/parent',
      'TEACHER': '/teacher',
      'SCHOOL_ADMIN': '/school',
      'MINISTRY_OFFICIAL': '/school',
      'SUPER_ADMIN': '/school',
    }

    const redirectPath = user?.role ? roleRoutes[user.role] : '/auth/login'
    router.push(redirectPath || '/auth/login')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
            <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t('unauthorized.title')}</h1>
          <p className="text-muted-foreground">
            {t('unauthorized.description')}
          </p>
          {user && (
            <p className="text-sm text-muted-foreground">
              {t('unauthorized.loggedAs')} <span className="font-medium">{user.email}</span>
              <br />
              {t('unauthorized.role')} <span className="font-medium">{user.role}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('unauthorized.goBack')}
          </Button>
          
          <Button onClick={handleGoHome}>
            {t('unauthorized.goToDashboard')}
          </Button>

          <Button variant="ghost" onClick={handleLogout}>
            <LogIn className="h-4 w-4 mr-2" />
            {t('unauthorized.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}
