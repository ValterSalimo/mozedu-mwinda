'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Beaker,
    CheckCircle,
    Clock,
    Search,
    Calendar,
    Microscope,
    Dumbbell,
    Calculator
} from 'lucide-react'
import { Input, Button, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '@mozedu/ui'
import { useUser } from '@/lib/stores'
import { useStudentPracticals } from '@/lib/hooks/use-assignments'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export default function StudentPracticalsPage() {
    const t = useTranslations('student')
    const user = useUser()
    const studentId = user?.entityId || ''
    const { data: practicals, isLoading } = useStudentPracticals(studentId)

    const [search, setSearch] = useState('')

    const pendingPracticals = practicals?.filter(a => a.status === 'PENDING') || []
    const completedPracticals = practicals?.filter(a => a.status === 'GRADED' || a.status === 'SUBMITTED') || []

    const filteredList = (list: any[]) => {
        return list.filter(item =>
            item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.subjectName.toLowerCase().includes(search.toLowerCase())
        )
    }

    // Helper to choose icon based on subject
    const getIcon = (subject: string) => {
        const s = subject.toLowerCase()
        if (s.includes('sci') || s.includes('phy') || s.includes('chem')) return Microscope
        if (s.includes('math')) return Calculator
        if (s.includes('sport') || s.includes('phys')) return Dumbbell
        return Beaker
    }

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const item = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1 }
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                        {t('practicals.title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('practicals.subtitle')}
                    </p>
                </div>
            </div>

            {/* Featured / Hero Section for Next Practical */}
            {pendingPracticals.length > 0 && (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-xl">
                    <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    <div className="absolute bottom-0 left-0 p-16 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />

                    <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 space-y-4">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm">
                                Up Next
                            </Badge>
                            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                                {pendingPracticals[0].title}
                            </h2>
                            <div className="flex items-center gap-4 text-emerald-100">
                                <span className="flex items-center gap-2">
                                    <Microscope className="h-5 w-5" />
                                    {pendingPracticals[0].subjectName}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    {new Date(pendingPracticals[0].dueDate).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="max-w-xl text-emerald-50/90 leading-relaxed">
                                {pendingPracticals[0].description || 'Get ready for your practical session. Make sure to review the safety guidelines and bring necessary equipment.'}
                            </p>
                            <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold border-none mt-4" onClick={() => toast.info('Coming Soon')}>
                                View Instructions
                            </Button>
                        </div>
                        <div className="hidden md:flex items-center justify-center bg-white/10 rounded-full p-8 backdrop-blur-md shadow-inner border border-white/20">
                            <Beaker className="h-24 w-24 text-white" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mt-8">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('practicals.search')}
                        className="pl-10 h-10 bg-background/50"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl max-w-md">
                    <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-muted/20 animate-pulse" />)}
                        </div>
                    ) : filteredList(pendingPracticals).length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-border/50">
                            <Beaker className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
                            <h3 className="text-xl font-bold">{t('practicals.noPending')}</h3>
                            <p className="text-muted-foreground">You&apos;re clear for now!</p>
                        </div>
                    ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredList(pendingPracticals).map((item) => {
                                const Icon = getIcon(item.subjectName)
                                return (
                                    <motion.div key={item.id} variants={item}>
                                        <div className="group relative bg-card hover:bg-accent/5 rounded-3xl p-6 border border-border hover:border-emerald-500/30 transition-all duration-300 shadow-sm hover:shadow-xl">
                                            <div className="absolute top-6 right-6 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                                <Icon className="h-6 w-6" />
                                            </div>

                                            <div className="space-y-4">
                                                <Badge variant="outline" className="rounded-full border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 dark:text-emerald-300">
                                                    {item.subjectName}
                                                </Badge>

                                                <div>
                                                    <h3 className="text-xl font-bold text-foreground leading-tight group-hover:text-emerald-600 transition-colors">
                                                        {item.title}
                                                    </h3>
                                                </div>

                                                {item.description && (
                                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                                        {item.description}
                                                    </p>
                                                )}

                                                <div className="pt-6 mt-2 flex items-center justify-between border-t border-dashed border-border">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="h-4 w-4" />
                                                        <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                    <Badge className="bg-foreground text-background hover:bg-foreground/90">Start</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    )}
                </TabsContent>

                <TabsContent value="completed">
                    {/* Similar structure logic */}
                    <div className="text-center py-16 text-muted-foreground">
                        <p>{t('practicals.pastHistory')}</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
