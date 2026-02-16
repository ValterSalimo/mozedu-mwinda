'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { Loader2, Calendar, Users, CheckCircle, XCircle, Clock, Save } from 'lucide-react'
import { useTeacherClasses, useTeacherId, useCurrentEntity, useScheduledSessionsByTeacher } from '@/lib/hooks'
import { gql } from '@/lib/api'

export default function AttendancePage() {
  const t = useTranslations('teacher')
  const tCommon = useTranslations('common')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  // Get teacher ID and classes
  useCurrentEntity()
  const teacherId = useTeacherId() || ''
  const { data: classes, isLoading: classesLoading } = useTeacherClasses(teacherId)

  // Get active sessions using GraphQL
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['activeSessions', teacherId],
    queryFn: () => gql.activeSessionsByTeacher(teacherId),
    enabled: !!teacherId,
  })

  // Get scheduled sessions for today (from timetable integration)
  const { data: scheduledData } = useScheduledSessionsByTeacher(teacherId, selectedDate, { enabled: !!teacherId && !!selectedDate })

  const activeSessions = sessionsData?.activeSessionsByTeacher || []
  const scheduledSessions = scheduledData || []

  const selectedClass = selectedClassId
    ? classes?.find(c => c.id === selectedClassId)
    : classes?.[0]

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{tCommon('attendance')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground"
            readOnly
          />
        </div>
      </div>

      {/* Class Selector */}
      {classes && classes.length > 0 && (
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('classManagement.selectClass')}
              </label>
              <select
                value={selectedClassId || classes[0]?.id || ''}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.scheduled')}</p>
              <p className="text-2xl font-bold text-foreground">{scheduledSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.held')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {scheduledSessions.filter((s: any) => s.is_active || isPastSession(s)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.missed')}</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {scheduledSessions.filter((s: any) => !s.is_active && isPastSession(s) && s.is_scheduled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('attendance.upcoming')}</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {scheduledSessions.filter((s: any) => !isPastSession(s)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Sessions or Placeholder */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">{t('attendance.studentList')}</h2>
            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {t('attendance.saveAttendance')}
            </Button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('attendance.noSession')}</h3>
            <p className="text-muted-foreground mb-4">{t('attendance.noSessionDescription')}</p>
            <Button>{t('attendance.startSession')}</Button>
          </div>
        )}
      </div>

      {/* Active Sessions from GraphQL */}
      {scheduledSessions && scheduledSessions.length > 0 && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">{t('attendance.todaySchedule')}</h3>
          <div className="space-y-3">
            {scheduledSessions.map((session: any) => {
              const isActive = session.is_active
              const isPast = isPastSession(session)
              const isMissed = !isActive && isPast && session.is_scheduled
              const isUpcoming = !isPast

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: isActive ? '#22c55e' : isMissed ? '#ef4444' : isUpcoming ? '#f59e0b' : '#6b7280'
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{session.subject?.name || 'Subject'}</p>
                      {session.is_scheduled && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Scheduled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{session.class?.name || 'Class'}</p>
                    {session.room && (
                      <p className="text-xs text-muted-foreground">Room: {session.room.code} - {session.room.name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </p>
                    </div>

                    <div>
                      {isActive ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {t('attendance.active')}
                        </span>
                      ) : isMissed ? (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {t('attendance.missed')}
                        </span>
                      ) : isUpcoming ? (
                        <Button size="sm" variant="outline">
                          {t('attendance.startSession')}
                        </Button>
                      ) : (
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {t('attendance.completed')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function isPastSession(session: any): boolean {
  const endTime = new Date(session.end_time)
  return endTime < new Date()
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
