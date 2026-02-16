'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from '@mozedu/ui'
import { useAuthStore } from '@/lib/stores'

export function SessionErrorModal() {
    const router = useRouter()

    // Select state directly to minimize re-renders
    const sessionError = useAuthStore((state) => state.sessionError)
    const clearSessionError = useAuthStore((state) => state.clearSessionError)

    if (!sessionError) return null

    const handleLogin = () => {
        clearSessionError()
        router.push('/auth/login')
    }

    return (
        <Dialog open={!!sessionError} onOpenChange={(open) => !open && clearSessionError()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Session Action Required</DialogTitle>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        {sessionError}
                    </p>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={handleLogin}>Log In Again</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
