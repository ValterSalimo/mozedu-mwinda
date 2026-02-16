'use client'

import { useState } from 'react'
import { BookOpen, TrendingUp, Award, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { 
  useStudentGrades, 
  useStudentGPA, 
  useStudentId, 
  useCurrentEntity,
  getLetterGrade,
  type Grade 
} from '@/lib/hooks'

export default function GradesPage() {
  const t = useTranslations('student')
  
  // Get the current student's ID from auth
  useCurrentEntity() // Ensure entity is resolved
  const studentId = useStudentId()
  
  const [filter, setFilter] = useState<'all' | 'EXAM' | 'ASSIGNMENT' | 'QUIZ' | 'PROJECT'>('all')

  // Fetch grades using real API
  const validStudentId = studentId && studentId.length > 0 ? studentId : undefined
  const { data: grades = [], isLoading, error } = useStudentGrades(
    validStudentId || '', 
    { enabled: !!validStudentId }
  )
  const { data: gpa = 0 } = useStudentGPA(validStudentId || '')

  const filteredGrades = grades.filter(
    (g) => filter === 'all' || g.gradeType === filter
  )

  const averageScore =
    filteredGrades.reduce((sum, g) => sum + (g.percentage || (g.score / g.maxScore) * 100), 0) /
      filteredGrades.length || 0

  const getGradeColor = (grade: Grade) => {
    const letter = grade.letterGrade || getLetterGrade(grade.percentage || (grade.score / grade.maxScore) * 100)
    if (letter.startsWith('A')) return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    if (letter.startsWith('B')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    if (letter.startsWith('C')) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-50 dark:bg-red-900/20'
  }

  const getGradeTypeLabel = (type: string) => {
    switch (type) {
      case 'EXAM':
        return t('grades.exam')
      case 'ASSIGNMENT':
        return t('grades.assignment')
      case 'QUIZ':
        return t('grades.quiz')
      case 'PROJECT':
        return t('grades.project')
      case 'MIDTERM':
        return t('grades.midterm')
      case 'FINAL':
        return t('grades.final')
      default:
        return type
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
        <h1 className="text-3xl font-bold text-foreground">{t('grades.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('grades.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('grades.currentGPA')}
            </CardTitle>
            <Award className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{gpa.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('grades.outOf')} 4.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('grades.averageScore')}
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('grades.currentTerm')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('grades.totalGrades')}
            </CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {filteredGrades.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('grades.thisTerm')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('grades.allGrades')}
        </button>
        <button
          onClick={() => setFilter('EXAM')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'EXAM'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('grades.exams')}
        </button>
        <button
          onClick={() => setFilter('ASSIGNMENT')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'ASSIGNMENT'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('grades.assignments')}
        </button>
        <button
          onClick={() => setFilter('QUIZ')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'QUIZ'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground hover:bg-muted/80'
          }`}
        >
          {t('grades.quizzes')}
        </button>
      </div>

      {/* Grades List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('grades.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredGrades.length > 0 ? (
            <div className="space-y-4">
              {filteredGrades.map((grade) => {
                const letterGrade = grade.letterGrade || getLetterGrade(grade.percentage || (grade.score / grade.maxScore) * 100)
                const teacherName = grade.teacher?.user 
                  ? `${grade.teacher.user.firstName} ${grade.teacher.user.lastName}`
                  : t('grades.unknownTeacher')
                
                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {grade.subject?.name || grade.subjectName || t('grades.unknownSubject')}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-foreground">
                          {getGradeTypeLabel(grade.gradeType)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('grades.teacher')}: {teacherName}
                      </p>
                      {grade.comments && (
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{grade.comments}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{grade.term} • {grade.academicYear}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div
                        className={`px-4 py-2 rounded-lg font-bold text-2xl ${getGradeColor(grade)}`}
                      >
                        {letterGrade}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {grade.score}/{grade.maxScore}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noGrades')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
