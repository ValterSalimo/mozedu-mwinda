'use client'

import React, { useState } from 'react'
import { Plus, Search, Trash2, UserPlus, X, Loader2, Edit } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gql, parentsApi } from '@/lib/api'
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@mozedu/ui'
import { toast } from 'sonner'
import { useCurrentEntity } from '@/lib/hooks/use-current-entity'
import { useStudents } from '@/lib/hooks/use-students'
import { useTranslations } from 'next-intl'

export default function ParentsPage() {
    const { schoolId } = useCurrentEntity()
    const t = useTranslations('school')
    const queryClient = useQueryClient()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedParent, setSelectedParent] = useState<any>(null)

    // Fetch Parents
    const { data: parentsData, isLoading } = useQuery({
        queryKey: ['parents', schoolId],
        queryFn: async () => {
            const res = await gql.parents()
            return res.parents?.edges.map((e: any) => e.node) || []
        },
        enabled: !!schoolId
    })

    // Create Parent Mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => parentsApi.create({ ...data, school_id: schoolId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parents'] })
            setIsCreateOpen(false)
            toast.success(t('parents.created'))
        },
        onError: (err: any) => toast.error(err.message || 'Erro ao criar encarregado')
    })

    // Link Student Mutation
    const linkStudentMutation = useMutation({
        mutationFn: ({ parentId, studentId }: { parentId: string, studentId: string }) =>
            parentsApi.addStudent(parentId, studentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parentChildren'] })
            toast.success(t('parents.studentLinked'))
        },
        onError: (err: any) => toast.error(err.message || 'Erro ao vincular aluno')
    })

    // Unlink Student Mutation
    const unlinkStudentMutation = useMutation({
        mutationFn: ({ parentId, studentId }: { parentId: string, studentId: string }) =>
            parentsApi.removeStudent(parentId, studentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['parentChildren'] })
            toast.success(t('parents.studentUnlinked'))
        },
        onError: (err: any) => toast.error(err.message || 'Erro ao desvincular aluno')
    })

    // Handle Create Form Submit
    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        createMutation.mutate({
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
        })
    }

    // Fetch Linked Children for Selected Parent
    const { data: linkedChildren, isLoading: isLoadingChildren } = useQuery({
        queryKey: ['parentChildren', selectedParent?.id],
        queryFn: async () => {
            if (!selectedParent?.id) return []
            const res = await gql.parentChildren(selectedParent.id)
            return res.parentChildren || []
        },
        enabled: !!selectedParent?.id
    })

    return (
        <div className="p-8 space-y-6 container mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('parents.title')}</h1>
                    <p className="text-muted-foreground">{t('parents.subtitle')}</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('parents.newParent')}
                </Button>
            </div>

            <div className="rounded-md border bg-card shadow-sm">
                {isLoading ? (
                    <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="divide-y">
                        {parentsData?.length === 0 && <div className="p-4 text-center text-muted-foreground">{t('parents.noParentsFound')}</div>}
                        {parentsData?.map((p: any) => (
                            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-semibold">{p.user?.firstName} {p.user?.lastName}</span>
                                    <span className="text-sm text-muted-foreground">{p.user?.email}</span>
                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>{p.user?.phoneNumber || t('parents.noPhone')}</span>
                                        <span>•</span>
                                        <span>{p.relationship || t('parents.parent')}</span>
                                        <span>•</span>
                                        <span>{p.children?.length || 0} {t('parents.studentsCount')}</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setSelectedParent(p)}>
                                    <Edit className="mr-2 h-3 w-3" /> {t('parents.manageLinks')}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{t('parents.newParent')}</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>{t('parents.firstName')}</Label><Input name="first_name" required placeholder={t('parents.firstNamePlaceholder')} /></div>
                            <div className="space-y-2"><Label>{t('parents.lastName')}</Label><Input name="last_name" required placeholder={t('parents.lastNamePlaceholder')} /></div>
                        </div>
                        <div className="space-y-2"><Label>{t('parents.email')}</Label><Input name="email" type="email" required placeholder={t('parents.emailPlaceholder')} /></div>
                        <div className="space-y-2"><Label>{t('parents.phone')}</Label><Input name="phone" placeholder={t('parents.phonePlaceholder')} /></div>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t('parents.create')}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Manage/Link Modal */}
            <Dialog open={!!selectedParent} onOpenChange={(open) => !open && setSelectedParent(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t('parents.manage')} {selectedParent?.user?.firstName} {selectedParent?.user?.lastName}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* List Linked Students */}
                        <div>
                            <h3 className="font-medium mb-3 text-sm uppercase text-muted-foreground">{t('parents.linkedStudents')}</h3>
                            {isLoadingChildren ? (
                                <div className="text-sm text-muted-foreground">{t('parents.loading')}</div>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {linkedChildren?.map((child: any) => (
                                        <div key={child.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md border">
                                            <div>
                                                <p className="font-medium">{child.user?.firstName} {child.user?.lastName}</p>
                                                <p className="text-xs text-muted-foreground">Nº: {child.studentNumber}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => unlinkStudentMutation.mutate({ parentId: selectedParent?.id, studentId: child.id })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {linkedChildren?.length === 0 && <p className="text-sm text-muted-foreground italic">{t('parents.noLinkedStudents')}</p>}
                                </div>
                            )}
                        </div>

                        {/* Add New Link */}
                        <div className="border-t pt-4">
                            <h3 className="font-medium mb-3 text-sm uppercase text-muted-foreground">{t('parents.addNewLink')}</h3>
                            <StudentSearch
                                onSelect={(studentId) => linkStudentMutation.mutate({ parentId: selectedParent?.id, studentId })}
                                isLoading={linkStudentMutation.isPending}
                                currentSchoolId={schoolId}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function StudentSearch({ onSelect, isLoading, currentSchoolId }: { onSelect: (id: string) => void, isLoading: boolean, currentSchoolId?: string }) {
    const t = useTranslations('school')
    const [search, setSearch] = useState('')
    const { data: searchResults, isFetching } = useStudents({
        schoolId: currentSchoolId, // Ensure we search in current school
        searchTerm: search,
        limit: 5
    } as any)

    return (
        <div className="space-y-2 relative">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t('parents.searchStudentPlaceholder')}
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {search.length > 0 && (
                <div className="border rounded-md mt-1 max-h-40 overflow-y-auto bg-popover shadow-md absolute w-full z-10 bg-white dark:bg-zinc-950">
                    {isFetching && <div className="p-2 text-xs text-muted-foreground">{t('parents.searching')}</div>}
                    {!isFetching && searchResults?.students?.length === 0 && <div className="p-2 text-xs text-muted-foreground">{t('parents.noStudentFound')}</div>}

                    {searchResults?.students?.map((s: any) => (
                        <div
                            key={s.id}
                            className="p-2 hover:bg-muted cursor-pointer flex justify-between items-center text-sm"
                            onClick={() => { onSelect(s.id); setSearch('') }}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{s.user?.firstName} {s.user?.lastName}</span>
                                <span className="text-xs text-muted-foreground">{s.class?.name || t('parents.noClass')}</span>
                            </div>
                            <Button size="sm" variant="ghost" disabled={isLoading}><UserPlus className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
