'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { Loader2, Award, TrendingUp, Users, BookOpen, Search, Filter } from 'lucide-react'
import { useTeacherClasses, useTeacherId, useCurrentEntity } from '@/lib/hooks'
import { useQuery } from '@tanstack/react-query'
import { gql } from '@/lib/api'

export default function GradesPage() {
  const t = useTranslations('teacher')
  const tCommon = useTranslations('common')
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get teacher ID and classes
  useCurrentEntity()
  const teacherId = useTeacherId() || ''
  const { data: classes, isLoading } = useTeacherClasses(teacherId)

  const selectedClass = selectedClassId 
    ? classes?.find(c => c.id === selectedClassId) 
    : classes?.[0]

  // Fetch students and grades for selected class
  const { data: studentsData } = useQuery({
    queryKey: ['class-students', selectedClass?.id],
    queryFn: async () => {
      if (!selectedClass?.id) return null
      return gql.studentsByClass(selectedClass.id)
    },
    enabled: !!selectedClass?.id,
  })

  // Calculate statistics
  const stats = useMemo(() => {
    const students = (studentsData?.studentsByClass || []) as any[]
    
    if (students.length === 0) {
      return {
        totalStudents: selectedClass?.students || 0,
        classAverage: 0,
        highestGrade: 0,
        pendingGrades: 0,
      }
    }

    const grades = students.flatMap((s: any) => s.grades || [])
    const averages = grades.map((g: any) => (g.score / g.maxScore) * 20) // Convert to 0-20 scale
    
    return {
      totalStudents: students.length,
      classAverage: averages.length > 0 
        ? Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10
        : 0,
      highestGrade: averages.length > 0 
        ? Math.round(Math.max(...averages) * 10) / 10
        : 0,
      pendingGrades: 0, // TODO: Calculate from pending assignments
    }
  }, [studentsData, selectedClass])

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
          <h1 className="text-3xl font-bold text-foreground">{tCommon('grades')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('manageGrades')}</p>
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
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('grades.assessmentType')}
              </label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground">
                <option value="all">{t('grades.allAssessments')}</option>
                <option value="exam">{t('grades.exams')}</option>
                <option value="quiz">{t('grades.quizzes')}</option>
                <option value="assignment">{t('grades.assignments')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('grades.term')}
              </label>
              <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground">
                <option value="current">{t('grades.currentTerm')}</option>
                <option value="1">{t('grades.term1')}</option>
                <option value="2">{t('grades.term2')}</option>
                <option value="3">{t('grades.term3')}</option>
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
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('stats.totalStudents')}</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('grades.classAverage')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.classAverage}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('grades.highestGrade')}</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.highestGrade}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('grades.pendingGrades')}</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pendingGrades}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('grades.searchStudents')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t('grades.filter')}
        </Button>
      </div>

      {/* Grade Entry Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('grades.studentGrades')}</h2>
        </div>
        
        {!selectedClass ? (
          <div className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('grades.noClassSelected')}</h3>
            <p className="text-muted-foreground">{t('grades.selectClassToView')}</p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">{t('grades.noGradesYet')}</h3>
            <p className="text-muted-foreground mb-4">{t('grades.noGradesDescription')}</p>
            <Button>{t('grades.addGrades')}</Button>
          </div>
        )}
      </div>
    </div>
  )
}
