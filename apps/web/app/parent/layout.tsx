'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Home,
  Users,
  MessageSquare,
  CreditCard,
  Bell,
  Settings,
  Menu,
  X,
  Bot,
  BarChart3,
  Calendar,
  Search,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react'
import { Button, Input } from '@mozedu/ui'
import { LanguageSwitcher } from '../../components/language-switcher'
import { AuthGuard } from '../../components/auth-guard'
import { TopBar } from '../../components/layout/top-bar'
import { useUser, useAuthStore } from '@/lib/stores'
import Image from 'next/image'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('parent')
  const tCommon = useTranslations('common')
  const user = useUser()
  const logout = useAuthStore((state) => state.logout)

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
    : 'P'

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Parent'

  const navigation = [
    { name: t('dashboardNav'), href: '/parent', icon: Home },
    { name: t('myChildren'), href: '/parent/children', icon: Users },
    { name: t('aiAssistant'), href: '/parent/chatbot', icon: Bot },
    { name: t('messagesNav'), href: '/parent/messages', icon: MessageSquare },
    { name: t('paymentsNav'), href: '/parent/payments', icon: CreditCard },
    { name: t('notificationsNav'), href: '/parent/notifications', icon: Bell },
    { name: t('reportsNav'), href: '/parent/reports', icon: BarChart3 },
    { name: t('scheduleNav'), href: '/parent/schedule', icon: Calendar },
    { name: t('settingsNav'), href: '/parent/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/parent') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <AuthGuard requiredRole={['PARENT']}>
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 h-screen bg-background/95 backdrop-blur-xl border-r border-border transition-all duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-64`}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 whitespace-nowrap">
                    {t('portal')}
                  </h1>
                  <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">{t('parentPortal')}</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                    title={item.name}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                    <span className={`font-medium transition-all duration-300 overflow-hidden whitespace-nowrap ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>{item.name}</span>
                    {active && !isCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  </Link>
                )
              })}
            </nav>

            {/* User Profile */}
            <div className={`p-4 mt-auto transition-all duration-300 ${isCollapsed ? 'lg:px-2' : ''}`}>
              <div className={`glass-card rounded-2xl p-4 border border-border/50 ${isCollapsed ? 'lg:p-2' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <Image src={user.profileImageUrl} alt={displayName} width={40} height={40} className="h-10 w-10 rounded-full object-cover ring-2 ring-background" />
                    ) : (
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900 dark:to-cyan-900 rounded-full flex items-center justify-center ring-2 ring-background">
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{initials}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                  </div>
                  <div className={`flex-1 min-w-0 transition-all duration-300 overflow-hidden ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100'}`}>
                    <p className="text-sm font-bold text-foreground truncate whitespace-nowrap">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{user?.email || tCommon('parent')}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className={`h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-300 ${isCollapsed ? 'lg:hidden' : ''}`}
                    title={tCommon('logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className={`transition-all duration-300 ${isCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
          <TopBar
            toggleSidebar={() => setSidebarOpen(true)}
            roleLabel={tCommon('parent')}
            extraActions={
              <Link
                href="/parent/chatbot"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <Bot className="h-5 w-5" />
                <span className="font-semibold">{t('chatbot.title')}</span>
              </Link>
            }
          />

          {/* Page Content */}

          {/* Page Content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
