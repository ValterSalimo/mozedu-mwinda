'use client'

import { UserRole } from '@mozedu/types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Button
} from '@mozedu/ui'
import { useTranslations } from 'next-intl'
import { User, Shield, GraduationCap, School as SchoolIcon } from 'lucide-react'

interface RoleSelectionModalProps {
    open: boolean
    roles: UserRole[]
    onSelect: (role: UserRole) => void
    onCancel: () => void
    isPending?: boolean
}

export function RoleSelectionModal({ open, roles, onSelect, onCancel, isPending }: RoleSelectionModalProps) {
    const t = useTranslations('auth')

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case UserRole.PARENT:
                return <User className="h-5 w-5 text-blue-500" />
            case UserRole.TEACHER:
            case UserRole.TEACHER_ADMIN:
                return <GraduationCap className="h-5 w-5 text-green-500" />
            case UserRole.SCHOOL_ADMIN:
                return <SchoolIcon className="h-5 w-5 text-purple-500" />
            default:
                return <Shield className="h-5 w-5 text-gray-500" />
        }
    }

    const getRoleLabel = (role: UserRole) => {
        // Basic mapping if translations are missing, but ideally use t()
        // We assume translation keys exist: auth.roles.PARENT, etc.
        // Or we can map manually.
        return t(`roles.${role}`)
    }

    const getRoleDescription = (role: UserRole) => {
        return t(`roles.${role}_description`)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('selectProfile')}</DialogTitle>
                    <DialogDescription>
                        {t('selectProfileDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3 py-4">
                    {roles.map((role) => (
                        <Button
                            key={role}
                            variant="outline"
                            className="w-full justify-start h-auto p-4 text-left hover:bg-accent hover:text-accent-foreground border-2 border-transparent hover:border-primary/20 transition-all"
                            onClick={() => onSelect(role)}
                            disabled={isPending}
                        >
                            <div className="mr-4 p-2 bg-background rounded-full shadow-sm">
                                {getRoleIcon(role)}
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-semibold text-base">{getRoleLabel(role)}</span>
                                <span className="text-xs text-muted-foreground font-normal">{getRoleDescription(role)}</span>
                            </div>
                        </Button>
                    ))}
                </div>
                <div className="flex justify-end">
                    <Button variant="ghost" onClick={onCancel} disabled={isPending}>
                        {t('cancel')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
