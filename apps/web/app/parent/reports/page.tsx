'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  Download,
  FileText,
  TrendingUp,
  Award,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  Target,
  BookOpen,
  Clock,
  Loader2,
  Users,
} from 'lucide-react'
import { useParentChildren, useChildGrades } from '@/lib/hooks/use-parent'
import { useParentId, useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { useUser } from '@/lib/stores'

export default function ReportsPage() {
  const t = useTranslations('parent.reports')
  const user = useUser()
  
  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''

  const { data: childrenList = [], isLoading: isLoadingChildren } = useParentChildren(parentId)
  const [selectedChildId, setSelectedChildId] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState('semester1')

  const selectedChildren = useMemo(() => {
    if (selectedChildId === 'all') return childrenList
    return childrenList.filter(c => c.id === selectedChildId)
  }, [childrenList, selectedChildId])

  const periods = [
    { id: 'semester1', name: t('semester1') },
    { id: 'semester2', name: t('semester2') },
    { id: 'year', name: t('fullYear') },
  ]

  // Placeholder for reports as we don't have an endpoint yet
  const reports: any[] = []

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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-700">{t('filterBy')}:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('student')}:</label>
            <select
              value={selectedChildId}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
            >
              <option value="all">{t('allChildren')}</option>
              {childrenList.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">{t('period')}:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
            >
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Summary Cards */}
        <div className="lg:col-span-1 space-y-6">
          {selectedChildren.map(child => (
            <div key={child.id} className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white font-bold">
                  {child.firstName[0]}{child.lastName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{child.firstName} {child.lastName}</h3>
                  <p className="text-xs text-gray-600">{child.class?.name || t('noClass')}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('overallAverage')}</span>
                  <span className="text-lg font-bold text-accent-600">{child.gpa ? child.gpa.toFixed(1) : 'N/A'}/20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t('attendance')}</span>
                  <span className="text-lg font-bold text-green-600">{child.attendanceRate || 0}%</span>
                </div>
              </div>

              <Button 
                className="w-full mt-4 bg-accent-500 hover:bg-accent-600"
                onClick={() => {
                  const headers = ['Nome', 'Turma', 'Média Geral', 'Presença']
                  const csvContent = [
                    headers.join(','),
                    [
                      `"${child.firstName} ${child.lastName}"`,
                      `"${child.class?.name || t('noClass')}"`,
                      child.gpa ? child.gpa.toFixed(1) : 'N/A',
                      `${child.attendanceRate || 0}%`
                    ].join(',')
                  ].join('\n')

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `relatorio-${child.firstName}-${new Date().toISOString().split('T')[0]}.csv`
                  a.click()
                  window.URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadAll', { name: child.firstName })}
              </Button>
            </div>
          ))}

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-6 text-white">
            <h3 className="font-bold mb-4">{t('quickStatistics')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">{t('totalReports')}</span>
                <span className="text-2xl font-bold">{reports.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Reports List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Available Reports */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('availableReports')}</h3>
            {reports.length > 0 ? (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-accent-500 transition-colors"
                  >
                    {/* Report Item UI */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{t('noReportsAvailable')}</p>
              </div>
            )}
          </div>

          {/* Performance Analytics */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">{t('performanceAnalysis')}</h3>
            
            {selectedChildren.map(child => (
               <div key={child.id} className="mb-6 last:mb-0 border-b last:border-0 pb-6 last:pb-0 border-gray-100">
                  <h4 className="font-medium text-foreground mb-3">{child.firstName} {child.lastName}</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-600">{t('average')}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{child.gpa ? child.gpa.toFixed(1) : 'N/A'}</p>
                    </div>
                     <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <span className="text-sm text-gray-600">{t('attendance')}</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">{child.attendanceRate || 0}%</p>
                    </div>
                  </div>
               </div>
            ))}
          </div>

          {/* Generate Custom Report */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-dashed border-blue-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-card rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('customReport')}</h3>
                <p className="text-sm text-gray-600">{t('customReportDescription')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="border-blue-300 hover:bg-blue-50">
                <PieChart className="h-4 w-4 mr-2" />
                {t('bySubject')}
              </Button>
              <Button variant="outline" className="border-purple-300 hover:bg-purple-50">
                <Calendar className="h-4 w-4 mr-2" />
                {t('byPeriod')}
              </Button>
              <Button variant="outline" className="border-green-300 hover:bg-green-50">
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('comparative')}
              </Button>
              <Button variant="outline" className="border-orange-300 hover:bg-orange-50">
                <BookOpen className="h-4 w-4 mr-2" />
                {t('complete')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
