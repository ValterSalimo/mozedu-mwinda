/**
 * School Admin Hooks for managing school settings
 * Includes grade system configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '../api/client'

// ==================== QUERY KEYS ====================

export const schoolKeys = {
  all: ['schools'] as const,
  lists: () => [...schoolKeys.all, 'list'] as const,
  details: () => [...schoolKeys.all, 'detail'] as const,
  detail: (id: string) => [...schoolKeys.details(), id] as const,
  gradeSystem: (schoolId: string) => [...schoolKeys.all, 'gradeSystem', schoolId] as const,
  gradeSystemDefaults: (schoolId: string, systemType: string) => 
    [...schoolKeys.gradeSystem(schoolId), 'defaults', systemType] as const,
}

// ==================== TYPES ====================

export interface GradeBoundary {
  min_score: number
  max_score: number
  letter_grade: string
  gpa: number
  description: string
}

export type GradeSystemType = 
  | 'MOZAMBIQUE_NATIONAL'
  | 'CAMBRIDGE' 
  | 'ANGOLA_NATIONAL'
  | 'SOUTH_AFRICA_CAPS'
  | 'CONGO_NATIONAL'
  | 'PERCENTAGE' 
  | 'GPA' 
  | 'CUSTOM'

export interface GradeSystemConfig {
  id: string
  school_id: string
  system_type: GradeSystemType
  min_score: number
  max_score: number
  passing_score: number
  grade_boundaries: Record<string, GradeBoundary>
  show_percentage: boolean
  show_letter_grade: boolean
  show_gpa: boolean
  decimal_places: number
  rounding_mode: string
}

// ==================== HOOKS ====================

/**
 * Get school details
 */
export function useSchool(schoolId: string) {
  return useQuery({
    queryKey: schoolKeys.detail(schoolId),
    queryFn: async () => {
      const response = await schoolsApi.getById(schoolId)
      return response.data
    },
    enabled: !!schoolId,
  })
}

/**
 * Get grade system configuration for a school
 */
export function useGradeSystemConfig(schoolId: string) {
  return useQuery({
    queryKey: schoolKeys.gradeSystem(schoolId),
    queryFn: async () => {
      const response = await schoolsApi.getGradeSystemConfig(schoolId)
      return response.data
    },
    enabled: !!schoolId,
    retry: false, // Don't retry if config doesn't exist
  })
}

/**
 * Get default grade system boundaries
 */
export function useDefaultGradeSystem(schoolId: string, systemType: GradeSystemType) {
  return useQuery({
    queryKey: schoolKeys.gradeSystemDefaults(schoolId, systemType),
    queryFn: async () => {
      const response = await schoolsApi.getDefaultGradeSystem(schoolId, systemType)
      return response.data
    },
    enabled: !!schoolId && !!systemType,
  })
}

/**
 * Create grade system configuration
 */
export function useCreateGradeSystemConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ schoolId, data }: {
      schoolId: string
      data: {
        system_type: GradeSystemType
        min_score?: number
        max_score: number
        passing_score: number
        grade_boundaries?: Record<string, GradeBoundary>
        show_percentage?: boolean
        show_letter_grade?: boolean
        show_gpa?: boolean
        decimal_places?: number
        rounding_mode?: string
      }
    }) => {
      const response = await schoolsApi.createGradeSystemConfig(schoolId, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schoolKeys.gradeSystem(variables.schoolId) })
    },
  })
}

/**
 * Update grade system configuration
 */
export function useUpdateGradeSystemConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ schoolId, data }: {
      schoolId: string
      data: {
        system_type?: GradeSystemType
        min_score?: number
        max_score?: number
        passing_score?: number
        grade_boundaries?: Record<string, GradeBoundary>
        show_percentage?: boolean
        show_letter_grade?: boolean
        show_gpa?: boolean
        decimal_places?: number
        rounding_mode?: string
      }
    }) => {
      const response = await schoolsApi.updateGradeSystemConfig(schoolId, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: schoolKeys.gradeSystem(variables.schoolId) })
    },
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert a score to letter grade based on grade system config
 */
export function scoreToLetterGrade(score: number, config: GradeSystemConfig): string {
  if (!config.grade_boundaries) return 'N/A'
  
  for (const [, boundary] of Object.entries(config.grade_boundaries)) {
    if (score >= boundary.min_score && score <= boundary.max_score) {
      return boundary.letter_grade
    }
  }
  return 'N/A'
}

/**
 * Convert a score to GPA based on grade system config
 */
export function scoreToGPA(score: number, config: GradeSystemConfig): number {
  if (!config.grade_boundaries) return 0
  
  for (const [, boundary] of Object.entries(config.grade_boundaries)) {
    if (score >= boundary.min_score && score <= boundary.max_score) {
      return boundary.gpa
    }
  }
  return 0
}

/**
 * Check if a score is passing based on grade system config
 */
export function isPassing(score: number, config: GradeSystemConfig): boolean {
  return score >= config.passing_score
}

/**
 * Format a score based on grade system config
 */
export function formatScore(score: number, config: GradeSystemConfig): string {
  const formatted = score.toFixed(config.decimal_places || 1)
  
  if (config.show_percentage && config.max_score !== 100) {
    const percentage = ((score / config.max_score) * 100).toFixed(config.decimal_places || 1)
    return `${formatted} (${percentage}%)`
  }
  
  if (config.show_letter_grade) {
    const letter = scoreToLetterGrade(score, config)
    return `${formatted} (${letter})`
  }
  
  return formatted
}
