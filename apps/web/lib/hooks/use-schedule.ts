/**
 * Schedule Hooks for managing timetable generation and viewing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi, timetableApi } from '../api/client'

// ==================== QUERY KEYS ====================

export const scheduleKeys = {
  all: ['schedule'] as const,
  templates: (schoolId: string) => [...scheduleKeys.all, 'templates', schoolId] as const,
  template: (schoolId: string, templateId: string) => [...scheduleKeys.templates(schoolId), templateId] as const,
  teacherSchedule: (schoolId: string, teacherId: string, date?: string) => 
    [...scheduleKeys.all, 'teacher', teacherId, date] as const,
  classSchedule: (schoolId: string, classId: string, date?: string) => 
    [...scheduleKeys.all, 'class', classId, date] as const,
  roomSchedule: (schoolId: string, roomId: string, date?: string) => 
    [...scheduleKeys.all, 'room', roomId, date] as const,
  constraints: (schoolId: string) => [...scheduleKeys.all, 'constraints', schoolId] as const,
  availabilitySummary: (schoolId: string, dayOfWeek?: number) => 
    [...scheduleKeys.all, 'availability', schoolId, dayOfWeek] as const,
}

// ==================== TYPES ====================

export interface TimetableTemplate {
  id: string
  school_id: string
  name: string
  academic_year: string
  term?: string
  curriculum_type: string
  status: string
  start_date: string
  end_date: string
  generated_by?: string
  generation_algorithm?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableSlot {
  id: string
  template_id: string
  period_id: string
  day_of_week: string
  start_time: string
  end_time: string
  subject_id: string
  subject_name: string
  teacher_id: string
  teacher_name: string
  class_id: string
  class_name: string
  room_id: string
  room_name: string
}

export interface BreakConfiguration {
  morning_break_after_period: number
  morning_break_duration_minutes: number
  lunch_break_after_period: number
  lunch_break_duration_minutes: number
  afternoon_break_after_period?: number
  afternoon_break_duration_minutes?: number
}

export interface GenerateScheduleInput {
  name: string
  academic_year: string
  term: string
  curriculum_type: 'national' | 'cambridge'
  start_date: string
  end_date: string
  algorithm?: 'basic' | 'genetic'
  respect_preferences?: boolean
  max_periods_per_day?: number
  break_configuration?: BreakConfiguration
  constraints?: Record<string, unknown>
}

export interface ValidationResult {
  is_valid: boolean
  teacher_conflicts: TimetableSlot[]
  room_conflicts: TimetableSlot[]
  class_conflicts: TimetableSlot[]
  total_conflicts: number
  suggestions: string[]
}

export interface GenerationStats {
  total_slots: number
  slots_assigned: number
  teacher_conflicts: number
  room_conflicts: number
  preferences_respected: number
  preferences_violated: number
  generation_time_seconds: number
  algorithm: string
  warnings: string[]
}

export interface GenerateScheduleResponse {
  template: TimetableTemplate
  validation_result: ValidationResult
  generation_stats: GenerationStats
}

export interface TeacherAvailabilitySummary {
  teacher_id: string
  teacher_name: string
  available_slots: number
  preferred_slots: number
  unavailable_slots: number
  assigned_classes: number
  required_periods: number
  max_periods_per_day: number
  has_overload: boolean
}

export interface RoomAvailabilitySummary {
  room_id: string
  room_name: string
  room_type: string
  capacity: number
  available_slots: number
  unavailable_slots: number
}

export interface PotentialConflict {
  type: string
  description: string
  severity: 'warning' | 'error'
  suggestion: string
}

export interface SchedulingConstraints {
  total_teachers: number
  total_rooms: number
  total_classes: number
  teacher_availability: TeacherAvailabilitySummary[]
  room_availability: RoomAvailabilitySummary[]
  subject_requirements: Array<{
    subject_id: string
    subject_name: string
    periods_per_week: number
    requires_special_room: boolean
    available_teachers: number
    suitable_rooms: number
  }>
  potential_conflicts: PotentialConflict[]
  recommendations: string[]
}

export interface TimeSlotStatus {
  start_time: string
  end_time: string
  status: 'available' | 'unavailable' | 'preferred' | 'reserved'
  reason?: string
}

export interface AvailabilitySummary {
  date?: string
  day_of_week: number
  teacher_slots: Record<string, TimeSlotStatus[]>
  room_slots: Record<string, TimeSlotStatus[]>
  available_count: number
  unavailable_count: number
}

// ==================== HOOKS ====================

/**
 * Get all timetable templates for a school
 */
export function useTimetableTemplates(schoolId: string) {
  return useQuery({
    queryKey: scheduleKeys.templates(schoolId),
    queryFn: async () => {
      const response = await scheduleApi.getTemplates(schoolId)
      return response.data as TimetableTemplate[]
    },
    enabled: !!schoolId,
  })
}

/**
 * Get a specific timetable template
 */
