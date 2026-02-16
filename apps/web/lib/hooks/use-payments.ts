/**
 * React Query Hooks for Payments
 * Following Context7 TanStack Query best practices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi, gql } from '../api'

// ==================== QUERY KEYS ====================

export const paymentKeys = {
  all: ['payments'] as const,
  student: (studentId: string) => [...paymentKeys.all, 'student', studentId] as const,
}

// ==================== TYPES ====================

export interface Payment {
  id: string
  studentId: string
  amount: number
  currency: 'CDF' | 'USD'
  feeType: 'tuition' | 'registration' | 'exam' | 'transport' | 'uniform' | 'other'
  academicYear: string
  term?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'mobile_money' | 'cash' | 'bank_transfer'
  transactionId?: string
  paidAt?: string
  receiptUrl?: string
  createdAt: string
}

export interface CreatePaymentData {
  student_id: string
  fee_structure_id?: string
  payer_id?: string
  amount: number
  currency: string
  payment_method: 'STRIPE' | 'FLUTTERWAVE' | 'CASH' | 'BANK_TRANSFER'
  notes?: string
}

// ==================== QUERIES ====================

/**
 * Hook to fetch student payments
 */
export function useStudentPayments(studentId: string) {
  return useQuery({
    queryKey: paymentKeys.student(studentId),
    queryFn: async () => {
      const result = await gql.studentPayments(studentId)
      // Parse edges to get payments array
      const payments = result.studentPayments?.edges?.map((edge: { node: unknown }) => edge.node) || []
      return payments as Payment[]
    },
    enabled: !!studentId,
    staleTime: 60 * 1000, // 1 minute
  })
}

// ==================== MUTATIONS ====================

/**
 * Hook to create a payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const response = await paymentsApi.create(data)
      return response.data as Payment
    },
    onSuccess: (_, variables) => {
      // Invalidate student payments
      queryClient.invalidateQueries({ 
        queryKey: paymentKeys.student(variables.student_id) 
      })
    },
  })
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('fr-CD', {
    style: 'currency',
    currency: currency === 'CDF' ? 'CDF' : currency === 'USD' ? 'USD' : 'CDF',
    minimumFractionDigits: 2,
  })
  
  return formatter.format(amount)
}

/**
 * Calculate total pending payments
 */
export function calculatePendingTotal(payments: Payment[]): number {
  return payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: Payment['status']): string {
  const colors: Record<Payment['status'], string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    completed: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    refunded: 'text-gray-600 bg-gray-100',
  }
  return colors[status]
}
