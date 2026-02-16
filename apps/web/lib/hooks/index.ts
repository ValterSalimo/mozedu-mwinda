/**
 * Hooks Module Exports
 */

// Auth hooks
export {
  useLogin,
  useVerifyOTP,
  useResendOTP,
  useLogout,
  useCheckAuth,
  authKeys,
} from './use-auth'

// Current Entity hooks (for resolving Student/Teacher/Parent ID from User)
export {
  useCurrentEntity,
  useStudentId,
  useTeacherId,
  useParentId,
  useSchoolId,
} from './use-current-entity'

// Student hooks
export {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  studentKeys,
  type Student,
  type StudentListFilters,
  type StudentListResponse,
} from './use-students'

// Attendance hooks
export {
  useStudentAttendance,
  useAttendanceSessions,
  useCreateAttendanceSession,
  useRecordAttendance,
  attendanceKeys,
  type AttendanceSession,
  type AttendanceRecord,
  type AttendanceSummary,
  type StudentAttendanceResponse,
} from './use-attendance'

// Grade hooks
export {
  useStudentGrades,
  useStudentGPA,
  useCreateGrade,
  useUpdateGrade,
  gradeKeys,
  getLetterGrade,
  calculateGPA,
  type Grade,
  type CreateGradeData,
} from './use-grades'

// Payment hooks
export {
  useStudentPayments,
  useCreatePayment,
  paymentKeys,
  formatCurrency,
  calculatePendingTotal,
  getPaymentStatusColor,
  type Payment,
  type CreatePaymentData,
} from './use-payments'

// Dashboard hooks
export {
  useDashboardStats,
  useDashboardStudents,
  useDashboardTeachers,
  useClassPerformance,
  dashboardKeys,
  getPerformanceStatus,
  getStatusColorClass,
  type DashboardStats,
  type ClassPerformance,
} from './use-dashboard'

// Teacher hooks
export {
  useTeachers,
  useTeacher,
  useTeacherClasses,
  useTeacherSchedule,
  useTeacherStats,
  useSubmitGrade,
  teacherKeys,
  type Teacher,
  type TeacherClass,
  type TeacherStats,
  type TeacherListFilters,
} from './use-teachers'

// Parent hooks
export {
  useParentChildren,
  useChildGrades,
  useChildAttendance,
  useChildPayments,
  parentKeys,
  getChildStatus,
  type ParentChild,
  type ChildGrade,
  type ChildAttendance,
  type ChildPayment,
} from './use-parent'

// Timetable-attendance integration hooks (avoid star-export collisions)
export {
  useSchoolConfiguration,
  useCreateSchoolConfiguration,
  useUpdateSchoolConfiguration,
  useScheduledSessionsByClass,
  useScheduledSessionsByTeacher,
  useAttendanceComparison,
  useCreateSessionsForDate,
  useCreateSessionsForDateRange,
  // Timetable management
  useRoomsBySchool,
  useRoom,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
  useTimetablesBySchool,
  useTimetable,
  useGenerateTimetable,
  useActivateTimetable,
  useValidateTimetable,
  // Constraints
  useTimetableConstraints,
  useCreateTimetableConstraint,
  useUpdateTimetableConstraint,
  useDeleteTimetableConstraint,
  // Teacher availability
  useTeacherAvailability,
  useSetTeacherAvailability,
  useClassTimetable,
} from './use-timetable'

// School settings hooks
export * from './use-school-settings'

// Curriculum tracks hooks
export * from './use-curriculum-tracks'

// Activities hooks
export * from './use-activities'

// Student cards hooks
export * from './use-student-cards'