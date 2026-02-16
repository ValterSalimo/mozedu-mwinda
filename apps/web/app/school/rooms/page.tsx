'use client'

import { useState } from 'react'
import { Button } from '@mozedu/ui'
import { ChevronLeft, Plus, Loader2 } from 'lucide-react'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { RoomManagement } from '@/components/rooms/room-management'

export default function RoomsPage() {
  const { schoolId } = useCurrentEntity()
  

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Salas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerir salas de aula, laboratórios e outros espaços
          </p>
        </div>
      </div>

      {/* Room Management Component */}
      <RoomManagement schoolId={schoolId} />
    </div>
  )
}
