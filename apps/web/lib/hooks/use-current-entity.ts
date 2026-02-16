/**
 * Hook to resolve the current user's entity (Student/Teacher/Parent/SchoolAdmin)
 * 
 * Uses the `me` query which returns the User with embedded entity relationships.
 * This is the proper GraphQL way - one query gets everything!
 * 
 * For SCHOOL_ADMIN users who don't have an entity, we fetch available schools
 * and auto-select one (or use stored selection from localStorage).
 * 
 * Query: me { id email role student { id schoolId } teacher { id schoolId } parent { id } }
 */

import * as React from 'react'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore, useUser } from '@/lib/stores'
import { graphqlClient, queries } from '@/lib/api/graphql'
import { UserRole } from '@mozedu/types'

// ==================== CONSTANTS ====================
const ADMIN_SCHOOL_STORAGE_KEY = 'mozedu-admin-school-id'

// ==================== TYPES ====================

interface Student {
  id: string
  userId: string
  schoolId: string
  studentNumber: string
  classId?: string
  gpa?: number
  attendanceRate?: number
  currentBalance?: number
}

interface Teacher {
  id: string
  userId: string
  schoolId: string
  employeeId?: string
  specialization?: string
}

interface Parent {
  id: string
  userId: string
  children?: Array<{
    id: string
    studentNumber: string
    user: { firstName: string; lastName: string }
  }>
}

interface School {
  id: string
  name: string
  code: string
  logoUrl?: string | null
  province: string
  city: string
  address: string
  principalName: string
  statistics?: {
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    averageAttendanceRate: number
    averageGPA: number
  }
}

interface SchoolEdge {
  node: School
  cursor: string
}

interface SchoolsResponse {
  schools: {
    edges: SchoolEdge[]
    pageInfo: {
      totalCount: number
      hasNextPage: boolean
    }
  }
}

interface MeUser {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
  phoneNumber?: string
  isActive: boolean
  // Role-based entities - only one will be non-null
  student?: Student | null
  teacher?: Teacher | null
  parent?: Parent | null
}

// ==================== QUERY ====================

/**
 * Single GraphQL query to get the current user with all their entity data.
 * This is the GraphQL way - one round-trip gets everything!
 */
const GET_ME = `
  query Me {
    me {
      id
      email
      role
      firstName
      lastName
      phoneNumber
      isActive
      student {
        id
        userId
        schoolId
        classId
        studentNumber
        gpa
        attendanceRate
        currentBalance
      }
      teacher {
        id
        userId
        schoolId
        employeeId
        specialization
      }
      parent {
        id
        userId
        children {
          id
          studentNumber
          user {
            firstName
            lastName
          }
        }
      }
    }
  }
`

// ==================== HOOK ====================

/**
 * Hook to find and store the current user's entity ID using the `me` query.
 * The `me` query returns the User with embedded Student/Teacher/Parent based on role.
 * 
 * For SCHOOL_ADMIN users:
 * - Fetches available schools
 * - Auto-selects first school if user hasn't selected one
 * - Persists selection in localStorage
 */
