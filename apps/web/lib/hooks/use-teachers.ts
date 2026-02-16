/**
 * Teacher Hooks for fetching teacher-related data
 * Uses REST API and GraphQL
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { graphqlClient } from '../api/graphql'
import { teachersApi, attendanceApi, gradesApi, usersApi, ApiError } from '../api/client'

// ==================== QUERY KEYS ====================

export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters: TeacherListFilters) => [...teacherKeys.lists(), filters] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: string) => [...teacherKeys.details(), id] as const,
  classes: (teacherId: string) => [...teacherKeys.all, 'classes', teacherId] as const,
  schedule: (teacherId: string) => [...teacherKeys.all, 'schedule', teacherId] as const,
  stats: (teacherId: string) => [...teacherKeys.all, 'stats', teacherId] as const,
}

// ==================== TYPES ====================

export interface TeacherListFilters {
  page?: number
  limit?: number
  schoolId?: string
  subjectId?: string
  status?: string
}

export interface Teacher {
  id: string
  teacherNumber: string
  qualification: string
  hireDate: string
  specialization?: string
  status: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    phone?: string
  }
  school?: {
    id: string
    name: string
  }
  subjects?: Array<{ id: string; name: string }>
  classes?: Array<{ id: string; name: string; gradeLevel: number }>
}

export interface TeacherClass {
  id: string
  name: string
  gradeLevel: number
  section: string
  students: number
  subject: string
  schedule?: Array<{
    day: number
    startTime: string
    endTime: string
    room: string
  }>
}

export interface TeacherStats {
  totalStudents: number
  totalClasses: number
  averageClassGrade: number
  averageAttendance: number
  pendingGrades: number
  pendingAttendance: number
}

// ==================== HOOKS ====================

/**
 * Fetch list of teachers using GraphQL
 */
export function useTeachers(filters: TeacherListFilters = {}) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: async () => {
      if (!filters.schoolId) {
        return []
      }

      const result = await graphqlClient<{
        teachers: {
          edges: Array<{
            node: {
              id: string
              employeeId: string
              specialization?: string
              qualifications?: string
              user: {
                id: string
                firstName: string
                lastName: string
                email: string
                role: string
                phoneNumber?: string
              }
              classes?: Array<{
                class: {
                  id: string
                  name: string
                  gradeLevel: number
                }
                subject: {
                  id: string
                  name: string
                }
              }>
            }
          }>
          pageInfo: {
            totalCount: number
            hasNextPage: boolean
          }
        }
      }>(
        `query GetTeachersBySchool($schoolId: UUID!, $pagination: PaginationInput) {
          teachers(filter: { schoolId: $schoolId }, pagination: $pagination) {
            edges {
              node {
                id
                employeeId
                specialization
                qualifications
                user {
                  id
                  firstName
                  lastName
                  email
                  role
                  phoneNumber
                }
                classes {
                  class {
                    id
                    name
                    gradeLevel
                  }
                  subject {
                    id
                    name
                  }
                }
              }
            }
            pageInfo {
              totalCount
              hasNextPage
            }
          }
        }`,
        {
          schoolId: filters.schoolId,
          pagination: {
            first: filters.limit || 100,
          },
        }
      )

      return result.teachers.edges.map(edge => ({
        id: edge.node.id,
        teacherNumber: edge.node.employeeId,
        qualification: edge.node.qualifications || edge.node.specialization || 'N/A',
        specialization: edge.node.specialization,
        status: 'ACTIVE', // Default to ACTIVE as backend doesn't have status field yet
        user: {
          id: edge.node.user.id,
          firstName: edge.node.user.firstName,
          lastName: edge.node.user.lastName,
          email: edge.node.user.email,
          role: edge.node.user.role || 'TEACHER', // Assuming backend returns role field now
          phone: edge.node.user.phoneNumber,
        },
        classes: edge.node.classes?.map(c => ({
          id: c.class.id,
          name: c.class.name,
          gradeLevel: c.class.gradeLevel,
        })) || [],
        subjects: edge.node.classes?.map(c => ({
          id: c.subject.id,
          name: c.subject.name,
        })) || [],
      }))
    },
    enabled: !!filters.schoolId,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch single teacher by ID
 */
export function useTeacher(id: string) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: async () => {
      const response = await teachersApi.getById(id)
      return response.data as Teacher
    },
    enabled: !!id,
  })
}

/**
 * Fetch teacher's classes via the Teacher.classes relationship
 * Uses teacher(id) query which returns TeacherClass[] with class and subject info
 */
