'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Bell,
  Award,
  Users,
  AlertCircle,
  MessageSquare,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
  Filter,
  Loader2,
} from 'lucide-react'
import { useUser } from '@/lib/stores'
import { useParentId, useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { 
  useParentChildren, 
  useChildGrades, 
  useChildAttendance, 
  useChildPayments 
} from '@/lib/hooks/use-parent'

export default function NotificationsPage() {
  const t = useTranslations('parent.notifications')
  const user = useUser()
  
  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''

  const { data: childrenList = [], isLoading: isLoadingChildren } = useParentChildren(parentId)
  const [selectedChildId, setSelectedChildId] = useState<string>('all')
  const [filterType, setFilterType] = useState('all')

  // Only fetch if a specific child is selected
  const childIdToFetch = selectedChildId === 'all' ? '' : selectedChildId

  const { data: grades = [], isLoading: isLoadingGrades } = useChildGrades(childIdToFetch)
  const { data: attendanceData, isLoading: isLoadingAttendance } = useChildAttendance(childIdToFetch)
  const { data: payments = [], isLoading: isLoadingPayments } = useChildPayments(childIdToFetch)

  const attendanceRecords = attendanceData?.records || []

  // Merge and transform into notifications
  const notifications = useMemo(() => {
    if (selectedChildId === 'all') return []

    const list: any[] = []

    // Grades -> Notifications
    grades.forEach(grade => {
      list.push({
        id: `grade-${grade.id}`,
        type: 'grades',
        icon: Award,
        color: 'blue',
        title: t('newGrade', { subject: grade.subjectName || 'Disciplina', grade: `${grade.score}/${grade.maxScore}` }),
        description: `Recebeu ${grade.score}/${grade.maxScore} (${grade.gradeType})`,
        child: childrenList.find(c => c.id === selectedChildId)?.firstName || 'Educando',
        date: grade.publishedAt || new Date().toISOString(), // Fallback date
        read: true, // Assume read for now
        timestamp: new Date(grade.publishedAt || Date.now()).getTime()
      })
    })

    // Attendance -> Notifications (e.g. Absences)
    attendanceRecords.forEach(att => {
      if (att.status === 'ABSENT' || att.status === 'LATE') {
        list.push({
          id: `att-${att.id}`,
          type: 'attendance',
          icon: Users,
          color: att.status === 'ABSENT' ? 'red' : 'orange',
          title: att.status === 'ABSENT' ? t('absenceRecorded') : t('latenessRecorded'),
          description: `${att.subject || 'Aula'} - ${att.date}`,
          child: childrenList.find(c => c.id === selectedChildId)?.firstName || 'Educando',
          date: att.date || new Date().toISOString(),
          read: true,
          timestamp: new Date(att.date || Date.now()).getTime()
        })
      }
    })

    // Payments -> Notifications
    payments.forEach(pay => {
      list.push({
        id: `pay-${pay.id}`,
        type: 'payments',
        icon: CreditCard,
        color: 'green',
        title: t('paymentRecorded'),
        description: `${pay.amount} ${pay.currency} - ${pay.feeType || 'Taxa'}`,
        child: childrenList.find(c => c.id === selectedChildId)?.firstName || 'Educando',
        date: pay.paidAt || new Date().toISOString(),
        read: true,
        timestamp: new Date(pay.paidAt || Date.now()).getTime()
      })
    })

    // Sort by date desc
    return list.sort((a, b) => b.timestamp - a.timestamp)
  }, [grades, attendanceRecords, payments, selectedChildId, childrenList])

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true
    return n.type === filterType
  })

  const filters = [
    { id: 'all', name: t('all'), count: notifications.length },
    { id: 'grades', name: t('academic'), count: notifications.filter(n => n.type === 'grades').length },
    { id: 'attendance', name: t('attendance'), count: notifications.filter(n => n.type === 'attendance').length },
    { id: 'payments', name: t('financial'), count: notifications.filter(n => n.type === 'payments').length },
  ]

  if (isLoadingChildren) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            {t('settings')}
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('clearAll')}
          </Button>
        </div>
      </div>

      {/* Child Filter */}
      <div className="bg-card rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-700">{t('filterBy')}:</span>
          </div>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
          >
            <option value="all">{t('selectChild')}</option>
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 px-2">{t('categories')}</h3>
            <div className="space-y-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    filterType === f.id
                      ? 'bg-accent-50 text-accent-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{f.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    filterType === f.id ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Notifications List */}
        <div className="lg:col-span-3 space-y-4">
          {selectedChildId === 'all' ? (
             <div className="bg-card rounded-xl p-12 shadow-sm text-center">
                <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('selectChild')}</h3>
                <p className="text-gray-500">
                  {t('selectChildToView')}
                </p>
             </div>
          ) : (
            <>
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => {
                  const Icon = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className={`bg-card rounded-xl p-4 shadow-sm border-l-4 transition-all hover:shadow-md ${
                        notification.read ? 'border-gray-200' : 'border-accent-500 bg-accent-50/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full bg-${notification.color}-100`}>
                          <Icon className={`h-6 w-6 text-${notification.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-bold ${notification.read ? 'text-gray-900' : 'text-accent-700'}`}>
                                {notification.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {new Date(notification.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {notification.child}
                            </span>
                            {!notification.read && (
                              <span className="text-xs font-medium text-accent-600 flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-accent-500" />
                                {t('unread')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 bg-card rounded-xl shadow-sm">
                  <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">{t('noNotifications')}</h3>
                  <p className="text-gray-500 mt-1">{t('noNotificationsInCategory')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
