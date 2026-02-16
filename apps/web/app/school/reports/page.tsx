'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@mozedu/ui'
import { gql } from '@/lib/api' // using the gql wrapper we saw earlier
import { useUser } from '@/lib/stores'
import {
  BarChart,
  Users,
  GraduationCap,
  School,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  Clock
} from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SchoolReportsPage() {
  const t = useTranslations('school') // Assuming school namespace
  const user = useUser()
  const schoolId = user?.schoolId

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboardStats', schoolId],
    queryFn: async () => {
      try {
        const res = await gql.dashboardStats(schoolId)
        return (res as any).dashboardStats
      } catch (e) {
        console.error(e)
        return null
      }
    },
    enabled: !!schoolId
  })

  if (isLoading) {
    return <div className="p-8 text-center">{t('reports.loadingReports')}</div>
  }

  if (!stats) {
    return <div className="p-8 text-center">{t('reports.noReportsData')}</div>
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('reports.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('reports.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalStudents')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">{t('reports.changeFromLastMonth')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalTeachers')}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.avgAttendance')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageAttendanceRate || 0)}%</div>
            <p className="text-xs text-muted-foreground">{t('reports.target')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.avgGpa')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageGPA?.toFixed(1) || '0.0'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('reports.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity?.map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {!stats.recentActivity?.length && <p className="text-sm text-muted-foreground">{t('reports.noActivity')}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>{t('reports.financialOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{t('reports.totalRevenue')}</span>
                </div>
                <span className="text-xl font-bold">{stats.totalRevenue?.toLocaleString()} MZN</span>
              </div>
              <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">{t('reports.pendingPayments')}</span>
                </div>
                <span className="text-xl font-bold">{stats.pendingPayments?.toLocaleString()} MZN</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
