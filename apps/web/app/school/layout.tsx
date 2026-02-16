
'use client'

import { ReactNode, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Building2,
  Bell,
  MessageSquare,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  LogOut,
  Layers,
  Music,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import { LanguageSwitcher } from '../../components/language-switcher'
import { AuthGuard } from '../../components/auth-guard'
import { TopBar } from '../../components/layout/top-bar'
import { useTranslations } from 'next-intl'
import { useUser, useAuthStore } from '@/lib/stores'
import { UserRole } from '@mozedu/types'
import Image from 'next/image'

export default function SchoolLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const t = useTranslations('common')
  const tSchool = useTranslations('school')
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)

  const role = user?.role
  const isAccountant = role === UserRole.ACCOUNTANT
  const isTeacherAdmin = role === UserRole.TEACHER_ADMIN

  const accountantAllowed = useMemo(() => {
    // Keep this list tight: accountants should only see what they need.
    // Expand later (e.g. /school/payments) when those pages exist.
    return pathname === '/school/messages' || pathname.startsWith('/school/messages/')
  }, [pathname])

  useEffect(() => {
    if (!isAccountant) return
    if (accountantAllowed) return
    router.replace('/school/messages')
  }, [accountantAllowed, isAccountant, router])

  // Navigation items with translation keys
  const navigation = useMemo(() => {
    if (isAccountant) {
      return [{ key: 'messagesNav', href: '/school/messages', icon: MessageSquare }]
    }

    const nav = [
      { key: 'dashboard', href: '/school', icon: LayoutDashboard },
      { key: 'students', href: '/school/students', icon: Users },
      { key: 'teachers', href: '/school/teachers', icon: GraduationCap },
      { key: 'classesNav', href: '/school/classes', icon: BookOpen },
      { key: 'curriculumTracksNav', href: '/school/curriculum-tracks', icon: Layers },
      { key: 'activitiesNav', href: '/school/activities', icon: Music },
      { key: 'studentCardsNav', href: '/school/student-cards', icon: CreditCard },
      { key: 'messagesNav', href: '/school/messages', icon: MessageSquare },
      { key: 'schedule', href: '/school/schedule', icon: Calendar },
      { key: 'reportsNav', href: '/school/reports', icon: FileText },
      { key: 'analyticsNav', href: '/school/analytics', icon: BarChart3 },
      { key: 'settingsNav', href: '/school/settings', icon: Settings },
    ]

    if (isTeacherAdmin) {
      nav.unshift({ key: 'teacherPortal', href: '/teacher', icon: GraduationCap })
    }

    return nav
  }, [isAccountant, isTeacherAdmin])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const roleLabel = isAccountant ? t('accountant') : t('schoolAdmin')

  // Get user initials
  const initials = user
    ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
    : isAccountant
      ? 'AC'
      : 'SA'

  const displayName = user ? `${user.firstName} ${user.lastName}` : roleLabel

  // Avoid rendering restricted pages for accountants (prevents content flash during redirect)
  if (isAccountant && !accountantAllowed) return null

  return (
    <AuthGuard
      requiredRole={[
        UserRole.SCHOOL_ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.MINISTRY_OFFICIAL,
        UserRole.ACCOUNTANT,
        UserRole.TEACHER_ADMIN,
      ]}
    >
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full bg-card border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64`}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link href="/school" className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                  <h1 className="text-lg font-bold whitespace-nowrap">{tSchool('portal')}</h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{tSchool('managementPortal')}</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
                aria-label={t('closeSidebar')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${isActive
                      ? 'bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/25'
                      : 'text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-cyan-500/10 hover:text-primary'
                      }`}
                    title={tSchool(item.key)}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg" />
                    )}
                    <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`} />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                      {tSchool(item.key)}
                    </span>
                  </Link>
                )
              })}
            </nav>

            {/* User info */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                {user?.profileImageUrl ? (
                  <Image src={user.profileImageUrl} alt={displayName} width={40} height={40} className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-border" />
                ) : (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                )}
                <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                  <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{roleLabel}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title={t('logout')}
                  className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden' : ''}`}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
          <TopBar
            toggleSidebar={() => setSidebarOpen(true)}
            roleLabel={roleLabel}
          />

          {/* Page content */}

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
