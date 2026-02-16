import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
export const locales = ['fr', 'en', 'pt', 'tr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr' // French as default for RDC

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound()

  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Africa/Kinshasa',
  }
})
