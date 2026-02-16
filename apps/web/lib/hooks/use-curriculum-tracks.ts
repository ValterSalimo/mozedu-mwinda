'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { curriculumTracksApi } from '../api'
import type {
  SchoolCurriculumTrack,
  TrackSubject,
  ClassCurriculumTrack,
  StudentCurriculumTrack,
  CurriculumType,
} from '@mozedu/types'

// Types for API requests
export interface CreateCurriculumTrackInput {
  schoolId: string
  name: string
  description?: string
  curriculumType: CurriculumType
  isCombined?: boolean
  combinedWith?: CurriculumType[]
  combinationRatio?: string
  scheduleConfig?: {
    periodsPerDay: number
    periodDurationMinutes: number
    breakDurationMinutes: number
    lunchBreakMinutes?: number
    schoolDays?: string[]
  }
  isDefault?: boolean
}

export interface UpdateCurriculumTrackInput {
  name?: string
  description?: string
  isCombined?: boolean
  combinedWith?: CurriculumType[]
  combinationRatio?: string
  scheduleConfig?: {
    periodsPerDay: number
    periodDurationMinutes: number
    breakDurationMinutes: number
    lunchBreakMinutes?: number
    schoolDays?: string[]
  }
  isDefault?: boolean
  isActive?: boolean
}

export interface AddTrackSubjectInput {
  trackId: string
  subjectId: string
  curriculumOrigin: CurriculumType
  weeklyPeriods: number
  isCore: boolean
  gradeWeight?: number
}

// Query keys
const curriculumTracksKeys = {
  all: ['curriculumTracks'] as const,
  lists: () => [...curriculumTracksKeys.all, 'list'] as const,
  list: (schoolId: string | undefined) => [...curriculumTracksKeys.lists(), schoolId] as const,
  details: () => [...curriculumTracksKeys.all, 'detail'] as const,
  detail: (id: string) => [...curriculumTracksKeys.details(), id] as const,
  subjects: (trackId: string) => [...curriculumTracksKeys.all, 'subjects', trackId] as const,
  classAssignments: (classId: string) => [...curriculumTracksKeys.all, 'classAssignments', classId] as const,
  studentAssignments: (studentId: string) => [...curriculumTracksKeys.all, 'studentAssignments', studentId] as const,
}

// Fetch curriculum tracks
export function useCurriculumTracks(schoolId: string | undefined) {
  return useQuery({
    queryKey: curriculumTracksKeys.list(schoolId),
    queryFn: async () => {
      if (!schoolId) return []
      const response = await curriculumTracksApi.list(schoolId)
      return (response.data as SchoolCurriculumTrack[]) || []
    },
    enabled: !!schoolId,
  })
}

// Fetch single track
export function useCurriculumTrack(trackId: string | undefined) {
  return useQuery({
    queryKey: curriculumTracksKeys.detail(trackId || ''),
    queryFn: async () => {
      if (!trackId) return null
      const response = await curriculumTracksApi.getById(trackId)
      return response.data as SchoolCurriculumTrack
    },
    enabled: !!trackId,
  })
}

// Fetch track subjects
export function useTrackSubjects(trackId: string | undefined) {
  return useQuery({
    queryKey: curriculumTracksKeys.subjects(trackId || ''),
    queryFn: async () => {
      if (!trackId) return []
      const response = await curriculumTracksApi.getSubjects(trackId)
      return (response.data as TrackSubject[]) || []
    },
    enabled: !!trackId,
  })
}

// Create curriculum track
export function useCreateCurriculumTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCurriculumTrackInput) => {
      const response = await curriculumTracksApi.create(input as unknown as Record<string, unknown>)
      return response.data as SchoolCurriculumTrack
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.list(variables.schoolId) })
    },
  })
}

// Update curriculum track
export function useUpdateCurriculumTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateCurriculumTrackInput & { id: string }) => {
      const response = await curriculumTracksApi.update(id, input as unknown as Record<string, unknown>)
      return response.data as SchoolCurriculumTrack
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.all })
    },
  })
}

// Delete curriculum track
export function useDeleteCurriculumTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (trackId: string) => {
      await curriculumTracksApi.delete(trackId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.all })
    },
  })
}

// Add subject to track
export function useAddTrackSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddTrackSubjectInput) => {
      const response = await curriculumTracksApi.addSubject(input.trackId, input as unknown as Record<string, unknown>)
      return response.data as TrackSubject
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.subjects(variables.trackId) })
    },
  })
}

// Remove subject from track
export function useRemoveTrackSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ trackId, subjectId }: { trackId: string; subjectId: string }) => {
      await curriculumTracksApi.removeSubject(trackId, subjectId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.subjects(variables.trackId) })
    },
  })
}

// Assign class to track
export function useAssignClassTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { classId: string; trackId: string; academicYear: string }) => {
      const response = await curriculumTracksApi.assignToClass({ classId: input.classId, trackId: input.trackId, isPrimary: true })
      return response.data as ClassCurriculumTrack
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.classAssignments(variables.classId) })
    },
  })
}

// Assign student to track
export function useAssignStudentTrack() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { studentId: string; trackId: string; academicYear: string }) => {
      const response = await curriculumTracksApi.assignToStudent({ studentId: input.studentId, trackId: input.trackId })
      return response.data as StudentCurriculumTrack
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: curriculumTracksKeys.studentAssignments(variables.studentId) })
    },
  })
}
