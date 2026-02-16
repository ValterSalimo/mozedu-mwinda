'use client'

import { Calendar, CheckCircle, XCircle, Clock, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { useStudentAttendance, useStudentId, useCurrentEntity, type AttendanceRecord } from '@/lib/hooks'

export default function AttendancePage() {
  const t = useTranslations('student')
  
  // Get the current student's ID from auth
  useCurrentEntity() // Ensure entity is resolved
  const studentId = useStudentId()
  
  // Fetch attendance data using real API
  const validStudentId = studentId && studentId.length > 0 ? studentId : undefined
  const { data: attendanceData, isLoading, error } = useStudentAttendance(
    validStudentId || '', 
    { enabled: !!validStudentId }
  )

  const summary = attendanceData?.summary
  const records = attendanceData?.records || []

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'present':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'absent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'late':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'excused':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'text-muted-foreground bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'present':
        return <CheckCircle className="h-5 w-5" />
      case 'absent':
        return <XCircle className="h-5 w-5" />
      case 'late':
      case 'excused':
        return <Clock className="h-5 w-5" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
      case 'present':
        return t('attendance.present')
      case 'absent':
        return t('attendance.absent')
      case 'late':
        return t('attendance.late')
      case 'excused':
        return t('attendance.excused')
      default:
        return status
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <p className="text-lg text-muted-foreground">{t('errors.loadingFailed')}</p>
      </div>
    )
  }

  // No student ID state
  if (!validStudentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-16 w-16 text-yellow-500" />
        <p className="text-lg text-muted-foreground">{t('errors.notAuthenticated')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('attendance.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('attendance.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('attendance.totalDays')}
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {summary?.totalDays || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('attendance.thisPeriod')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('attendance.present')}
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {summary?.presentDays || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('attendance.daysAttended')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('attendance.absent')}
            </CardTitle>
            <XCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {summary?.absentDays || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('attendance.daysMissed')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('attendance.rate')}
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary">
              {summary?.attendanceRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('attendance.overallPerformance')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>{t('attendance.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="space-y-3">
              {records.slice(0, 20).map((record: AttendanceRecord) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {record.session?.date 
                          ? new Date(record.session.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : t('attendance.noDate')
                        }
                      </p>
                      {record.session?.subject?.name && (
                        <p className="text-sm text-muted-foreground">
                          {record.session.subject.name}
                        </p>
                      )}
                      {record.checkInTime && (
                        <p className="text-sm text-muted-foreground">
                          {t('attendance.checkIn')}: {record.checkInTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusLabel(record.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('attendance.noRecords')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
