/**
 * React Query Hooks for Grades
 * Following Context7 TanStack Query best practices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gradesApi, gql } from '../api'

// ==================== QUERY KEYS ====================

export const gradeKeys = {
  all: ['grades'] as const,
  student: (studentId: string) => [...gradeKeys.all, 'student', studentId] as const,
  studentTerm: (studentId: string, term?: string, academicYear?: string) =>
    [...gradeKeys.student(studentId), { term, academicYear }] as const,
  gpa: (studentId: string, academicYear?: string, term?: string) =>
    [...gradeKeys.all, 'gpa', studentId, { academicYear, term }] as const,
}

// ==================== TYPES ====================

export interface Grade {
  id: string
  gradeType: string
  score: number
  maxScore: number
  percentage: number
  weight?: number
  comments?: string
  isPublished?: boolean
  academicYear: string
  term: string
  subject?: {
    name: string
  }
  teacher?: {
    user?: {
      firstName: string
      lastName: string
    }
  }
  // Legacy fields for compatibility
  studentId?: string
  subjectId?: string
  subjectName?: string
  letterGrade?: string
  createdAt?: string
}

export interface CreateGradeData {
  student_id: string
  subject_id: string
  teacher_id: string
  class_id: string
  score: number
  max_score: number
  grade_type: 'QUIZ' | 'ASSIGNMENT' | 'MIDTERM' | 'FINAL' | 'EXAM' | 'PROJECT'
  term: string
  academic_year: string
  weight?: number
  comments?: string
}

// ==================== QUERIES ====================

/**
 * Hook to fetch student grades
 */
export function useStudentGrades(
  studentId: string,
  options?: { term?: string; academicYear?: string; enabled?: boolean }
) {
  const isEnabled = options?.enabled !== undefined ? options.enabled : !!studentId
  
  return useQuery({
    queryKey: gradeKeys.studentTerm(studentId, options?.term, options?.academicYear),
    queryFn: async (): Promise<Grade[]> => {
      try {
        const filter = {
          academicYear: options?.academicYear,
          term: options?.term,
          isPublished: true,
        }
        const result = await gql.studentGrades(studentId, filter, { first: 100 })
        
        // Transform edges to flat array
        return (result.studentGrades?.edges || []).map((edge: any) => {
          const node = edge.node
          return {
            ...node,
            subjectName: node.subject?.name,
          } as Grade
        })
      } catch (error) {
        console.error('Failed to fetch student grades:', error)
        return []
      }
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - grades don't change frequently
  })
}

/**
 * Hook to fetch student GPA
 */
export function useStudentGPA(
  studentId: string,
  options?: { academicYear?: string; term?: string }
) {
  return useQuery({
    queryKey: gradeKeys.gpa(studentId, options?.academicYear, options?.term),
    queryFn: async () => {
      try {
        const result = await gql.studentGPA(studentId, options?.academicYear, options?.term)
        return result.studentGPA || 0
      } catch (error) {
        console.error('Failed to fetch student GPA:', error)
        return 0
      }
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== MUTATIONS ====================

/**
 * Hook to create a grade
 */
export function useCreateGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGradeData) => {
      const response = await gradesApi.create(data)
      return response.data as Grade
    },
    onSuccess: (_, variables) => {
      // Invalidate student grades
      queryClient.invalidateQueries({ 
        queryKey: gradeKeys.student(variables.student_id) 
      })
    },
  })
}

/**
 * Hook to update a grade
 */
export function useUpdateGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Grade> }) => {
      const response = await gradesApi.update(id, data as Record<string, unknown>)
      return response.data as Grade
    },
    onSuccess: (data) => {
      // Invalidate student grades
      if (data.studentId) {
        queryClient.invalidateQueries({ 
          queryKey: gradeKeys.student(data.studentId) 
        })
      }
    },
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate letter grade from percentage
 */
export function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 80) return 'B'
  if (percentage >= 70) return 'C'
  if (percentage >= 60) return 'D'
  return 'F'
}

/**
 * Calculate GPA from grades
 */
export function calculateGPA(grades: Grade[]): number {
  if (grades.length === 0) return 0

  const gradePoints: Record<string, number> = {
    'A': 4.0,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0,
  }

  const totalPoints = grades.reduce((sum, grade) => {
    const letter = grade.letterGrade || getLetterGrade(grade.percentage)
    return sum + (gradePoints[letter] || 0)
  }, 0)

  return Math.round((totalPoints / grades.length) * 100) / 100
}
