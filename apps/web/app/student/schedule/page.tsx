'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Loader2, Clock, BookOpen, Users, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudentId, useCurrentEntity, useScheduledSessionsByClass } from '@/lib/hooks'
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
    timetableSlotId?: string
    roomId?: string
    teacher: { user: { firstName: string; lastName: string } }
    subject: { name: string }
    room?: { code: string; name: string; capacity: number }
  }
  isScheduled: boolean
  isHeld: boolean
  isMissed: boolean
}

interface StudentData {
  student?: {
    class?: { id: string; name: string }
  }
}

export default function StudentSchedulePage() {
  const t = useTranslations('student')
  const tCommon = useTranslations('common')
  
  // Get student ID and data
  useCurrentEntity()
  const studentId = useStudentId() || ''
  
  // Date state for viewing schedule
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  // Format date for API (YYYY-MM-DD)
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  // Get student data with class info from GraphQL
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => gql.student(studentId),
    enabled: !!studentId,
  })

  const student = studentData?.student as StudentData['student']
  const classId = student?.class?.id || ''
  const className = student?.class?.name || ''
  
  // Get scheduled sessions for the class on selected date
  const { data: scheduledSessions, isLoading: isLoadingSessions } = useScheduledSessionsByClass(
    classId, 
    formatDate(selectedDate)
  )
  
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
          <p className="text-sm text-muted-foreground mt-1">
            {className ? `${className} Schedule` : 'Your class schedule'}
          </p>
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

      {/* Daily Schedule - Scheduled Sessions from Timetable */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">
            {isToday(selectedDate) ? t('todaySchedule') : `Schedule for ${selectedDate.toLocaleDateString()}`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your class timetable
          </p>
        </div>

        {isLoadingSessions ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : !scheduledSessions || scheduledSessions.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('noClasses')}</h3>
            <p className="text-muted-foreground">
              {isToday(selectedDate) 
                ? 'Your class has no sessions scheduled for today' 
                : 'Your class has no sessions scheduled for this date'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {scheduledSessions.map((item: ScheduledSessionItem, index: number) => (
              <div 
                key={item.session.id} 
                className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg min-w-[60px]">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{t('schedule.period')}</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground text-lg">{item.session.subject?.name}</p>
                    {item.isHeld && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        Completed
                      </span>
                    )}
                    {item.isMissed && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                        Cancelled
                      </span>
                    )}
                    {item.isScheduled && !item.isHeld && !item.isMissed && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Users className="h-4 w-4" />
                    <span>{item.session.teacher?.user?.firstName} {item.session.teacher?.user?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.session.startTime} - {item.session.endTime || 'In Progress'}</span>
                    </div>
                    {item.session.room && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{item.session.room.name} ({item.session.room.code})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">{t('schedule.about')}</h3>
            <p className="text-sm text-muted-foreground">
              This schedule is generated from your school&apos;s timetable. All students in {className} will follow the same schedule. 
              The times and rooms shown are based on the official timetable created by your school administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
