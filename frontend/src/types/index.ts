export interface User {
  id: number
  email: string
  fullName: string
  role: 'admin' | 'teacher' | 'student' | string
  phone?: string
  address?: string
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: number
  userId: number
  user?: User
  studentCode: string
  dateOfBirth?: string
  gender?: string
  enrollment?: string
  major?: string
  year?: number
  gpa?: number
  guardianName?: string
  guardianPhone?: string
  createdAt: string
  updatedAt: string
}

export interface Teacher {
  id: number
  userId: number
  user?: User
  teacherCode: string
  dateOfBirth?: string
  gender?: string
  department?: string
  title?: string
  specialty?: string
  hireDate?: string
  salary?: number
  createdAt: string
  updatedAt: string
}

export interface Course {
  id: number
  name: string
  code: string
  description?: string
  credit: number
  hours: number
  department?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Launch {
  id: number
  name: string
  code: string
  startDate: string
  endDate: string
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Class {
  id: number
  name: string
  code: string
  courseId: number
  course?: Course
  teacherId: number
  teacher?: Teacher
  launchId: number
  launch?: Launch
  room?: string
  maxStudent: number
  schedule?: string
  status: string
  enrolledCount?: number
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  id: number
  studentId: number
  student?: Student
  classId: number
  class?: Class
  score: number
  grade?: string
  status: string
  enrolledAt: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export type PaginatedResponse<K extends string, T> = {
  [P in K]: T[]
} & {
  total: number
  page: number
  limit: number
}

export type Role = 'admin' | 'teacher' | 'student'

export interface Attendance {
  id: number
  studentId: number
  student?: Student
  classId: number
  class?: Class
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note?: string
  createdAt: string
  updatedAt: string
}

export interface GradeRule {
  id: number
  minScore: number
  maxScore: number
  letterGrade: string
  gpaPoints: number
  launchId?: number | null
  launch?: Launch | null
  createdAt: string
  updatedAt: string
}

export interface Transcript {
  id: number
  studentId: number
  student?: Student
  launchId: number
  launch?: Launch
  gpa: number
  totalCredits: number
  totalPoints: number
  courseCount: number
  createdAt: string
  updatedAt: string
}

export interface ClassReport {
  classId: number
  className: string
  avgScore: number
  minScore: number
  maxScore: number
  passCount: number
  failCount: number
  totalCount: number
  passRate: number
}

export interface TranscriptSummary {
  launches: number
  transcripts: number
  overallGpa: number
}

export interface AttendanceSummaryItem {
  studentId: number
  studentCode: string
  fullName: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  percentage: number
}