export function useCurrentEntity() {
  const user = useUser()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setEntityId = useAuthStore((state) => state.setEntityId)

  // Initialize adminSchoolId from localStorage synchronously to avoid flash
  const [adminSchoolId, setAdminSchoolId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ADMIN_SCHOOL_STORAGE_KEY)
    }
    return null
  })

  // Check if user is school admin
  const isSchoolAdmin = user?.role === UserRole.SCHOOL_ADMIN

  // For non-admin users, resolve their entity via the `me` query
  const shouldResolveEntity = !!(isAuthenticated && user?.id && !user?.entityId && !isSchoolAdmin)

  // Single query to get everything for students/teachers/parents
  const { data, isSuccess, isLoading: meQueryLoading } = useQuery({
    queryKey: ['me', user?.id],
    queryFn: () => graphqlClient<{ me: MeUser | null }>(GET_ME),
    enabled: shouldResolveEntity,
    staleTime: Infinity,
    retry: false,
  })

  // Determine the effective schoolId
  // Priority: user.schoolId (for students/teachers) > adminSchoolId (for school admins)
  const effectiveSchoolId = user?.schoolId || adminSchoolId

  // Fetch school details if we have a schoolId
  const { data: schoolData, isLoading: schoolLoading } = useQuery({
    queryKey: ['school', effectiveSchoolId],
    queryFn: () => graphqlClient<{ school: School }>(queries.school, { id: effectiveSchoolId }),
    enabled: !!effectiveSchoolId,
    staleTime: 5 * 60 * 1000,
  })

  // For SCHOOL_ADMIN users, ALWAYS fetch available schools when authenticated
  // Don't wait for any other initialization - just fetch schools
  const { data: schoolsData, isLoading: schoolsLoading } = useQuery({
    queryKey: ['schools-for-admin'],
    queryFn: () => graphqlClient<SchoolsResponse>(queries.schools, { pagination: { first: 100 } }),
    enabled: isSchoolAdmin && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  // Auto-select first school for admin if none selected
  React.useEffect(() => {
    if (isSchoolAdmin && schoolsData?.schools?.edges?.length && !adminSchoolId) {
      const firstSchool = schoolsData.schools.edges[0]?.node
      if (firstSchool?.id) {
        console.log('[Auth] Auto-selecting school for admin:', firstSchool.id, firstSchool.name)
        setAdminSchoolId(firstSchool.id)
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_SCHOOL_STORAGE_KEY, firstSchool.id)
        }
        // Also set it in the auth store
        setEntityId(user?.id || '', firstSchool.id)
      }
    }
  }, [isSchoolAdmin, schoolsData, adminSchoolId, setEntityId, user?.id])

  // Effect to set the entity ID when data is received (for students/teachers/parents)
  useEffect(() => {
    if (!user || user.entityId || !isSuccess || !data?.me) return

    const me = data.me

    // Check each role-based entity
    if (me.student) {
      setEntityId(me.student.id, me.student.schoolId)
      console.log('[Auth] Resolved student entity:', me.student.id, 'schoolId:', me.student.schoolId)
    } else if (me.teacher) {
      setEntityId(me.teacher.id, me.teacher.schoolId)
      console.log('[Auth] Resolved teacher entity:', me.teacher.id, 'schoolId:', me.teacher.schoolId)
    } else if (me.parent) {
      setEntityId(me.parent.id)
      console.log('[Auth] Resolved parent entity:', me.parent.id)
    } else {
      console.log('[Auth] User has no entity (role:', me.role, ')')
    }
  }, [user, data, isSuccess, setEntityId])

  // Build list of available schools for admin
  const availableSchools = React.useMemo(() => {
    if (!isSchoolAdmin || !schoolsData?.schools?.edges) return []
    return schoolsData.schools.edges.map(edge => edge.node)
  }, [isSchoolAdmin, schoolsData])

  // Function to change the admin's selected school
  const setAdminSchool = React.useCallback((schoolId: string) => {
    if (isSchoolAdmin) {
      setAdminSchoolId(schoolId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_SCHOOL_STORAGE_KEY, schoolId)
      }
      // Update auth store
      setEntityId(user?.id || '', schoolId)
      console.log('[Auth] Admin changed school to:', schoolId)
    }
  }, [isSchoolAdmin, setEntityId, user?.id])

  // Calculate loading state
  // For SCHOOL_ADMIN: loading if schools haven't been fetched yet and we don't have a stored schoolId
  // For others: loading if we need to resolve entity and query is in progress
  const isLoading = isSchoolAdmin
    ? (!effectiveSchoolId && schoolsLoading)
    : (shouldResolveEntity && meQueryLoading) || schoolLoading

  return {
    entityId: user?.entityId,
    schoolId: effectiveSchoolId || undefined,
    isResolved: !!user?.entityId || (isSchoolAdmin && !!effectiveSchoolId),
    isLoading,
    userId: user?.id,
    role: user?.role,
    // Also expose the full entity data for convenience
    studentData: data?.me?.student,
    teacherData: data?.me?.teacher,
    parentData: data?.me?.parent,
    currentSchool: schoolData?.school,
    // Admin-specific
    availableSchools,
    setAdminSchool,
    isSchoolAdmin,
  }
}

/**
 * Hook to get the current student's ID
 * Returns the entityId if the user is a student, null otherwise
 */
export function useStudentId(): string | null {
  const user = useUser()

  if (user?.role !== UserRole.STUDENT) return null

  return user.entityId || null
}

/**
 * Hook to get the current teacher's ID
 * Returns the entityId if the user is a teacher, null otherwise
 */
export function useTeacherId(): string | null {
  const user = useUser()

  if (user?.role !== UserRole.TEACHER) return null

  return user.entityId || null
}

/**
 * Hook to get the current parent's ID
 * Returns the entityId if the user is a parent, null otherwise
 */
export function useParentId(): string | null {
  const user = useUser()

  if (user?.role !== UserRole.PARENT) return null

  return user.entityId || null
}

/**
 * Hook to get the current school ID
 * Returns the schoolId from the entity (for students, teachers)
 */
export function useSchoolId(): string | null {
  const user = useUser()
  return user?.schoolId || null
}
