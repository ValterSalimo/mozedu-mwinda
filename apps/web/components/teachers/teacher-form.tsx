'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Clock,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'

export interface TeacherFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  teacher_number?: string
  qualification?: string
  specialization?: string
  hire_date?: string
  address?: string
  max_periods_per_day?: number
  max_periods_per_week?: number
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE'
  subjects?: { subject_id: string; is_primary: boolean }[]
}

interface TeacherFormProps {
  initialData?: TeacherFormData
  subjects?: { id: string; name: string }[]
  onSubmit: (data: TeacherFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function TeacherForm({
  initialData,
  subjects = [],
  onSubmit,
  onCancel,
  isLoading = false,
  mode,
}: TeacherFormProps) {
  const [formData, setFormData] = useState<TeacherFormData>(
    initialData || {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      teacher_number: '',
      qualification: '',
      specialization: '',
      hire_date: '',
      address: '',
      max_periods_per_day: 6,
      max_periods_per_week: 25,
      status: 'ACTIVE',
      subjects: [],
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof TeacherFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Nome é obrigatório'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Apelido é obrigatório'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const submissionData = {
        ...formData,
        hire_date: formData.hire_date ? new Date(formData.hire_date).toISOString() : undefined
      }
      await onSubmit(submissionData as TeacherFormData)
    }
  }

  const addSubject = () => {
    setFormData((prev) => ({
      ...prev,
      subjects: [...(prev.subjects || []), { subject_id: '', is_primary: false }],
    }))
  }

  const removeSubject = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateSubject = (index: number, field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects?.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ) || [],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Informação Básica
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              placeholder="Nome"
              error={errors.first_name}
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Apelido <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              placeholder="Apelido"
              error={errors.last_name}
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              leftIcon={<Mail className="h-4 w-4 text-muted-foreground" />}
              error={errors.email}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+258 84 XXX XXXX"
              leftIcon={<Phone className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Informação Profissional
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Número do Professor</label>
            <Input
              value={formData.teacher_number || ''}
              onChange={(e) => handleChange('teacher_number', e.target.value)}
              placeholder="P-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Qualificação</label>
            <Input
              value={formData.qualification || ''}
              onChange={(e) => handleChange('qualification', e.target.value)}
              placeholder="Licenciatura em..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Especialização</label>
            <Input
              value={formData.specialization || ''}
              onChange={(e) => handleChange('specialization', e.target.value)}
              placeholder="Matemática, Física..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data de Contratação</label>
            <Input
              type="date"
              value={formData.hire_date || ''}
              onChange={(e) => handleChange('hire_date', e.target.value)}
              leftIcon={<Calendar className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Teacher status"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="ON_LEAVE">De Licença</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Morada</label>
            <Input
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Endereço completo"
              leftIcon={<MapPin className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </div>
      </div>

      {/* Scheduling Constraints */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Restrições de Horário
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Máximo de Aulas por Dia</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={formData.max_periods_per_day || 6}
              onChange={(e) => handleChange('max_periods_per_day', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Número máximo de aulas que o professor pode dar por dia
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Máximo de Aulas por Semana</label>
            <Input
              type="number"
              min="1"
              max="40"
              value={formData.max_periods_per_week || 25}
              onChange={(e) => handleChange('max_periods_per_week', parseInt(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Número máximo de aulas que o professor pode dar por semana
            </p>
          </div>
        </div>
      </div>

      {/* Subjects */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Disciplinas
          </span>
          <Button type="button" variant="outline" size="sm" onClick={addSubject}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </h3>
        {formData.subjects && formData.subjects.length > 0 ? (
          <div className="space-y-3">
            {formData.subjects.map((subject, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <select
                  value={subject.subject_id}
                  onChange={(e) => updateSubject(index, 'subject_id', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Select subject"
                >
                  <option value="">Selecionar disciplina...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={subject.is_primary}
                    onChange={(e) => updateSubject(index, 'is_primary', e.target.checked)}
                    className="rounded border-border"
                  />
                  Principal
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubject(index)}
                  aria-label="Remove subject"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
            Nenhuma disciplina adicionada. Clique em &quot;Adicionar&quot; para associar disciplinas.
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-1" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-1" />
          {isLoading ? 'A guardar...' : mode === 'create' ? 'Criar Professor' : 'Guardar Alterações'}
        </Button>
      </div>
    </form>
  )
}
