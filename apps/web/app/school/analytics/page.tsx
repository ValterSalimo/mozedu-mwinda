'use client'

import { BarChart3 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function AnalyticsPage() {
  const t = useTranslations('school')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <div className="p-4 rounded-full bg-primary/10">
        <BarChart3 className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">{t('analytics.title')}</h1>
      <p className="text-muted-foreground max-w-md">
        {t('analytics.comingSoonDesc')}
      </p>
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
        {t('analytics.comingSoon')}
      </div>
    </div>
  )
}
