'use client'

import { useState, useRef } from 'react'
import { Button, Input } from '@mozedu/ui'
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Loader2,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useUpdateUserRole } from '@/lib/hooks/use-teachers'
import { useSubjects } from '@/lib/hooks/use-subjects'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { TeacherForm } from '@/components/teachers/teacher-form'
import { TeacherAvailability } from '@/components/teachers/teacher-availability'

type ViewMode = 'list' | 'add' | 'edit' | 'availability'

export default function TeachersPage() {
  const { schoolId, isLoading: entityLoading } = useCurrentEntity()
  const { data: teachers, isLoading, error } = useTeachers({ schoolId: schoolId || '', limit: 500 })
  const { data: subjectsData } = useSubjects({ pageSize: 100 })
  const createTeacher = useCreateTeacher()
  const updateTeacher = useUpdateTeacher()
  const deleteTeacher = useDeleteTeacher()
  const updateUserRole = useUpdateUserRole()
  const tCommon = useTranslations('common')
  const t = useTranslations('school.teachersPage')

  const subjects = subjectsData?.map(s => ({ id: s.id, name: s.name })) || []

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9
  const fileInputRef = useRef<HTMLInputElement>(null)

  const teachersList = teachers || []

  // Filter teachers
  const filteredTeachers = teachersList.filter((teacher: any) => {
    const fullName = `${teacher.user.firstName} ${teacher.user.lastName}`
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherNumber.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && teacher.status === 'active') ||
      (selectedStatus === 'inactive' && teacher.status === 'inactive')

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage)
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = {
    total: teachersList.length,
    active: teachersList.filter((t: any) => t.status === 'ACTIVE').length,
    inactive: teachersList.filter((t: any) => t.status === 'INACTIVE').length,
    averageRating: 0, // Placeholder
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast.error(t('csvMustHaveHeaders'))
        return
      }

      const headers = lines[0].split(',')
      const requiredHeaders = ['Nome', 'Email']
      const hasRequiredHeaders = requiredHeaders.every(h => 
        headers.some(header => header.toLowerCase().includes(h.toLowerCase()))
      )

      if (!hasRequiredHeaders) {
        toast.error(t('csvMustHaveColumns'))
        return
      }

      const dataRows = lines.slice(1)
      toast.success(`${dataRows.length} teachers ready to import. Individual creation required via the Add Teacher form.`)
      toast.info(t('useAddTeacherButton'))
    } catch (error) {
      toast.error(t('failedToReadCsv'))
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleExport = (format: 'json' | 'csv' = 'csv') => {
    if (filteredTeachers.length === 0) return

    const dataToExport = filteredTeachers.map((t: any) => ({
      ID: t.id,
      Nome: `${t.user.firstName} ${t.user.lastName}`,
      Email: t.user.email,
      Telefone: t.user.phone,
      Numero: t.teacherNumber,
      Status: t.status,
      Disciplinas: t.subjects?.map((s: any) => s.name).join(', ') || '',
      Turmas: t.classes?.length || 0,
    }))

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teachers_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const headers = Object.keys(dataToExport[0]).join(',')
      const rows = dataToExport.map((row: any) =>
        Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      const csv = `${headers}\n${rows}`
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleCreateTeacher = async (data: any) => {
    try {
      if (!schoolId) {
        console.error('School ID is missing')
        return
      }

      const apiData = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone_number: data.phone,
        school_id: schoolId,
        // employee_number: data.teacher_number, // Removed
        department: data.department, // Assuming department might be added to form later, or if it exists in data but not typed in FormData
        specialization: data.specialization,
        qualifications: data.qualification,
        years_of_experience: data.years_of_experience,
        hire_date: data.hire_date,
      }

      await createTeacher.mutateAsync(apiData)
      setViewMode('list')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create teacher')
    }
  }

  const handleUpdateTeacher = async (data: any) => {
    if (!editingTeacher) return
    try {
      const apiData = {
        // employee_number: data.teacher_number, // Removed
        department: data.department,
        specialization: data.specialization,
        qualifications: data.qualification,
        years_of_experience: data.years_of_experience,
        hire_date: data.hire_date,
        status: data.status,
        max_periods_per_day: data.max_periods_per_day,
        max_periods_per_week: data.max_periods_per_week,
      }

      await updateTeacher.mutateAsync({ id: editingTeacher.id, data: apiData })
      setViewMode('list')
      setEditingTeacher(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update teacher')
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm(tCommon('confirmDelete'))) return
    try {
      await deleteTeacher.mutateAsync(teacherId)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete teacher')
    }
  }

  const handleToggleAdmin = async (teacher: any) => {
    const isTeacherAdmin = teacher.user.role === 'TEACHER_ADMIN'
    const newRole = isTeacherAdmin ? 'TEACHER' : 'TEACHER_ADMIN'

    if (!confirm(tCommon('confirmAction'))) return

    try {
      await updateUserRole.mutateAsync({ userId: teacher.user.id, role: newRole })
      toast.success(`${tCommon('teacher')} ${isTeacherAdmin ? t('demoted') : t('promoted')} ${tCommon('success')}`)
    } catch (error: any) {
      toast.error(error?.message || tCommon('error'))
    }
  }

  const handleEditClick = (teacher: any) => {
    setEditingTeacher(teacher)
    setViewMode('edit')
  }

  const handleAvailabilityClick = (teacher: any) => {
    setSelectedTeacher(teacher)
    setViewMode('availability')
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
        {tCommon('error')}
      </div>
    )
  }

  // Show Add Teacher Form
  if (viewMode === 'add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('newTeacher')}</h1>
        </div>
        <div className="bg-card rounded-xl shadow-sm p-6">
          <TeacherForm
            subjects={subjects}
            onSubmit={handleCreateTeacher}
            onCancel={() => setViewMode('list')}
            mode="create"
          />
        </div>
      </div>
    )
  }

  // Show Edit Teacher Form
  if (viewMode === 'edit' && editingTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setEditingTeacher(null) }}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{t('editTeacher')}</h1>
        </div>
        <div className="bg-card rounded-xl shadow-sm p-6">
          <TeacherForm
            initialData={{
              first_name: editingTeacher.user?.firstName || editingTeacher.user?.first_name || '',
              last_name: editingTeacher.user?.lastName || editingTeacher.user?.last_name || '',
              email: editingTeacher.user?.email || '',
              phone: editingTeacher.user?.phone || '',
              teacher_number: editingTeacher.teacherNumber || editingTeacher.teacher_number || '',
              qualification: editingTeacher.qualification || editingTeacher.qualifications || '',
              specialization: editingTeacher.specialization || '',
              hire_date: editingTeacher.hireDate || editingTeacher.hire_date ? new Date(editingTeacher.hireDate || editingTeacher.hire_date).toISOString().split('T')[0] : '',
              max_periods_per_day: editingTeacher.maxPeriodsPerDay || editingTeacher.max_periods_per_day || 6,
              max_periods_per_week: editingTeacher.maxPeriodsPerWeek || editingTeacher.max_periods_per_week || 25,
              status: editingTeacher.status || 'ACTIVE',
              subjects: editingTeacher.subjects?.map((s: any) => ({
                subject_id: s.id || s.subject_id,
                is_primary: s.isPrimary || s.is_primary || false,
              })) || [],
            }}
            subjects={subjects}
            onSubmit={handleUpdateTeacher}
            onCancel={() => { setViewMode('list'); setEditingTeacher(null) }}
            mode="edit"
          />
        </div>
      </div>
    )
  }

  // Show Teacher Availability Management
  if (viewMode === 'availability' && selectedTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setViewMode('list'); setSelectedTeacher(null) }}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('availability')} - {selectedTeacher.user?.firstName} {selectedTeacher.user?.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('manageAvailability')}
            </p>
          </div>
        </div>
        <TeacherAvailability
          teacherId={selectedTeacher.id}
          schoolId={schoolId || ''}
          isAdmin={true}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            {tCommon('import')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button size="sm" onClick={() => setViewMode('add')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newTeacher')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{t('totalTeachers')}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">{t('activeTeachers')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">{t('filterAll')}</option>
              <option value="active">{t('filterActive')}</option>
              <option value="inactive">{t('filterInactive')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      {paginatedTeachers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl shadow-sm">
          {t('noTeachers')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTeachers.map((teacher: any) => (
            <div key={teacher.id} className="bg-card rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Card Header */}
              <div className="relative h-24 bg-gradient-to-r from-purple-500 to-blue-500">
                <div className="absolute -bottom-8 left-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-card bg-muted flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${teacher.status === 'ACTIVE'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-500 text-white'
                      }`}
                  >
                    {teacher.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="pt-10 p-4">
                <h3 className="font-bold text-foreground">{teacher.user.firstName} {teacher.user.lastName}</h3>
                <p className="text-sm text-muted-foreground">{teacher.qualification}</p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {teacher.subjects?.map((subject: any) => (
                    <span
                      key={subject.id}
                      className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                    >
                      {subject.name}
                    </span>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{teacher.classes?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">{t('classesNav')}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                      {teacher.rating || '-'}
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    </p>
                    <p className="text-xs text-muted-foreground">{t('rating')}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTeacher(teacher)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('viewProfile')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAvailabilityClick(teacher)}
                    title={t('availability')}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(teacher)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTeacher(teacher.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleAdmin(teacher)}
                    title={teacher.user.role === 'TEACHER_ADMIN' ? tCommon('removeAdmin') : tCommon('makeAdmin')}
                  >
                    {teacher.user.role === 'TEACHER_ADMIN' ? <ShieldAlert className="h-4 w-4 text-orange-500" /> : <ShieldCheck className="h-4 w-4 text-blue-500" />}
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
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
          {Math.min(currentPage * itemsPerPage, filteredTeachers.length)} de {filteredTeachers.length}{' '}
          professores
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
            Página {currentPage} de {totalPages || 1}
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

      {/* Teacher Detail Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
            <div className="relative h-32 bg-gradient-to-r from-purple-500 to-blue-500">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-3 right-3 text-white hover:bg-white/20"
                onClick={() => setSelectedTeacher(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-6 pb-6">
              {/* Profile Header */}
              <div className="flex items-end gap-4 -mt-12 mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-card bg-muted flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="flex-1 pb-2">
                  <h2 className="text-2xl font-bold text-foreground">{selectedTeacher.user.firstName} {selectedTeacher.user.lastName}</h2>
                  <p className="text-muted-foreground">{selectedTeacher.qualification}</p>
                </div>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${selectedTeacher.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}
                >
                  {selectedTeacher.status === 'ACTIVE' ? tCommon('active') : tCommon('inactive')}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t('personalInfo')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTeacher.user.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedTeacher.user.phone || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{t('hiredDate')} {new Date(selectedTeacher.hireDate).toLocaleDateString('fr-CD')}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">{t('academicInfo')}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{t('employeeNumber')}</p>
                      <p className="font-medium">{selectedTeacher.teacherNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Disciplinas</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTeacher.subjects?.map((subject: any) => (
                          <span
                            key={subject.id}
                            className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {subject.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <Button className="flex-1" onClick={() => { setSelectedTeacher(null); handleEditClick(selectedTeacher) }}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('editProfile')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setSelectedTeacher(null); handleAvailabilityClick(selectedTeacher) }}>
                  <Clock className="h-4 w-4 mr-2" />
                  {t('availability')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
