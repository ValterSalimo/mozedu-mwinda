/**
 * React Query Hooks for Attendance
 * Following Context7 TanStack Query best practices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, gql } from '../api'

// ==================== QUERY KEYS ====================

export const attendanceKeys = {
  all: ['attendance'] as const,
  sessions: () => [...attendanceKeys.all, 'sessions'] as const,
  session: (id: string) => [...attendanceKeys.sessions(), id] as const,
  student: (studentId: string) => [...attendanceKeys.all, 'student', studentId] as const,
  studentRange: (studentId: string, dateFrom?: string, dateTo?: string) => 
    [...attendanceKeys.student(studentId), { dateFrom, dateTo }] as const,
}

// ==================== TYPES ====================

export interface AttendanceSession {
  id: string
  classId: string
  teacherId: string
  date: string
  startTime: string
  endTime: string
  status: 'active' | 'closed' | 'cancelled'
  totalExpected: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  sessionCode?: string
}

export interface AttendanceRecord {
  id: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  checkInTime?: string
  session?: {
    date: string
    subject?: {
      name: string
    }
  }
}

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
}

export interface StudentAttendanceResponse {
  summary: AttendanceSummary
  records: AttendanceRecord[]
}

// ==================== QUERIES ====================

/**
 * Hook to fetch student attendance
 */
export function useStudentAttendance(
  studentId: string,
  options?: { dateFrom?: string; dateTo?: string; enabled?: boolean }
) {
  const isEnabled = options?.enabled !== undefined ? options.enabled : !!studentId
  
  return useQuery({
    queryKey: attendanceKeys.studentRange(studentId, options?.dateFrom, options?.dateTo),
    queryFn: async (): Promise<StudentAttendanceResponse> => {
      try {
        const filter = {
          dateFrom: options?.dateFrom,
          dateTo: options?.dateTo,
        }
        const result = await gql.studentAttendance(studentId, filter, { first: 100 })
        
        // Transform edges to records
        const records = (result.studentAttendance?.edges || []).map((edge: any) => edge.node as AttendanceRecord)
        const totalCount = result.studentAttendance?.pageInfo?.totalCount || 0
        
        // Calculate summary from records
        const presentCount = records.filter((r: AttendanceRecord) => r.status === 'PRESENT').length
        const absentCount = records.filter((r: AttendanceRecord) => r.status === 'ABSENT').length
        const lateCount = records.filter((r: AttendanceRecord) => r.status === 'LATE').length
        const excusedCount = records.filter((r: AttendanceRecord) => r.status === 'EXCUSED').length
        
        return {
          summary: {
            totalDays: totalCount,
            presentDays: presentCount,
            absentDays: absentCount,
            lateDays: lateCount,
            excusedDays: excusedCount,
            attendanceRate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0,
          },
          records,
        }
      } catch (error) {
        console.error('Failed to fetch student attendance:', error)
        return {
          summary: {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            excusedDays: 0,
            attendanceRate: 0,
          },
          records: [],
        }
      }
    },
    enabled: isEnabled,
    staleTime: 30 * 1000, // 30 seconds - attendance data changes frequently
  })
}

/**
 * Hook to fetch attendance sessions
 */
export function useAttendanceSessions(filters?: { classId?: string; date?: string }) {
  return useQuery({
    queryKey: [...attendanceKeys.sessions(), filters],
    queryFn: async () => {
      const response = await attendanceApi.listSessions({
        classId: filters?.classId,
      })
      return response.data as AttendanceSession[]
    },
    staleTime: 30 * 1000,
  })
}

// ==================== MUTATIONS ====================

/**
 * Hook to create an attendance session
 */
export function useCreateAttendanceSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      teacher_id: string
      class_id: string
      subject_id?: string
      date: string
      duration_minutes?: number
    }) => {
      const response = await attendanceApi.createSession(data)
      return response.data as AttendanceSession
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.sessions() })
    },
  })
}

/**
 * Hook to record attendance for a student (check-in)
 */
export function useRecordAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      session_id: string
      student_id: string
      latitude?: number
      longitude?: number
      facial_image?: string
      check_in_method?: 'FACIAL_RECOGNITION' | 'MANUAL' | 'QR_CODE' | 'BIOMETRIC'
    }) => {
      const response = await attendanceApi.checkIn(data)
      return response.data as AttendanceRecord
    },
    onSuccess: (_, variables) => {
      // Invalidate session and student attendance
      queryClient.invalidateQueries({ queryKey: attendanceKeys.session(variables.session_id) })
      queryClient.invalidateQueries({ 
        queryKey: attendanceKeys.student(variables.student_id) 
      })
    },
  })
}
