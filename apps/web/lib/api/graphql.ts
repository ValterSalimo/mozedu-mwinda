/**
 * GraphQL Client for Mwinda Backend
 * Lightweight GraphQL client using fetch
 */

import { getAccessToken, ApiError, authApi, setTokens } from './client'

const getGraphqlUrl = () => {
  const url = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8080/graphql'

  // Fail-safe: If running on localhost but URL points to production (api.mozedu.org), force localhost
  // This handles cases where production env vars are stuck in the build
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && url.includes('api.mozedu.org')) {
    console.warn('[GraphQL] Detected production URL on localhost. Forcing localhost endpoint.')
    return 'http://localhost:8080/graphql'
  }
  return url
}

const GRAPHQL_URL = getGraphqlUrl()
console.log('[GraphQL] Client configured with Endpoint:', GRAPHQL_URL)

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
    extensions?: Record<string, unknown>
  }>
}

export async function graphqlClient<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  retryCount = 0 // Adicionado para evitar loops infinitos
): Promise<T> {
  let token = getAccessToken()

  // If no token in memory, try to refresh immediately (handling page reload)
  if (!token && retryCount === 0) {
    try {
      const refreshResponse = await authApi.refresh()
      if (refreshResponse.success) {
        token = refreshResponse.data.accessToken
      }
    } catch (e) {
      // Ignore refresh error, proceed without token (public queries or login required)
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add Accept-Language header from user's locale preference
  if (typeof localStorage !== 'undefined') {
    const locale = localStorage.getItem('preferredLanguage') || 'pt';
    (headers as Record<string, string>)['Accept-Language'] = locale
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Add CSRF token header
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/csrf_token=([^;]+)/)
    if (match) {
      // HeadersInit can be Record<string, string>, but typescript needs casting or specific type handling
      (headers as Record<string, string>)['X-CSRF-Token'] = decodeURIComponent(match[1])
    }
  }

  let response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    credentials: 'include', // Send HttpOnly cookies (refresh token)
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  // Handle unauthorized - attempt token refresh if not already done significantly
  // Se o status for 401 direto (REST level)
  if (response.status === 401 && retryCount === 0) {
    try {
      const refreshResponse = await authApi.refresh()
      if (refreshResponse.success) {
        return graphqlClient(query, variables, 1) // Recursively retry
      }
    } catch (e) {
      // Refresh failed, throw original 401
    }
  }

  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After')
    throw new ApiError(
      429,
      retryAfter
        ? `Rate limited. Try again in ${retryAfter} seconds.`
        : 'Too many requests. Please slow down.',
      'RATE_LIMITED'
    )
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'GraphQL request failed')
  }

  const result: GraphQLResponse<T> = await response.json()

  // TRATAMENTO CRÍTICO: Se houver erro de autenticação dentro do JSON (Status 200)
  if (result.errors && result.errors.length > 0) {
    const error = result.errors[0]
    const isUnauth = error.message.toLowerCase().includes('not authenticated') ||
      error.message.toLowerCase().includes('unauthorized')

    if (isUnauth && retryCount === 0) {
      console.warn('[GraphQL] Not authenticated. Attempting token refresh...')
      try {
        const refreshResponse = await authApi.refresh()
        if (refreshResponse.success) {
          return graphqlClient(query, variables, 1) // Tenta novamente com novo token
        }
      } catch (e) {
        throw new ApiError(401, 'Sessão expirada. Faça login novamente.', 'UNAUTHORIZED')
      }
    }

    throw new ApiError(isUnauth ? 401 : 400, error.message, isUnauth ? 'UNAUTHORIZED' : 'GRAPHQL_ERROR')
  }

  return result.data as T
}

// ==================== GRAPHQL QUERIES ====================

