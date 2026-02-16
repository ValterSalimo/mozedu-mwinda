/**
 * Dashboard Hooks for fetching aggregated data
 * Uses GraphQL for complex queries
 */

import { useQuery } from '@tanstack/react-query'
import { graphqlClient, queries } from '../api/graphql'
import { studentsApi, teachersApi } from '../api/client'

// ==================== QUERY KEYS ====================

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (schoolId?: string) => [...dashboardKeys.all, 'stats', schoolId] as const,
  students: (schoolId?: string) => [...dashboardKeys.all, 'students', schoolId] as const,
  teachers: (schoolId?: string) => [...dashboardKeys.all, 'teachers', schoolId] as const,
  classes: (schoolId?: string) => [...dashboardKeys.all, 'classes', schoolId] as const,
  recentActivity: (schoolId?: string) => [...dashboardKeys.all, 'activity', schoolId] as const,
}

// ==================== TYPES ====================

export interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  averageAttendance: number
  averageGPA: number
  pendingPayments: number
  alertsCount: number
}

export interface ClassPerformance {
  id: string
  name: string
  gradeLevel: number
  students: number
  average: number
  attendance: number
  status: 'excellent' | 'good' | 'warning' | 'alert'
}

export interface RecentActivity {
  id: string
  type: 'student' | 'grade' | 'attendance' | 'payment' | 'alert'
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// ==================== HOOKS ====================

/**
 * Fetch dashboard statistics for school admin
 */
export function useDashboardStats(schoolId?: string) {
  return useQuery({
    queryKey: dashboardKeys.stats(schoolId),
    queryFn: async (): Promise<DashboardStats> => {
      if (!schoolId) return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        averageAttendance: 0,
        averageGPA: 0,
        pendingPayments: 0,
        alertsCount: 0,
      }

      try {
        const result = await graphqlClient<{
          school: {
            statistics: {
              totalStudents: number
              totalTeachers: number
              totalClasses: number
              averageAttendanceRate: number
              averageGPA: number
            }
          }
        }>(
          queries.school,
          { id: schoolId }
        )

        const stats = result.school?.statistics

        return {
          totalStudents: stats?.totalStudents || 0,
          totalTeachers: stats?.totalTeachers || 0,
          totalClasses: stats?.totalClasses || 0,
          averageAttendance: stats?.averageAttendanceRate || 0,
          averageGPA: stats?.averageGPA || 0,
          pendingPayments: 0,
          alertsCount: 0,
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        throw error
      }
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch students list for dashboard
 */
export function useDashboardStudents(schoolId?: string, pageSize = 10) {
  return useQuery({
    queryKey: dashboardKeys.students(schoolId),
    queryFn: async () => {
      const response = await studentsApi.getAll({
        schoolId,
        pageSize,
        page: 1
      })
      return response.data || []
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch teachers list for dashboard
 */
export function useDashboardTeachers(schoolId?: string, limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.teachers(schoolId),
    queryFn: async () => {
      const response = await teachersApi.getAll({
        schoolId,
        limit,
        page: 1
      })
      return response.data || []
    },
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Fetch class performance data
 */
export function useClassPerformance(schoolId?: string) {
  return useQuery({
    queryKey: dashboardKeys.classes(schoolId),
    queryFn: async (): Promise<ClassPerformance[]> => {
      if (!schoolId) return []
      try {
        const result = await graphqlClient<{
          school: {
            classes: {
              edges: Array<{
                node: {
                  id: string
                  name: string
                  gradeLevel: number
                  maxStudents: number | null
                }
              }>
            }
          }
        }>(
          `query GetClasses($schoolId: UUID!) {
            school(id: $schoolId) {
              classes(pagination: { first: 10 }) {
                edges {
                  node {
                    id
                    name
                    gradeLevel
                    maxStudents
                  }
                }
              }
            }
          }`,
          { schoolId }
        )

        // Map to ClassPerformance (attendance and average would come from analytics)
        return (result.school?.classes?.edges || []).map(edge => ({
          id: edge.node.id,
          name: edge.node.name,
          gradeLevel: edge.node.gradeLevel,
          students: edge.node.maxStudents || 0,
          average: 0, // Would need analytics query
          attendance: 0, // Would need analytics query
          status: 'good' as const,
        }))
      } catch (error) {
        console.error('Failed to fetch classes:', error)
        return []
      }
    },
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  })
}

/**
 * Helper to calculate status based on average
 */
export function getPerformanceStatus(average: number): 'excellent' | 'good' | 'warning' | 'alert' {
  if (average >= 16) return 'excellent'
  if (average >= 14) return 'good'
  if (average >= 10) return 'warning'
  return 'alert'
}

/**
 * Helper to get status color class
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600'
    case 'good':
      return 'text-blue-600'
    case 'warning':
      return 'text-orange-600'
    case 'alert':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}
