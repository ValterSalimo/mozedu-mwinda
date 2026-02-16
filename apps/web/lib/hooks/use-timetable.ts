'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { timetableApi, timetableAttendanceApi, teachersApi } from '../api/client'
import { graphqlClient, queries } from '../api/graphql'

// ==================== SCHOOL CONFIGURATION ====================

export function useSchoolConfiguration(schoolId: string, academicYear: string) {
  return useQuery({
    queryKey: ['school-configuration', schoolId, academicYear],
    queryFn: () => timetableApi.getSchoolConfiguration(schoolId, academicYear),
    enabled: !!schoolId && !!academicYear,
  })
}

export function useCreateSchoolConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string
      data: {
        academic_year: string
        curriculum_type: 'national' | 'cambridge'
        school_start_time: string
        school_end_time: string
        national_periods_per_day: number
        cambridge_periods_per_day: number
        period_duration_minutes: number
        cambridge_period_duration_minutes: number
        break_duration_minutes: number
        lunch_duration_minutes: number
        morning_break_after_period: number
        lunch_break_after_period: number
      }
    }) => timetableApi.createSchoolConfiguration(schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['school-configuration', variables.schoolId],
      })
    },
  })
}

export function useUpdateSchoolConfiguration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string
      data: Record<string, unknown>
    }) => timetableApi.updateSchoolConfiguration(schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['school-configuration', variables.schoolId],
      })
    },
  })
}

// ==================== ROOMS ====================

export function useRoomsBySchool(schoolId: string) {
  return useQuery({
    queryKey: ['rooms', schoolId],
    queryFn: () => timetableApi.getRoomsBySchool(schoolId),
    enabled: !!schoolId,
  })
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['room', roomId],
    queryFn: () => timetableApi.getRoom(roomId),
    enabled: !!roomId,
  })
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string
      data: {
        code: string
        name: string
        capacity: number
        room_type?: string
        floor?: number
        building?: string
      }
    }) => timetableApi.createRoom(schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rooms', variables.schoolId],
      })
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      roomId,
      data,
    }: {
      roomId: string
      data: Record<string, unknown>
    }) => timetableApi.updateRoom(roomId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['room', variables.roomId],
      })
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (roomId: string) => timetableApi.deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rooms'],
      })
    },
  })
}

// ==================== TIMETABLE TEMPLATES ====================

export function useTimetablesBySchool(schoolId: string) {
  return useQuery({
    queryKey: ['timetables', schoolId],
    queryFn: () => timetableApi.getTimetablesBySchool(schoolId),
    enabled: !!schoolId,
  })
}

export function useTimetable(timetableId: string) {
  return useQuery({
    queryKey: ['timetable', timetableId],
    queryFn: () => timetableApi.getTimetable(timetableId),
    enabled: !!timetableId,
  })
}

export function useClassTimetable(schoolId: string, classId: string, date?: string) {
  return useQuery({
    queryKey: ['class-timetable', schoolId, classId, date],
    queryFn: async () => {
      const response = await timetableApi.getClassTimetable(schoolId, classId, date)
      return response.data as Array<{
        id: string
        day_of_week: string
        start_time: string
        end_time: string
        subject: { name: string }
        teacher: { user: { first_name: string; last_name: string } }
        room: { code: string }
      }>
    },
    enabled: !!schoolId && !!classId,
  })
}

export function useGenerateTimetable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      school_id: string
      name: string
      academic_year: string
      term: string
      curriculum_type: string
      start_date: string
      end_date: string
      algorithm: 'genetic' | 'basic'
      constraints?: Record<string, unknown>
      generated_by: string
    }) => timetableApi.generateTimetable(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timetables', variables.school_id],
      })
    },
  })
}

export function useActivateTimetable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (timetableId: string) => timetableApi.activateTimetable(timetableId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['timetables'],
      })
    },
  })
}

export function useValidateTimetable(timetableId: string) {
  return useQuery({
    queryKey: ['timetable-validation', timetableId],
    queryFn: () => timetableApi.validateTimetable(timetableId),
    enabled: !!timetableId,
  })
}

// ==================== TIMETABLE CONSTRAINTS ====================

export function useTimetableConstraints(schoolId: string) {
  return useQuery({
    queryKey: ['timetable-constraints', schoolId],
    queryFn: () => timetableApi.getTimetableConstraints(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreateTimetableConstraint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      data,
    }: {
      schoolId: string
      data: {
        constraint_type: string
        constraint_data: Record<string, unknown>
        priority: number
        is_hard_constraint: boolean
        description?: string
      }
    }) => timetableApi.createTimetableConstraint(schoolId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timetable-constraints', variables.schoolId],
      })
    },
  })
}

