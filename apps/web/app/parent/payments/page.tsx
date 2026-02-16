'use client'

import { useState, useMemo } from 'react'
import { Button } from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Receipt,
  Smartphone,
  Filter,
  Plus,
  Loader2,
} from 'lucide-react'
import { useParentChildren, useChildPayments } from '@/lib/hooks/use-parent'
import { useParentId, useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { useUser } from '@/lib/stores'
import { toast } from 'sonner'

export default function PaymentsPage() {
  const t = useTranslations('parent.payments')
  const user = useUser()
  
  // Ensure entity is resolved
  useCurrentEntity()
  const parentId = useParentId() || user?.id || ''

  const { data: childrenList = [], isLoading: isLoadingChildren } = useParentChildren(parentId)
  const [selectedChildId, setSelectedChildId] = useState<string>('all')
  const [selectedMethod, setSelectedMethod] = useState('mpesa')

  const { data: childPayments = [], isLoading: isLoadingPayments } = useChildPayments(
    selectedChildId === 'all' ? '' : selectedChildId
  )

  const totalPending = useMemo(() => {
    if (selectedChildId === 'all') {
      return childrenList.reduce((acc, child) => acc + (child.outstandingBalance || 0), 0)
    }
    const child = childrenList.find(c => c.id === selectedChildId)
    return child?.outstandingBalance || 0
  }, [childrenList, selectedChildId])

  const paymentMethods = [
    { id: 'mpesa', name: t('mpesa'), icon: '📱', color: 'red' },
    { id: 'emola', name: t('emola'), icon: '💳', color: 'blue' },
    { id: 'mkesh', name: t('mkesh'), icon: '💰', color: 'orange' },
    { id: 'card', name: t('card'), icon: '💳', color: 'purple' },
  ]

  // Separate payments into pending and completed
  const pendingPayments = childPayments.filter(p => p.status === 'pending' || p.status === 'failed')
  const completedPayments = childPayments.filter(p => p.status === 'completed')

  if (isLoadingChildren) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Student Filter */}
      <div className="bg-card rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-gray-700">{t('filterBy')}:</span>
          </div>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
          >
            <option value="all">{t('allChildrenSummary')}</option>
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.firstName} {child.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm opacity-90">{t('totalPending')}</h3>
              <CreditCard className="h-6 w-6 opacity-90" />
            </div>
            <p className="text-4xl font-bold mb-2">{totalPending.toLocaleString()} MZN</p>
            <p className="text-sm opacity-90">
              {selectedChildId === 'all' 
                ? t('totalAccumulated') 
                : `${pendingPayments.length} ${t('pendingPayments')}`}
            </p>
            
            <Button className="w-full mt-6 bg-white text-accent-600 hover:bg-gray-100 border-0">
              <Plus className="h-4 w-4 mr-2" />
              {t('payNow')}
            </Button>
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">{t('paymentMethods')}</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedMethod === method.id
                      ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-500'
                      : 'border-gray-200 hover:border-accent-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium text-gray-700">{method.name}</span>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-5 w-5 text-accent-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {selectedChildId === 'all' ? (
             <div className="bg-card rounded-xl p-12 shadow-sm text-center">
                <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('selectChild')}</h3>
                <p className="text-gray-500">
                  {t('detailedHistoryNote')}
                </p>
             </div>
          ) : (
            <>
              {/* Pending Payments */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    {t('pendingPayments')}
                  </h3>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                    {pendingPayments.length}
                  </span>
                </div>

                {pendingPayments.length > 0 ? (
                  <div className="space-y-3">
                    {pendingPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50/50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-white rounded-full shadow-sm">
                            <Clock className="h-5 w-5 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{payment.feeType || 'Pagamento'}</h4>
                            <p className="text-sm text-gray-600">{payment.feeStructure?.feeName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {t('dueDate')}: {payment.dueDate || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{payment.amount.toLocaleString()} {payment.currency}</p>
                          <Button size="sm" className="mt-2 bg-accent-500 hover:bg-accent-600 h-8">
                            {t('pay')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                    <p>{t('noPendingPayments')}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-gray-500" />
                    {t('history')}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (completedPayments.length === 0) {
                      toast.info(t('noPaymentsToExport'))
                      return
                    }
                    
                    const headers = ['Tipo', 'Descrição', 'Valor', 'Moeda', 'Data Pagamento', 'Método']
                    const csvContent = [
                      headers.join(','),
                      ...completedPayments.map((p: any) => [
                        `"${p.feeType || 'Pagamento'}"`,
                        `"${p.feeStructure?.feeName || ''}"`,
                        p.amount,
                        p.currency,
                        `"${p.paidAt || ''}"`,
                        `"${p.paymentMethod || ''}"`
                      ].join(','))
                    ].join('\n')

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `pagamentos-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('export')}
                  </Button>
                </div>

                {completedPayments.length > 0 ? (
                  <div className="space-y-3">
                    {completedPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-green-100 rounded-full">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{payment.feeType || 'Pagamento'}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-500">{payment.paidAt || 'Data desconhecida'}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{payment.paymentMethod}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{payment.amount.toLocaleString()} {payment.currency}</p>
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            {t('paid')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('noPaymentHistory')}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