export function useTimetableTemplate(schoolId: string, templateId: string) {
  return useQuery({
    queryKey: scheduleKeys.template(schoolId, templateId),
    queryFn: async () => {
      const response = await timetableApi.getTimetable(templateId)
      return response.data as TimetableTemplate
    },
    enabled: !!schoolId && !!templateId,
  })
}

/**
 * Generate a new schedule
 */
export function useGenerateSchedule(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: GenerateScheduleInput) => {
      const response = await scheduleApi.generate(schoolId, {
        name: data.name,
        academic_year: data.academic_year,
        term: data.term,
        curriculum_type: data.curriculum_type,
        start_date: data.start_date,
        end_date: data.end_date,
        algorithm: data.algorithm === 'basic' ? 'constraint' : 'genetic',
        options: {
          respect_preferences: data.respect_preferences,
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates(schoolId) })
    },
  })
}

/**
 * Activate a timetable template
 */
export function useActivateTimetable(schoolId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      await timetableApi.activateTimetable(templateId)
      return templateId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.templates(schoolId) })
    },
  })
}

/**
 * Validate a timetable
 */
export function useValidateTimetable(schoolId: string) {
  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await timetableApi.validateTimetable(templateId)
      return response.data
    },
  })
}

/**
 * Get teacher schedule
 */
export function useTeacherSchedule(schoolId: string, teacherId: string, date?: string) {
  return useQuery({
    queryKey: scheduleKeys.teacherSchedule(schoolId, teacherId, date),
    queryFn: async () => {
      const response = await timetableApi.getTeacherTimetable(schoolId, teacherId, date)
      return response.data as TimetableSlot[]
    },
    enabled: !!schoolId && !!teacherId,
  })
}

/**
 * Get class schedule
 */
export function useClassSchedule(schoolId: string, classId: string, date?: string) {
  return useQuery({
    queryKey: scheduleKeys.classSchedule(schoolId, classId, date),
    queryFn: async () => {
      const response = await timetableApi.getClassTimetable(schoolId, classId, date)
      return response.data as TimetableSlot[]
    },
    enabled: !!schoolId && !!classId,
  })
}

/**
 * Get room schedule
 */
export function useRoomSchedule(schoolId: string, roomId: string, date?: string) {
  return useQuery({
    queryKey: scheduleKeys.roomSchedule(schoolId, roomId, date),
    queryFn: async () => {
      const response = await timetableApi.getRoomTimetable(schoolId, roomId, date)
      return response.data as TimetableSlot[]
    },
    enabled: !!schoolId && !!roomId,
  })
}

/**
 * Get scheduling constraints analysis
 */
export function useSchedulingConstraints(schoolId: string) {
  return useQuery({
    queryKey: scheduleKeys.constraints(schoolId),
    queryFn: async () => {
      const response = await scheduleApi.getConstraints(schoolId)
      return response.data
    },
    enabled: !!schoolId,
  })
}

/**
 * Get availability summary for a day
 */
export function useAvailabilitySummary(schoolId: string, dayOfWeek?: number) {
  return useQuery({
    queryKey: scheduleKeys.availabilitySummary(schoolId, dayOfWeek),
    queryFn: async () => {
      const response = await scheduleApi.getAvailabilitySummary(schoolId)
      return response.data
    },
    enabled: !!schoolId,
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

/**
 * Get Portuguese day name from day of week number
 */
export function getDayNamePT(dayOfWeek: number): string {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  return days[dayOfWeek] || 'Desconhecido'
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`
}

/**
 * Get schedule for a specific day from an array of slots
 */
export function getScheduleForDay(slots: TimetableSlot[], dayOfWeek: string): TimetableSlot[] {
  return slots.filter(slot => slot.day_of_week.toLowerCase() === dayOfWeek.toLowerCase())
}

/**
 * Sort slots by start time
 */
export function sortSlotsByTime(slots: TimetableSlot[]): TimetableSlot[] {
  return [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time))
}

/**
 * Check if constraints allow schedule generation
 */
export function canGenerateSchedule(constraints: SchedulingConstraints): { 
  canGenerate: boolean
  blockers: string[] 
} {
  const blockers: string[] = []
  
  if (constraints.total_teachers === 0) {
    blockers.push('No teachers registered')
  }
  if (constraints.total_rooms === 0) {
    blockers.push('No rooms registered')
  }
  if (constraints.total_classes === 0) {
    blockers.push('No classes registered')
  }
  
  const criticalConflicts = constraints.potential_conflicts.filter(c => c.severity === 'error')
  if (criticalConflicts.length > 0) {
    blockers.push(...criticalConflicts.map(c => c.description))
  }
  
  return {
    canGenerate: blockers.length === 0,
    blockers,
  }
}

/**
 * Get status badge color based on template status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'green'
    case 'draft':
      return 'yellow'
    case 'archived':
      return 'gray'
    default:
      return 'blue'
  }
}

/**
 * Calculate schedule utilization percentage
 */
export function calculateUtilization(stats: GenerationStats): number {
  if (stats.total_slots === 0) return 0
  return Math.round((stats.slots_assigned / stats.total_slots) * 100)
}
