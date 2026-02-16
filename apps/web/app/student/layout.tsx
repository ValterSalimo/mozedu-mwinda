'use client'

import { useState } from 'react'
import { StudentSidebar } from '@/components/student/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { AuthGuard } from '../../components/auth-guard'
import { useTranslations } from 'next-intl'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('common')

  return (
    <AuthGuard requiredRole={['STUDENT']}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar
            toggleSidebar={() => setSidebarOpen(true)}
            roleLabel={t('student')}
          />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}

