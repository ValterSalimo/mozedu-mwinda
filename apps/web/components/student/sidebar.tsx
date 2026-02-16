'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Award,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  X,
  BookCheck,
  Beaker,
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function StudentSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('student')
  const [isCollapsed, setIsCollapsed] = useState(true)

  const navigation = useMemo(() => [
    { name: t('dashboard'), href: '/student', icon: LayoutDashboard },
    { name: t('attendanceNav'), href: '/student/attendance', icon: Calendar },
    { name: t('gradesNav'), href: '/student/grades', icon: Award },
    { name: t('assignmentsNav', { defaultValue: 'Assignments' }), href: '/student/assignments', icon: BookCheck },
    { name: t('practicalsNav', { defaultValue: 'Practicals' }), href: '/student/practicals', icon: Beaker },
    { name: t('libraryNav'), href: '/student/library', icon: BookOpen },
    { name: t('reportsNav'), href: '/student/reports', icon: FileText },
    { name: t('messagesNav'), href: '/student/messages', icon: MessageSquare },
  ], [t])

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:relative lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'lg:w-16' : 'lg:w-64',
        'w-64'
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">Mw</span>
          </div>
          <div className={cn('transition-all duration-300 overflow-hidden', isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100')}>
            <h1 className="text-lg font-bold text-card-foreground whitespace-nowrap">Mwinda</h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{t('portal')}</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden" aria-label="Close sidebar">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-gradient-to-r from-primary to-cyan-500 text-white shadow-lg shadow-primary/25'
                  : 'text-card-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-cyan-500/10 hover:text-primary'
              )}
              title={item.name}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg" />
              )}
              <Icon className={cn('h-5 w-5 flex-shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')} />
              <span className={cn('transition-all duration-300 overflow-hidden whitespace-nowrap', isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100')}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-1">
        <Link
          href="/student/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-card-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary group"
          title={t('settingsNav')}
        >
          <Settings className="h-5 w-5 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
          <span className={cn('transition-all duration-300 overflow-hidden whitespace-nowrap', isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100')}>
            {t('settingsNav')}
          </span>
        </Link>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive transition-all duration-200 hover:bg-destructive/10 group" title={t('logout')}>
          <LogOut className="h-5 w-5 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
          <span className={cn('transition-all duration-300 overflow-hidden whitespace-nowrap', isCollapsed ? 'lg:w-0 lg:opacity-0' : 'lg:w-auto lg:opacity-100')}>
            {t('logout')}
          </span>
        </button>
      </div>
    </aside>
  )
}
