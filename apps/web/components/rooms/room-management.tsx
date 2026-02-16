'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MapPin,
  Users,
  Monitor,
  X,
  Save,
  Loader2,
  Building2,
  Layers,
  Check,
} from 'lucide-react'
import {
  useRooms,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  type Room,
  type CreateRoomInput,
  type UpdateRoomInput,
  type RoomType,
  type RoomStatus,
} from '@/lib/hooks/use-rooms'

interface RoomManagementProps {
  schoolId: string
}

const ROOM_TYPES: { value: RoomType; label: string; icon: string }[] = [
  { value: 'CLASSROOM', label: 'Sala de Aula', icon: '🏫' },
  { value: 'LAB', label: 'Laboratório', icon: '🔬' },
  { value: 'COMPUTER_LAB', label: 'Laboratório de Informática', icon: '💻' },
  { value: 'LIBRARY', label: 'Biblioteca', icon: '📚' },
  { value: 'GYM', label: 'Ginásio', icon: '🏋️' },
  { value: 'AUDITORIUM', label: 'Auditório', icon: '🎭' },
  { value: 'ART_ROOM', label: 'Sala de Arte', icon: '🎨' },
  { value: 'MUSIC_ROOM', label: 'Sala de Música', icon: '🎵' },
  { value: 'OTHER', label: 'Outro', icon: '🏢' },
]

const ROOM_STATUSES: { value: RoomStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Disponível', color: 'green' },
  { value: 'OCCUPIED', label: 'Ocupado', color: 'blue' },
  { value: 'MAINTENANCE', label: 'Em Manutenção', color: 'yellow' },
  { value: 'CLOSED', label: 'Fechado', color: 'purple' },
]

