'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Button } from '@mozedu/ui'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useLogin } from '@/lib/hooks'
import { useAuthStore } from '@/lib/stores'
import { RoleSelectionModal } from './role-selection-modal'
import { UserRole } from '@mozedu/types'

export default function LoginClient() {
  const t = useTranslations('auth')
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<LoginFormData | null>(null)

  const { mutate: login, isPending, error, data, reset } = useLogin()
  const authError = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const loginSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(6, t('validation.passwordMin')),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const onSubmit = (formData: LoginFormData) => {
    setCredentials(formData)
    login(formData)
  }

  const handleRoleSelect = (role: UserRole) => {
    if (credentials) {
      login({ ...credentials, activeRole: role })
    }
  }

  const showRoleSelection = data?.requiresSelection && data?.availableRoles && data.availableRoles.length > 0

  const displayError = error?.message || authError

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">Mw</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Mwinda</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">{t('welcomeBack')}</h2>
          <p className="mt-2 text-muted-foreground">{t('enterAccount')}</p>
        </div>

        {displayError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${errors.email ? 'border-destructive' : 'border-input'
                    }`}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${errors.password ? 'border-destructive' : 'border-input'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80">
                {t('forgotPassword')}
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? t('loggingIn') : t('login')}
            </Button>
          </form>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('contactAdmin')}
        </p>
      </div>
      
      <RoleSelectionModal 
        open={!!showRoleSelection} 
        roles={data?.availableRoles || []}
        onSelect={handleRoleSelect}
        onCancel={() => reset()}
        isPending={isPending}
      />
    </div >
  )
}
