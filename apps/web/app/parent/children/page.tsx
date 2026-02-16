'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Users,
  Award,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Edit,
  Plus,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useCurrentEntity, useParentId } from '@/lib/hooks/use-current-entity'
import { useParentChildren, useChildGrades, useChildAttendance, getChildStatus } from '@/lib/hooks/use-parent'
import { useUser } from '@/lib/stores'

export default function ChildrenPage() {
  const t = useTranslations('parent')
  const user = useUser()
  
  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''
  
  const { data: childrenList, isLoading: childrenLoading } = useParentChildren(parentId)
  
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  // Select first child by default when data loads
  const activeChildId = useMemo(() => {
    if (selectedChildId) return selectedChildId
    if (childrenList && childrenList.length > 0) return childrenList[0].id
    return ''
  }, [childrenList, selectedChildId])

  // Fetch details for selected child
  const { data: grades } = useChildGrades(activeChildId)
  const { data: attendance } = useChildAttendance(activeChildId)

  const selectedChild = useMemo(() => {
    if (!childrenList) return null
    return childrenList.find(c => c.id === activeChildId) || null
  }, [childrenList, activeChildId])

  // Process grades for display
  const subjects = useMemo(() => {
    if (!grades) return []
    
    // Group grades by subject
    const subjectMap = new Map()
    
    grades.forEach(grade => {
      const subjectName = grade.subjectName || 'Unknown Subject'
      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, {
          name: subjectName,
          grades: [],
          teacher: 'Prof. Unknown', // Placeholder as grade doesn't have teacher info usually
          attendance: 100 // Placeholder
        })
      }
      subjectMap.get(subjectName).grades.push(grade)
    })

    return Array.from(subjectMap.values()).map(subject => {
      const total = subject.grades.reduce((sum: number, g: any) => sum + (g.score / g.maxScore * 20), 0)
      const avg = subject.grades.length > 0 ? total / subject.grades.length : 0
      
      return {
        name: subject.name,
        grade: Math.round(avg * 10) / 10,
        trend: 'stable', // Placeholder
        teacher: subject.teacher,
        attendance: subject.attendance
      }
    })
  }, [grades])

  const recentGrades = useMemo(() => {
    if (!grades) return []
    return [...grades]
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
      .slice(0, 5)
      .map(g => ({
        subject: g.subjectName,
        type: g.gradeType,
        grade: Math.round((g.score / g.maxScore) * 20),
        date: g.publishedAt ? new Date(g.publishedAt).toLocaleDateString() : '-',
        trend: '0'
      }))
  }, [grades])

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!childrenList || childrenList.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('noChildrenFound')}</h3>
        <p className="text-sm text-muted-foreground">{t('childrenPage.noChildrenFound')}</p>
      </div>
    )
  }

  if (!selectedChild) return null

  const status = getChildStatus(selectedChild.average || 0, selectedChild.attendance || 0)
  const statusColor = status === 'excellent' ? 'green' : status === 'good' ? 'blue' : 'orange'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('childrenNav')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('trackPerformance')}</p>
        </div>
        <Button className="bg-accent-500 hover:bg-accent-600">
          <Plus className="h-4 w-4 mr-2" />
          {t('addStudent')}
        </Button>
      </div>

      {/* Child Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {childrenList.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChildId(c.id)}
            className={`bg-card rounded-xl p-6 shadow-sm transition-all ${
              activeChildId === c.id ? 'ring-2 ring-accent-500' : 'hover:shadow-md'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {c.firstName.charAt(0)}{c.lastName.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-bold text-gray-900">{c.firstName} {c.lastName}</h3>
                <p className="text-sm text-gray-600">{c.class?.name || t('childrenPage.noClass')} • {c.school?.name || t('childrenPage.noSchool')}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500">{t('average')}: <strong className="text-accent-600">{c.average || 0}/20</strong></span>
                  <span className="text-xs text-gray-500">{t('attendance')}: <strong className="text-accent-600">{c.attendance || 0}%</strong></span>
                  {c.alerts && c.alerts > 0 ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{c.alerts} {t('childrenPage.alerts')}</span>
                  ) : null}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      {/* Child Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{t('studentInfo')}</h3>
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center mb-6">
              <div className="h-24 w-24 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-3">
                {selectedChild.firstName.charAt(0)}{selectedChild.lastName.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</h2>
              <p className="text-sm text-gray-600">{selectedChild.class?.name}</p>
              <span
                className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  statusColor === 'green'
                    ? 'bg-green-100 text-green-700'
                    : statusColor === 'blue'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {status === 'excellent' ? t('childrenPage.excellent') : status === 'good' ? t('childrenPage.good') : t('childrenPage.attention')}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-gray-600">{t('studentNumber')}:</span>
                <span className="font-medium text-gray-900">{selectedChild.studentNumber}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-gray-600">{t('birthDate')}:</span>
                <span className="font-medium text-gray-900">-</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-gray-600">{t('age')}:</span>
                <span className="font-medium text-gray-900">- {t('years')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-gray-600">{t('childrenPage.school')}</span>
                <span className="font-medium text-foreground line-clamp-1">{selectedChild.school?.name}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('quickStats')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('average')}</span>
                  <span className="text-lg font-bold text-accent-600">{selectedChild.average || 0}/20</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500"
                    style={{ width: `${((selectedChild.average || 0) / 20) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('attendanceRate')}</span>
                  <span className="text-lg font-bold text-green-600">{selectedChild.attendance || 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${selectedChild.attendance || 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('activeAlerts')}</span>
                  {selectedChild.alerts === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {selectedChild.alerts}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Academic Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance by Subject */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('gradesBySubject')}</h3>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('childrenPage.noGradesRecorded')}</p>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{subject.grade}/20</span>
                          {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {subject.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            subject.grade >= 18
                              ? 'bg-green-500'
                              : subject.grade >= 14
                              ? 'bg-blue-500'
                              : subject.grade >= 10
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${(subject.grade / 20) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{subject.teacher}</span>
                        <span className="text-xs text-gray-500">{t('attendance')}: {subject.attendance}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Grades */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('recentGrades')}</h3>
            {recentGrades.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('childrenPage.noRecentGrades')}</p>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Award className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{grade.subject}</p>
                        <p className="text-xs text-gray-600">{grade.type} • {grade.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-accent-600">{grade.grade}/20</p>
                      <p className={`text-xs ${grade.trend.startsWith('+') ? 'text-green-600' : grade.trend === '0' ? 'text-muted-foreground' : 'text-red-600'}`}>
                        {grade.trend !== '0' && grade.trend}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher Feedback - Placeholder */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('teacherFeedback')}</h3>
            <div className="p-4 bg-accent-50 rounded-lg text-center">
              <p className="text-sm text-gray-700">{t('childrenPage.feedbackComingSoon')}</p>
            </div>
          </div>

          {/* Upcoming Events - Placeholder */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('upcomingEvents')}</h3>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-gray-700">{t('childrenPage.eventsComingSoon')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
