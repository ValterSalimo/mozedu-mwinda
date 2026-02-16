'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@mozedu/ui'
import {
  GraduationCap,
  Users,
  School,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  Play,
  Star,
  Check,
  Sparkles,
  Brain,
  Smartphone,
  MessageCircle,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react'
import { LanguageSwitcher } from '../components/language-switcher'
import { useTheme } from './theme-provider'

// Mock Images using placeholder services
const MOCK_IMAGES = {
  dashboard: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop',
  students: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop',
  classroom: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop',
  teacher: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
  parent: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
  school: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
  mobile: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=800&fit=crop',
  africa: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=1200&h=800&fit=crop',
  // Feature Images
  schoolManagement: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop',
  ai: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
  mobileApp: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
  multilingual: 'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=800&h=600&fit=crop',
  security: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop',
  analytics: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
}

// --- Navigation ---
const Navigation = () => {
  const { resolvedTheme, setTheme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = useTranslations('common')
  const tLanding = useTranslations('landing')

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 py-4'
            : 'bg-transparent py-6'
          }`}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-lg">
                Mw
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">Mwinda</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { labelKey: 'nav.features', href: '#features' },
              { labelKey: 'nav.portals', href: '#portals' },
              { labelKey: 'nav.about', href: '#about' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
              >
                {tLanding(item.labelKey)}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 rounded-full hover:bg-muted transition-colors"
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <LanguageSwitcher />
            <div className="w-px h-6 bg-border mx-2" />
            <Link href="/auth/login">
              <Button className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 shadow-lg shadow-blue-500/25">
                {t('login')}
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col items-center justify-center h-full gap-8">
              {[
                { labelKey: 'nav.features', href: '#features' },
                { labelKey: 'nav.portals', href: '#portals' },
                { labelKey: 'nav.about', href: '#about' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-3xl font-bold hover:text-primary transition-colors"
                >
                  {tLanding(item.labelKey)}
                </a>
              ))}

              {/* Theme Toggle & Language Switcher */}
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center justify-center min-w-[44px] min-h-[44px] p-3 rounded-full bg-muted hover:bg-muted/80 transition-all duration-200"
                  aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {resolvedTheme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>
                <LanguageSwitcher />
              </div>

              <div className="flex gap-4 mt-4">
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                  <Button size="lg">{t('login')}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// --- Hero Section ---
const Hero = () => {
  const t = useTranslations('landing')

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      {/* Low-Poly Geometric Blue Background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-600" />

        {/* SVG Low-Poly Pattern Overlay */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Row 1 */}
          <polygon fill="#38bdf8" fillOpacity="0.7" points="0,0 200,0 100,80" />
          <polygon fill="#0ea5e9" fillOpacity="0.6" points="200,0 350,0 280,100 100,80" />
          <polygon fill="#56d0f5" fillOpacity="0.5" points="350,0 500,0 450,120 280,100" />
          <polygon fill="#0284c7" fillOpacity="0.6" points="500,0 700,0 600,90 450,120" />
          <polygon fill="#38bdf8" fillOpacity="0.7" points="700,0 850,0 800,110 600,90" />
          <polygon fill="#7dd3fc" fillOpacity="0.5" points="850,0 1000,0 1000,80 800,110" />
          {/* Row 2 */}
          <polygon fill="#0ea5e9" fillOpacity="0.6" points="0,0 100,80 50,180 0,150" />
          <polygon fill="#56d0f5" fillOpacity="0.5" points="100,80 280,100 200,200 50,180" />
          <polygon fill="#0284c7" fillOpacity="0.7" points="280,100 450,120 400,220 200,200" />
          <polygon fill="#38bdf8" fillOpacity="0.6" points="450,120 600,90 550,200 400,220" />
          <polygon fill="#7dd3fc" fillOpacity="0.5" points="600,90 800,110 750,210 550,200" />
          <polygon fill="#0ea5e9" fillOpacity="0.6" points="800,110 1000,80 1000,200 750,210" />
          {/* Row 3 */}
          <polygon fill="#56d0f5" fillOpacity="0.7" points="0,150 50,180 80,300 0,280" />
          <polygon fill="#0284c7" fillOpacity="0.5" points="50,180 200,200 180,320 80,300" />
          <polygon fill="#38bdf8" fillOpacity="0.6" points="200,200 400,220 350,340 180,320" />
          <polygon fill="#7dd3fc" fillOpacity="0.7" points="400,220 550,200 500,330 350,340" />
          <polygon fill="#0ea5e9" fillOpacity="0.5" points="550,200 750,210 700,340 500,330" />
          <polygon fill="#56d0f5" fillOpacity="0.6" points="750,210 1000,200 1000,350 700,340" />
          {/* Row 4 */}
          <polygon fill="#0284c7" fillOpacity="0.6" points="0,280 80,300 100,420 0,400" />
          <polygon fill="#38bdf8" fillOpacity="0.7" points="80,300 180,320 200,450 100,420" />
          <polygon fill="#7dd3fc" fillOpacity="0.5" points="180,320 350,340 320,470 200,450" />
          <polygon fill="#0ea5e9" fillOpacity="0.6" points="350,340 500,330 480,460 320,470" />
          <polygon fill="#56d0f5" fillOpacity="0.7" points="500,330 700,340 650,480 480,460" />
          <polygon fill="#0284c7" fillOpacity="0.5" points="700,340 1000,350 1000,500 650,480" />
          {/* Row 5 */}
          <polygon fill="#38bdf8" fillOpacity="0.6" points="0,400 100,420 80,550 0,520" />
          <polygon fill="#7dd3fc" fillOpacity="0.7" points="100,420 200,450 180,580 80,550" />
          <polygon fill="#0ea5e9" fillOpacity="0.5" points="200,450 320,470 300,600 180,580" />
          <polygon fill="#56d0f5" fillOpacity="0.6" points="320,470 480,460 450,600 300,600" />
          <polygon fill="#0284c7" fillOpacity="0.7" points="480,460 650,480 620,600 450,600" />
          <polygon fill="#38bdf8" fillOpacity="0.5" points="650,480 1000,500 1000,600 620,600" />
          {/* Row 6 */}
          <polygon fill="#7dd3fc" fillOpacity="0.6" points="0,520 80,550 0,600" />
          <polygon fill="#0ea5e9" fillOpacity="0.7" points="80,550 180,580 0,600" />
        </svg>

        {/* Subtle animated glow overlays for depth */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-200/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-300/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-8">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t('badge')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              {t('hero.welcome')}
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Mwinda
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="url(#underline)" strokeWidth="4" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="underline" x1="0" y1="0" x2="200" y2="0">
                      <stop stopColor="#2563eb" />
                      <stop offset="0.5" stopColor="#06b6d4" />
                      <stop offset="1" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl">
              {t('hero.description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/auth/login">
                <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 shadow-xl shadow-blue-500/25 group">
                  {t('hero.accessPortal') || 'Aceder ao Portal'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg group border-2">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                {t('hero.watchDemo')}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 border-2 border-background" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{t('hero.schoolsCount')}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-muted-foreground ml-1">--</span>
              </div>
            </div>
          </motion.div>

          {/* Right - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 bg-card">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full max-w-xs mx-auto h-6 rounded-full bg-muted/50 flex items-center justify-center text-xs text-muted-foreground">
                    mwinda.mozedu.org
                  </div>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {[
                    { labelKey: 'preview.students', value: '2,847', color: 'from-blue-500 to-blue-600', icon: GraduationCap },
                    { labelKey: 'preview.teachers', value: '156', color: 'from-emerald-500 to-emerald-600', icon: BookOpen },
                    { labelKey: 'preview.attendanceRate', value: '94%', color: 'from-purple-500 to-purple-600', icon: TrendingUp },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                        <stat.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Chart Mockup */}
                <div className="h-32 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 flex items-end justify-around px-4 pb-4">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.5, ease: "easeOut" }}
                      className="w-4 rounded-t-sm bg-gradient-to-t from-blue-600 to-cyan-400"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20, x: -20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute -left-8 top-1/4 p-4 rounded-xl bg-card border border-border shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="font-semibold">{t('preview.gradeRecorded')}</div>
                  <div className="text-sm text-muted-foreground">{t('preview.mathGrade')}</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ delay: 1.2 }}
              className="absolute -right-4 bottom-1/4 p-4 rounded-xl bg-card border border-border shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="font-semibold">{t('preview.newMessage')}</div>
                  <div className="text-sm text-muted-foreground">{t('preview.teacherName')}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- Features Section (Static Grid) ---
const Features = () => {
  const t = useTranslations('landing')

  const features = [
    {
      icon: School,
      titleKey: 'schoolManagement',
      descKey: 'schoolManagementDesc',
      gradient: 'from-blue-600 to-cyan-500',
      lightBg: 'from-blue-50 to-cyan-50',
      darkBg: 'dark:from-blue-950/50 dark:to-cyan-950/50',
      image: MOCK_IMAGES.schoolManagement,
      stats: [
        { value: '--', labelKey: 'schoolsUsing' },
        { value: '--', labelKey: 'uptime' },
      ],
      highlights: ['enrollmentKey', 'schedulesKey', 'resourcesKey'],
    },
    {
      icon: Brain,
      titleKey: 'artificialIntelligence',
      descKey: 'artificialIntelligenceDesc',
      gradient: 'from-purple-600 to-pink-500',
      lightBg: 'from-purple-50 to-pink-50',
      darkBg: 'dark:from-purple-950/50 dark:to-pink-950/50',
      image: MOCK_IMAGES.ai,
      stats: [
        { value: '--', labelKey: 'accuracy' },
        { value: '24/7', labelKey: 'monitoring' },
      ],
      highlights: ['predictiveKey', 'riskDetectionKey', 'recommendationsKey'],
    },
    {
      icon: Smartphone,
      titleKey: 'mobileApp',
      descKey: 'mobileAppDesc',
      gradient: 'from-cyan-600 to-teal-500',
      lightBg: 'from-cyan-50 to-teal-50',
      darkBg: 'dark:from-cyan-950/50 dark:to-teal-950/50',
      image: MOCK_IMAGES.mobileApp,
      stats: [
        { value: '--', labelKey: 'rating' },
        { value: '--', labelKey: 'downloads' },
      ],
      highlights: ['realtimeKey', 'offlineKey', 'chatKey'],
    },
    {
      icon: Globe,
      titleKey: 'multilingual',
      descKey: 'multilingualDesc',
      gradient: 'from-emerald-600 to-green-500',
      lightBg: 'from-emerald-50 to-green-50',
      darkBg: 'dark:from-emerald-950/50 dark:to-green-950/50',
      image: MOCK_IMAGES.multilingual,
      stats: [
        { value: '4', labelKey: 'languages' },
        { value: '100%', labelKey: 'coverage' },
      ],
      highlights: ['portugueseKey', 'englishKey', 'frenchTurkishKey'],
    },
    {
      icon: Shield,
      titleKey: 'security',
      descKey: 'securityDesc',
      gradient: 'from-orange-600 to-amber-500',
      lightBg: 'from-orange-50 to-amber-50',
      darkBg: 'dark:from-orange-950/50 dark:to-amber-950/50',
      image: MOCK_IMAGES.security,
      stats: [
        { value: '256-bit', labelKey: 'encryption' },
        { value: 'LGPD', labelKey: 'compliant' },
      ],
      highlights: ['dataProtectionKey', 'backupKey', 'auditKey'],
    },
    {
      icon: BarChart3,
      titleKey: 'analytics',
      descKey: 'analyticsDesc',
      gradient: 'from-rose-600 to-pink-500',
      lightBg: 'from-rose-50 to-pink-50',
      darkBg: 'dark:from-rose-950/50 dark:to-pink-950/50',
      image: MOCK_IMAGES.analytics,
      stats: [
        { value: '--', labelKey: 'reportTypes' },
        { value: '--', labelKey: 'dashboards' },
      ],
      highlights: ['performanceKey', 'trendsKey', 'insightsKey'],
    },
  ]

  // Translation maps for features
  const featureTitles: Record<string, string> = {
    schoolManagement: t('newFeatures.schoolManagement.title'),
    artificialIntelligence: t('newFeatures.ai.title'),
    mobileApp: t('newFeatures.mobile.title'),
    multilingual: t('newFeatures.multilingual.title'),
    security: t('newFeatures.security.title'),
    analytics: t('newFeatures.analytics.title'),
  }

  const featureDescs: Record<string, string> = {
    schoolManagement: t('newFeatures.schoolManagement.desc'),
    artificialIntelligence: t('newFeatures.ai.desc'),
    mobileApp: t('newFeatures.mobile.desc'),
    multilingual: t('newFeatures.multilingual.desc'),
    security: t('newFeatures.security.desc'),
    analytics: t('newFeatures.analytics.desc'),
  }

  const statLabels: Record<string, string> = {
    schoolsUsing: t('newFeatures.stats.schoolsUsing'),
    uptime: t('newFeatures.stats.uptime'),
    accuracy: t('newFeatures.stats.accuracy'),
    monitoring: t('newFeatures.stats.monitoring'),
    rating: t('newFeatures.stats.rating'),
    downloads: t('newFeatures.stats.downloads'),
    languages: t('newFeatures.stats.languages'),
    coverage: t('newFeatures.stats.coverage'),
    encryption: t('newFeatures.stats.encryption'),
    compliant: t('newFeatures.stats.compliant'),
    reportTypes: t('newFeatures.stats.reportTypes'),
    dashboards: t('newFeatures.stats.dashboards'),
  }

  const highlightTexts: Record<string, string> = {
    enrollmentKey: t('newFeatures.highlights.enrollment'),
    schedulesKey: t('newFeatures.highlights.schedules'),
    resourcesKey: t('newFeatures.highlights.resources'),
    predictiveKey: t('newFeatures.highlights.predictive'),
    riskDetectionKey: t('newFeatures.highlights.riskDetection'),
    recommendationsKey: t('newFeatures.highlights.recommendations'),
    realtimeKey: t('newFeatures.highlights.realtime'),
    offlineKey: t('newFeatures.highlights.offline'),
    chatKey: t('newFeatures.highlights.chat'),
    portugueseKey: t('newFeatures.highlights.portuguese'),
    englishKey: t('newFeatures.highlights.english'),
    frenchTurkishKey: t('newFeatures.highlights.frenchTurkish'),
    dataProtectionKey: t('newFeatures.highlights.dataProtection'),
    backupKey: t('newFeatures.highlights.backup'),
    auditKey: t('newFeatures.highlights.audit'),
    performanceKey: t('newFeatures.highlights.performance'),
    trendsKey: t('newFeatures.highlights.trends'),
    insightsKey: t('newFeatures.highlights.insights'),
  }

  return (
    <section id="features" className="relative py-20 md:py-32 bg-background overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t('newFeatures.badge')}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {t('newFeatures.title')}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent ml-2">
              {t('newFeatures.titleHighlight')}
            </span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            {t('newFeatures.subtitle')}
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex h-[450px] flex-col justify-end overflow-hidden rounded-xl"
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0 h-full w-full transition-transform duration-500 ease-in-out group-hover:scale-110">
                <Image
                  src={feature.image}
                  alt={featureTitles[feature.titleKey]}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />
              </div>

              {/* Content Card */}
              <div className="relative z-10 m-2 rounded-lg border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out group-hover:bg-white/20">
                <div className="flex flex-col gap-4">
                  <feature.icon className="text-primary h-10 w-10" />

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {featureTitles[feature.titleKey]}
                    </h3>
                    <p className="text-sm text-slate-300 line-clamp-2">
                      {featureDescs[feature.titleKey]}
                    </p>
                  </div>

                  <div className="group/link mt-2 flex items-center gap-2 text-sm font-semibold text-primary cursor-pointer">
                    <span>{t('newFeatures.learnMore')}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Portals Section ---
const Portals = () => {
  const t = useTranslations('landing')

  const portals = [
    {
      id: 'student',
      titleKey: 'portals.student.title',
      descKey: 'portals.student.description',
      icon: GraduationCap,
      color: 'from-blue-500 to-cyan-500',
      href: '/student',
      featuresKeys: ['portals.student.f1', 'portals.student.f2', 'portals.student.f3'],
    },
    {
      id: 'teacher',
      titleKey: 'portals.teacher.title',
      descKey: 'portals.teacher.description',
      icon: BookOpen,
      color: 'from-emerald-500 to-teal-500',
      href: '/teacher',
      featuresKeys: ['portals.teacher.f1', 'portals.teacher.f2', 'portals.teacher.f3'],
    },
    {
      id: 'parent',
      titleKey: 'portals.parent.title',
      descKey: 'portals.parent.description',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      href: '/parent',
      featuresKeys: ['portals.parent.f1', 'portals.parent.f2', 'portals.parent.f3'],
    },
    {
      id: 'school',
      titleKey: 'portals.school.title',
      descKey: 'portals.school.description',
      icon: School,
      color: 'from-orange-500 to-red-500',
      href: '/school',
      featuresKeys: ['portals.school.f1', 'portals.school.f2', 'portals.school.f3'],
    },
  ]

  return (
    <section id="portals" className="py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background border border-border mb-6">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">{t('portalsSection.badge')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            {t('portalsSection.title')}
            <br />
            <span className="text-muted-foreground">{t('portalsSection.titleHighlight')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('portalsSection.subtitle')}
          </p>
        </motion.div>

        {/* Portals Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {portals.map((portal, i) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={portal.href} className="group block h-full">
                <div className="relative h-full rounded-2xl bg-card border border-border overflow-hidden hover:shadow-xl hover:border-primary/50 transition-all duration-300">
                  {/* Content */}
                  <div className="p-8">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${portal.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <portal.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">
                      {t(portal.titleKey)}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {t(portal.descKey)}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-3 mb-6">
                      {portal.featuresKeys.map((featureKey, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{t(featureKey)}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="flex items-center font-medium text-primary group-hover:translate-x-1 transition-transform">
                      {t('portalsSection.accessPortal')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Stats Section ---
const Stats = () => {
  const t = useTranslations('landing')

  const stats = [
    { value: '--', labelKey: 'stats.schools', icon: School },
    { value: '--', labelKey: 'stats.students', icon: GraduationCap },
    { value: '--', labelKey: 'stats.teachers', icon: BookOpen },
    { value: '--', labelKey: 'stats.satisfaction', icon: Award },
  ]

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-500 relative overflow-hidden">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYtMmgtMnYtMmgydi0yaDJ2MmgydjJoLTJ2Mmgydjh6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center text-white"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-white/80">{t(stat.labelKey)}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- CTA Section ---
const CTA = () => {
  const t = useTranslations('landing')

  return (
    <section id="about" className="py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={MOCK_IMAGES.africa}
              alt="Africa"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-900/90 to-cyan-900/80" />
          </div>

          {/* Content */}
          <div className="relative z-10 py-20 px-8 md:px-16 text-white">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('cta.title')}
                <br />
                {t('cta.titleLine2')}
              </h2>
              <p className="text-xl text-white/80 mb-10 leading-relaxed">
                {t('cta.description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="h-14 px-8 rounded-full text-lg bg-white text-blue-600 hover:bg-white/90 shadow-xl">
                    {t('cta.accessNow') || 'Aceder Agora'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 border-white/30 text-white hover:bg-white/10">
                  {t('cta.contactSales')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// --- Footer ---
const Footer = () => {
  const t = useTranslations('landing')

  const links = {
    platform: [
      { key: 'features', label: t('footer.platform.features') },
      { key: 'pricing', label: t('footer.platform.pricing') },
      { key: 'security', label: t('footer.platform.security') },
      { key: 'api', label: t('footer.platform.api') },
    ],
    portals: [
      { key: 'students', label: t('footer.portals.students') },
      { key: 'teachers', label: t('footer.portals.teachers') },
      { key: 'parents', label: t('footer.portals.parents') },
      { key: 'schools', label: t('footer.portals.schools') },
    ],
    company: [
      { key: 'about', label: t('footer.company.about') },
      { key: 'careers', label: t('footer.company.careers') },
      { key: 'blog', label: t('footer.company.blog') },
      { key: 'contact', label: t('footer.company.contact') },
    ],
    legal: [
      { key: 'privacy', label: t('footer.legal.privacy') },
      { key: 'terms', label: t('footer.legal.terms') },
      { key: 'cookies', label: t('footer.legal.cookies') },
    ],
  }

  return (
    <footer className="border-t bg-muted/30 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold">
                Mw
              </div>
              <span className="text-xl font-bold">Mwinda</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <div className="w-4 h-4 bg-current rounded-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.platformTitle')}</h4>
            <ul className="space-y-3">
              {links.platform.map((link) => (
                <li key={link.key}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.portalsTitle')}</h4>
            <ul className="space-y-3">
              {links.portals.map((link) => (
                <li key={link.key}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t('footer.companyTitle')}</h4>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.key}>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            © 2025 Mwinda. {t('footer.rights')}
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            {links.legal.map((link) => (
              <a key={link.key} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- Main Page ---
export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/20">
      <Navigation />
      <Hero />
      <Features />
      <Portals />
      <Stats />
      <CTA />
      <Footer />
    </main>
  )
}
