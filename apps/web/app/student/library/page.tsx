'use client'

import { Book, Clock, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@mozedu/ui'
import { useTranslations } from 'next-intl'

export default function LibraryPage() {
  const t = useTranslations('student')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('library.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('library.subtitle')}
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <Book className="h-24 w-24 text-muted-foreground" />
            <div className="absolute -top-2 -right-2 bg-primary rounded-full p-2">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t('library.comingSoon')}
          </h2>
          
          <p className="text-muted-foreground text-center max-w-md mb-6">
            {t('library.comingSoonDescription')}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
            <Clock className="h-4 w-4" />
            <span>{t('library.expectedLaunch')}</span>
          </div>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📚</div>
              <p className="text-sm font-medium text-foreground">{t('library.feature1')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm font-medium text-foreground">{t('library.feature2')}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📱</div>
              <p className="text-sm font-medium text-foreground">{t('library.feature3')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
