'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import ptMessages from '../messages/pt.json'
import enMessages from '../messages/en.json'
import frMessages from '../messages/fr.json'
import trMessages from '../messages/tr.json'

type Locale = 'pt' | 'en' | 'fr' | 'tr'

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const messagesMap: Record<Locale, any> = {
  pt: ptMessages,
  en: enMessages,
  fr: frMessages,
  tr: trMessages,
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')
  const [messages, setMessages] = useState<any>(messagesMap['fr'])
  const [isMounted, setIsMounted] = useState(false)

  // Load saved language preference on mount
  useEffect(() => {
    setIsMounted(true)
    const savedLocale = localStorage.getItem('preferredLanguage') as Locale
    if (savedLocale && ['pt', 'en', 'fr', 'tr'].includes(savedLocale)) {
      setLocaleState(savedLocale)
      setMessages(messagesMap[savedLocale])
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setMessages(messagesMap[newLocale])
    localStorage.setItem('preferredLanguage', newLocale)
    document.documentElement.lang = newLocale
  }

  // Prevent hydration mismatch by rendering children only after mount, 
  // or render with default locale (fr) initially.
  // For SEO, we should render immediately. 
  // The 'isMounted' check is mainly to avoid hydration errors if local storage differs from server default.
  // But since we default to 'pt' and server defaults to 'pt', it should be fine.

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Africa/Kinshasa">
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  )
}
