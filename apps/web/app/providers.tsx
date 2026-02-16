'use client'

import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { SessionErrorModal } from '@/components/auth/session-error-modal'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
        mutationCache: new MutationCache({
          onError: (error: Error) => {
            // Global fallback: if a mutation's catch block doesn't handle
            // the error with its own toast, this ensures the user always
            // sees something. Pages that already call toast.error() in their
            // catch will show their own message; this fires as a safety net.
            // We check _handled to avoid double-toasting.
            if (!(error as any)._handled) {
              toast.error(error.message || 'An unexpected error occurred')
            }
          },
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={5000}
        toastOptions={{
          style: { fontSize: '14px' },
        }}
      />
      <SessionErrorModal />
      {children}
    </QueryClientProvider>
  )
}
