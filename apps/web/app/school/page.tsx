'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
  BarChart3,
  Loader2,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '@/lib/stores'
import { useDashboardStats, useClassPerformance, getStatusColorClass, useCurrentEntity } from '@/lib/hooks'

export default function SchoolDashboard() {
  const t = useTranslations('school')
  const user = useUser()

  // Resolve entity - for school admin, we need the schoolId
  const { schoolId } = useCurrentEntity()

  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning')
    if (hour < 18) return t('greeting.afternoon')
    return t('greeting.evening')
  })

  // Fetch real data
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(schoolId)
  const { data: classPerformance, isLoading: classesLoading } = useClassPerformance(schoolId)

  const stats = [
    {
      label: t('stats.totalStudents'),
      value: dashboardStats?.totalStudents?.toLocaleString() || '—',
      change: '',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      loading: statsLoading,
    },
    {
      label: t('stats.activeTeachers'),
      value: dashboardStats?.totalTeachers?.toString() || '—',
      change: '',
      icon: <GraduationCap className="h-6 w-6" />,
      color: 'bg-purple-500',
      loading: statsLoading,
    },
    {
      label: t('stats.classes'),
      value: dashboardStats?.totalClasses?.toString() || '—',
      change: '',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-green-500',
      loading: statsLoading,
    },
    {
      label: t('stats.attendanceRate'),
      value: dashboardStats?.averageAttendance ? `${dashboardStats.averageAttendance}%` : '—',
      change: '',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-orange-500',
      loading: statsLoading,
    },
  ]

  const quickStats = [
    {
      label: t('quickStats.studentsToday'),
      value: dashboardStats?.totalStudents?.toString() || '—',
      percentage: dashboardStats?.averageAttendance || 0,
      color: 'text-green-600'
    },
    {
      label: t('quickStats.teachersPresent'),
      value: dashboardStats?.totalTeachers?.toString() || '—',
      percentage: 0, // TODO: Implement teacher attendance tracking
      color: 'text-green-600'
    },
    {
      label: t('quickStats.classesActive'),
      value: dashboardStats?.totalClasses?.toString() || '—',
      percentage: 0, // TODO: Implement active class tracking
      color: 'text-blue-600'
    },
    {
      label: t('quickStats.schoolAverage'),
      value: dashboardStats?.averageGPA?.toFixed(1) || '—',
      percentage: (dashboardStats?.averageGPA || 0) * 5, // Convert 0-20 scale to percentage
      color: 'text-purple-600'
    },
  ]

  // Alerts from API data
  const alerts = dashboardStats?.alertsCount && dashboardStats.alertsCount > 0 ? [
    {
      title: t('alerts.lowAttendance'),
      message: t('alerts.lowAttendanceMessage'),
      severity: 'warning' as const,
      action: t('alerts.viewDetails'),
    },
  ] : []

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
            {greeting}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {user ? `${user.firstName} ${user.lastName}` : t('schoolAdmin')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="glass-card border-primary/20 hover:bg-primary/10">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Button>
        </div>
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 relative overflow-hidden group ring-1 ring-slate-900/5 dark:ring-white/10 shadow-xl hover:shadow-2xl hover:ring-primary/20 transition-all duration-300"
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${stat.color === 'bg-blue-500' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : stat.color === 'bg-purple-500' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : stat.color === 'bg-green-500' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`} />
            
            <div className={`absolute -top-4 -right-4 w-24 h-24 opacity-10 group-hover:opacity-20 transition-all duration-300 rounded-full blur-xl ${stat.color}`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color === 'bg-blue-500' ? 'from-blue-500 to-cyan-500 shadow-blue-500/30' : stat.color === 'bg-purple-500' ? 'from-purple-500 to-pink-500 shadow-purple-500/30' : stat.color === 'bg-green-500' ? 'from-green-500 to-emerald-500 shadow-green-500/30' : 'from-orange-500 to-amber-500 shadow-orange-500/30'} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                {stat.loading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight">{stat.value}</span>
                    {stat.change && (
                      <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                        {stat.change}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              {t('quickActions')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'manageStudents', icon: Users, href: '/school/students', color: 'text-blue-500', bgColor: 'bg-blue-500', shadowColor: 'shadow-blue-500/20 group-hover:shadow-blue-500/40' },
                { label: 'manageTeachers', icon: GraduationCap, href: '/school/teachers', color: 'text-purple-500', bgColor: 'bg-purple-500', shadowColor: 'shadow-purple-500/20 group-hover:shadow-purple-500/40' },
                { label: 'manageClasses', icon: BookOpen, href: '/school/classes', color: 'text-green-500', bgColor: 'bg-green-500', shadowColor: 'shadow-green-500/20 group-hover:shadow-green-500/40' },
                { label: 'reports', icon: BarChart3, href: '/school/reports', color: 'text-orange-500', bgColor: 'bg-orange-500', shadowColor: 'shadow-orange-500/20 group-hover:shadow-orange-500/40' },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <Button variant="ghost" className="w-full h-auto py-6 flex flex-col items-center gap-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-primary/30 shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl group">
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 shadow-lg ${action.shadowColor} group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{t(action.label)}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Class Performance Table Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20">
                  <TrendingUp className="h-4 w-4" />
                </div>
                {t('classPerformance')}
              </h2>
              <Link href="/school/classes">
                <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  {t('viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="p-0">
              {classesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : classPerformance && classPerformance.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {classPerformance.map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform duration-200 ${i % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-blue-500/25' :
                          i % 3 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/25' :
                            'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/25'
                          }`}>
                          {item.name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.students} {t('students')}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-right">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('average')}</p>
                          <p className={`font-bold ${getStatusColorClass(item.status)}`}>
                            {item.average || '—'}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t('attendance')}</p>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${item.attendance || 0}%` }} />
                            </div>
                            <span className="text-sm font-semibold">{item.attendance || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  {t('noClasses')}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Alerts Widget */}
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-6 border-l-4 border-l-red-500 bg-red-500/5"
            >
              <h3 className="font-bold flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                {t('alertsTitle') || 'Atenção Necessária'}
              </h3>
              <div className="space-y-3">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-3 rounded-lg bg-background/50 border border-red-200 dark:border-red-900/50">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    <Button size="sm" variant="ghost" className="p-0 h-auto text-red-500 mt-2 hover:bg-transparent hover:underline">
                      {alert.action}
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stats Summary Widget */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('overview')}
            </h3>
            <div className="space-y-6">
              {[
                { label: t('quickStats.schoolAverage'), value: dashboardStats?.averageGPA?.toFixed(1) || '—', max: 20, color: 'bg-green-500' },
                { label: t('stats.attendanceRate'), value: dashboardStats?.averageAttendance || 0, max: 100, suffix: '%', color: 'bg-blue-500' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{item.value}{item.suffix}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(item.value) / item.max) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full ${item.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
