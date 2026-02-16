// ==================== CORE MODELS ====================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Role values must match backend Go enums exactly (uppercase)
export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  TEACHER_ADMIN = 'TEACHER_ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  MINISTRY_OFFICIAL = 'MINISTRY_OFFICIAL',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

// ==================== STUDENT ====================

export interface Student extends User {
  role: UserRole.STUDENT
  studentId: string
  schoolId: string
  classId: string
  gradeLevel: number
  enrollmentDate: string
  dateOfBirth: string
  gender: 'male' | 'female' | 'other'
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  guardians: Guardian[]
  profilePhoto?: string
  status: 'active' | 'suspended' | 'graduated' | 'withdrawn'
}

export interface Guardian {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  relationship: 'mother' | 'father' | 'guardian' | 'other'
  isPrimary: boolean
}

// ==================== TEACHER ====================

export interface Teacher extends User {
  role: UserRole.TEACHER
  teacherId: string
  schoolId: string
  subjects: string[]
  classes: string[]
  qualification: string
  hireDate: string
  specialization?: string
  status: 'active' | 'on_leave' | 'terminated'
}

// ==================== SCHOOL ====================

export interface School {
  id: string
  name: string
  code: string
  logoUrl?: string | null
  type: 'primary' | 'secondary' | 'combined'
  address: string
  city: string
  province: string
  country?: CountryCode
  phone: string
  email: string
  principalName?: string
  totalStudents: number
  totalTeachers: number
  status: 'active' | 'inactive'
  preferredLanguage?: LanguageCode
  curriculumSystems?: CurriculumSystem[]
  createdAt: string
}

// ==================== CLASS ====================

export interface Class {
  id: string
  name: string
  gradeLevel: number
  section: string
  schoolId: string
  teacherId: string
  academicYear: string
  capacity: number
  currentEnrollment: number
  schedule?: ClassSchedule[]
}

export interface ClassSchedule {
  id: string
  classId: string
  subjectId: string
  teacherId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // "08:00"
  endTime: string // "09:00"
  room?: string
}

// ==================== ATTENDANCE ====================

export interface AttendanceSession {
  id: string
  classId: string
  teacherId: string
  subjectId: string
  date: string
  startTime: string
  endTime: string
  status: 'active' | 'closed' | 'cancelled'
  totalExpected: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  sessionCode?: string
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  status: 'present' | 'absent' | 'late' | 'excused'
  checkInTime?: string
  checkInMethod: 'facial_recognition' | 'manual' | 'qr_code'
  location?: {
    latitude: number
    longitude: number
  }
  facialConfidence?: number
  notes?: string
  markedBy: string
  createdAt: string
}

export interface AttendanceSummary {
  studentId: string
  totalSessions: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
  period: {
    startDate: string
    endDate: string
  }
}

// ==================== GRADES ====================

export interface Subject {
  id: string
  name: string
  code: string
  gradeLevel: number
  description?: string
  credits?: number
}

export interface Grade {
  id: string
  studentId: string
  subjectId: string
  teacherId: string
  academicYear: string
  term: 'term1' | 'term2' | 'term3'
  gradeType: 'assignment' | 'quiz' | 'midterm' | 'exam' | 'project'
  score: number
  maxScore: number
  percentage: number
  letterGrade?: string
  comments?: string
  publishedAt?: string
  createdAt: string
}

export interface ReportCard {
  id: string
  studentId: string
  academicYear: string
  term: 'term1' | 'term2' | 'term3'
  grades: GradeDetail[]
  overallGPA: number
  attendance: AttendanceSummary
  behaviorScore: number
  teacherComments?: string
  principalComments?: string
  generatedAt: string
}

export interface GradeDetail {
  subject: Subject
  grades: Grade[]
  average: number
  letterGrade: string
  classAverage: number
  rank?: number
}

// ==================== PAYMENTS ====================

export interface Payment {
  id: string
  studentId: string
  amount: number
  currency: 'CDF' | 'USD'
  feeType: 'tuition' | 'registration' | 'exam' | 'transport' | 'uniform' | 'other'
  academicYear: string
  term?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: 'stripe' | 'mobile_money' | 'cash' | 'bank_transfer'
  transactionId?: string
  paidAt?: string
  receiptUrl?: string
  createdAt: string
}

export interface FeeStructure {
  id: string
  schoolId: string
  gradeLevel: number
  academicYear: string
  fees: {
    type: string
    amount: number
    currency: 'CDF' | 'USD'
    dueDate: string
    mandatory: boolean
  }[]
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string
  userId: string
  type: 'grade_posted' | 'attendance_alert' | 'payment_due' | 'announcement' | 'message'
  title: string
  message: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  read: boolean
  actionUrl?: string
  metadata?: Record<string, any>
  createdAt: string
}

