'use client'

import { useState } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { useClasses, useCreateClass, useDeleteClass } from '@/lib/hooks/use-classes'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export default function ClassesPage() {
  const { schoolId } = useCurrentEntity()
  const t = useTranslations('school')
  const { data: classes, isLoading, error } = useClasses(schoolId)
  const createClassMutation = useCreateClass()
  const deleteClassMutation = useDeleteClass()

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  // Form State
  const [newClass, setNewClass] = useState({
    name: '',
    gradeLevel: '',
    academicYear: new Date().getFullYear().toString(),
    maxStudents: '',
  })

  const classesList = classes || []

  // Filter classes
  const filteredClasses = classesList.filter((cls: any) => {
    return cls.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Pagination
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = {
    total: classesList.length,
    totalStudents: 0, // Placeholder
    averageAttendance: 0, // Placeholder
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolId) return

    try {
      await createClassMutation.mutateAsync({
        school_id: schoolId,
        name: newClass.name,
        grade_level: parseInt(newClass.gradeLevel),
        academic_year: newClass.academicYear,
        max_students: newClass.maxStudents ? parseInt(newClass.maxStudents) : undefined,
      })
      toast.success(t('classes.created'))
      setShowAddModal(false)
      setNewClass({ name: '', gradeLevel: '', academicYear: new Date().getFullYear().toString(), maxStudents: '' })
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao criar turma.')
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm(t('classes.confirmDelete'))) return

    try {
      await deleteClassMutation.mutateAsync(id)
      toast.success(t('classes.deleted'))
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir turma.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        {t('classes.errorLoading')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('classes.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('classes.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('classes.export')}
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('classes.newClass')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{t('classes.totalClasses')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t('classes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {paginatedClasses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl shadow-sm">
          {t('classes.noClassesFound')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedClasses.map((cls: any) => (
            <div key={cls.id} className="bg-card rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground">{cls.gradeLevel}ª Classe • {cls.section || 'A'}</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('classes.capacity')}
                    </span>
                    <span className="font-medium">{cls.maxStudents || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('classes.academicYear')}
                    </span>
                    <span className="font-medium">{cls.academicYear}</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    {t('classes.viewDetails')}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteClass(cls.id)}
                    disabled={deleteClassMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('classes.showing')} {(currentPage - 1) * itemsPerPage + 1} {t('classes.to')}{' '}
          {Math.min(currentPage * itemsPerPage, filteredClasses.length)} {t('classes.of')} {filteredClasses.length}{' '}
          {t('classes.classesLabel')}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('classes.page')} {currentPage} {t('classes.of')} {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{t('classes.newClass')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('classes.className')}</label>
                <Input
                  required
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder={t('classes.classNamePlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('classes.gradeLevel')}</label>
                  <Input
                    required
                    type="number"
                    value={newClass.gradeLevel}
                    onChange={(e) => setNewClass({ ...newClass, gradeLevel: e.target.value })}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('classes.academicYear')}</label>
                  <Input
                    required
                    value={newClass.academicYear}
                    onChange={(e) => setNewClass({ ...newClass, academicYear: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('classes.maxCapacity')}</label>
                <Input
                  type="number"
                  value={newClass.maxStudents}
                  onChange={(e) => setNewClass({ ...newClass, maxStudents: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  {t('classes.cancel')}
                </Button>
                <Button type="submit" disabled={createClassMutation.isPending}>
                  {createClassMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('classes.createClass')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