export const queries = {
  // User Queries
  me: `
    query Me {
      me {
        id
        email
        firstName
        lastName
        role
        phoneNumber
        isActive
        student {
          id
          schoolId
          classId
          studentNumber
          profileImageUrl
        }
        teacher {
          id
          schoolId
          employeeId
          profileImageUrl
        }
        parent {
          id
          children {
            id
            studentNumber
            profileImageUrl
            gpa
            attendanceRate
            currentBalance
            user {
              firstName
              lastName
            }
            class {
              id
              name
              gradeLevel
            }
            school {
              id
              name
            }
          }
        }
      }
    }
  `,

  // Student Queries
  students: `
    query Students($filter: StudentFilterInput, $pagination: PaginationInput) {
      students(filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            studentNumber
            dateOfBirth
            gender
            profileImageUrl
            user {
              firstName
              lastName
              email
            }
            class {
              name
              gradeLevel
            }
            gpa
            attendanceRate
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
          startCursor
          endCursor
        }
      }
    }
  `,

  student: `
    query Student($id: UUID!) {
      student(id: $id) {
        id
        studentNumber
        dateOfBirth
        gender
        profileImageUrl
        user {
          id
          firstName
          lastName
          email
          phoneNumber
        }
        school {
          id
          name
          logoUrl
        }
        class {
          id
          name
          gradeLevel
        }
        parents {
          user {
            firstName
            lastName
            phoneNumber
          }
          relationship
        }
        gpa
        attendanceRate
        currentBalance
      }
    }
  `,

  studentsByClass: `
    query GetStudentsByClass($classId: UUID!) {
      studentsByClass(classId: $classId) {
        id
        studentNumber
        user {
          firstName
          lastName
        }
        attendanceRate
        gpa
        grades {
          score
          maxScore
          gradeType
          term
        }
      }
    }
  `,

  classAttendance: `
    query GetClassAttendance($classId: UUID!, $date: Time!) {
      classAttendance(classId: $classId, date: $date) {
        id
        status
        checkInTime
        student {
          id
          studentNumber
          user {
            firstName
            lastName
          }
        }
      }
    }
  `,

  activeSessionsByTeacher: `
    query ActiveSessionsByTeacher($teacherId: UUID!) {
      activeSessionsByTeacher(teacherId: $teacherId) {
        id
        startTime
        endTime
        isActive
        class {
          id
          name
        }
        subject {
          name
        }
        presentCount
        absentCount
      }
    }
  `,

  // Teacher Queries
  teachers: `
    query Teachers($filter: TeacherFilterInput, $pagination: PaginationInput) {
      teachers(filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            employeeId
            specialization
            qualifications
            user {
              firstName
              lastName
              email
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
        }
      }
    }
  `,

  teacher: `
    query GetTeacher($id: UUID!) {
      teacher(id: $id) {
        id
        employeeId
        specialization
        qualifications
        yearsOfExperience
        user {
          firstName
          lastName
          email
        }
        school {
          name
        }
        classes {
          class {
            id
            name
            gradeLevel
            students(pagination: { first: 100 }) {
              pageInfo {
                totalCount
              }
            }
          }
          subject {
            id
            name
          }
          isMain
        }
      }
    }
  `,

  teachersBySchool: `
    query GetTeachersBySchool($schoolId: UUID!, $pagination: PaginationInput) {
      teachers(filter: { schoolId: $schoolId }, pagination: $pagination) {
        edges {
          node {
            id
            employeeId
            specialization
            user {
              firstName
              lastName
              email
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          totalCount
        }
      }
    }
  `,

  // Attendance Queries
  attendanceSession: `
    query AttendanceSession($id: UUID!) {
      attendanceSession(id: $id) {
        id
        date
        startTime
        endTime
        isActive
        class {
          name
        }
        subject {
          name
        }
        teacher {
          user {
            firstName
            lastName
          }
        }
        presentCount
        absentCount
        lateCount
        attendanceRate
        records {
          id
          status
          checkInTime
          student {
            user {
              firstName
              lastName
            }
          }
        }
      }
    }
  `,

  studentAttendance: `
    query StudentAttendance($studentId: UUID!, $filter: AttendanceFilterInput, $pagination: PaginationInput) {
      studentAttendance(studentId: $studentId, filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            status
            checkInTime
            session {
              date
              subject {
                name
              }
            }
          }
          cursor
        }
        pageInfo {
          totalCount
          hasNextPage
        }
      }
    }
  `,

  // Grade Queries
  studentGrades: `
    query StudentGrades($studentId: UUID!, $filter: GradeFilterInput, $pagination: PaginationInput) {
      studentGrades(studentId: $studentId, filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            gradeType
            score
            maxScore
            percentage
            weight
            comments
            isPublished
            academicYear
            term
            subject {
              name
            }
            teacher {
              user {
                firstName
                lastName
              }
            }
          }
          cursor
        }
        pageInfo {
          totalCount
          hasNextPage
        }
      }
    }
  `,

  // Student GPA
  studentGPA: `
    query StudentGPA($studentId: UUID!, $academicYear: String, $term: String) {
      studentGPA(studentId: $studentId, academicYear: $academicYear, term: $term)
    }
  `,

  // Payment Queries
  studentPayments: `
    query StudentPayments($studentId: UUID!, $filter: PaymentFilterInput, $pagination: PaginationInput) {
      studentPayments(studentId: $studentId, filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            amount
            currency
            status
            paymentMethod
            transactionId
            paidAt
            feeStructure {
              feeName
            }
          }
          cursor
        }
        pageInfo {
          totalCount
          hasNextPage
        }
      }
    }
  `,

  // Outstanding fees
  studentOutstandingFees: `
    query StudentOutstandingFees($studentId: UUID!) {
      studentOutstandingFees(studentId: $studentId)
    }
  `,

  // School Queries
  schools: `
    query Schools($filter: SchoolFilterInput, $pagination: PaginationInput) {
      schools(filter: $filter, pagination: $pagination) {
        edges {
          node {
            id
            name
            code
            province
            city
            address
            principalName
            statistics {
              totalStudents
              totalTeachers
              totalClasses
              averageAttendanceRate
              averageGPA
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          totalCount
        }
      }
    }
  `,

  school: `
    query School($id: UUID!) {
      school(id: $id) {
        id
        name
        code
        logoUrl
        province
        city
        address
        principalName
        statistics {
          totalStudents
          totalTeachers
          totalClasses
          averageAttendanceRate
          averageGPA
        }
      }
    }
  `,

  schoolClasses: `
    query SchoolClasses($id: UUID!, $pagination: PaginationInput) {
      school(id: $id) {
        classes(pagination: $pagination) {
          edges {
            node {
              id
              name
              gradeLevel
              section
              academicYear
              maxStudents
              teachers {
                teacher {
                  user {
                    firstName
                    lastName
                  }
                }
              }
            }
          }
          pageInfo {
            totalCount
            hasNextPage
          }
        }
      }
    }
  `,

  // Dashboard Stats
  dashboardStats: `
    query DashboardStats($schoolId: UUID) {
      dashboardStats(schoolId: $schoolId) {
        totalStudents
        totalTeachers
        totalSchools
        totalClasses
        averageAttendanceRate
        averageGPA
        totalRevenue
        pendingPayments
        recentActivity {
          type
          description
          timestamp
        }
      }
    }
  `,

  // Timetable Integration
  scheduledSessionsByClass: `
    query ScheduledSessionsByClass($classId: UUID!, $date: Time!) {
      scheduledSessionsByClass(classId: $classId, date: $date) {
        session {
          id
          date
          startTime
          endTime
          isActive
          isScheduled
          timetableSlotId
          roomId
          teacher {
            user {
              firstName
              lastName
            }
          }
          subject {
            name
          }
          room {
            code
            name
            capacity
          }
        }
        isScheduled
        isHeld
        isMissed
      }
    }
  `,

  scheduledSessionsByTeacher: `
    query ScheduledSessionsByTeacher($teacherId: UUID!, $date: Time!) {
      scheduledSessionsByTeacher(teacherId: $teacherId, date: $date) {
        session {
          id
          date
          startTime
          endTime
          isActive
          isScheduled
          class {
            name
            gradeLevel
          }
          subject {
            name
          }
          room {
            code
            name
          }
        }
        isScheduled
        isHeld
        isMissed
      }
    }
  `,

  attendanceComparison: `
    query AttendanceComparison($classId: UUID!, $startDate: Time!, $endDate: Time!) {
      attendanceComparison(classId: $classId, startDate: $startDate, endDate: $endDate) {
        scheduledSessions
        actualSessions
        missedSessions
        unscheduledSessions
        complianceRate
      }
    }
  `,

  // Parent Queries
  parents: `
    query Parents {
      parents {
        edges {
          cursor
          node {
            id
            userId
            user {
              firstName
              lastName
              email
              phoneNumber
            }
            occupation
            relationship
            children {
              id
            }
            createdAt
            updatedAt
          }
        }
      }
    }
  `,

  parentChildren: `
    query ParentChildren($parentId: UUID!) {
      parentChildren(parentId: $parentId) {
        id
        userId
        schoolId
        classId
        studentNumber
        dateOfBirth
        gender
        address
        emergencyContactName
        emergencyContactPhone
        medicalInfo
        profileImageUrl
        enrollmentDate
        createdAt
        updatedAt
        gpa
        attendanceRate
        currentBalance
        school {
          id
          name
        }
        class {
          id
          name
          gradeLevel
        }
        user {
          firstName
          lastName
        }
      }
    }
  `,
}

