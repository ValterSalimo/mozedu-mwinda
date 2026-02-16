'use client'

import { useTranslations } from 'next-intl'
import { FileText, Clock, CheckCircle, Send, Filter } from 'lucide-react'

export default function AssignmentsPage() {
  const t = useTranslations('teacher')

  const features = [
    { icon: FileText, text: t('assignments.feature1') },
    { icon: Send, text: t('assignments.feature2') },
    { icon: CheckCircle, text: t('assignments.feature3') },
    { icon: Filter, text: t('assignments.feature4') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('assignments.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('assignments.subtitle')}</p>
      </div>

      <div className="bg-card rounded-xl p-12 shadow-sm text-center border border-border">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">{t('assignments.comingSoon')}</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          {t('assignments.comingSoonDescription')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <feature.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-foreground">{feature.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t('assignments.expectedLaunch')}</span>
        </div>
      </div>
    </div>
  )
}
