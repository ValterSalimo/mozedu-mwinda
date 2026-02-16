'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@mozedu/ui'

export default function SchoolError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    console.error('School section error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('errorBoundary.title')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('errorBoundary.description')}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              {t('errorBoundary.errorId')}: {error.digest}
            </p>
          )}
        </div>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="primary">
            {t('errorBoundary.tryAgain')}
          </Button>
          <Button onClick={() => window.location.href = '/school'} variant="outline">
            {t('errorBoundary.goBack')}
          </Button>
        </div>
      </div>
    </div>
  )
}
