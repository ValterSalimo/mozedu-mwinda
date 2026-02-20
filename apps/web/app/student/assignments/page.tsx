'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen,
    CheckCircle,
    Clock,
    FileText,
    Filter,
    Search,
    AlertCircle,
    ChevronRight,
    Upload,
    Calendar
} from 'lucide-react'
import { Input, Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@mozedu/ui'
import { useUser } from '@/lib/stores'
import { useStudentAssignments } from '@/lib/hooks/use-assignments'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export default function StudentAssignmentsPage() {
    const t = useTranslations('student') // Using student namespace, assuming keys exist or will fallback
    const user = useUser()
    const studentId = user?.entityId || ''
    const { data: assignments, isLoading } = useStudentAssignments(studentId)

    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')

    const pendingAssignments = assignments?.filter(a => a.status === 'PENDING') || []
    const completedAssignments = assignments?.filter(a => a.status === 'GRADED' || a.status === 'SUBMITTED') || [] // Assuming GRADED implies completed

    const filteredList = (list: any[]) => {
        return list.filter(item =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.subjectName.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                        {t('assignments.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('assignmentsSubtitle')}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-blue-500/10 rounded-bl-2xl transition-colors group-hover:bg-blue-500/20">
                        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('pendingAssignments')}</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{pendingAssignments.length}</h3>
                    <div className="mt-2 text-xs text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20 py-1 px-2 rounded-lg w-fit">
                        {t('assignments.dueSoon')}{pendingAssignments.length > 0 ? '2' : '0'}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-green-500/10 rounded-bl-2xl transition-colors group-hover:bg-green-500/20">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('assignments.completed')}</p>
                    <h3 className="text-3xl font-bold mt-2 text-foreground">{completedAssignments.length}</h3>
                    <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 dark:bg-green-900/20 py-1 px-2 rounded-lg w-fit">
                        {t('assignments.greatJob')}
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 bg-purple-500/10 rounded-bl-2xl transition-colors group-hover:bg-purple-500/20">
                        <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{t('nextDue')}</p>
                    <h3 className="text-lg font-bold mt-2 text-foreground truncate">
                        {pendingAssignments.length > 0 ? new Date(pendingAssignments[0].dueDate).toLocaleDateString() : t('assignments.noPendingTasks')}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {pendingAssignments.length > 0 ? pendingAssignments[0].title : t('assignments.allCaughtUp')}
                    </p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('searchAssignments')}
                        className="pl-10 h-10 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button variant={filter === 'all' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('all')} className="rounded-full">
                        {t('assignments.all')}
                    </Button>
                    <Button variant={filter === 'quiz' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('quiz')} className="rounded-full">
                        {t('assignments.quizzes')}
                    </Button>
                    <Button variant={filter === 'task' ? 'primary' : 'outline'} size="sm" onClick={() => setFilter('task')} className="rounded-full">
                        {t('assignments.tasks')}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('assignments.pending')}</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">{t('assignments.completed')}</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-40 rounded-2xl bg-muted/20 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredList(pendingAssignments).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="h-10 w-10 text-muted-foreground opacity-50" />
                            </div>
                            <h3 className="text-xl font-bold">{t('noPendingAssignments')}</h3>
                            <p className="text-muted-foreground">{t('assignments.allCaughtUpMessage')}</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <AnimatePresence>
                                {filteredList(pendingAssignments).map((assignment) => (
                                    <motion.div key={assignment.id} variants={item} layout>
                                        <div className="glass-card rounded-2xl p-6 h-full flex flex-col hover:border-primary/50 transition-all duration-300 group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-2 rounded-xl ${assignment.type === 'QUIZ' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                    {assignment.type === 'QUIZ' ? <FileText className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                                                </div>
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200">
                                                    {t('assignments.pending')}
                                                </Badge>
                                            </div>

                                            <div className="mb-4 flex-1">
                                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{assignment.title}</h3>
                                                <p className="text-sm font-medium text-muted-foreground">{assignment.subjectName}</p>

                                                {assignment.description && (
                                                    <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">
                                                        {assignment.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-3 pt-4 border-t border-border/50">
                                                <div className="flex items-center text-xs text-muted-foreground gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{t('assignments.due')} {new Date(assignment.dueDate).toLocaleDateString()}</span>
                                                </div>

                                                <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-all" onClick={() => toast.info(t('assignments.comingSoon'))}>
                                                    <Upload className="h-4 w-4" />
                                                    {t('assignments.submitAssignment')}
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                    {/* Similar list but for completed items */}
                    {filteredList(completedAssignments).length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>{t('noCompletedAssignments')}</p>
                        </div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredList(completedAssignments).map((assignment) => (
                                <motion.div key={assignment.id} variants={item}>
                                    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col opacity-80 hover:opacity-100 transition-opacity">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="h-5 w-5" />
                                            </div>
                                            <span className="text-lg font-bold text-foreground">
                                                {assignment.score} <span className="text-sm text-muted-foreground font-normal">/ {assignment.maxScore}</span>
                                            </span>
                                        </div>
                                        <div className="mb-4">
                                            <h3 className="text-lg font-bold text-foreground mb-1">{assignment.title}</h3>
                                            <p className="text-sm font-medium text-muted-foreground">{assignment.subjectName}</p>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-border/50 text-xs text-muted-foreground flex justify-between">
                                            <span>{t('graded')}</span>
                                            <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
