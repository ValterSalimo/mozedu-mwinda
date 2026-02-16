'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const MessagingPage = dynamic(
  () => import('@/components/messaging/messaging-page').then(mod => ({ default: mod.MessagingPage })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
)

export default function SchoolMessagesPage() {
  return <MessagingPage scope="school" />
}
