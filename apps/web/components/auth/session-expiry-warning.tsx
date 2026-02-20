'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { getTokenExpiresAt, getFreshAccessToken } from '@/lib/api'
import { useAuthStore } from '@/lib/stores'

/** Show a warning toast 2 minutes before the access token expires */
const WARNING_THRESHOLD_MS = 2 * 60 * 1000
/** How often to check remaining time */
const CHECK_INTERVAL_MS = 30 * 1000

export function SessionExpiryWarning() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const warningShownRef = useRef(false)

    useEffect(() => {
        if (!isAuthenticated) {
            warningShownRef.current = false
            return
        }

        const check = () => {
            const expiresAt = getTokenExpiresAt()
            if (!expiresAt) return

            const remaining = expiresAt - Date.now()

            // Token was refreshed — reset warning flag
            if (remaining > WARNING_THRESHOLD_MS) {
                warningShownRef.current = false
                return
            }

            // Show warning once when under threshold and still valid
            if (remaining > 0 && remaining <= WARNING_THRESHOLD_MS && !warningShownRef.current) {
                warningShownRef.current = true
                const minutes = Math.ceil(remaining / 60000)

                toast.warning(
                    `Your session expires in ~${minutes} minute${minutes !== 1 ? 's' : ''}`,
                    {
                        description: 'Click "Extend" to stay logged in.',
                        duration: Math.min(remaining, 120000), // show up to 2 min
                        action: {
                            label: 'Extend Session',
                            onClick: async () => {
                                try {
                                    await getFreshAccessToken()
                                    warningShownRef.current = false
                                    toast.success('Session extended successfully')
                                } catch {
                                    // Handled by the session-expired flow
                                }
                            },
                        },
                    },
                )
            }
        }

        // Run immediately, then on interval
        check()
        const interval = setInterval(check, CHECK_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [isAuthenticated])

    return null
}