export function useUpdateTimetableConstraint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      constraintId,
      data,
    }: {
      constraintId: string
      data: Record<string, unknown>
    }) => timetableApi.updateTimetableConstraint(constraintId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['timetable-constraints'],
      })
    },
  })
}

export function useDeleteTimetableConstraint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (constraintId: string) => timetableApi.deleteTimetableConstraint(constraintId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['timetable-constraints'],
      })
    },
  })
}

// ==================== TEACHER AVAILABILITY ====================

export function useTeacherAvailability(teacherId: string) {
  return useQuery({
    queryKey: ['teacher-availability', teacherId],
    queryFn: () => timetableApi.getTeacherAvailability(teacherId),
    enabled: !!teacherId,
  })
}

export function useSetTeacherAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teacherId,
      data,
    }: {
      teacherId: string
      data: {
        day_of_week: string
        start_time: string
        end_time: string
        is_available: boolean
        reason?: string
      }
    }) => timetableApi.setTeacherAvailability(teacherId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teacher-availability', variables.teacherId],
      })
    },
  })
}

// ==================== TIMETABLE-ATTENDANCE INTEGRATION ====================

// Fix: Add options parameter
export function useScheduledSessionsByClass(classId: string, date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['scheduled-sessions-class', classId, date],
    queryFn: async () => {
      const response = await graphqlClient<{
        scheduledSessionsByClass: Array<{
          session: {
            id: string
            date: string
            startTime: string
            endTime: string
            isActive: boolean
            isScheduled: boolean
            timetableSlotId?: string
            roomId?: string
            teacher: {
              user: {
                firstName: string
                lastName: string
              }
            }
            subject: {
              name: string
            }
            room?: {
              code: string
              name: string
              capacity: number
            }
          }
          isScheduled: boolean
          isHeld: boolean
          isMissed: boolean
        }>
      }>(queries.scheduledSessionsByClass, {
        classId: classId,
        date: new Date(date).toISOString(),
      })
      return response.scheduledSessionsByClass
    },
    enabled: options?.enabled !== undefined ? options.enabled : (!!classId && !!date),
  })
}

// Fix: Add options parameter
export function useScheduledSessionsByTeacher(teacherId: string, date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['scheduled-sessions-teacher', teacherId, date],
    queryFn: async () => {
      const response = await graphqlClient<{
        scheduledSessionsByTeacher: Array<{
          session: {
            id: string
            date: string
            startTime: string
            endTime: string
            isActive: boolean
            isScheduled: boolean
            class: {
              name: string
              gradeLevel: number
            }
            subject: {
              name: string
            }
            room?: {
              code: string
              name: string
            }
          }
          isScheduled: boolean
          isHeld: boolean
          isMissed: boolean
        }>
      }>(queries.scheduledSessionsByTeacher, {
        teacherId: teacherId,
        date: new Date(date).toISOString(),
      })
      return response.scheduledSessionsByTeacher
    },
    enabled: options?.enabled !== undefined ? options.enabled : (!!teacherId && !!date),
  })
}

export function useAttendanceComparison(
  classId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['attendance-comparison', classId, startDate, endDate],
    queryFn: async () => {
      const response = await graphqlClient<{
        attendanceComparison: {
          scheduledSessions: number
          actualSessions: number
          missedSessions: number
          unscheduledSessions: number
          complianceRate: number
        }
      }>(queries.attendanceComparison, {
        classId: classId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      })
      return response.attendanceComparison
    },
    enabled: !!classId && !!startDate && !!endDate,
  })
}

export function useCreateSessionsForDate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      date,
    }: {
      schoolId: string
      date: string
    }) => timetableAttendanceApi.createSessionsForDate(schoolId, date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-class'],
      })
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-teacher'],
      })
    },
  })
}

export function useCreateSessionsForWeek() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      startDate,
    }: {
      schoolId: string
      startDate: string
    }) => timetableAttendanceApi.createSessionsForWeek(schoolId, startDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-class'],
      })
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-teacher'],
      })
    },
  })
}

export function useCreateSessionsForDateRange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      schoolId,
      startDate,
      endDate,
    }: {
      schoolId: string
      startDate: string
      endDate: string
    }) => timetableAttendanceApi.createSessionsForDateRange(schoolId, startDate, endDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-class'],
      })
      queryClient.invalidateQueries({
        queryKey: ['scheduled-sessions-teacher'],
      })
    },
  })
}
