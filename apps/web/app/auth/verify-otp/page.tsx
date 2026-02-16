import { Suspense } from 'react'
import VerifyOTPClient from './verify-otp-client'

export const metadata = {
  title: 'Verify OTP - Mwinda',
  description: 'Enter the verification code sent to your email',
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VerifyOTPClient />
    </Suspense>
  )
}
