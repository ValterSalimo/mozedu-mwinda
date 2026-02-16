'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@mozedu/ui'
import {
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Bell,
  BarChart3,
  Loader2,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '@/lib/stores'
import { useStudentGrades, useStudentAttendance, calculateGPA, useCurrentEntity, useStudentId, useScheduledSessionsByClass } from '@/lib/hooks'

export default function StudentDashboard() {
  const t = useTranslations('student')
  const user = useUser()

  // Resolve the student entity ID and data
  const { entityId, isLoading: entityLoading, studentData: entityStudentData } = useCurrentEntity()
  const studentId = useStudentId()
  const classId = entityStudentData?.classId

  const [greeting] = useState(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('greeting.morning')
    if (hour < 18) return t('greeting.afternoon')
    return t('greeting.evening')
  })

  // Only fetch data when we have a valid studentId
  const validStudentId = studentId && studentId.length > 0 ? studentId : undefined

  // Data Hooks
  const { data: gradesData, isLoading: gradesLoading } = useStudentGrades(validStudentId || '', { enabled: !!validStudentId })
  const { data: attendanceData, isLoading: attendanceLoading } = useStudentAttendance(validStudentId || '', { enabled: !!validStudentId })

  // Fetch Today's Schedule
  const today = new Date().toISOString()
  const { data: scheduleData, isLoading: scheduleLoading } = useScheduledSessionsByClass(
    classId || '',
    today,
    { enabled: !!classId }
  )

  // Calculate stats from real data
  const gpa = gradesData ? calculateGPA(gradesData) : 0
  const attendanceRate = attendanceData?.summary?.attendanceRate ?? 0
  const recentGrades = gradesData?.slice(0, 4) || []

  // Student info from API
  const studentData = {
    name: user ? `${user.firstName} ${user.lastName}` : t('welcome'),
    grade: '10ª Classe', // Placeholder until class name is available in context
    studentId: user?.id?.slice(0, 8) || '...',
    avatar: user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}` : 'ME',
  }

  const stats = [
    {
      label: t('stats.overallAverage'),
      value: gpa.toFixed(1) || '—',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-green-500',
      trend: '',
      loading: gradesLoading,
    },
    {
      label: t('stats.presence'),
      value: `${attendanceRate}%`,
      icon: <CheckCircle className="h-5 w-5" />,
      color: 'bg-blue-500',
      trend: '',
      loading: attendanceLoading,
    },
    {
      label: t('stats.subjects'),
      value: gradesData ? new Set(gradesData.map(g => g.subjectId || g.subjectName)).size.toString() : '—',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'bg-purple-500',
      trend: '',
      loading: gradesLoading,
    },
    {
      label: t('stats.attendances'),
      value: attendanceData?.summary?.presentDays?.toString() || '—',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-orange-500',
      trend: '',
      loading: attendanceLoading,
    },
  ]

  // Transform Schedule Data
  const upcomingClasses = (scheduleData || []).map((session: any) => ({
    subject: session.session?.subject?.name || 'Unknown Subject',
    time: `${session.session?.startTime?.slice(0, 5)} - ${session.session?.endTime?.slice(0, 5)}`,
    teacher: session.session?.teacher?.user
      ? `${session.session.teacher.user.firstName} ${session.session.teacher.user.lastName}`
      : 'Unknown Teacher',
    room: session.session?.room?.code || 'TBD'
  }))

  const pendingAssignments: Array<{ subject: string; title: string; dueDate: string; priority: string }> = []
  const announcements: Array<{ title: string; message: string; date: string; type: string }> = []

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
            {greeting}, {studentData.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {studentData.grade} • ID: {studentData.studentId}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10 bg-background/50 hover:bg-background border border-border/50">
            <Bell className="h-5 w-5 text-foreground/70" />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background"></span>
          </Button>
          <div className="flex items-center gap-3 glass-card px-3 py-1.5 rounded-full border-primary/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {studentData.avatar}
            </div>
            <span className="text-sm font-medium hidden sm:block">{t('profile')}</span>
          </div>
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
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 relative overflow-hidden group ring-1 ring-slate-900/5 dark:ring-white/10 shadow-xl hover:shadow-2xl hover:ring-primary/20 transition-all duration-300"
          >
            {/* Gradient overlay on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${stat.color === 'bg-green-500' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : stat.color === 'bg-blue-500' ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : stat.color === 'bg-purple-500' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-orange-500 to-amber-500'}`} />
            
            <div className={`absolute -top-4 -right-4 w-24 h-24 opacity-10 group-hover:opacity-20 transition-all duration-300 rounded-full blur-xl ${stat.color}`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color === 'bg-green-500' ? 'from-green-500 to-emerald-500 shadow-green-500/30' : stat.color === 'bg-blue-500' ? 'from-blue-500 to-cyan-500 shadow-blue-500/30' : stat.color === 'bg-purple-500' ? 'from-purple-500 to-pink-500 shadow-purple-500/30' : 'from-orange-500 to-amber-500 shadow-orange-500/30'} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                {stat.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <span className="text-4xl font-bold tracking-tight">{stat.value}</span>
                    {stat.trend && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.trend.startsWith('+') ? 'text-green-500 bg-green-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
                        {stat.trend}
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
              {t('quickAccess')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'grades.title', icon: BarChart3, href: '/student/grades', color: 'text-green-500', shadowColor: 'shadow-green-500/20 group-hover:shadow-green-500/40' },
                { label: 'attendance.title', icon: Calendar, href: '/student/attendance', color: 'text-blue-500', shadowColor: 'shadow-blue-500/20 group-hover:shadow-blue-500/40' },
                { label: 'library.title', icon: BookOpen, href: '/student/library', color: 'text-purple-500', shadowColor: 'shadow-purple-500/20 group-hover:shadow-purple-500/40' },
                { label: 'messages.title', icon: Users, href: '/student/messages', color: 'text-orange-500', shadowColor: 'shadow-orange-500/20 group-hover:shadow-orange-500/40' },
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

          {/* Recent Grades */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 dark:bg-slate-900/90 rounded-2xl overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/10 shadow-xl"
          >
            <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-800/80 dark:to-slate-900/80">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20">
                  <BarChart3 className="h-4 w-4" />
                </div>
                {t('recentGrades')}
              </h2>
              <Link href="/student/grades">
                <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  {t('viewAll')} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {gradesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentGrades.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group cursor-pointer">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{grade.subject?.name || grade.subjectName || 'Subject'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-muted-foreground uppercase font-bold">{grade.gradeType}</span>
                        <p className="text-xs text-muted-foreground">{grade.term} • {grade.academicYear}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className={`text-2xl font-bold ${grade.percentage >= 90 ? 'text-green-500' :
                          grade.percentage >= 70 ? 'text-blue-500' :
                            grade.percentage >= 50 ? 'text-orange-500' :
                              'text-red-500'
                          }`}>
                          {grade.score}
                        </div>
                        <div className="text-xs text-muted-foreground opacity-70">/{grade.maxScore}</div>
                      </div>
                      <div className="w-2 h-12 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden hidden sm:block">
                        <div className={`w-full rounded-full transition-all duration-500 ${grade.percentage >= 90 ? 'bg-gradient-to-t from-green-500 to-emerald-400' :
                          grade.percentage >= 70 ? 'bg-gradient-to-t from-blue-500 to-cyan-400' :
                            grade.percentage >= 50 ? 'bg-gradient-to-t from-orange-500 to-amber-400' :
                              'bg-gradient-to-t from-red-500 to-rose-400'
                          }`} style={{ height: `${grade.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('noGrades')}</p>
              </div>
            )}
          </motion.div>

          {/* Pending Assignments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-panel rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                {t('pendingAssignments')}
              </h2>
              <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 text-xs font-bold">
                {pendingAssignments.length} {t('assignments.title')}
              </span>
            </div>
            {pendingAssignments.length > 0 ? (
              <div className="space-y-4">
                {pendingAssignments.map((assignment, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-background/40 border border-border/50 hover:bg-background/60 transition-colors">
                    <div className={`p-3 rounded-xl ${assignment.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
                      assignment.priority === 'medium' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                      }`}>
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-foreground">{assignment.title}</p>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">{assignment.subject}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground font-medium">{t('dueDate')}: {assignment.dueDate}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" className="self-center">{t('viewAll')}</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>{t('noClasses')}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-8">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-xl"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-cyan-500 text-white shadow-lg shadow-primary/20">
                <Calendar className="h-4 w-4" />
              </div>
              {t('todaySchedule')}
            </h2>
            {upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((cls, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer">
                    <div className="w-1 h-full min-h-[60px] self-stretch bg-gradient-to-b from-primary to-cyan-500 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{cls.subject}</p>
                      <p className="text-sm text-muted-foreground truncate">{cls.teacher}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                        <span className="text-xs font-mono text-muted-foreground bg-white dark:bg-slate-800 px-2 py-0.5 rounded">{cls.time}</span>
                        <span className="text-xs font-bold bg-gradient-to-r from-primary to-cyan-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">{cls.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                {t('noClasses')}
              </div>
            )}
          </motion.div>

          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t('announcements')}
            </h2>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((announcement, index) => (
                  <div key={index} className={`p-4 rounded-xl relative overflow-hidden ${announcement.type === 'important' ? 'bg-red-500/10 border border-red-500/20' : 'bg-blue-500/10 border border-blue-500/20'
                    }`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${announcement.type === 'important' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <p className="font-bold text-foreground text-sm pl-2">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 pl-2 leading-relaxed">{announcement.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 pl-2 opacity-70 uppercase tracking-widest">{announcement.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('notifications')}</p>
              </div>
            )}
          </motion.div>

          {/* Performance Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              {t('performance')}
            </h2>
            <div className="h-48 flex items-center justify-center bg-gradient-to-b from-white/5 to-white/0 rounded-xl border border-white/10">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">{t('performanceChart')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('comingSoon')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
