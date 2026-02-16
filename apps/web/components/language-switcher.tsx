'use client'

import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '../app/language-provider'

export function LanguageSwitcher() {
  const t = useTranslations('languages')
  const { locale, setLocale } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages = [
    { code: 'pt' as const, name: t('pt'), flag: '🇵🇹' },
    { code: 'en' as const, name: t('en'), flag: '🇬🇧' },
    { code: 'fr' as const, name: t('fr'), flag: '🇫🇷' },
    { code: 'tr' as const, name: t('tr'), flag: '🇹🇷' },
  ]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const changeLanguage = (newLocale: 'pt' | 'en' | 'fr' | 'tr') => {
    setIsOpen(false)
    setLocale(newLocale)
    // No reload needed - LanguageProvider updates IntlProvider which re-renders all components
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Change language"
      >
        <Globe className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-card border border-border z-20">
            <div className="py-1" role="menu">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                    locale === lang.code
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground'
                  }`}
                  role="menuitem"
                >
                  <span className="text-lg" aria-hidden="true">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                  {locale === lang.code && (
                    <span className="ml-auto text-primary" aria-label="Selected">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
