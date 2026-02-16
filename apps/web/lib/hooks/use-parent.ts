/**
 * Parent Hooks for fetching parent-related data
 * Uses GraphQL for complex queries - Updated to match GRAPHQL.md spec
 */

import { useQuery } from '@tanstack/react-query'
import { graphqlClient } from '../api/graphql'
import { gql } from '../api'

// ==================== QUERY KEYS ====================

export const parentKeys = {
  all: ['parent'] as const,
  children: (parentId: string) => [...parentKeys.all, 'children', parentId] as const,
  childGrades: (studentId: string) => [...parentKeys.all, 'grades', studentId] as const,
  childAttendance: (studentId: string) => [...parentKeys.all, 'attendance', studentId] as const,
  childPayments: (studentId: string) => [...parentKeys.all, 'payments', studentId] as const,
  notifications: (parentId: string) => [...parentKeys.all, 'notifications', parentId] as const,
}

// ==================== TYPES ====================

export interface ParentChild {
  id: string
  studentId: string
  studentNumber: string
  firstName: string
  lastName: string
  gradeLevel?: number
  status?: string
  average?: number
  attendance?: number
  gpa?: number
  attendanceRate?: number
  outstandingBalance?: number
  school?: {
    id?: string
    name: string
  }
  class?: {
    id?: string
    name: string
  }
  lastCheckIn?: string
  alerts?: number
  profileImageUrl?: string
}

export interface ChildGrade {
  id: string
  subject?: { name: string }
  subjectName?: string
  score: number
  maxScore: number
  percentage: number
  gradeType: string
  term: string
  academicYear?: string
  publishedAt?: string
  isPublished?: boolean
}

export interface ChildAttendance {
  id: string
  date?: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  subject?: string
  checkInTime?: string
  session?: {
    date: string
    subject?: { name: string }
  }
}

export interface ChildPayment {
  id: string
  amount: number
  currency: string
  feeType?: string
  status: 'pending' | 'completed' | 'failed'
  paymentMethod?: string
  transactionId?: string
  dueDate?: string
  paidAt?: string
  feeStructure?: {
    feeName: string
  }
}

export interface ParentNotification {
  id: string
  type: 'grade' | 'attendance' | 'payment' | 'message' | 'alert'
  title: string
  message: string
  childId: string
  childName: string
  read: boolean
  createdAt: string
}

// ==================== HOOKS ====================

/**
 * Fetch parent's children using the me query
 * Uses the proper GraphQL schema: me { parent { children { ... } } }
 */
export function useParentChildren(parentId: string) {
  return useQuery({
    queryKey: parentKeys.children(parentId),
    queryFn: async (): Promise<ParentChild[]> => {
      try {
        // Use the optimized 'parentChildren' query
        // This accepts a parentId, or uses the logged-in user context if null
        // Note: The UI hook passes parentId, which is usually user.id for parents
        const result = await gql.parentChildren(parentId)

        const children = result.parentChildren || []

        return children.map((child: any) => ({
          id: child.id,
          studentId: child.id,
          studentNumber: child.studentNumber,
          firstName: child.user?.firstName || '',
          lastName: child.user?.lastName || '',
          gradeLevel: child.class?.gradeLevel,
          average: child.gpa || 0,
          attendance: child.attendanceRate ? Math.round(child.attendanceRate * 100) : 0,
          gpa: child.gpa || 0,
          attendanceRate: child.attendanceRate ? Math.round(child.attendanceRate * 100) : 0,
          outstandingBalance: child.currentBalance || 0,
          school: child.school,
          class: child.class,
          alerts: 0,
          profileImageUrl: child.profileImageUrl,
        }))
      } catch (error) {
        console.error('Failed to fetch parent children:', error)
        return []
      }
    },
    enabled: !!parentId, // We still check parentId to ensure we have a user context, even if we use 'me'
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch child's grades using proper schema
 */
export function useChildGrades(studentId: string, options?: { term?: string; academicYear?: string }) {
  return useQuery({
    queryKey: parentKeys.childGrades(studentId),
    queryFn: async (): Promise<ChildGrade[]> => {
      try {
        const filter = {
          academicYear: options?.academicYear,
          term: options?.term,
          isPublished: true,
        }
        const result = await gql.studentGrades(studentId, filter, { first: 50 })

        return (result.studentGrades?.edges || []).map((edge: any) => {
          const node = edge.node
          return {
            id: node.id,
            subject: node.subject,
            subjectName: node.subject?.name,
            score: node.score,
            maxScore: node.maxScore,
            percentage: node.percentage,
            gradeType: node.gradeType,
            term: node.term,
            academicYear: node.academicYear,
            isPublished: node.isPublished,
          }
        })
      } catch (error) {
        console.error('Failed to fetch child grades:', error)
        return []
      }
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch child's attendance using proper schema
 */
export function useChildAttendance(studentId: string, options?: { dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: parentKeys.childAttendance(studentId),
    queryFn: async (): Promise<{ records: ChildAttendance[]; summary: { rate: number; presentDays: number; absentDays: number; lateDays: number; totalDays: number } }> => {
      try {
        const filter = {
          dateFrom: options?.dateFrom,
          dateTo: options?.dateTo,
        }
        const result = await gql.studentAttendance(studentId, filter, { first: 100 })

        const records = (result.studentAttendance?.edges || []).map((edge: any) => {
          const node = edge.node
          return {
            id: node.id,
            status: node.status as ChildAttendance['status'],
            checkInTime: node.checkInTime,
            session: node.session,
            date: node.session?.date,
            subject: node.session?.subject?.name,
          }
        })

        const totalDays = result.studentAttendance?.pageInfo?.totalCount || records.length
        const presentDays = records.filter((r: ChildAttendance) => r.status === 'PRESENT').length
        const absentDays = records.filter((r: ChildAttendance) => r.status === 'ABSENT').length
        const lateDays = records.filter((r: ChildAttendance) => r.status === 'LATE').length

        return {
          records,
          summary: {
            rate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
            presentDays,
            absentDays,
            lateDays,
            totalDays,
          },
        }
      } catch (error) {
        console.error('Failed to fetch child attendance:', error)
        return {
          records: [],
          summary: { rate: 0, presentDays: 0, absentDays: 0, lateDays: 0, totalDays: 0 },
        }
      }
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch child's payments using proper schema
 */
export function useChildPayments(studentId: string) {
  return useQuery({
    queryKey: parentKeys.childPayments(studentId),
    queryFn: async (): Promise<ChildPayment[]> => {
      try {
        const result = await gql.studentPayments(studentId, undefined, { first: 20 })

        return (result.studentPayments?.edges || []).map((edge: any) => {
          const node = edge.node
          return {
            id: node.id,
            amount: node.amount,
            currency: node.currency,
            feeType: node.feeStructure?.feeName,
            status: node.status?.toLowerCase() as ChildPayment['status'],
            paymentMethod: node.paymentMethod,
            transactionId: node.transactionId,
            paidAt: node.paidAt,
            feeStructure: node.feeStructure,
          }
        })
      } catch (error) {
        console.error('Failed to fetch child payments:', error)
        return []
      }
    },
    enabled: !!studentId,
    staleTime: 60 * 1000,
  })
}

/**
 * Helper to get status display info - returns string for simpler usage
 */
export function getChildStatus(gpa: number, attendanceRate: number): string {
  if (gpa >= 16 && attendanceRate >= 95) {
    return 'excellent'
  }
  if (gpa >= 14 && attendanceRate >= 90) {
    return 'good'
  }
  if (gpa >= 10 && attendanceRate >= 80) {
    return 'warning'
  }
  return 'alert'
}