// ==================== ANALYTICS ====================

export interface StudentPerformance {
  studentId: string
  currentGPA: number
  gpaHistory: {
    term: string
    gpa: number
    date: string
  }[]
  subjectPerformance: {
    subjectId: string
    subjectName: string
    average: number
    trend: 'improving' | 'declining' | 'stable'
  }[]
  attendanceRate: number
  behaviorScore: number
  prediction?: {
    nextTermGPA: number
    confidence: number
    insights: string[]
  }
}

export interface DashboardMetrics {
  totalStudents?: number
  totalTeachers?: number
  averageAttendance?: number
  averageGPA?: number
  alertsCount?: number
  [key: string]: any
}

// ==================== API RESPONSES ====================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export interface LoginResponse {
  success: boolean
  requires2FA?: false
  data: {
    user: User
    accessToken: string
    // Note: refreshToken is stored as HttpOnly cookie by backend (not exposed to JS)
    refreshToken?: string // Optional for backwards compatibility
    expiresIn: number
  }
}

export interface TwoFactorRequiredResponse {
  success: true
  requires2FA: true
  sessionToken: string
  email: string
  expiresAt: string
}

export interface RoleSelectionRequiredResponse {
  success: true
  requiresSelection: true
  availableRoles: UserRole[]
  message?: string
}

export interface AuthTokens {
  accessToken: string
  // refreshToken is stored as HttpOnly cookie by backend
  refreshToken?: string
  expiresIn: number
}

// ==================== COUNTRY & CURRICULUM SUPPORT ====================

export type CountryCode = 'MZ' | 'AO' | 'ZA' | 'CD' // Mozambique, Angola, South Africa, Congo

export type CurriculumSystem = 
  | 'MOZAMBIQUE_NATIONAL'  // Mozambique National System
  | 'CAMBRIDGE'            // Cambridge International
  | 'ANGOLA_NATIONAL'      // Angola National System
  | 'SOUTH_AFRICA_CAPS'    // South Africa CAPS
  | 'CONGO_NATIONAL'       // Congo National System
  | 'CUSTOM'               // Custom system

export type LanguageCode = 'pt' | 'en' | 'fr' | 'tr' // Portuguese, English, French, Turkish

export interface CountryConfig {
  code: CountryCode
  name: string
  defaultLanguage: LanguageCode
  supportedLanguages: LanguageCode[]
  defaultCurriculum: CurriculumSystem
  supportedCurriculums: CurriculumSystem[]
  gradeScale: {
    min: number
    max: number
    passingScore: number
    description: string
  }
  academicTerms: {
    count: number // Number of terms/semesters per year
    names: string[] // e.g., ['1º Trimestre', '2º Trimestre', '3º Trimestre']
  }
  assessmentTypes: {
    hasTests: boolean // Regular tests during term
    hasFinalExam: boolean // Final exam at end of term
    finalExamName?: string // e.g., "AP" for Mozambique
    weights?: {
      tests?: number // Percentage weight for tests
      finalExam?: number // Percentage weight for final exam
    }
  }
}

export interface CurriculumConfig {
  system: CurriculumSystem
  name: string
  description: string
  countryCode: CountryCode
  gradeScale: {
    min: number
    max: number
    passingScore: number
    gradeBoundaries?: GradeBoundary[]
  }
  scheduleConfig: {
    periodsPerDay: number
    periodDurationMinutes: number
    breakDurationMinutes: number
    lunchBreakMinutes?: number
  }
  assessmentConfig: {
    termsPerYear: number
    assessmentTypes: string[] // e.g., ['test', 'exam', 'assignment']
    hasIntermediateAssessments: boolean
    hasFinalExam: boolean
    finalExamWeight?: number
  }
}

export interface GradeBoundary {
  minScore: number
  maxScore: number
  letterGrade: string
  gpa?: number
  description: string
  passingStatus: 'excellent' | 'good' | 'satisfactory' | 'pass' | 'fail'
}

