'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Calendar,
  Clock,
  Settings,
  Play,
  Check,
  AlertTriangle,
  Info,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import {
  useGenerateSchedule,
  useSchedulingConstraints,
  useTimetableTemplates,
  useActivateTimetable,
  useValidateTimetable,
  canGenerateSchedule,
  type GenerateScheduleInput,
  type TimetableTemplate,
  type SchedulingConstraints,
  type PotentialConflict,
  type GenerateScheduleResponse,
  type ValidationResult,
} from '@/lib/hooks/use-schedule'

interface ScheduleGeneratorProps {
  schoolId: string
}

export function ScheduleGenerator({ schoolId }: ScheduleGeneratorProps) {
  const { data: constraints, isLoading: loadingConstraints } = useSchedulingConstraints(schoolId)
  const { data: templates, isLoading: loadingTemplates } = useTimetableTemplates(schoolId)
  const generateSchedule = useGenerateSchedule(schoolId)
  const activateTimetable = useActivateTimetable(schoolId)
  const validateTimetable = useValidateTimetable(schoolId)

  const [step, setStep] = useState<'overview' | 'configure' | 'generating' | 'result'>('overview')
  const [formData, setFormData] = useState<GenerateScheduleInput>({
    name: '',
    academic_year: new Date().getFullYear().toString(),
    term: '1º Trimestre',
    curriculum_type: 'national',
    start_date: '',
    end_date: '',
    algorithm: 'basic',
    respect_preferences: true,
    max_periods_per_day: 8,
  })
  const [generationResult, setGenerationResult] = useState<GenerateScheduleResponse | null>(null)

  // Type-safe constraints access
  const typedConstraints = constraints as SchedulingConstraints | undefined

  // Check if we can generate - handle type conversion for constraints
  const canGenerate = typedConstraints && 'total_teachers' in typedConstraints
    ? canGenerateSchedule(typedConstraints) 
    : { canGenerate: false, blockers: ['A carregar...'] }

  const handleGenerate = async () => {
    setStep('generating')
    try {
      const result = await generateSchedule.mutateAsync(formData)
      if (result) {
        // Cast the API response to the expected type for the UI
        setGenerationResult(result as unknown as GenerateScheduleResponse)
        setStep('result')
      } else {
        setStep('configure')
      }
    } catch (error) {
      setStep('configure')
    }
  }

  const handleActivate = async (templateId: string) => {
    await activateTimetable.mutateAsync(templateId)
  }

  const handleValidate = async (templateId: string) => {
    const result = await validateTimetable.mutateAsync(templateId)
    // Update the generation result with validation
    if (generationResult && result) {
      setGenerationResult({
        ...generationResult,
        validation_result: result as unknown as ValidationResult,
      })
    }
  }

  if (loadingConstraints || loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Gerador de Horários
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gere automaticamente o horário escolar baseado nas restrições configuradas
        </p>
      </div>

      {/* Step: Overview */}
      {step === 'overview' && (
        <div className="space-y-6">
          {/* Constraints Summary */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Resumo das Restrições
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{typedConstraints?.teacher_availability?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Professores</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{typedConstraints?.room_availability?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Salas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{typedConstraints?.subject_requirements?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Turmas</p>
              </div>
            </div>

            {/* Potential Conflicts */}
            {typedConstraints?.potential_conflicts && typedConstraints.potential_conflicts.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2 text-yellow-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Conflitos Potenciais
                </h4>
                <div className="space-y-2">
                  {typedConstraints.potential_conflicts.map((conflict: PotentialConflict, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg text-sm ${
                        conflict.severity === 'error' 
                          ? 'bg-red-50 border border-red-200 text-red-700' 
                          : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                      }`}
                    >
                      <p className="font-medium">{conflict.description}</p>
                      <p className="text-xs mt-1 opacity-80">{conflict.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {typedConstraints?.recommendations && typedConstraints.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recomendações</h4>
                <ul className="space-y-1">
                  {typedConstraints.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-primary" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Can Generate Check */}
          {!canGenerate.canGenerate && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Não é possível gerar o horário
              </h4>
              <ul className="mt-2 space-y-1">
                {canGenerate.blockers.map((blocker, index) => (
                  <li key={index} className="text-sm text-red-600">• {blocker}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Existing Templates */}
          {templates && templates.length > 0 && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Horários Existentes</h3>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div 
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.academic_year} - {template.term}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        template.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {template.status === 'active' ? 'Ativo' : template.status}
                      </span>
                      {template.status !== 'active' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleActivate(template.id)}
                        >
                          Ativar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setStep('configure')}
              disabled={!canGenerate.canGenerate}
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Configurar Novo Horário
            </Button>
          </div>
        </div>
      )}

      {/* Step: Configure */}
      {step === 'configure' && (
        <div className="bg-card rounded-lg border p-6 space-y-6">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar Geração
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Horário *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Horário 2024 - 1º Trimestre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ano Lectivo</label>
              <Input
                value={formData.academic_year}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_year: e.target.value }))}
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Período/Trimestre</label>
              <select
                value={formData.term}
                onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="1º Trimestre">1º Trimestre</option>
                <option value="2º Trimestre">2º Trimestre</option>
                <option value="3º Trimestre">3º Trimestre</option>
                <option value="1º Semestre">1º Semestre</option>
                <option value="2º Semestre">2º Semestre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Currículo</label>
              <select
                value={formData.curriculum_type}
                onChange={(e) => setFormData(prev => ({ ...prev, curriculum_type: e.target.value as 'national' | 'cambridge' }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="national">Nacional (Moçambique)</option>
                <option value="cambridge">Cambridge International</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de Início</label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de Fim</label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Opções Avançadas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Algoritmo</label>
                <select
                  value={formData.algorithm}
                  onChange={(e) => setFormData(prev => ({ ...prev, algorithm: e.target.value as 'basic' | 'genetic' }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="basic">Básico (Rápido)</option>
                  <option value="genetic">Genético (Otimizado)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máx. Aulas por Dia</label>
                <Input
                  type="number"
                  min="4"
                  max="12"
                  value={formData.max_periods_per_day || 8}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_periods_per_day: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.respect_preferences}
                  onChange={(e) => setFormData(prev => ({ ...prev, respect_preferences: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-sm">Respeitar preferências de horário dos professores</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setStep('overview')}>
              Voltar
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={!formData.name || !formData.start_date || !formData.end_date}
            >
              <Play className="h-4 w-4 mr-2" />
              Gerar Horário
            </Button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-semibold mt-4">A Gerar Horário...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Este processo pode demorar alguns minutos dependendo da complexidade
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>✓ A analisar disponibilidade dos professores</p>
            <p>✓ A verificar salas disponíveis</p>
            <p>✓ A aplicar restrições</p>
            <p className="animate-pulse">○ A otimizar horário...</p>
          </div>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && generationResult && (
        <div className="space-y-6">
          {/* Result Summary */}
          <div className={`rounded-lg border p-6 ${
            generationResult.validation_result?.is_valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-4">
              {generationResult.validation_result?.is_valid ? (
                <Check className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {generationResult.validation_result?.is_valid 
                    ? 'Horário Gerado com Sucesso!' 
                    : 'Horário Gerado com Conflitos'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {generationResult.validation_result?.is_valid
                    ? 'O horário foi gerado sem conflitos e está pronto para ser ativado.'
                    : `Foram encontrados ${generationResult.validation_result?.total_conflicts || 0} conflitos.`}
                </p>
              </div>
            </div>
          </div>

          {/* Generation Stats */}
          {generationResult.generation_stats && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Estatísticas da Geração</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{generationResult.generation_stats.generation_time_seconds || 0}s</p>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{generationResult.generation_stats.teacher_conflicts || 0}</p>
                  <p className="text-xs text-muted-foreground">Conflitos Professores</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{generationResult.generation_stats.room_conflicts || 0}</p>
                  <p className="text-xs text-muted-foreground">Conflitos Salas</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold">{generationResult.generation_stats.algorithm}</p>
                  <p className="text-xs text-muted-foreground">Algoritmo</p>
                </div>
              </div>
            </div>
          )}

          {/* Conflicts */}
          {generationResult.validation_result && !generationResult.validation_result.is_valid && (
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4 text-yellow-600">Conflitos Detectados</h3>
              {generationResult.validation_result.suggestions?.map((suggestion: string, index: number) => (
                <p key={index} className="text-sm text-muted-foreground mb-2">• {suggestion}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => {
              setStep('configure')
              setGenerationResult(null)
            }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Novo
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => handleValidate(generationResult.template.id)}
              >
                Revalidar
              </Button>
              <Button 
                onClick={() => handleActivate(generationResult.template.id)}
                disabled={!generationResult.validation_result?.is_valid}
              >
                <Check className="h-4 w-4 mr-2" />
                Ativar Horário
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
