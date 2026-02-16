'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { Loader2, Users, BookOpen, Calendar, TrendingUp, BarChart3, MessageSquare, FileText, Award } from 'lucide-react'
import { useTeacherClasses, useTeacherId, useCurrentEntity } from '@/lib/hooks'

export default function ClassesPage() {
  const t = useTranslations('teacher')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  
  // Get teacher ID and classes
  useCurrentEntity()
  const teacherId = useTeacherId() || ''
  const { data: classes, isLoading } = useTeacherClasses(teacherId)
  
  // Select first class by default when loaded
  const selectedClass = selectedClassId 
    ? classes?.find(c => c.id === selectedClassId) 
    : classes?.[0]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('myClasses')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('classManagement.subtitle')}</p>
        </div>
        <div className="bg-card rounded-xl p-12 shadow-sm text-center border border-border">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('noClasses')}</h3>
          <p className="text-muted-foreground">{t('classManagement.noClassesDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('myClasses')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('classManagement.subtitle')}</p>
        </div>
      </div>

      {/* Classes Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`bg-card rounded-xl p-6 shadow-sm cursor-pointer transition-all border ${
              selectedClass?.id === cls.id ? 'ring-2 ring-primary shadow-md border-primary' : 'border-border hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground">{cls.name}</h3>
                <p className="text-sm text-muted-foreground">{cls.subject}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('classManagement.gradeLevel')}</span>
                <span className="font-medium text-foreground">{cls.gradeLevel}a {t('class')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('classManagement.section')}</span>
                <span className="font-medium text-foreground">{cls.section || 'A'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('classManagement.students')}</span>
                <span className="font-medium text-foreground">{cls.students || '0'}</span>
              </div>
            </div>

            {cls.schedule && cls.schedule.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">{t('schedule.title')}</p>
                <p className="text-sm font-medium text-foreground">
                  {cls.schedule.map(s => {
                    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
                    return `${days[s.day]} ${s.startTime}`
                  }).join(', ')}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Class Details */}
      {selectedClass && (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {selectedClass.name} - {selectedClass.subject}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedClass.gradeLevel}a {t('class')} - {t('classManagement.section')} {selectedClass.section}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('classManagement.totalStudents')}</p>
                  <p className="text-2xl font-bold text-foreground">{selectedClass.students || '0'}</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('classManagement.classAverage')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">-</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('attendanceRate')}</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</p>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('classManagement.activeAssignments')}</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">-</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('viewSchedule')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('reports')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('classManagement.groupMessage')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('classManagement.performanceAnalysis')}
            </Button>
          </div>

          {/* Students List - Placeholder */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4">{t('classManagement.studentList')}</h3>
            <div className="bg-muted/20 rounded-lg p-8 text-center border border-border">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('classManagement.studentListComingSoon')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