export function useTeacherClasses(teacherId: string) {
  return useQuery({
    queryKey: teacherKeys.classes(teacherId),
    queryFn: async (): Promise<TeacherClass[]> => {
      try {
        const result = await graphqlClient<{
          teacher: {
            id: string
            classes: Array<{
              id: string
              class: {
                id: string
                name: string
                gradeLevel: number
                section: string
                students: {
                  pageInfo: { totalCount: number }
                }
              }
              subject: {
                id: string
                name: string
              }
            }>
          } | null
        }>(
          `query GetTeacherWithClasses($teacherId: UUID!) {
            teacher(id: $teacherId) {
              id
              classes {
                id
                class {
                  id
                  name
                  gradeLevel
                  section
                  students(pagination: { first: 0 }) {
                    pageInfo {
                      totalCount
                    }
                  }
                }
                subject {
                  id
                  name
                }
              }
            }
          }`,
          { teacherId }
        )

        if (!result.teacher) return []

        return (result.teacher.classes || []).map(tc => ({
          id: tc.class.id,
          name: tc.class.name,
          gradeLevel: tc.class.gradeLevel,
          section: tc.class.section || '',
          students: tc.class.students?.pageInfo?.totalCount || 0,
          subject: tc.subject?.name || '',
        }))
      } catch (error) {
        console.error('Failed to fetch teacher classes:', error)
        return []
      }
    },
    enabled: !!teacherId,
    staleTime: 60 * 1000,
  })
}

/**
 * Fetch teacher's today schedule using attendance sessions
 * Uses activeSessionsByTeacher or attendanceSessions query
 */
export function useTeacherSchedule(teacherId: string, date?: string) {
  const today = date || new Date().toISOString().split('T')[0]

  return useQuery({
    queryKey: teacherKeys.schedule(teacherId),
    queryFn: async () => {
      try {
        // Get teacher's classes first, then check for active sessions
        const result = await graphqlClient<{
          activeSessionsByTeacher: Array<{
            id: string
            class: { id: string; name: string }
            subject: { id: string; name: string }
            startTime: string
            endTime: string
            isActive: boolean
          }>
        }>(
          `query GetTeacherActiveSessions($teacherId: UUID!) {
            activeSessionsByTeacher(teacherId: $teacherId) {
              id
              class {
                id
                name
              }
              subject {
                id
                name
              }
              startTime
              endTime
              isActive
            }
          }`,
          { teacherId }
        )

        return (result.activeSessionsByTeacher || []).map(session => ({
          id: session.id,
          class: session.class,
          subject: session.subject,
          startTime: session.startTime,
          endTime: session.endTime,
          room: '', // Not in current schema
          status: session.isActive ? 'active' : 'completed',
        }))
      } catch (error) {
        console.error('Failed to fetch teacher schedule:', error)
        return []
      }
    },
    enabled: !!teacherId,
    staleTime: 30 * 1000,
  })
}

/**
 * Fetch teacher statistics
 * Computes stats from teacher's classes and related data
 */
export function useTeacherStats(teacherId: string) {
  return useQuery({
    queryKey: teacherKeys.stats(teacherId),
    queryFn: async (): Promise<TeacherStats> => {
      try {
        // Get teacher with classes, then aggregate stats
        const result = await graphqlClient<{
          teacher: {
            id: string
            classes: Array<{
              id: string
              class: {
                id: string
                name: string
                students: {
                  pageInfo: { totalCount: number }
                }
              }
            }>
          } | null
        }>(
          `query GetTeacherForStats($teacherId: UUID!) {
            teacher(id: $teacherId) {
              id
              classes {
                id
                class {
                  id
                  name
                  students {
                    pageInfo {
                      totalCount
                    }
                  }
                }
              }
            }
          }`,
          { teacherId }
        )

        if (!result.teacher) {
          return {
            totalStudents: 0,
            totalClasses: 0,
            averageClassGrade: 0,
            averageAttendance: 0,
            pendingGrades: 0,
            pendingAttendance: 0,
          }
        }

        const classes = result.teacher.classes || []
        const totalStudents = classes.reduce(
          (sum, tc) => sum + (tc.class.students?.pageInfo?.totalCount || 0),
          0
        )

        return {
          totalStudents,
          totalClasses: classes.length,
          averageClassGrade: 0, // Would need grade analytics query
          averageAttendance: 0, // Would need attendance analytics query
          pendingGrades: 0,
          pendingAttendance: 0,
        }
      } catch (error) {
        console.error('Failed to fetch teacher stats:', error)
        return {
          totalStudents: 0,
          totalClasses: 0,
          averageClassGrade: 0,
          averageAttendance: 0,
          pendingGrades: 0,
          pendingAttendance: 0,
        }
      }
    },
    enabled: !!teacherId,
    staleTime: 30 * 1000,
  })
}

/**
 * Create attendance session
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
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
  })
}

/**
 * Submit grade
 */
export function useSubmitGrade() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
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
    }) => {
      const response = await gradesApi.create(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
    },
  })
}

// ==================== TEACHER MANAGEMENT HOOKS ====================

