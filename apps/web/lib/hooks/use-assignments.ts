import { useQuery } from '@tanstack/react-query'
import { gql } from '../api'

// Define keys
export const assignmentKeys = {
    all: ['assignments'] as const,
    student: (studentId: string) => [...assignmentKeys.all, 'student', studentId] as const,
    practicals: (studentId: string) => [...assignmentKeys.all, 'practicals', studentId] as const,
}

// Re-use Grade type but alias it for clarity
export interface Assignment {
    id: string
    title: string // mapped from subjectName or a generic name
    description?: string // mapped from comments
    subjectName: string
    dueDate: string // mapped from gradedAt or createdAt? keeping it simple
    status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE'
    type: 'QUIZ' | 'TASK' | 'PROJECT' | 'EXAM'
    score?: number
    maxScore: number
    teacherName?: string
}

export interface Practical {
    id: string
    title: string
    description?: string
    subjectName: string
    dueDate: string
    status: 'PENDING' | 'SUBMITTED' | 'GRADED'
    type: 'EXPERIMENT' | 'EXERCISE' | 'PHYSICAL'
    score?: number
    maxScore: number
}

// Hook for Assignments (Quizzes, Tasks)
export function useStudentAssignments(studentId: string) {
    return useQuery({
        queryKey: assignmentKeys.student(studentId),
        queryFn: async (): Promise<Assignment[]> => {
            try {
                // Fetch items that are Quizzes or Assignments
                // We fetch all and filter client-side because filtering by multiple types might not be supported deep in the API
                // or we make two requests. For now, fetch all published grades.
                const filter = {
                    isPublished: true,
                    // We can't strictly filter by multiple types in the current GQL input if it takes a single string.
                    // We'll fetch all and filter in JS.
                }
                const result = await gql.studentGrades(studentId, filter, { first: 100 })

                const edges = result.studentGrades?.edges || []

                return edges
                    .map((edge: any) => edge.node)
                    .filter((node: any) => ['QUIZ', 'ASSIGNMENT'].includes(node.gradeType)) // Filter for assignments
                    .map((node: any) => {
                        const isGraded = node.score > 0
                        // logic for status
                        let status: Assignment['status'] = isGraded ? 'GRADED' : 'PENDING'

                        return {
                            id: node.id,
                            title: node.comments || `${node.gradeType} - ${node.subject?.name}`, // Fallback title
                            description: node.comments,
                            subjectName: node.subject?.name || 'General',
                            dueDate: node.createdAt, // Using createdAt as proxy for now
                            status: status,
                            type: node.gradeType === 'QUIZ' ? 'QUIZ' : 'TASK',
                            score: node.score,
                            maxScore: node.maxScore,
                            teacherName: 'Teacher' // Placeholder if not in query
                        }
                    })
            } catch (error) {
                console.error('Failed to fetch assignments:', error)
                return []
            }
        },
        enabled: !!studentId,
    })
}

// Hook for Practicals (Projects)
export function useStudentPracticals(studentId: string) {
    return useQuery({
        queryKey: assignmentKeys.practicals(studentId),
        queryFn: async (): Promise<Practical[]> => {
            try {
                const filter = {
                    isPublished: true,
                    gradeType: 'PROJECT' // We can filter strictly here if API supports it, or filter client side
                }
                // Attempt to filter by PROJECT if possible, otherwise list all and filter
                const result = await gql.studentGrades(studentId, filter, { first: 100 })

                const edges = result.studentGrades?.edges || []

                return edges
                    .map((edge: any) => edge.node)
                    .filter((node: any) => node.gradeType === 'PROJECT')
                    .map((node: any) => {
                        const isGraded = node.score > 0
                        let status: Practical['status'] = isGraded ? 'GRADED' : 'PENDING'

                        return {
                            id: node.id,
                            title: node.comments || `Practical - ${node.subject?.name}`,
                            description: node.comments,
                            subjectName: node.subject?.name || 'Science',
                            dueDate: node.createdAt,
                            status: status,
                            type: 'EXPERIMENT', // Default mapping
                            score: node.score,
                            maxScore: node.maxScore
                        }
                    })
            } catch (error) {
                console.error('Failed to fetch practicals:', error)
                return []
            }
        },
        enabled: !!studentId,
    })
}
