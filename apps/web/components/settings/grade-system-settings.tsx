'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Settings,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Info,
  Loader2,
} from 'lucide-react'
import {
  useGradeSystemConfig,
  useCreateGradeSystemConfig,
  useUpdateGradeSystemConfig,
  useDefaultGradeSystem,
  type GradeSystemConfig,
  type GradeBoundary,
  type GradeSystemType,
} from '@/lib/hooks/use-school-settings'

interface GradeSystemSettingsProps {
  schoolId: string
}

const GRADE_SYSTEM_TYPES: { value: GradeSystemType; label: string; description: string }[] = [
  {
    value: 'MOZAMBIQUE_NATIONAL',
    label: 'Sistema Moçambicano',
    description: 'Escala de 0 a 20, nota mínima de aprovação: 10. Avaliações contínuas e prova final (AP)',
  },
  {
    value: 'ANGOLA_NATIONAL',
    label: 'Sistema Angolano',
    description: 'Escala de 0 a 20, nota mínima de aprovação: 10. Sistema similar ao Moçambicano',
  },
  {
    value: 'CONGO_NATIONAL',
    label: 'Sistema Congolês',
    description: 'Escala de 0 a 100, nota mínima de aprovação: 50. Sistema percentual',
  },
  {
    value: 'SOUTH_AFRICA_CAPS',
    label: 'Sistema Sul-Africano (CAPS)',
    description: 'Escala de 0 a 100 com 7 níveis de desempenho, nota mínima: 30',
  },
  {
    value: 'CAMBRIDGE',
    label: 'Sistema Cambridge',
    description: 'Escala de A* a U, baseado em percentagens internacionais',
  },
  {
    value: 'PERCENTAGE',
    label: 'Percentagem',
    description: 'Escala de 0 a 100%',
  },
  {
    value: 'GPA',
    label: 'GPA (Grade Point Average)',
    description: 'Escala de 0.0 a 4.0',
  },
  {
    value: 'CUSTOM',
    label: 'Personalizado',
    description: 'Configure as suas próprias escalas e limites',
  },
]

// Map legacy grade system types to new names
const mapSystemType = (type: string): GradeSystemType => {
  const mapping: Record<string, GradeSystemType> = {
    'MOZAMBIQUE': 'MOZAMBIQUE_NATIONAL',
    'ANGOLA': 'ANGOLA_NATIONAL',
    'SOUTH_AFRICA': 'SOUTH_AFRICA_CAPS',
    'CONGO': 'CONGO_NATIONAL',
  }
  return (mapping[type] || type) as GradeSystemType
}

