'use client'

import { FileText, Download, Award, TrendingUp, Loader2, AlertCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { 
  useStudentGrades, 
  useStudentGPA,
  useStudentAttendance,
  useStudentId, 
  useCurrentEntity,
  getLetterGrade,
  type Grade 
} from '@/lib/hooks'

export default function ReportsPage() {
  const t = useTranslations('student')
  
  // Get the current student's ID from auth
  useCurrentEntity() // Ensure entity is resolved
  const studentId = useStudentId()
  
  // Fetch data using real API
  const validStudentId = studentId && studentId.length > 0 ? studentId : undefined
  const { data: grades = [], isLoading: gradesLoading } = useStudentGrades(
    validStudentId || '', 
    { enabled: !!validStudentId }
  )
  const { data: gpa = 0, isLoading: gpaLoading } = useStudentGPA(validStudentId || '')
  const { data: attendanceData, isLoading: attendanceLoading } = useStudentAttendance(
    validStudentId || '', 
    { enabled: !!validStudentId }
  )

  const isLoading = gradesLoading || gpaLoading || attendanceLoading
  const attendanceRate = attendanceData?.summary?.attendanceRate ?? 0

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    const subjectName = grade.subject?.name || grade.subjectName || t('reports.unknownSubject')
    if (!acc[subjectName]) {
      acc[subjectName] = []
    }
    acc[subjectName].push(grade)
    return acc
  }, {} as Record<string, Grade[]>)

  // Calculate subject averages
  const subjectAverages = Object.entries(gradesBySubject).map(([subject, subjectGrades]) => {
    const avg = subjectGrades.reduce((sum, g) => sum + (g.percentage || (g.score / g.maxScore) * 100), 0) / subjectGrades.length
    return {
      subject,
      average: avg,
      letterGrade: getLetterGrade(avg),
      gradeCount: subjectGrades.length,
    }
  })

  // Get unique academic terms
  const terms = [...new Set(grades.map(g => `${g.term} ${g.academicYear}`))]

  const getGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
    if (letter.startsWith('B')) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    if (letter.startsWith('C')) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
        <h1 className="text-3xl font-bold text-foreground">{t('reports.title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('reports.subtitle')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.currentGPA')}
            </CardTitle>
            <Award className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {gpa.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('reports.outOf')} 4.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.subjectsEnrolled')}
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary">
              {subjectAverages.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('reports.activeSubjects')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.attendanceRate')}
            </CardTitle>
            <Calendar className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {attendanceRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('reports.thisTerm')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Academic Report Card */}
      {subjectAverages.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('reports.academicReport')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {terms.length > 0 ? terms.join(', ') : t('reports.currentPeriod')}
                </p>
              </div>
              <button 
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => {
                  // Generate CSV report from available data
                  const headers = [t('reports.subject'), t('reports.average'), t('reports.letterGrade'), t('reports.gradeCount')]
                  const csvContent = [
                    headers.join(','),
                    ...subjectAverages.map(s => [
                      `"${s.subject}"`,
                      s.average.toFixed(1),
                      s.letterGrade,
                      s.gradeCount
                    ].join(','))
                  ].join('\n')

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `academic-report-${new Date().toISOString().split('T')[0]}.csv`
                  a.click()
                  window.URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-4 w-4" />
                {t('reports.downloadPDF')}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Grades Table */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">
                {t('reports.gradeSummary')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t('reports.subject')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t('reports.assessments')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t('reports.average')}
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                        {t('reports.grade')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectAverages.map((subj) => (
                      <tr
                        key={subj.subject}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-muted/50"
                      >
                        <td className="py-3 px-4 text-foreground font-medium">
                          {subj.subject}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {subj.gradeCount}
                        </td>
                        <td className="py-3 px-4 text-center text-foreground">
                          {subj.average.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full font-medium ${getGradeColor(subj.letterGrade)}`}>
                            {subj.letterGrade}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overall Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('reports.overallGPA')}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {gpa.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-muted-foreground mb-1">
                  {t('reports.attendanceRate')}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {attendanceRate}%
                </p>
              </div>
            </div>

            {/* Note about report generation */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('reports.autoGenerated')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t('reports.noData')}
          </p>
        </div>
      )}
    </div>
  )
}
