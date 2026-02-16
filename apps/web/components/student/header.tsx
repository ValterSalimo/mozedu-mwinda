'use client'

import { Bell, Search, Moon, Sun, LogOut, Menu } from 'lucide-react'
import { Button, Input } from '@mozedu/ui'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '../language-switcher'
import { useTranslations } from 'next-intl'
import { useUser, useAuthStore } from '@/lib/stores'
import Image from 'next/image'

interface HeaderProps {
  toggleSidebar?: () => void
}

export function Header({ toggleSidebar }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const t = useTranslations('common')
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  // Get user initials
  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : 'U'

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-muted"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="max-w-md w-full hidden md:block">
          <Input
            type="search"
            placeholder={t('search')}
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label={t('notifications')}>
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>

        <div className="flex items-center gap-3">
          {user?.profileImageUrl ? (
            <Image src={user.profileImageUrl} alt={user.firstName} width={40} height={40} className="h-10 w-10 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {initials}
            </div>
          )}
          <div className="text-sm">
            <p className="font-medium text-card-foreground">
              {user ? `${user.firstName} ${user.lastName}` : t('student')}
            </p>
            <p className="text-muted-foreground">{t('student')}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title={t('logout')}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