/**
 * Create a new teacher
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      first_name: string
      last_name: string
      email: string
      phone_number?: string
      school_id: string
      employee_id?: string
      department?: string
      specialization?: string
      qualifications?: string
      years_of_experience?: number
      hire_date: string
    }) => {
      // API client will send this directly to backend which now handles user creation
      const response = await teachersApi.create(data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
    },
  })
}

/**
 * Update a teacher
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: {
        employee_id?: string
        department?: string
        specialization?: string
        qualifications?: string
        years_of_experience?: number
        hire_date?: string
        status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
        max_periods_per_day?: number
        max_periods_per_week?: number
        notes?: string
      }
    }) => {
      const response = await teachersApi.update(id, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() })
    },
  })
}

/**
 * Delete a teacher
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await teachersApi.delete(id)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
    },
  })
}

/**
 * Update a user's role (e.g. promote to Admin)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await usersApi.updateRole(userId, role)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.all })
    },
  })
}

// ==================== CLASS ASSIGNMENT HOOKS ====================

/**
 * Get teacher's class assignments
 */
export function useTeacherClassAssignments(teacherId: string) {
  return useQuery({
    queryKey: [...teacherKeys.classes(teacherId), 'assignments'],
    queryFn: async () => {
      const response = await teachersApi.getClasses(teacherId)
      return response
    },
    enabled: !!teacherId,
  })
}

/**
 * Assign a class to teacher
 */
export function useAssignClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teacherId, data }: {
      teacherId: string
      data: {
        class_id: string
        subject_id: string
        is_main?: boolean
        periods_per_week?: number
        academic_year?: string
      }
    }) => {
      const response = await teachersApi.assignClass(teacherId, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.classes(variables.teacherId) })
    },
  })
}

/**
 * Unassign a class from teacher
 */
export function useUnassignClass() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teacherId, classId, subjectId }: {
      teacherId: string
      classId: string
      subjectId: string
    }) => {
      const response = await teachersApi.unassignClass(teacherId, classId, subjectId)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.classes(variables.teacherId) })
    },
  })
}

// ==================== SUBJECT QUALIFICATION HOOKS ====================

/**
 * Get teacher's subject qualifications
 */
export function useTeacherSubjects(teacherId: string) {
  return useQuery({
    queryKey: [...teacherKeys.all, 'subjects', teacherId],
    queryFn: async () => {
      const response = await teachersApi.getSubjects(teacherId)
      return response
    },
    enabled: !!teacherId,
  })
}

/**
 * Add subject qualification to teacher
 */
export function useAddTeacherSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teacherId, data }: {
      teacherId: string
      data: {
        subject_id: string
        is_primary?: boolean
        certification?: string
      }
    }) => {
      const response = await teachersApi.addSubject(teacherId, data)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'subjects', variables.teacherId] })
    },
  })
}

/**
 * Remove subject qualification from teacher
 */
export function useRemoveTeacherSubject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teacherId, subjectId }: {
      teacherId: string
      subjectId: string
    }) => {
      const response = await teachersApi.removeSubject(teacherId, subjectId)
      return response
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'subjects', variables.teacherId] })
    },
  })
}

// ==================== AVAILABILITY HOOKS ====================

/**
 * Get teacher's availability
 */
export function useTeacherAvailability(schoolId: string, teacherId: string) {
  return useQuery({
    queryKey: [...teacherKeys.all, 'availability', schoolId, teacherId],
    queryFn: async () => {
      const response = await teachersApi.getAvailability(teacherId)
      return response.data
    },
    enabled: !!schoolId && !!teacherId,
  })
}

/**
 * Set teacher availability
 */
export function useSetTeacherAvailability(schoolId: string, teacherId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      day_of_week: string
      start_time: string
      end_time: string
      is_available: boolean
      reason?: string
      is_preference?: boolean
      priority?: number
      is_recurring?: boolean
      specific_date?: string
      academic_year?: string
    }) => {
      const response = await teachersApi.setAvailability(teacherId, {
        ...data,
        day_of_week: data.day_of_week,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'availability', schoolId, teacherId] })
    },
  })
}

/**
 * Update teacher availability
 */
export function useUpdateTeacherAvailability(schoolId: string, teacherId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ availabilityId, data }: {
      availabilityId: string
      data: {
        day_of_week?: string
        start_time?: string
        end_time?: string
        is_available?: boolean
        reason?: string
        is_preference?: boolean
        priority?: number
      }
    }) => {
      const response = await teachersApi.updateAvailability(teacherId, availabilityId, {
        ...data,
        day_of_week: data.day_of_week,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'availability', schoolId, teacherId] })
    },
  })
}

/**
 * Delete teacher availability
 */
export function useDeleteTeacherAvailability(schoolId: string, teacherId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (availabilityId: string) => {
      const response = await teachersApi.deleteAvailability(teacherId, availabilityId)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'availability', schoolId, teacherId] })
    },
  })
}

/**
 * Approve teacher availability (Admin only)
 */
export function useApproveTeacherAvailability(schoolId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teacherId, availabilityId, approved, admin_notes }: {
      teacherId: string
      availabilityId: string
      approved: boolean
      admin_notes?: string
    }) => {
      const response = await teachersApi.approveAvailability(teacherId, availabilityId, { approved, admin_notes })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...teacherKeys.all, 'availability', schoolId, variables.teacherId] })
    },
  })
}