export function RoomManagement({ schoolId }: RoomManagementProps) {
  const { data: rooms, isLoading } = useRooms(schoolId)
  const createRoom = useCreateRoom(schoolId)
  const updateRoom = useUpdateRoom(schoolId)
  const deleteRoom = useDeleteRoom(schoolId)

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<RoomType | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [formData, setFormData] = useState<CreateRoomInput>({
    name: '',
    code: '',
    room_type: 'CLASSROOM',
    capacity: 30,
    floor: '',
    building: '',
    description: '',
    has_projector: false,
    has_whiteboard: true,
    has_smartboard: false,
    has_computers: false,
    computer_count: 0,
    is_accessible: false,
  })

  // Filter rooms
  const filteredRooms = (rooms || []).filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || room.room_type === selectedType
    return matchesSearch && matchesType
  })

  // Stats
  const stats = {
    total: rooms?.length || 0,
    available: rooms?.filter(r => r.status === 'AVAILABLE').length || 0,
    totalCapacity: rooms?.reduce((sum, r) => sum + r.capacity, 0) || 0,
  }

  const openCreateModal = () => {
    setEditingRoom(null)
    setFormData({
      name: '',
      code: '',
      room_type: 'CLASSROOM',
      capacity: 30,
      floor: '',
      building: '',
      description: '',
      has_projector: false,
      has_whiteboard: true,
      has_smartboard: false,
      has_computers: false,
      computer_count: 0,
      is_accessible: false,
    })
    setShowModal(true)
  }

  const openEditModal = (room: Room) => {
    setEditingRoom(room)
    setFormData({
      name: room.name,
      code: room.code,
      room_type: room.room_type,
      capacity: room.capacity,
      floor: room.floor || '',
      building: room.building || '',
      description: room.description || '',
      has_projector: room.has_projector,
      has_whiteboard: room.has_whiteboard,
      has_smartboard: room.has_smartboard,
      has_computers: room.has_computers,
      computer_count: room.computer_count || 0,
      is_accessible: room.is_accessible,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingRoom) {
      await updateRoom.mutateAsync({
        roomId: editingRoom.id,
        data: formData as UpdateRoomInput,
      })
    } else {
      await createRoom.mutateAsync(formData)
    }
    
    setShowModal(false)
  }

  const handleDelete = async (roomId: string) => {
    if (confirm('Tem certeza que deseja eliminar esta sala?')) {
      await deleteRoom.mutateAsync(roomId)
    }
  }

  const getRoomTypeInfo = (type: RoomType) => {
    return ROOM_TYPES.find(t => t.value === type) || ROOM_TYPES[0]
  }

  const getStatusInfo = (status: RoomStatus) => {
    return ROOM_STATUSES.find(s => s.value === status) || ROOM_STATUSES[0]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gestão de Salas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerir salas, laboratórios e outros espaços da escola
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Sala
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total de Salas</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.available}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Capacidade Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Pesquisar salas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as RoomType | 'all')}
          className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          aria-label="Filter by room type"
        >
          <option value="all">Todos os Tipos</option>
          {ROOM_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          Nenhuma sala encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const typeInfo = getRoomTypeInfo(room.room_type)
            const statusInfo = getStatusInfo(room.status)
            
            return (
              <div key={room.id} className="bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo.icon}</span>
                      <div>
                        <h3 className="font-semibold">{room.name}</h3>
                        <p className="text-sm text-muted-foreground">{room.code}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{room.capacity} lugares</span>
                    </div>
                    {room.building && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{room.building}</span>
                      </div>
                    )}
                    {room.floor && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span>Piso {room.floor}</span>
                      </div>
                    )}
                  </div>

                  {/* Equipment icons */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {room.has_projector && (
                      <span className="px-2 py-1 text-xs rounded bg-muted" title="Projector">
                        📽️
                      </span>
                    )}
                    {room.has_whiteboard && (
                      <span className="px-2 py-1 text-xs rounded bg-muted" title="Quadro Branco">
                        📝
                      </span>
                    )}
                    {room.has_smartboard && (
                      <span className="px-2 py-1 text-xs rounded bg-muted" title="Quadro Interactivo">
                        🖥️
                      </span>
                    )}
                    {room.has_computers && (
                      <span className="px-2 py-1 text-xs rounded bg-muted" title={`${room.computer_count} Computadores`}>
                        💻 {room.computer_count}
                      </span>
                    )}
                    {room.is_accessible && (
                      <span className="px-2 py-1 text-xs rounded bg-muted" title="Acessível">
                        ♿
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-muted/50 flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(room)} aria-label="Edit room">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(room.id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingRoom ? 'Editar Sala' : 'Nova Sala'}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)} aria-label="Close modal">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sala A101"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Código *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="A101"
                    required
                  />
                </div>
              </div>

              {/* Type and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Sala</label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, room_type: e.target.value as RoomType }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    aria-label="Room type"
                  >
                    {ROOM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Edifício</label>
                  <Input
                    value={formData.building || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                    placeholder="Bloco A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Piso</label>
                  <Input
                    value={formData.floor || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, floor: e.target.value }))}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                  rows={2}
                  placeholder="Informações adicionais sobre a sala..."
                />
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-sm font-medium mb-2">Equipamento</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_projector}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_projector: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">📽️ Projector</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_whiteboard}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_whiteboard: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">📝 Quadro Branco</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.has_smartboard}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_smartboard: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">🖥️ Quadro Interactivo</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_accessible}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_accessible: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">♿ Acessível</span>
                  </label>
                </div>
              </div>

              {/* Computers */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.has_computers}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      has_computers: e.target.checked,
                      computer_count: e.target.checked ? prev.computer_count || 10 : 0
                    }))}
                    className="rounded border-border"
                  />
                  <span className="text-sm">💻 Tem Computadores</span>
                </label>
                {formData.has_computers && (
                  <div>
                    <Input
                      type="number"
                      min="1"
                      value={formData.computer_count || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, computer_count: parseInt(e.target.value) }))}
                      placeholder="Número de computadores"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRoom.isPending || updateRoom.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {editingRoom ? 'Guardar' : 'Criar Sala'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