// ==================== TYPED QUERY FUNCTIONS ====================
// NOTE: All mutations (create, update, delete) are handled via REST API in client.ts
// GraphQL is ONLY used for queries (read operations) following CQRS pattern

export interface PaginationInput {
  first?: number
  after?: string
  last?: number
  before?: string
}

export interface AttendanceFilterInput {
  sessionId?: string
  studentId?: string
  classId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
}

export interface GradeFilterInput {
  studentId?: string
  subjectId?: string
  classId?: string
  teacherId?: string
  academicYear?: string
  term?: string
  gradeType?: string
  isPublished?: boolean
  dateFrom?: string
  dateTo?: string
}

export interface PaymentFilterInput {
  studentId?: string
  status?: string
  paymentMethod?: string
  dateFrom?: string
  dateTo?: string
}

export interface StudentFilterInput {
  schoolId?: string
  classId?: string
  gender?: string
  searchTerm?: string
}

export const gql = {
  // User
  me: () =>
    graphqlClient<{ me: unknown }>(queries.me),

  // Students
  students: (filter?: StudentFilterInput, pagination?: PaginationInput) =>
    graphqlClient<{ students: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown } }>(
      queries.students,
      { filter, pagination }
    ),

  student: (id: string) =>
    graphqlClient<{ student: unknown }>(queries.student, { id }),

  studentsByClass: (classId: string) =>
    graphqlClient<{ studentsByClass: unknown[] }>(queries.studentsByClass, { classId }),

  // Attendance
  classAttendance: (classId: string, date: string) =>
    graphqlClient<{ classAttendance: unknown[] }>(queries.classAttendance, { classId, date }),

  activeSessionsByTeacher: (teacherId: string) =>
    graphqlClient<{ activeSessionsByTeacher: unknown[] }>(queries.activeSessionsByTeacher, { teacherId }),

  // Teachers
  teachers: (filter?: { schoolId?: string }, pagination?: PaginationInput) =>
    graphqlClient<{ teachers: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown } }>(
      queries.teachers,
      { filter, pagination }
    ),

  teachersBySchool: (schoolId: string, pagination?: PaginationInput) =>
    graphqlClient<{ teachers: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown } }>(
      queries.teachersBySchool,
      { schoolId, pagination }
    ),

  teacher: (id: string) =>
    graphqlClient<{ teacher: unknown }>(queries.teacher, { id }),

  // Attendance
  studentAttendance: (studentId: string, filter?: AttendanceFilterInput, pagination?: PaginationInput) =>
    graphqlClient<{ studentAttendance: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: { totalCount: number } } }>(
      queries.studentAttendance,
      { studentId, filter, pagination }
    ),

  // Grades
  studentGrades: (studentId: string, filter?: GradeFilterInput, pagination?: PaginationInput) =>
    graphqlClient<{ studentGrades: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: { totalCount: number } } }>(
      queries.studentGrades,
      { studentId, filter, pagination }
    ),

  studentGPA: (studentId: string, academicYear?: string, term?: string) =>
    graphqlClient<{ studentGPA: number }>(
      queries.studentGPA,
      { studentId, academicYear, term }
    ),

  // Payments
  studentPayments: (studentId: string, filter?: PaymentFilterInput, pagination?: PaginationInput) =>
    graphqlClient<{ studentPayments: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: { totalCount: number } } }>(
      queries.studentPayments,
      { studentId, filter, pagination }
    ),

  studentOutstandingFees: (studentId: string) =>
    graphqlClient<{ studentOutstandingFees: number }>(
      queries.studentOutstandingFees,
      { studentId }
    ),

  // Schools
  schools: (filter?: { province?: string }, pagination?: PaginationInput) =>
    graphqlClient<{ schools: { edges: Array<{ node: unknown; cursor: string }>; pageInfo: unknown } }>(
      queries.schools,
      { filter, pagination }
    ),

  school: (id: string) =>
    graphqlClient<{ school: unknown }>(queries.school, { id }),

  // Dashboard
  dashboardStats: (schoolId?: string) =>
    graphqlClient<{ dashboardStats: unknown }>(
      queries.dashboardStats,
      schoolId ? { schoolId } : undefined
    ),

  // Parent
  parents: () =>
    graphqlClient<{ parents: { edges: Array<{ node: unknown; cursor: string }> } }>(queries.parents),

  parentChildren: (parentId?: string) =>
    graphqlClient<{ parentChildren: unknown[] }>(queries.parentChildren, { parentId }),
}
