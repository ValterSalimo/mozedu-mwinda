import '@mozedu/ui/styles'
import './globals.css'
import type { Metadata } from 'next'
import { Poppins, Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import { LanguageProvider } from './language-provider'
import { ThemeProvider } from './theme-provider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Mwinda - Plateforme Éducative Numérique',
  description: 'Écosystème éducatif pour la République Démocratique du Congo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <Providers>{children}</Providers>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