export function GradeSystemSettings({ schoolId }: GradeSystemSettingsProps) {
  const { data: config, isLoading } = useGradeSystemConfig(schoolId)
  const createConfig = useCreateGradeSystemConfig()
  const updateConfig = useUpdateGradeSystemConfig()
  const { data: mozambiqueDefaults } = useDefaultGradeSystem(schoolId, 'MOZAMBIQUE_NATIONAL')
  const { data: angolaDefaults } = useDefaultGradeSystem(schoolId, 'ANGOLA_NATIONAL')
  const { data: congoDefaults } = useDefaultGradeSystem(schoolId, 'CONGO_NATIONAL')
  const { data: southAfricaDefaults } = useDefaultGradeSystem(schoolId, 'SOUTH_AFRICA_CAPS')
  const { data: cambridgeDefaults } = useDefaultGradeSystem(schoolId, 'CAMBRIDGE')

  const [formData, setFormData] = useState<{
    system_type: GradeSystemType
    min_score: number
    max_score: number
    passing_score: number
    grade_boundaries: Record<string, GradeBoundary>
    show_percentage: boolean
    show_letter_grade: boolean
    show_gpa: boolean
    decimal_places: number
  }>({
    system_type: 'MOZAMBIQUE_NATIONAL',
    min_score: 0,
    max_score: 20,
    passing_score: 10,
    grade_boundaries: {},
    show_percentage: true,
    show_letter_grade: true,
    show_gpa: false,
    decimal_places: 1,
  })

  const [isEditing, setIsEditing] = useState(false)

  // Load existing config
  useEffect(() => {
    if (config) {
      setFormData({
        system_type: mapSystemType(config.system_type),
        min_score: config.min_score,
        max_score: config.max_score,
        passing_score: config.passing_score,
        grade_boundaries: config.grade_boundaries || {},
        show_percentage: config.show_percentage,
        show_letter_grade: config.show_letter_grade,
        show_gpa: config.show_gpa,
        decimal_places: config.decimal_places,
      })
    }
  }, [config])

  // Apply default values when system type changes
  const applyDefaults = (type: GradeSystemType) => {
    if (type === 'MOZAMBIQUE_NATIONAL' && mozambiqueDefaults) {
      setFormData(prev => ({
        ...prev,
        system_type: type,
        min_score: 0,
        max_score: 20,
        passing_score: 10,
        grade_boundaries: mozambiqueDefaults.boundaries || {},
      }))
    } else if (type === 'ANGOLA_NATIONAL' && angolaDefaults) {
      setFormData(prev => ({
        ...prev,
        system_type: type,
        min_score: 0,
        max_score: 20,
        passing_score: 10,
        grade_boundaries: angolaDefaults.boundaries || {},
      }))
    } else if (type === 'CONGO_NATIONAL' && congoDefaults) {
      setFormData(prev => ({
        ...prev,
        system_type: type,
        min_score: 0,
        max_score: 100,
        passing_score: 50,
        grade_boundaries: congoDefaults.boundaries || {},
      }))
    } else if (type === 'SOUTH_AFRICA_CAPS' && southAfricaDefaults) {
      setFormData(prev => ({
        ...prev,
        system_type: type,
        min_score: 0,
        max_score: 100,
        passing_score: 30,
        grade_boundaries: southAfricaDefaults.boundaries || {},
      }))
    } else if (type === 'CAMBRIDGE' && cambridgeDefaults) {
      setFormData(prev => ({
        ...prev,
        system_type: type,
        min_score: 0,
        max_score: 100,
        passing_score: 40,
        grade_boundaries: cambridgeDefaults.boundaries || {},
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        system_type: type,
      }))
    }
  }

  // Add grade boundary
  const addGradeBoundary = () => {
    const key = `grade_${Object.keys(formData.grade_boundaries).length + 1}`
    setFormData(prev => ({
      ...prev,
      grade_boundaries: {
        ...prev.grade_boundaries,
        [key]: {
          min_score: 0,
          max_score: 0,
          letter_grade: '',
          gpa: 0,
          description: '',
        },
      },
    }))
  }

  // Update grade boundary
  const updateGradeBoundary = (key: string, field: keyof GradeBoundary, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      grade_boundaries: {
        ...prev.grade_boundaries,
        [key]: {
          ...prev.grade_boundaries[key],
          [field]: value,
        },
      },
    }))
  }

  // Remove grade boundary
  const removeGradeBoundary = (key: string) => {
    setFormData(prev => {
      const newBoundaries = { ...prev.grade_boundaries }
      delete newBoundaries[key]
      return {
        ...prev,
        grade_boundaries: newBoundaries,
      }
    })
  }

  // Save configuration
  const handleSave = async () => {
    if (config) {
      await updateConfig.mutateAsync({
        schoolId,
        data: formData,
      })
    } else {
      await createConfig.mutateAsync({
        schoolId,
        data: formData,
      })
    }
    setIsEditing(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema de Avaliação
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o sistema de notas e avaliação da escola
          </p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            Editar Configuração
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              if (config) {
                setFormData({
                  system_type: mapSystemType(config.system_type),
                  min_score: config.min_score,
                  max_score: config.max_score,
                  passing_score: config.passing_score,
                  grade_boundaries: config.grade_boundaries || {},
                  show_percentage: config.show_percentage,
                  show_letter_grade: config.show_letter_grade,
                  show_gpa: config.show_gpa,
                  decimal_places: config.decimal_places,
                })
              }
              setIsEditing(false)
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createConfig.isPending || updateConfig.isPending}
            >
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        )}
      </div>

      {/* Current System Info */}
      {!isEditing && config && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-primary">
                {GRADE_SYSTEM_TYPES.find(t => t.value === config.system_type)?.label || config.system_type}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Escala de {config.min_score} a {config.max_score} | Nota mínima de aprovação: {config.passing_score}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="space-y-6 bg-card rounded-lg p-6 border">
          {/* System Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Sistema</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GRADE_SYSTEM_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    applyDefaults(type.value)
                  }}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    formData.system_type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Score Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nota Mínima</label>
              <Input
                type="number"
                value={formData.min_score}
                onChange={(e) => setFormData(prev => ({ ...prev, min_score: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nota Máxima</label>
              <Input
                type="number"
                value={formData.max_score}
                onChange={(e) => setFormData(prev => ({ ...prev, max_score: parseFloat(e.target.value) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nota de Aprovação</label>
              <Input
                type="number"
                value={formData.passing_score}
                onChange={(e) => setFormData(prev => ({ ...prev, passing_score: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          {/* Display Options */}
          <div>
            <label className="block text-sm font-medium mb-2">Opções de Visualização</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.show_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_percentage: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Mostrar Percentagem</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.show_letter_grade}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_letter_grade: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Mostrar Nota por Letra</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.show_gpa}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_gpa: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Mostrar GPA</span>
              </label>
            </div>
          </div>

          {/* Decimal Places */}
          <div className="w-48">
            <label className="block text-sm font-medium mb-1">Casas Decimais</label>
            <Input
              type="number"
              min="0"
              max="4"
              value={formData.decimal_places}
              onChange={(e) => setFormData(prev => ({ ...prev, decimal_places: parseInt(e.target.value) }))}
            />
          </div>

          {/* Grade Boundaries */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Limites de Classificação</label>
              <Button type="button" variant="outline" size="sm" onClick={addGradeBoundary}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {Object.entries(formData.grade_boundaries).length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
                  <div className="col-span-2">Nota Min</div>
                  <div className="col-span-2">Nota Max</div>
                  <div className="col-span-2">Letra</div>
                  <div className="col-span-2">GPA</div>
                  <div className="col-span-3">Descrição</div>
                  <div className="col-span-1"></div>
                </div>
                {Object.entries(formData.grade_boundaries).map(([key, boundary]) => (
                  <div key={key} className="grid grid-cols-12 gap-2 items-center bg-muted/50 p-2 rounded-lg">
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={boundary.min_score}
                        onChange={(e) => updateGradeBoundary(key, 'min_score', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={boundary.max_score}
                        onChange={(e) => updateGradeBoundary(key, 'max_score', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={boundary.letter_grade}
                        onChange={(e) => updateGradeBoundary(key, 'letter_grade', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="A, B..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={boundary.gpa}
                        onChange={(e) => updateGradeBoundary(key, 'gpa', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={boundary.description}
                        onChange={(e) => updateGradeBoundary(key, 'description', e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Excelente..."
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGradeBoundary(key)}
                        className="h-8 w-8 p-0"
                        aria-label="Remove grade boundary"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Nenhum limite de classificação definido.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique em &quot;Adicionar&quot; para criar limites personalizados ou selecione um sistema predefinido.
                </p>
              </div>
            )}
          </div>

          {/* Reset to Defaults */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => applyDefaults(formData.system_type)}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restaurar Padrões
            </Button>
          </div>
        </div>
      )}

      {/* Grade Boundaries Preview */}
      {!isEditing && Object.entries(formData.grade_boundaries).length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Tabela de Classificação</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 rounded-tl-lg">Intervalo</th>
                  <th className="text-center p-3">Letra</th>
                  <th className="text-center p-3">GPA</th>
                  <th className="text-left p-3 rounded-tr-lg">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(formData.grade_boundaries)
                  .sort(([, a], [, b]) => b.min_score - a.min_score)
                  .map(([key, boundary]) => (
                    <tr key={key} className="border-b">
                      <td className="p-3">{boundary.min_score} - {boundary.max_score}</td>
                      <td className="p-3 text-center font-semibold">{boundary.letter_grade}</td>
                      <td className="p-3 text-center">{boundary.gpa.toFixed(1)}</td>
                      <td className="p-3">{boundary.description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
