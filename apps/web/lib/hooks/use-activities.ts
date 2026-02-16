'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { activitiesApi } from '../api'
import type {
  Activity,
  ActivityEnrollment,
  ActivitySession,
  ActivityAttendance,
  ActivityType,
  ActivityCategory,
  ActivityStatus,
  EnrollmentStatus,
} from '@mozedu/types'

// Types for API requests
export interface CreateActivityInput {
  schoolId: string
  name: string
  description?: string
  activityType: ActivityType
  category: ActivityCategory
  dayOfWeek?: number[]
  startTime?: string
  endTime?: string
  duration: number
  minParticipants?: number
  maxParticipants?: number
  location?: string
  roomId?: string
  requiresSpecialFacility?: boolean
  facilityRequirements?: string[]
  instructorId?: string
  externalInstructorName?: string
  hasFee?: boolean
  feeAmount?: number
  feeCurrency?: string
  feeFrequency?: 'one_time' | 'monthly' | 'per_session' | 'annual'
  gradeRestrictions?: number[]
  equipmentRequired?: string[]
  academicYear: string
}

export interface UpdateActivityInput {
  name?: string
  description?: string
  dayOfWeek?: number[]
  startTime?: string
  endTime?: string
  duration?: number
  minParticipants?: number
  maxParticipants?: number
  location?: string
  roomId?: string
  instructorId?: string
  externalInstructorName?: string
  hasFee?: boolean
  feeAmount?: number
  feeCurrency?: string
  feeFrequency?: 'one_time' | 'monthly' | 'per_session' | 'annual'
  gradeRestrictions?: number[]
  equipmentRequired?: string[]
  status?: ActivityStatus
}

export interface CreateSessionInput {
  activityId: string
  date: string
  startTime: string
  endTime: string
  location?: string
  instructorId?: string
}

export interface RecordAttendanceInput {
  sessionId: string
  enrollmentId: string
  studentId: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes?: string
}

// Query keys
const activitiesKeys = {
  all: ['activities'] as const,
  lists: () => [...activitiesKeys.all, 'list'] as const,
  list: (schoolId: string | undefined) => [...activitiesKeys.lists(), schoolId] as const,
  details: () => [...activitiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...activitiesKeys.details(), id] as const,
  enrollments: (activityId: string) => [...activitiesKeys.all, 'enrollments', activityId] as const,
  sessions: (activityId: string) => [...activitiesKeys.all, 'sessions', activityId] as const,
  attendance: (sessionId: string) => [...activitiesKeys.all, 'attendance', sessionId] as const,
  studentActivities: (studentId: string) => [...activitiesKeys.all, 'student', studentId] as const,
}

// Fetch activities
export function useActivities(schoolId: string | undefined, filters?: { type?: ActivityType; status?: ActivityStatus }) {
  return useQuery({
    queryKey: [...activitiesKeys.list(schoolId), filters],
    queryFn: async () => {
      if (!schoolId) return []
      const response = await activitiesApi.list(schoolId)
      let activities = (response.data as Activity[]) || []
      if (filters?.type) activities = activities.filter(a => a.activityType === filters.type)
      if (filters?.status) activities = activities.filter(a => a.status === filters.status)
      return activities
    },
    enabled: !!schoolId,
  })
}

// Fetch single activity
export function useActivity(activityId: string | undefined) {
  return useQuery({
    queryKey: activitiesKeys.detail(activityId || ''),
    queryFn: async () => {
      if (!activityId) return null
      const response = await activitiesApi.getById(activityId)
      return response.data as Activity
    },
    enabled: !!activityId,
  })
}

// Fetch activity enrollments
export function useActivityEnrollments(activityId: string | undefined) {
  return useQuery({
    queryKey: activitiesKeys.enrollments(activityId || ''),
    queryFn: async () => {
      if (!activityId) return []
      const response = await activitiesApi.getEnrollments(activityId)
      return (response.data as ActivityEnrollment[]) || []
    },
    enabled: !!activityId,
  })
}

// Fetch activity sessions
export function useActivitySessions(activityId: string | undefined, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: [...activitiesKeys.sessions(activityId || ''), dateRange],
    queryFn: async () => {
      if (!activityId) return []
      const response = await activitiesApi.getSessions(activityId)
      // Note: date filtering would ideally be done server-side with query params
      return (response.data as ActivitySession[]) || []
    },
    enabled: !!activityId,
  })
}

// Fetch student activities
export function useStudentActivities(studentId: string | undefined) {
  return useQuery({
    queryKey: activitiesKeys.studentActivities(studentId || ''),
    queryFn: async () => {
      if (!studentId) return []
      const response = await activitiesApi.getStudentActivities(studentId)
      return (response.data as ActivityEnrollment[]) || []
    },
    enabled: !!studentId,
  })
}

// Create activity
export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const response = await activitiesApi.create(input as unknown as Record<string, unknown>)
      return response.data as Activity
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.list(variables.schoolId) })
    },
  })
}

// Update activity
export function useUpdateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateActivityInput & { id: string }) => {
      const response = await activitiesApi.update(id, input)
      return response.data as Activity
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.all })
    },
  })
}

// Delete activity
export function useDeleteActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (activityId: string) => {
      await activitiesApi.delete(activityId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.all })
    },
  })
}

// Enroll student in activity
export function useEnrollStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ activityId, studentId }: { activityId: string; studentId: string }) => {
      const response = await activitiesApi.enroll(activityId, { studentId })
      return response.data as ActivityEnrollment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.enrollments(variables.activityId) })
      queryClient.invalidateQueries({ queryKey: activitiesKeys.studentActivities(variables.studentId) })
    },
  })
}

// Update enrollment
export function useUpdateEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      activityId,
      enrollmentId,
      status,
      parentApproved,
      feePaid,
    }: {
      activityId: string
      enrollmentId: string
      status?: EnrollmentStatus
      parentApproved?: boolean
      feePaid?: boolean
    }) => {
      const response = await activitiesApi.updateEnrollment(activityId, enrollmentId, { status, parentApproved, feePaid })
      return response.data as ActivityEnrollment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.enrollments(variables.activityId) })
    },
  })
}

// Remove enrollment
export function useRemoveEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ activityId, enrollmentId }: { activityId: string; enrollmentId: string }) => {
      await activitiesApi.removeEnrollment(activityId, enrollmentId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.enrollments(variables.activityId) })
    },
  })
}

// Create session
export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      const response = await activitiesApi.createSession(input.activityId, input as unknown as Record<string, unknown>)
      return response.data as ActivitySession
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.sessions(variables.activityId) })
    },
  })
}

// Cancel session
export function useCancelSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ activityId, sessionId, reason }: { activityId: string; sessionId: string; reason: string }) => {
      await activitiesApi.cancelSession(activityId, sessionId, reason)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.sessions(variables.activityId) })
    },
  })
}

// Record attendance
export function useRecordAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RecordAttendanceInput) => {
      const response = await activitiesApi.recordAttendance(input.sessionId, {
        studentId: input.studentId,
        status: input.status,
        notes: input.notes,
      })
      return response.data as ActivityAttendance
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.attendance(variables.sessionId) })
    },
  })
}

// Bulk record attendance
export function useBulkRecordAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, records }: { sessionId: string; records: Array<{ studentId: string; status: string; notes?: string }> }) => {
      const response = await activitiesApi.bulkRecordAttendance(sessionId, records)
      return (response.data as ActivityAttendance[]) || []
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activitiesKeys.attendance(variables.sessionId) })
    },
  })
}
