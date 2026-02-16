'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  HelpCircle,
  Loader2,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '@/lib/stores'
import { useTeacherClasses, useTeacherStats, useCurrentEntity, useTeacherId, useScheduledSessionsByTeacher } from '@/lib/hooks'
import {
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/glass-table'

export default function TeacherDashboard() {
  const t = useTranslations('teacher')
  const user = useUser()

  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning')
    if (hour < 18) return t('greeting.afternoon')
    return t('greeting.evening')
  })

  // Resolve the teacher entity ID from user ID
  useCurrentEntity()
  const teacherId = useTeacherId() || ''

  // Fetch real data
  const { data: teacherStats, isLoading: statsLoading } = useTeacherStats(teacherId)
  const { data: teacherClasses, isLoading: classesLoading } = useTeacherClasses(teacherId)
  const { data: todayScheduleData, isLoading: scheduleLoading } = useScheduledSessionsByTeacher(teacherId, new Date().toISOString().split('T')[0])

  const todaySchedule = todayScheduleData || []

  const teacherInfo = {
    name: user ? `${user.firstName} ${user.lastName}` : t('professor'),
    subjects: [], // Would come from teacher profile
    classes: teacherStats?.totalClasses || 0,
  }

  const stats = [
    {
      label: t('stats.activeStudents'),
      value: teacherStats?.totalStudents?.toString() || '—',
      change: '',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      loading: statsLoading,
    },
    {
      label: t('stats.classes'),
      value: teacherStats?.totalClasses?.toString() || '—',
      change: '',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-purple-500',
      loading: statsLoading,
    },
    {
      label: t('stats.pendingGrades'),
      value: teacherStats?.pendingGrades?.toString() || '—',
      change: '',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-orange-500',
      loading: statsLoading,
    },
    {
      label: t('stats.classAverage'),
      value: teacherStats?.averageClassGrade?.toFixed(1) || '—',
      change: '',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-green-500',
      loading: statsLoading,
    },
  ]

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
            {greeting}, {teacherInfo.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {teacherInfo.classes} {t('classes')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="glass-card border-primary/20 hover:bg-primary/10">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity rounded-bl-3xl ${stat.color.replace('bg-', 'bg-')}`}>
              {stat.icon}
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color === 'bg-blue-500' ? 'from-blue-500 to-blue-600' : stat.color === 'bg-purple-500' ? 'from-purple-500 to-purple-600' : stat.color === 'bg-orange-500' ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} text-white shadow-lg`}>
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
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.change.startsWith('+') ? 'text-green-500 bg-green-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
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
        {/* Main Content - 2 columns */}
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
                { label: 'submitGrades', icon: BookOpen, href: '/teacher/grades', color: 'text-blue-500' },
                { label: 'attendance', icon: ClipboardCheck, href: '/teacher/attendance', color: 'text-purple-500' },
                { label: 'assignments.title', icon: FileText, href: '/teacher/assignments', color: 'text-orange-500' },
                { label: 'quizzes.title', icon: HelpCircle, href: '/teacher/quizzes', color: 'text-green-500' },
              ].map((action, i) => (
                <Link key={i} href={action.href}>
                  <Button variant="ghost" className="w-full h-auto py-6 flex flex-col items-center gap-3 hover:bg-white/50 dark:hover:bg-white/5 border border-dashed border-border hover:border-solid hover:border-primary/50 transition-all rounded-xl group">
                    <div className={`p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform ${action.color}`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium">{t(action.label)}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Today's Classes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                {t('todayClasses')}
              </h2>
              <Link href="/teacher/schedule">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  {t('viewSchedule')} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : todaySchedule && todaySchedule.length > 0 ? (
              <div className="space-y-4">
                {todaySchedule.map((item: any, index: number) => {
                  const cls = item.session
                  const isCompleted = item.isHeld || item.isMissed
                  // Map status for UI styling
                  const status = isCompleted ? 'completed' : cls.isActive ? 'active' : 'scheduled'

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border-l-[6px] shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center ${status === 'completed'
                        ? 'bg-green-50/50 border-green-500 dark:bg-green-900/10'
                        : 'bg-blue-50/50 border-blue-500 dark:bg-blue-900/10'
                        }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {cls.room?.code || 'Room'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg text-foreground">{cls.class?.name}</p>
                          <span className="text-sm text-muted-foreground font-medium">• {cls.subject?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {cls.startTime} - {cls.endTime}
                        </div>
                      </div>
                      {status !== 'completed' && (
                        <Link href="/teacher/attendance">
                          <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/20">{t('markAttendance')}</Button>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <p>{t('noClassesToday')}</p>
              </div>
            )}
          </motion.div>

          {/* My Classes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-white/5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                {t('myClasses')}
              </h2>
              <Link href="/teacher/classes">
                <Button variant="ghost" size="sm" className="hover:text-primary">
                  {t('viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {classesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : teacherClasses && teacherClasses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHeader>
                    <TableRow className="border-b border-white/10 bg-white/5">
                      <TableHead className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('class')}</TableHead>
                      <TableHead className="text-center py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('students')}</TableHead>
                      <TableHead className="text-center py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('subject')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClasses.map((cls) => (
                      <TableRow key={cls.id} className="hover:bg-white/5 transition-colors">
                        <TableCell className="py-4 px-6 text-sm font-semibold text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs shadow-sm">
                              {cls.name.substring(0, 1)}
                            </div>
                            {cls.name}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center text-sm">
                          <span className="bg-muted px-2 py-1 rounded-full text-xs font-medium">
                            {cls.students}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-center text-sm text-foreground/80">{cls.subject}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('noClasses')}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-8">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('upcomingEvents')}
            </h2>
            <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
              {t('noUpcomingEvents')}
            </div>
          </motion.div>

          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              {t('performance')}
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('classAverage')}</span>
                  {statsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-bold text-green-500">
                      {teacherStats?.averageClassGrade ? `${teacherStats.averageClassGrade.toFixed(1)}/20` : '—'}
                    </span>
                  )}
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((teacherStats?.averageClassGrade || 0) / 20) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{t('attendanceRate')}</span>
                  {statsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-sm font-bold text-blue-500">
                      {teacherStats?.averageAttendance ? `${teacherStats.averageAttendance}%` : '—'}
                    </span>
                  )}
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${teacherStats?.averageAttendance || 0}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
