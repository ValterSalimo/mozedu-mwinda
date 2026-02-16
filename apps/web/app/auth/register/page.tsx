'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@Ulongo/ui'
import { AlertCircle } from 'lucide-react'

/**
 * Public self-registration is disabled.
 * Users must be created by an administrator, teacher, or school admin.
 */
export default function RegisterPage() {
  const t = useTranslations('auth')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">Mw</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Mwinda</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            {t('registrationDisabled')}
          </h2>
        </div>

        {/* Info Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-6">
            {t('contactAdminForAccount')}
          </p>
          <Link href="/auth/login">
            <Button className="w-full" size="lg">
              {t('backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
