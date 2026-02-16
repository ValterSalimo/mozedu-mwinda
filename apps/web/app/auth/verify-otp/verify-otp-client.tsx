'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@Ulongo/ui'
import { Mail, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useVerifyOTP, useResendOTP } from '@/lib/hooks'
import { useAuthStore } from '@/lib/stores'

export default function VerifyOTPClient() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(0)
  const [isHydrated, setIsHydrated] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const twoFactorPending = useAuthStore((state) => state.twoFactorPending)
  const clearTwoFactorState = useAuthStore((state) => state.clearTwoFactorState)
  const authError = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const { mutate: verifyOTP, isPending: isVerifying, error: verifyError } = useVerifyOTP()
  const { mutate: resendOTP, isPending: isResending } = useResendOTP()

  // Wait for Zustand persist rehydration to complete
  useEffect(() => {
    // Check if the store has rehydrated by using onRehydrateStorage or by checking persist
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })

    // In case hydration already finished before this effect runs
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  // Redirect if no 2FA session (only after hydration)
  useEffect(() => {
    if (isHydrated && !twoFactorPending) {
      router.push('/auth/login')
    }
  }, [isHydrated, twoFactorPending, router])

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => clearError()
  }, [clearError])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Take only last character
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit !== '') && value) {
      verifyOTP(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtp(newOtp)
      verifyOTP(pastedData)
    }
  }

  const handleResend = () => {
    resendOTP(undefined, {
      onSuccess: () => {
        setCountdown(60) // 60 second cooldown
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      },
    })
  }

  const handleBack = () => {
    clearTwoFactorState()
    router.push('/auth/login')
  }

  const displayError = verifyError?.message || authError

  // Show loading while hydrating or if no 2FA pending
  if (!isHydrated || !twoFactorPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-2xl font-bold text-primary-foreground">Mw</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Mwinda</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            {t('verifyOTP')}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t('otpSentTo')}
          </p>
          <p className="mt-1 font-medium text-foreground">{twoFactorPending.email}</p>
        </div>

        {displayError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          {/* OTP Input */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent ${displayError ? 'border-destructive' : 'border-input'
                  }`}
                disabled={isVerifying}
              />
            ))}
          </div>

          {/* Verify Button */}
          <Button
            type="button"
            className="w-full"
            size="lg"
            disabled={isVerifying || otp.some(d => d === '')}
            onClick={() => verifyOTP(otp.join(''))}
          >
            {isVerifying ? t('verifying') : t('verify')}
          </Button>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('resendIn', { seconds: countdown })}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? t('resending') : t('resendCode')}
              </button>
            )}
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToLogin')}
            </button>
          </div>
        </div>

        {/* Help text */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('otpHelp')}
        </p>
      </div>
    </div>
  )
}
