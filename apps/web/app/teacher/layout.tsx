'use client'

import { ReactNode, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BookOpen,
  FileText,
  FlaskConical,
  HelpCircle,
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  Menu,
  X,
  GraduationCap,
  Search,
  Moon,
  Sun,
  LogOut,
  Building2,
} from 'lucide-react'
import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import { LanguageSwitcher } from '../../components/language-switcher'
import { AuthGuard } from '../../components/auth-guard'
import { TopBar } from '../../components/layout/top-bar'
import { useTranslations } from 'next-intl'
import { useUser, useAuthStore } from '@/lib/stores'
import Image from 'next/image'

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const t = useTranslations('common')
  const tTeacher = useTranslations('teacher')
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)

  const role = user?.role
  const isTeacherAdmin = role === 'TEACHER_ADMIN'

  // Navigation items with translation keys - memoized to update on language change
  const navigation = useMemo(() => {
    const nav: any[] = [
      { name: t('dashboard'), href: '/teacher', icon: LayoutDashboard },
      { name: tTeacher('classes'), href: '/teacher/classes', icon: Users },
      { name: t('grades'), href: '/teacher/grades', icon: BookOpen },
      { name: t('attendance'), href: '/teacher/attendance', icon: ClipboardCheck },
      { name: tTeacher('assignments.title'), href: '/teacher/assignments', icon: FileText },
      { name: tTeacher('practicals.title'), href: '/teacher/practicals', icon: FlaskConical },
      { name: tTeacher('quizzes.title'), href: '/teacher/quizzes', icon: HelpCircle },
      { name: tTeacher('schedule.title'), href: '/teacher/schedule', icon: Calendar },
      { name: t('messages'), href: '/teacher/messages', icon: MessageSquare },
      { name: t('settings'), href: '/teacher/settings', icon: Settings },
    ]

    if (isTeacherAdmin) {
      nav.push({ name: t('schoolAdmin'), href: '/school', icon: Building2 })
    }

    return nav
  }, [t, tTeacher, isTeacherAdmin])

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
    : 'T'

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Teacher'

  return (
    <AuthGuard requiredRole={['TEACHER', 'TEACHER_ADMIN']}>
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
              <Link href="/teacher" className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <GraduationCap className="h-6 w-6 text-foreground" />
                </div>
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                  <h1 className="text-lg font-bold whitespace-nowrap">{tTeacher('portal')}</h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{tTeacher('teachingPortal')}</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? 'bg-secondary-50 text-secondary-700'
                      : 'text-foreground hover:bg-background'
                      }`}
                    title={item.name}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                      {item.name}
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
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold">
                    {initials}
                  </div>
                )}
                <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                  <p className="text-sm font-medium text-foreground truncate whitespace-nowrap">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{t('teacher')}</p>
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
            roleLabel={t('teacher')}
          />

          {/* Page content */}

          {/* Page content */}
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
