'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Award,
  BookOpen,
  DollarSign,
  MessageSquare,
  Bot,
  ChevronRight,
  Bell,
  Activity,
  Loader2,
  Zap,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useUser } from '@/lib/stores'
import { useParentChildren, useChildGrades, useChildAttendance, useChildPayments, getChildStatus, useParentId, useCurrentEntity } from '@/lib/hooks'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'

export default function ParentDashboard() {
  const t = useTranslations('parent')
  const user = useUser()

  // Resolve the parent entity ID from user ID
  useCurrentEntity()

  // Get parent ID
  const parentId = useParentId() || user?.id || ''

  // Fetch children from API
  const { data: children, isLoading: childrenLoading } = useParentChildren(parentId)

  // Select first child by default
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  const selectedChild = useMemo(() => {
    if (!children || children.length === 0) return null
    if (selectedChildId && children.find((c: any) => c.id === selectedChildId)) {
      return children.find((c: any) => c.id === selectedChildId)
    }
    // Default to first child
    const first = children[0]
    if (first && !selectedChildId) setSelectedChildId(first.id)
    return first
  }, [children, selectedChildId])

  // Fetch grades and attendance for selected child
  const { data: childGrades, isLoading: gradesLoading } = useChildGrades(selectedChild?.studentId || '')
  const { data: childAttendance, isLoading: attendanceLoading } = useChildAttendance(selectedChild?.studentId || '')
  const { data: childPayments, isLoading: paymentsLoading } = useChildPayments(selectedChild?.studentId || '')

  // --- Data Transformation for Charts ---

  // Grades Chart Data
  const gradesChartData = useMemo(() => {
    if (!childGrades) return []
    // Map grades to a simpler format, maybe sort by date?
    // For now, let's just show by subject
    return childGrades.map((g: any) => ({
      subject: g.subjectName?.substring(0, 3).toUpperCase() || g.subject?.name?.substring(0, 3).toUpperCase() || 'SUB',
      fullName: g.subjectName || g.subject?.name,
      score: (g.score / g.maxScore) * 20, // Normalize to 20
      fullMark: 20
    }))
  }, [childGrades])

  // Attendance Chart Data
  const attendanceChartData = useMemo(() => {
    if (!childAttendance) return [
      { name: t('dashboard.present'), value: 1, color: '#22c55e' },
      { name: t('dashboard.absent'), value: 0, color: '#ef4444' },
      { name: t('dashboard.justified'), value: 0, color: '#f59e0b' },
    ]

    const present = childAttendance.summary?.presentDays || 0
    const absent = childAttendance.summary?.absentDays || 0
    const late = childAttendance.summary?.lateDays || 0

    // If no data, show a placeholder
    if (present === 0 && absent === 0 && late === 0) {
      return [
        { name: t('dashboard.noData'), value: 1, color: '#e2e8f0' }
      ]
    }

    return [
      { name: t('dashboard.present'), value: present, color: '#22c55e' }, // Green
      { name: t('dashboard.absent'), value: absent, color: '#ef4444' }, // Red
      { name: t('dashboard.late'), value: late, color: '#f59e0b' }, // Amber
    ]
  }, [childAttendance, t])

  // Recent Activity Feed
  const recentActivities = useMemo(() => {
    if (!selectedChild) return []
    const list: any[] = []

    // Grades
    if (childGrades) {
      childGrades.forEach((grade: any) => {
        list.push({
          id: `grade-${grade.id}`,
          type: 'grade',
          title: t('dashboard.newGrade', { subject: grade.subjectName || t('subject'), grade: `${grade.score}/${grade.maxScore}` }),
          description: `${grade.score}/${grade.maxScore}`,
          date: grade.publishedAt || new Date().toISOString(),
          timestamp: new Date(grade.publishedAt || Date.now()).getTime(),
          icon: Award,
          color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
        })
      })
    }

    // Attendance
    if (childAttendance?.records) {
      childAttendance.records.forEach((att: any) => {
        if (att.status === 'ABSENT' || att.status === 'LATE') {
          list.push({
            id: `att-${att.id}`,
            type: 'attendance',
            title: att.status === 'ABSENT' ? t('dashboard.absenceRecorded') : t('dashboard.latenessRecorded'),
            description: `${att.subject || 'Aula'} - ${new Date(att.date).toLocaleDateString()}`,
            date: att.date || new Date().toISOString(),
            timestamp: new Date(att.date || Date.now()).getTime(),
            icon: AlertCircle,
            color: att.status === 'ABSENT' ? 'text-red-500 bg-red-100 dark:bg-red-900/30' : 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
          })
        }
      })
    }

    // Payments
    if (childPayments) {
      childPayments.forEach((pay: any) => {
        list.push({
          id: `pay-${pay.id}`,
          type: 'payment',
          title: t('dashboard.paymentRecorded'),
          description: `${pay.amount} ${pay.currency}`,
          date: pay.paidAt || new Date().toISOString(),
          timestamp: new Date(pay.paidAt || Date.now()).getTime(),
          icon: DollarSign,
          color: 'text-green-500 bg-green-100 dark:bg-green-900/30'
        })
      })
    }

    return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
  }, [childGrades, childAttendance, childPayments, selectedChild])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent': return t('statusExcellent')
      case 'good': return t('statusGood')
      case 'warning': return t('statusWarning')
      case 'alert': return t('statusAlert')
      default: return status
    }
  }

  const averageGrade = useMemo(() => {
    if (!childGrades || childGrades.length === 0) return 0
    const total = childGrades.reduce((sum: number, g: any) => sum + (g.score / g.maxScore * 20), 0)
    return total / childGrades.length
  }, [childGrades])

  const attendanceRate = useMemo(() => {
    if (!childAttendance) return 0
    const presentDays = childAttendance.summary?.presentDays || 0
    const totalDays = childAttendance.summary?.totalDays || 1
    return Math.round((presentDays / totalDays) * 100)
  }, [childAttendance])

  // --- Handlers ---
  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId)
  }

  // --- Render Custom Tooltip for Charts ---
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-xl border border-border shadow-xl">
          <p className="font-bold text-sm text-foreground">{label || payload[0].payload.fullName}</p>
          <p className="text-sm text-primary">
            {payload[0].name === 'score' ? t('dashboard.gradeTooltip', { value: payload[0].value.toFixed(1) }) : t('dashboard.valueTooltip', { value: payload[0].value })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with AI Assistant CTA */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">
            {t('welcomeBack')} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">{t('childrenOverview')}</p>
        </div>

        <Link href="/parent/chatbot">
          <Button className="h-12 px-6 rounded-full flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 group border-0">
            <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">{t('chatbot.title')}</span>
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
          </Button>
        </Link>
      </motion.div>

      {/* Loading State */}
      {childrenLoading ? (
        <div className="flex items-center justify-center py-24 glass-panel rounded-3xl">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : !children || children.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-24 glass-panel rounded-3xl border-dashed"
        >
          <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">{t('noChildren')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{t('noChildrenDescription')}</p>
        </motion.div>
      ) : (
        <>
          {/* Child Selector Tabs (Mobile Friendly) */}
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar snap-x">
            {children.map((child: any) => {
              const isSelected = selectedChild?.id === child.id
              return (
                <motion.div
                  key={child.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChildSelect(child.id)}
                  className={`min-w-[280px] md:min-w-[320px] snap-center cursor-pointer p-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${isSelected
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-xl shadow-blue-500/20'
                    : 'glass-card hover:bg-white/60 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm relative ${isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      {child.profileImageUrl ? (
                        <Image src={child.profileImageUrl} alt={t('profile')} fill className="object-cover rounded-xl" />
                      ) : (
                        <span>{child.firstName?.[0]}{child.lastName?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{child.firstName} {child.lastName}</h3>
                      <p className={`text-xs ${isSelected ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {child.class?.name || t('noClass')} • {child.school?.name}
                      </p>
                    </div>
                    {isSelected && <CheckCircle className="ml-auto h-6 w-6 text-white opacity-80" />}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

            {/* Main Stats (Top Row) */}
            <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('currentAverage'), value: averageGrade.toFixed(1), icon: Award, color: 'text-blue-500', trend: '+0.5', trendUp: true },
                { label: t('attendanceRate'), value: `${attendanceRate}%`, icon: CheckCircle, color: 'text-green-500', trend: t('dashboard.stable'), trendUp: true },
                { label: t('dashboard.tuition'), value: t('dashboard.upToDate'), icon: DollarSign, color: 'text-emerald-500', trend: t('dashboard.paid'), trendUp: true },
                { label: t('dashboard.alerts'), value: '0', icon: Bell, color: 'text-orange-500', trend: t('dashboard.noAlerts'), trendUp: true },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <div className="flex items-center gap-1 mt-2 text-xs font-medium">
                      {stat.trendUp ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                      <span className={stat.trendUp ? 'text-green-600' : 'text-red-500'}>{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl bg-background/50 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Charts Row - Grade Analysis */}
            <div className="lg:col-span-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      {t('dashboard.academicPerformance')}
                    </h3>
                    <p className="text-xs text-muted-foreground">{t('dashboard.gradesBySubject')}</p>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gradesChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                      <XAxis
                        dataKey="subject"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        domain={[0, 20]}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorScore)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Charts Row - Attendance */}
            <div className="lg:col-span-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-6 rounded-3xl h-[400px] flex flex-col"
              >
                <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  {t('dashboard.attendance')}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">{t('dashboard.attendanceDistribution')}</p>

                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={attendanceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Centered Percentage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold">{attendanceRate}%</span>
                    <span className="text-xs text-muted-foreground">{t('dashboard.attendance')}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Row: Recent Activities & Quick Actions */}
            <div className="lg:col-span-8">
              <div className="glass-panel rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    {t('dashboard.recentActivity')}
                  </h3>
                  <Link href="/parent/notifications">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">{t('viewAll')}</Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {recentActivities.map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                      <div className={`p-3 rounded-xl ${activity.color} group-hover:scale-110 transition-transform`}>
                        <activity.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                     <div className="text-center py-8 text-muted-foreground">{t('noRecentActivity')}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
                 <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="h-6 w-6 text-yellow-300" />
                    <h3 className="font-bold text-lg">{t('aiAssistant')}</h3>
                 </div>
                 <p className="text-indigo-100 text-sm mb-6">&ldquo;Como estão as notas de Matemática do Edmilson?&rdquo;</p>
                 <Link href="/parent/chatbot">
                    <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-0">
                       {t('dashboard.askNow')}
                    </Button>
                 </Link>
              </div>

              <div className="glass-panel p-6 rounded-3xl">
                <h3 className="font-bold mb-4">{t('dashboard.quickLinks')}</h3>
                <div className="grid grid-cols-2 gap-3">
                   <Link href="/parent/messages">
                     <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 transition-colors text-center cursor-pointer">
                        <MessageSquare className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-orange-700 dark:text-orange-400">{t('dashboard.messages')}</span>
                     </div>
                   </Link>
                   <Link href="/parent/payments">
                     <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 transition-colors text-center cursor-pointer">
                        <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                        <span className="text-xs font-bold text-green-700 dark:text-green-400">{t('dashboard.payments')}</span>
                     </div>
                   </Link>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
