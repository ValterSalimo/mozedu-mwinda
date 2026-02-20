'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@mozedu/ui'
import {
  CreditCard,
  Download,
  RotateCcw,
  Loader2,
  QrCode,
  User,
  School,
  Calendar,
  Hash,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useUser } from '@/lib/stores'
import { useCurrentEntity, useStudentId } from '@/lib/hooks/use-current-entity'
import { useStudentCard, useRenderCardHTML, StudentCard } from '@/lib/hooks/use-student-cards'
import { studentCardsApi } from '@/lib/api'
import { toast } from 'sonner'

export default function StudentCardPage() {
  const t = useTranslations('student')
  const tCard = useTranslations('student.card')
  const user = useUser()
  const { entityId, isLoading: entityLoading, studentData } = useCurrentEntity()
  const studentId = useStudentId()
  const currentYear = new Date().getFullYear().toString()

  const [flipped, setFlipped] = useState(false)
  const [frontHtml, setFrontHtml] = useState<string | null>(null)
  const [backHtml, setBackHtml] = useState<string | null>(null)

  const validStudentId = studentId && studentId.length > 0 ? studentId : undefined
  const { data: cardResponse, isLoading: cardLoading, error: cardError } = useStudentCard(validStudentId, currentYear)
  const renderCardHTML = useRenderCardHTML()

  const card = (cardResponse as any)?.data as StudentCard | undefined
  const hasCard = !!card && !cardError
  const is404 = (cardError as any)?.status === 404

  // Load HTML card preview when card exists
  const loadCardHtml = async (cardId: string) => {
    try {
      const [front, back] = await Promise.all([
        renderCardHTML.mutateAsync({ cardId, side: 'front' }),
        renderCardHTML.mutateAsync({ cardId, side: 'back' }),
      ])
      setFrontHtml(front)
      setBackHtml(back)
    } catch {
      // HTML render failed, fall back to default display
    }
  }

  // Load HTML when card becomes available
  if (hasCard && card?.id && !frontHtml && !renderCardHTML.isPending) {
    loadCardHtml(card.id)
  }

  const handleDownloadPDF = async () => {
    if (!card?.id) return
    try {
      const blob = await studentCardsApi.downloadPDF(card.id) as unknown as Blob
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `student-card-${user?.firstName || 'student'}-${currentYear}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(tCard('downloadSuccess'))
    } catch {
      toast.error(tCard('downloadError'))
    }
  }

  if (entityLoading || cardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Build student info for classic card
  const studentInfo = {
    name: user ? `${user.firstName} ${user.lastName}` : 'Student',
    initials: user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'ST',
    studentNumber: card?.card_number || studentData?.studentNumber || user?.id?.slice(0, 8) || '---',
    className: '',
    schoolName: 'School',
    academicYear: card?.academic_year || currentYear,
    qrCode: card?.qr_code_data || '',
    profileImage: card?.student?.profile_image_url || '',
    status: card?.status || 'active',
    issuedAt: card?.issued_at ? new Date(card.issued_at).toLocaleDateString() : '',
    expiresAt: card?.expires_at ? new Date(card.expires_at).toLocaleDateString() : '',
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            {tCard('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{tCard('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {hasCard && (
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              {tCard('downloadPDF')}
            </Button>
          )}
          <Button variant="outline" onClick={() => setFlipped(!flipped)} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {flipped ? tCard('showFront') : tCard('showBack')}
          </Button>
        </div>
      </motion.div>

      {/* Card Display */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-lg"
        >
          {/* Card container with flip animation */}
          <div
            className="relative w-full"
            style={{ perspective: '1000px' }}
          >
            <div
              className="relative w-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front Side */}
              <div
                className="w-full"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {hasCard && frontHtml ? (
                  <div
                    className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10"
                    dangerouslySetInnerHTML={{ __html: frontHtml }}
                  />
                ) : (
                  <ClassicCardFront info={studentInfo} is404={is404} />
                )}
              </div>

              {/* Back Side */}
              <div
                className="w-full absolute top-0 left-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {hasCard && backHtml ? (
                  <div
                    className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10"
                    dangerouslySetInnerHTML={{ __html: backHtml }}
                  />
                ) : (
                  <ClassicCardBack info={studentInfo} is404={is404} />
                )}
              </div>
            </div>
          </div>

          {/* Card Info */}
          {hasCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 grid grid-cols-2 gap-4"
            >
              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm">
                <p className="text-xs text-muted-foreground">{tCard('cardNumber')}</p>
                <p className="font-bold text-foreground">{card?.card_number || '---'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm">
                <p className="text-xs text-muted-foreground">{tCard('status')}</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  card?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {card?.status === 'active' ? tCard('active') : card?.status || '---'}
                </span>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm">
                <p className="text-xs text-muted-foreground">{tCard('issuedDate')}</p>
                <p className="font-bold text-foreground">{studentInfo.issuedAt || '---'}</p>
              </div>
              <div className="bg-white dark:bg-slate-800/80 rounded-xl p-4 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm">
                <p className="text-xs text-muted-foreground">{tCard('expiryDate')}</p>
                <p className="font-bold text-foreground">{studentInfo.expiresAt || '---'}</p>
              </div>
            </motion.div>
          )}

          {/* No card message */}
          {is404 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center"
            >
              <p className="text-sm text-blue-700 dark:text-blue-300">{tCard('classicCardMessage')}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================================
// Classic Default Card - Front
// ============================================================================

function ClassicCardFront({ info, is404 }: { info: any; is404: boolean }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10" style={{ aspectRatio: '1.586' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] " />

      <div className="relative h-full flex flex-col p-6">
        {/* Top: School Name + Logo */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg tracking-wide">{info.schoolName}</h3>
            <p className="text-blue-200 text-xs">{info.academicYear}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <School className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Middle: Photo + Info */}
        <div className="flex-1 flex items-center gap-5 mt-4">
          <div className="h-20 w-20 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
            {info.profileImage ? (
              <img src={info.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">{info.initials}</span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-xl">{info.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Hash className="h-3 w-3 text-blue-200" />
              <span className="text-blue-100 text-sm">{info.studentNumber}</span>
            </div>
            {info.className && (
              <div className="flex items-center gap-2 mt-0.5">
                <User className="h-3 w-3 text-blue-200" />
                <span className="text-blue-100 text-sm">{info.className}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Badge */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-blue-200 uppercase tracking-widest">Student ID Card</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {info.status === 'active' ? 'Active' : info.status}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Classic Default Card - Back
// ============================================================================

function ClassicCardBack({ info, is404 }: { info: any; is404: boolean }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10" style={{ aspectRatio: '1.586' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900" />

      <div className="relative h-full flex flex-col p-6">
        {/* Magnetic strip */}
        <div className="h-10 -mx-6 -mt-6 mb-4 bg-slate-800 dark:bg-slate-600" />

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          {/* QR Code area */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Year: {info.academicYear}</span>
              </div>
              {info.issuedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Issued: {info.issuedAt}</span>
                </div>
              )}
              {info.expiresAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Expires: {info.expiresAt}</span>
                </div>
              )}
            </div>
            <div className="h-20 w-20 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
              {info.qrCode ? (
                <img src={`data:image/png;base64,${info.qrCode}`} alt="QR" className="h-16 w-16" />
              ) : (
                <QrCode className="h-10 w-10 text-slate-400" />
              )}
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-600">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              This card is the property of {info.schoolName}. If found, please return to the school administration.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
