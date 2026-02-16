/**
 * React Query Hooks for Students
 * Following Context7 TanStack Query best practices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { studentsApi, gql, ApiError } from '../api'

// ==================== QUERY KEYS ====================

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: { schoolId?: string; page?: number; limit?: number }) =>
    [...studentKeys.lists(), filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
}

// ==================== TYPES ====================

export interface StudentListFilters {
  schoolId?: string
  page?: number
  limit?: number
}

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string
  gradeLevel: number
  gender: string
  status: string
  schoolId: string
  classId: string
  enrollmentDate: string
  profilePhoto?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  parents?: Array<{
    user: {
      firstName: string
      lastName: string
      phoneNumber: string
    }
    relationship: string
  }>
}

export interface StudentListResponse {
  edges: Array<{ node: Student }>
  pageInfo: {
    hasNextPage: boolean
    hasPreviousPage: boolean
    totalCount: number
  }
}

// ==================== QUERIES ====================

/**
 * Hook to fetch list of students
 * Uses GraphQL for rich data
 */
export function useStudents(filters: StudentListFilters = {}) {
  return useQuery({
    queryKey: studentKeys.list(filters),
    queryFn: async () => {
      const result = await gql.students(
        { schoolId: filters.schoolId },  // filter
        { first: filters.limit || 100 }   // pagination
      )
      const edges = result.students?.edges || []
      const pageInfo = result.students?.pageInfo as any
      return {
        students: edges.map((edge: any) => ({
          ...edge.node,
          firstName: edge.node.user?.firstName || '',
          lastName: edge.node.user?.lastName || '',
          email: edge.node.user?.email || '',
          studentId: edge.node.studentNumber, // Map studentNumber to studentId
        })) as Student[],
        total: pageInfo?.totalCount || 0
      }
    },
    enabled: !!filters.schoolId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch a single student by ID
 */
export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: async () => {
      const result = await gql.student(id)
      return result.student as Student
    },
    enabled: !!id, // Only fetch if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ==================== MUTATIONS ====================

export interface CreateStudentData {
  school_id: string
  class_id?: string
  first_name: string
  last_name: string
  student_number?: string
  grade_level: number
  enrollment_date: string
  email?: string
  date_of_birth?: string
  gender?: 'Male' | 'Female'
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_info?: string
  parent_email?: string
  parent_first_name?: string
  parent_last_name?: string
  parent_phone?: string
  parent_relationship?: 'FATHER' | 'MOTHER' | 'GUARDIAN'
}

/**
 * Hook to create a new student
 */
export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateStudentData) => {
      const response = await studentsApi.create(data)
      return response.data as Student
    },
    onSuccess: () => {
      // Invalidate all student list queries
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
  })
}

/**
 * Hook to update a student
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
      const response = await studentsApi.update(id, data as Record<string, unknown>)
      return response.data as Student
    },
    onSuccess: (data, variables) => {
      // Update the cache for this specific student
      queryClient.setQueryData(studentKeys.detail(variables.id), data)
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
  })
}

/**
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await studentsApi.delete(id)
      return id
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: studentKeys.detail(deletedId) })
      // Invalidate list queries
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() })
    },
  })
}