export interface SchoolCountrySettings {
  id: string
  schoolId: string
  country: CountryCode
  primaryLanguage: LanguageCode
  secondaryLanguages: LanguageCode[]
  primaryCurriculum: CurriculumSystem
  secondaryCurriculums: CurriculumSystem[] // Schools can use multiple systems
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface EmailTemplate {
  id: string
  templateKey: string
  language: LanguageCode
  subject: string
  body: string
  variables: string[] // Placeholder variables like {{studentName}}, {{date}}
  category: 'attendance' | 'grades' | 'general' | 'payment' | 'report'
  createdAt: string
  updatedAt: string
}

// ==================== CURRICULUM TRACKS ====================

export type CurriculumType =
  | 'MOZAMBIQUE_NATIONAL'
  | 'ANGOLA_NATIONAL'
  | 'CAMBRIDGE'
  | 'SOUTH_AFRICA_CAPS'
  | 'CONGO_NATIONAL'
  | 'TURKEY_NATIONAL'
  | 'CUSTOM'
  | 'COMBINED'

export interface SchoolCurriculumTrack {
  id: string
  schoolId: string
  name: string // e.g., "National Track", "Cambridge Track", "Combined Track"
  description?: string
  curriculumType: CurriculumType
  isCombined: boolean // Whether this track combines multiple curriculums
  combinedWith?: CurriculumType[] // Other curriculums combined in this track
  combinationRatio?: string // e.g., "70-30" for 70% Mozambique, 30% Cambridge
  scheduleConfig?: {
    periodsPerDay: number
    periodDurationMinutes: number
    breakDurationMinutes: number
    lunchBreakMinutes?: number
    schoolDays?: string[] // e.g., ["monday", "tuesday", "wednesday", "thursday", "friday"]
  }
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TrackSubject {
  id: string
  trackId: string
  subjectId: string
  curriculumOrigin: CurriculumType // Which curriculum this subject comes from
  weeklyPeriods: number
  isCore: boolean // Core vs elective
  gradeWeight?: number // Weight in final grade calculation
  subject?: Subject
  createdAt: string
  updatedAt: string
}

export interface ClassCurriculumTrack {
  id: string
  classId: string
  trackId: string
  academicYear: string
  isActive: boolean
  class?: Class
  track?: SchoolCurriculumTrack
  createdAt: string
}

export interface StudentCurriculumTrack {
  id: string
  studentId: string
  trackId: string
  academicYear: string
  isActive: boolean
  enrollmentDate: string
  student?: Student
  track?: SchoolCurriculumTrack
  createdAt: string
}

// ==================== EXTRA-CURRICULAR ACTIVITIES ====================

export type ActivityType =
  | 'SPORT'
  | 'MUSIC'
  | 'ART'
  | 'CLUB'
  | 'TUTORING'
  | 'LANGUAGE'
  | 'TECHNOLOGY'
  | 'COMMUNITY'
  | 'OTHER'

export type ActivityCategory =
  // Sports
  | 'TEAM_SPORT'
  | 'INDIVIDUAL_SPORT'
  | 'MARTIAL_ARTS'
  | 'AQUATICS'
  // Music  
  | 'INSTRUMENT'
  | 'VOCAL'
  | 'ENSEMBLE'
  // Arts
  | 'VISUAL_ART'
  | 'PERFORMING_ART'
  | 'CRAFT'
  // Academic
  | 'ACADEMIC_CLUB'
  | 'LANGUAGE_CLUB'
  | 'STEM_CLUB'
  // Other
  | 'GENERAL'

export type ActivityStatus = 'active' | 'inactive' | 'cancelled' | 'pending'
export type EnrollmentStatus = 'enrolled' | 'waitlisted' | 'withdrawn' | 'completed'
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ActivityAttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface Activity {
  id: string
  schoolId: string
  name: string // e.g., "Tennis", "Guitar Lessons", "Math Club"
  description?: string
  activityType: ActivityType
  category: ActivityCategory
  
  // Schedule
  dayOfWeek?: number[] // 0-6 (Sunday-Saturday), null for flexible scheduling
  startTime?: string // "16:00"
  endTime?: string // "17:30"
  duration: number // Duration in minutes
  
  // Capacity
  minParticipants?: number
  maxParticipants?: number
  currentEnrollment?: number
  
  // Location
  location?: string
  roomId?: string
  requiresSpecialFacility: boolean
  facilityRequirements?: string[]
  
  // Instructor
  instructorId?: string // Teacher ID
  externalInstructorName?: string
  externalInstructorContact?: string
  
  // Fees
  hasFee: boolean
  feeAmount?: number
  feeCurrency?: string
  feeFrequency?: 'one_time' | 'monthly' | 'per_session' | 'annual'
  
  // Requirements
  gradeRestrictions?: number[] // Allowed grades
  prerequisites?: string[]
  equipmentRequired?: string[]
  
  // Metadata
  status: ActivityStatus
  academicYear: string
  termRestriction?: string[] // Which terms activity runs
  createdAt: string
  updatedAt: string
}

export interface ActivityEnrollment {
  id: string
  activityId: string
  studentId: string
  enrollmentDate: string
  status: EnrollmentStatus
  waitlistPosition?: number
  parentApproved: boolean
  parentApprovalDate?: string
  feePaid: boolean
  feePaymentId?: string
  notes?: string
  activity?: Activity
  student?: Student
  createdAt: string
  updatedAt: string
}

export interface ActivitySession {
  id: string
  activityId: string
  date: string
  startTime: string
  endTime: string
  status: SessionStatus
  location?: string
  roomId?: string
  instructorId?: string
  substituteInstructorId?: string
  notes?: string
  cancellationReason?: string
  activity?: Activity
  createdAt: string
  updatedAt: string
}

export interface ActivityAttendance {
  id: string
  sessionId: string
  enrollmentId: string
  studentId: string
  status: ActivityAttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  markedById?: string
  session?: ActivitySession
  student?: Student
  createdAt: string
}

// Common activity presets for quick setup
export interface CommonActivityPreset {
  name: string
  activityType: ActivityType
  category: ActivityCategory
  suggestedDuration: number
  requiresSpecialFacility: boolean
  suggestedFacility?: string
  suggestedEquipment?: string[]
}

export const COMMON_ACTIVITIES: CommonActivityPreset[] = [
  { name: 'Tennis', activityType: 'SPORT', category: 'INDIVIDUAL_SPORT', suggestedDuration: 60, requiresSpecialFacility: true, suggestedFacility: 'Tennis Court', suggestedEquipment: ['Tennis racket', 'Tennis balls'] },
  { name: 'Basketball', activityType: 'SPORT', category: 'TEAM_SPORT', suggestedDuration: 90, requiresSpecialFacility: true, suggestedFacility: 'Basketball Court', suggestedEquipment: ['Basketball'] },
  { name: 'Soccer', activityType: 'SPORT', category: 'TEAM_SPORT', suggestedDuration: 90, requiresSpecialFacility: true, suggestedFacility: 'Soccer Field', suggestedEquipment: ['Soccer ball'] },
  { name: 'Swimming', activityType: 'SPORT', category: 'AQUATICS', suggestedDuration: 60, requiresSpecialFacility: true, suggestedFacility: 'Swimming Pool', suggestedEquipment: ['Swimsuit', 'Goggles'] },
  { name: 'Guitar', activityType: 'MUSIC', category: 'INSTRUMENT', suggestedDuration: 45, requiresSpecialFacility: false, suggestedEquipment: ['Guitar'] },
  { name: 'Piano', activityType: 'MUSIC', category: 'INSTRUMENT', suggestedDuration: 45, requiresSpecialFacility: true, suggestedFacility: 'Music Room', suggestedEquipment: ['Piano'] },
  { name: 'Choir', activityType: 'MUSIC', category: 'VOCAL', suggestedDuration: 60, requiresSpecialFacility: false },
  { name: 'Drama Club', activityType: 'ART', category: 'PERFORMING_ART', suggestedDuration: 90, requiresSpecialFacility: true, suggestedFacility: 'Auditorium' },
  { name: 'Art Class', activityType: 'ART', category: 'VISUAL_ART', suggestedDuration: 60, requiresSpecialFacility: true, suggestedFacility: 'Art Room', suggestedEquipment: ['Art supplies'] },
  { name: 'Coding Club', activityType: 'TECHNOLOGY', category: 'STEM_CLUB', suggestedDuration: 60, requiresSpecialFacility: true, suggestedFacility: 'Computer Lab' },
  { name: 'Debate Club', activityType: 'CLUB', category: 'ACADEMIC_CLUB', suggestedDuration: 60, requiresSpecialFacility: false },
  { name: 'Chess Club', activityType: 'CLUB', category: 'ACADEMIC_CLUB', suggestedDuration: 60, requiresSpecialFacility: false, suggestedEquipment: ['Chess sets'] },
  { name: 'Robotics Club', activityType: 'TECHNOLOGY', category: 'STEM_CLUB', suggestedDuration: 90, requiresSpecialFacility: true, suggestedFacility: 'Science Lab', suggestedEquipment: ['Robotics kits'] },
  { name: 'French Club', activityType: 'LANGUAGE', category: 'LANGUAGE_CLUB', suggestedDuration: 45, requiresSpecialFacility: false },
  { name: 'English Club', activityType: 'LANGUAGE', category: 'LANGUAGE_CLUB', suggestedDuration: 45, requiresSpecialFacility: false },
  { name: 'Community Service', activityType: 'COMMUNITY', category: 'GENERAL', suggestedDuration: 120, requiresSpecialFacility: false },
]
