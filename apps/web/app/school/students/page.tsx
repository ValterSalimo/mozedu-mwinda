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
  Calendar,
  Users,
  CheckCircle,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useStudents, useStudent, useCreateStudent, useDeleteStudent, useUpdateStudent } from '@/lib/hooks/use-students'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { useGenerateCardForStudent, useEmailCardToParent } from '@/lib/hooks/use-student-cards'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export default function StudentsPage() {
  const { schoolId } = useCurrentEntity()
  const { data: studentsData, isLoading, error } = useStudents({ schoolId: schoolId || '', limit: 500 })
  const createStudentMutation = useCreateStudent()
  const updateStudentMutation = useUpdateStudent()
  const deleteStudentMutation = useDeleteStudent()
  const generateCardMutation = useGenerateCardForStudent()
  const emailCardMutation = useEmailCardToParent()
  const t = useTranslations('school.studentsPage')
  const tCommon = useTranslations('common')
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)
  const { data: studentDetails, isLoading: isLoadingDetails } = useStudent(selectedStudent?.id || '')

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Form State
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gradeLevel: '',
    dateOfBirth: '',
    gender: 'Male',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelationship: 'GUARDIAN',
    sendStudentCard: false,
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const students = studentsData?.students || []

  const handleEditClick = (student: any) => {
    setEditingStudent(student)
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      gradeLevel: student.gradeLevel ? String(student.gradeLevel) : '',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      gender: student.gender || 'Male',
      parentFirstName: '', // Parent info would need separate fetching or pre-filling if available
      parentLastName: '',
      parentEmail: '',
      parentPhone: '',
      parentRelationship: 'GUARDIAN',
    })
    setStep(1)
    setShowAddModal(true)
  }

  const handleExportStudents = () => {
    if (!students || students.length === 0) {
      toast.error(t('noStudents'));
      return;
    }
    const headers = [t('firstName'), t('lastName'), t('email'), t('studentNumber'), t('gradeLevel'), t('birthDate'), t('gender')];
    const csvContent = [
      headers.join(','),
      ...students.map((s: any) => [
        s.firstName, s.lastName, s.email, s.studentNumber, s.gradeLevel, s.dateOfBirth, s.gender
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(tCommon('success'));
  };

  // Filter students
  const filteredStudents = students.filter((student: any) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    // Status filtering placeholder
    const matchesStatus = true

    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = {
    total: students.length,
    active: students.length,
    inactive: 0,
    averageAttendance: 0,
  }

  const handleSaveStudent = async () => {
    if (!schoolId) return

    try {
      if (editingStudent) {
        await updateStudentMutation.mutateAsync({
          id: editingStudent.id,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            grade_level: parseInt(formData.gradeLevel) || 0,
            date_of_birth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
            gender: formData.gender as any,
          } as any
        })
        toast.success(t('updateSuccess'))
      } else {
        const newStudent = await createStudentMutation.mutateAsync({
          school_id: schoolId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          grade_level: parseInt(formData.gradeLevel) || 0,
          enrollment_date: new Date().toISOString(),
          date_of_birth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
          gender: formData.gender as any,
          parent_first_name: formData.parentFirstName,
          parent_last_name: formData.parentLastName,
          parent_email: formData.parentEmail,
          parent_phone: formData.parentPhone,
          parent_relationship: formData.parentRelationship as any,
        })
        toast.success(t('createSuccess'))

        // Generate and email student card if option was checked
        if (formData.sendStudentCard && newStudent?.id) {
          try {
            const academicYear = new Date().getFullYear().toString()
            const generatedCard = await generateCardMutation.mutateAsync({
              studentId: newStudent.id,
              academicYear,
            })
            if (generatedCard?.id) {
              await emailCardMutation.mutateAsync(generatedCard.id)
              toast.success(t('cardSentSuccess', { defaultValue: 'Student card has been sent!' }))
            }
          } catch {
            toast.error(t('cardSendFailed', { defaultValue: 'Student created but card could not be sent.' }))
          }
        }
      }
      closeModal()
    } catch (error: any) {
      const errorMessage = error?.message || tCommon('error')
      toast.error(errorMessage)
    }
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingStudent(null)
    setStep(1)
    setFormData({
      firstName: '', lastName: '', email: '', gradeLevel: '',
      dateOfBirth: '', gender: 'Male',
      parentFirstName: '', parentLastName: '', parentEmail: '', parentPhone: '', parentRelationship: 'GUARDIAN',
      sendStudentCard: false,
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.gender || !formData.dateOfBirth || !formData.gradeLevel) {
        toast.error(t('fillRequiredFields'))
        return
      }
      if (editingStudent) {
        handleSaveStudent()
      } else {
        setStep(2)
      }
    } else {
      handleSaveStudent()
    }
  }

  const handleDeleteStudent = async (id: string) => {
    if (!confirm(tCommon('confirmDelete'))) return

    try {
      await deleteStudentMutation.mutateAsync(id)
      toast.success(t('deleteSuccess'))
      if (selectedStudent?.id === id) setSelectedStudent(null)
    } catch (error) {
      toast.error(tCommon('error'))
    }
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
        toast.error(t('importErrorNoData'))
        return
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
      const nameIndex = headers.findIndex(h => h.includes('nome') || h.includes('name') || h.includes('firstname'))
      const lastNameIndex = headers.findIndex(h => h.includes('apelido') || h.includes('lastname') || h.includes('sobrenome'))
      const emailIndex = headers.findIndex(h => h.includes('email'))
      const gradeIndex = headers.findIndex(h => h.includes('grade') || h.includes('classe') || h.includes('gradelevel'))

      if (nameIndex === -1) {
        toast.error(t('csvMustHaveNameColumn'))
        return
      }

      const dataRows = lines.slice(1)
      let successCount = 0
      let errorCount = 0

      for (const row of dataRows) {
        const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
        const firstName = values[nameIndex] || ''
        const lastName = lastNameIndex !== -1 ? values[lastNameIndex] : ''
        const email = emailIndex !== -1 ? values[emailIndex] : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.mozedu.com`
        const gradeLevel = gradeIndex !== -1 ? parseInt(values[gradeIndex]) || 0 : 0

        if (!firstName) continue

        try {
          await createStudentMutation.mutateAsync({
            school_id: schoolId!,
            first_name: firstName,
            last_name: lastName,
            email: email,
            grade_level: gradeLevel,
            enrollment_date: new Date().toISOString(),
            gender: 'Male' as any,
          })
          successCount++
        } catch (err) {
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ${t('studentsImported')}`)
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} ${t('studentsFailedImport')}`)
      }
    } catch (error) {
      toast.error(tCommon('error'))
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
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
            accept=".csv,.xlsx"
            onChange={handleFileChange}
          />
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            {tCommon('import')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportStudents}>
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('newStudent')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">{t('totalStudents')}</p>
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
              <p className="text-xs text-muted-foreground">{t('activeStudents')}</p>
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
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/50">
              <tr>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t('student')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t('email')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">
                  {t('studentNumber')}
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">
                  {t('gradeLevel')}
                </th>
                <th className="text-right px-4 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    {t('noStudents')}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student: any, idx: number) => (
                  <tr key={student.id} className={`hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group ${idx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center text-primary ring-2 ring-white dark:ring-slate-700 shadow-lg group-hover:scale-105 transition-transform duration-200">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{student.firstName} {student.lastName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-foreground">{student.email}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{student.studentNumber}</span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">{student.gradeLevel || '-'}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={() => setSelectedStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all" onClick={() => handleEditClick(student)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-all"
                          onClick={() => handleDeleteStudent(student.id)}
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {t('showingResults', { from: (currentPage - 1) * itemsPerPage + 1, to: Math.min(currentPage * itemsPerPage, filteredStudents.length), total: filteredStudents.length })}
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
              {t('pageOf', { current: currentPage, total: totalPages || 1 })}
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
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{t('studentDetails')}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-muted-foreground">{selectedStudent.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedStudent.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{t('bornOn')} {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('fr-CD') : '-'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-lg font-semibold mb-3">{t('parents')}</h4>
                {isLoadingDetails ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t('loadingDetails')}</div>
                ) : studentDetails?.parents && studentDetails.parents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentDetails.parents.map((parent: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{parent.user.firstName} {parent.user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{parent.user.phoneNumber || t('noContact')}</p>
                          </div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {parent.relationship}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('noParents')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{editingStudent ? t('editStudent') : t('newStudent')}</h2>
              <Button variant="ghost" size="sm" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              {step === 1 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('studentData')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('firstName')} *</label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder={t('firstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('lastName')} *</label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder={t('lastNamePlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('email')} {t('emailOptional')}</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('emailPlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('birthDate')}</label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('gradeLevel')}</label>
                    <Input
                      type="number"
                      value={formData.gradeLevel}
                      onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('gender')}</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="Male">{t('male')}</option>
                      <option value="Female">{t('female')}</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{t('parentData')}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('firstName')}</label>
                      <Input
                        value={formData.parentFirstName}
                        onChange={(e) => setFormData({ ...formData, parentFirstName: e.target.value })}
                        placeholder={t('parentFirstNamePlaceholder')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('lastName')}</label>
                      <Input
                        value={formData.parentLastName}
                        onChange={(e) => setFormData({ ...formData, parentLastName: e.target.value })}
                        placeholder={t('parentLastNamePlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-medium">{t('email')} {t('emailForCredentials')}</label>
                      <Input
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        placeholder={t('parentEmailPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('parentPhone')}</label>
                      <Input
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="+258..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t('relationship')}</label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.parentRelationship}
                        onChange={(e) => setFormData({ ...formData, parentRelationship: e.target.value })}
                      >
                        <option value="FATHER">{t('father')}</option>
                        <option value="MOTHER">{t('mother')}</option>
                        <option value="GUARDIAN">{t('guardian')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Send Student Card Option */}
                  <div className="pt-3 border-t border-border">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.sendStudentCard}
                        onChange={(e) => setFormData({ ...formData, sendStudentCard: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {t('sendStudentCard', { defaultValue: 'Send Student ID Card' })}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {t('sendStudentCardDesc', { defaultValue: 'Generate and email the student ID card along with the welcome credentials.' })}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                {step === 2 && (
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    {tCommon('back')}
                  </Button>
                )}
                {step === 1 && (
                  <Button type="button" variant="outline" onClick={closeModal}>
                    {tCommon('cancel')}
                  </Button>
                )}

                <Button type="button" onClick={handleNext} disabled={createStudentMutation.isPending}>
                  {createStudentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (step === 1 ? t('next') : t('create'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
