'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Loader2, Clock, BookOpen, Users, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTeacherId, useCurrentEntity, useScheduledSessionsByTeacher } from '@/lib/hooks'
import { gql } from '@/lib/api'
import { Button } from '@repo/ui/button'

interface ScheduledSessionItem {
  session: {
    id: string
    date: string
    startTime: string
    endTime: string
    isActive: boolean
    isScheduled: boolean
    class: { name: string; gradeLevel: number }
    subject: { name: string }
    room?: { code: string; name: string }
  }
  isScheduled: boolean
  isHeld: boolean
  isMissed: boolean
}

interface ActiveSession {
  id: string
  startTime?: string
  endTime?: string
  subject?: { name: string }
  class?: { name: string }
  presentCount?: number
  absentCount?: number
}

interface TeacherClassItem {
  class?: {
    id: string
    name: string
    gradeLevel?: string
    students?: { pageInfo?: { totalCount: number } }
  }
  subject?: { id: string; name: string }
  isMain?: boolean
}

interface TeacherData {
  teacher?: {
    classes?: TeacherClassItem[]
  }
}

export default function SchedulePage() {
  const t = useTranslations('teacher')
  const tCommon = useTranslations('common')
  
  // Get teacher ID and data
  useCurrentEntity()
  const teacherId = useTeacherId() || ''
  
  // Date state for viewing schedule
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Format date for API (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  // Get scheduled sessions for the selected date
  const { data: scheduledSessions, isLoading: isLoadingSessions } = useScheduledSessionsByTeacher(
    teacherId, 
    formatDate(selectedDate)
  )
  
  // Get teacher data with classes from GraphQL
  const { data: teacherData, isLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => gql.teacher(teacherId),
    enabled: !!teacherId,
  })

  const teacher = teacherData?.teacher as TeacherData['teacher']
  const classes: TeacherClassItem[] = teacher?.classes || []

  // Get active sessions
  const { data: sessionsData } = useQuery({
    queryKey: ['activeSessions', teacherId],
    queryFn: () => gql.activeSessionsByTeacher(teacherId),
    enabled: !!teacherId,
  })

  const activeSessions = (sessionsData?.activeSessionsByTeacher || []) as ActiveSession[]
  
  // Helper functions for date navigation
  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() - 1)
      return newDate
    })
  }
  
  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(newDate.getDate() + 1)
      return newDate
    })
  }
  
  const goToToday = () => {
    setSelectedDate(new Date())
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i) // 8 AM to 5 PM

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-foreground">{tCommon('schedule')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('schedule.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col items-center min-w-[150px]">
            <span className="text-sm font-medium text-foreground">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {!isToday(selectedDate) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToToday}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Go to today
              </Button>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToNextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('schedule.totalClasses')}</p>
              <p className="text-2xl font-bold text-foreground">{classes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('schedule.totalStudents')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {classes.reduce((sum: number, c: TeacherClassItem) => sum + (c.class?.students?.pageInfo?.totalCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('schedule.subjects')}</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(classes.map((c: TeacherClassItem) => c.subject?.name)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Schedule - Scheduled Sessions from Timetable */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('schedule.todaysSchedule', { default: "Today's Schedule" })}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isToday(selectedDate) ? t('schedule.scheduleFromTimetable', { default: 'Based on your timetable' }) : `Schedule for ${selectedDate.toLocaleDateString()}`}
          </p>
        </div>

        {isLoadingSessions ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : !scheduledSessions || scheduledSessions.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('schedule.noScheduledSessions', { default: 'No scheduled sessions' })}</h3>
            <p className="text-muted-foreground">{t('schedule.noSessionsDescription', { default: 'You have no classes scheduled for this date' })}</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {scheduledSessions.map((item: ScheduledSessionItem) => (
              <div 
                key={item.session.id} 
                className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{item.session.subject?.name}</p>
                    {item.isHeld && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Completed
                      </span>
                    )}
                    {item.isMissed && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                        Missed
                      </span>
                    )}
                    {item.isScheduled && !item.isHeld && !item.isMissed && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.session.class?.name}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.session.startTime} - {item.session.endTime}</span>
                    </div>
                    {item.session.room && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.session.room.name} ({item.session.room.code})</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.session.startTime}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.session.endTime || 'In Progress'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Calendar */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('schedule.weeklySchedule')}</h2>
        </div>

        {!classes || classes.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('schedule.noClasses')}</h3>
            <p className="text-muted-foreground">{t('schedule.noClassesDescription')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-6 border-b border-border">
                <div className="p-3 bg-muted/30 border-r border-border">
                  <span className="text-sm font-medium text-muted-foreground">{t('schedule.time')}</span>
                </div>
                {days.map((day) => (
                  <div key={day} className="p-3 bg-muted/30 border-r border-border last:border-r-0 text-center">
                    <span className="text-sm font-medium text-foreground">{t(`schedule.${day}`)}</span>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-6 border-b border-border last:border-b-0">
                  <div className="p-3 border-r border-border bg-muted/10">
                    <span className="text-sm text-muted-foreground">
                      {`${hour}:00 - ${hour + 1}:00`}
                    </span>
                  </div>
                  {days.map((day) => (
                    <div key={day} className="p-2 border-r border-border last:border-r-0 min-h-[60px]">
                      {/* Sessions would be rendered here based on matching time/day */}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Today's Active Sessions */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">{t('schedule.activeSessions')}</h3>
        
        {activeSessions && activeSessions.length > 0 ? (
          <div className="space-y-3">
            {activeSessions.map((session: ActiveSession) => (
              <div key={session.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{session.subject?.name}</p>
                  <p className="text-sm text-muted-foreground">{session.class?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {session.startTime} - {session.endTime || 'In Progress'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="text-green-600 dark:text-green-400">✓ {session.presentCount || 0}</span>
                    <span className="text-red-600 dark:text-red-400">✗ {session.absentCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">{t('schedule.noActiveSessions')}</p>
        )}
      </div>

      {/* All Classes */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-bold text-foreground mb-4">{t('schedule.allClasses')}</h3>
        
        {classes && classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((classItem: TeacherClassItem) => (
              <div key={`${classItem.class?.id}-${classItem.subject?.id}`} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{classItem.subject?.name}</p>
                  <p className="text-sm text-muted-foreground">{classItem.class?.name} - Grade {classItem.class?.gradeLevel}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{classItem.class?.students?.pageInfo?.totalCount || 0} students</span>
                  </div>
                  {classItem.isMain && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full mt-1 inline-block">
                      Main Teacher
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">{t('schedule.noClassesToday')}</p>
        )}
      </div>
    </div>
  )
}
