import api from './api'
import type { Attendance, AttendanceSummaryItem, GradeRule, Transcript, ClassReport, TranscriptSummary, FeeStructure, Invoice, Payment, FinanceSummary } from '../types'
import type {
  AuthResponse,
  Class,
  Course,
  Enrollment,
  Launch,
  PaginatedResponse,
  Student,
  Teacher,
  User,
} from '../types'

export const authService = {
  signin: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/signin', { email, password }).then((r) => r.data),
  signup: (data: {
    email: string
    password: string
    fullName: string
    phone?: string
    address?: string
    role?: string
  }) => api.post<AuthResponse>('/auth/signup', data).then((r) => r.data),
  signout: () => api.post('/auth/signout').then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
}

export const userService = {
  list: (page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'users', User>>('/users', { params: { page, limit } })
      .then((r) => r.data),
  get: (id: number) => api.get<{ user: User }>(`/users/${id}`).then((r) => r.data.user),
  update: (id: number, data: Partial<User>) =>
    api.put<{ user: User }>(`/users/${id}`, data).then((r) => r.data.user),
  remove: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
}

export const studentService = {
  list: (search?: string, page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'students', Student>>('/students', {
        params: { search, page, limit },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ student: Student }>(`/students/${id}`).then((r) => r.data.student),
  create: (data: Partial<Student> & { email: string; password: string; fullName: string }) =>
    api.post<{ student: Student }>('/students', data).then((r) => r.data.student),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ student: Student }>(`/students/${id}`, data).then((r) => r.data.student),
  remove: (id: number) => api.delete(`/students/${id}`).then((r) => r.data),
}

export const teacherService = {
  list: (search?: string, page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'teachers', Teacher>>('/teachers', {
        params: { search, page, limit },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ teacher: Teacher }>(`/teachers/${id}`).then((r) => r.data.teacher),
  create: (data: Partial<Teacher> & { email: string; password: string; fullName: string }) =>
    api.post<{ teacher: Teacher }>('/teachers', data).then((r) => r.data.teacher),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ teacher: Teacher }>(`/teachers/${id}`, data).then((r) => r.data.teacher),
  remove: (id: number) => api.delete(`/teachers/${id}`).then((r) => r.data),
}

export const courseService = {
  list: (search?: string, department?: string, page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'courses', Course>>('/courses', {
        params: { search, department, page, limit },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ course: Course }>(`/courses/${id}`).then((r) => r.data.course),
  create: (data: Partial<Course>) =>
    api.post<{ course: Course }>('/courses', data).then((r) => r.data.course),
  update: (id: number, data: Partial<Course>) =>
    api.put<{ course: Course }>(`/courses/${id}`, data).then((r) => r.data.course),
  remove: (id: number) => api.delete(`/courses/${id}`).then((r) => r.data),
}

export const launchService = {
  list: (page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'launches', Launch>>('/launches', { params: { page, limit } })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ launch: Launch }>(`/launches/${id}`).then((r) => r.data.launch),
  create: (data: Partial<Launch>) =>
    api.post<{ launch: Launch }>('/launches', data).then((r) => r.data.launch),
  update: (id: number, data: Partial<Launch>) =>
    api.put<{ launch: Launch }>(`/launches/${id}`, data).then((r) => r.data.launch),
  remove: (id: number) => api.delete(`/launches/${id}`).then((r) => r.data),
}

export const attendanceService = {
  list: (classId: number, date?: string) =>
    api
      .get<PaginatedResponse<'attendance', Attendance>>(`/classes/${classId}/attendance`, {
        params: { date },
      })
      .then((r) => r.data),
  markBulk: (classId: number, date: string, records: { studentId: number; status: string; note?: string }[]) =>
    api
      .post<{ attendance: Attendance[]; date: string }>(`/classes/${classId}/attendance/bulk`, {
        date,
        records,
      })
      .then((r) => r.data),
  summary: (classId: number) =>
    api
      .get<{ summary: AttendanceSummaryItem[]; total: number }>(`/classes/${classId}/attendance/summary`)
      .then((r) => r.data),
}

export const gradeRuleService = {
  list: (page = 1, limit = 20, launchId?: number) =>
    api
      .get<PaginatedResponse<'gradeRules', GradeRule>>('/grade-rules', {
        params: { page, limit, launchId },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ gradeRule: GradeRule }>(`/grade-rules/${id}`).then((r) => r.data.gradeRule),
  create: (data: Partial<GradeRule>) =>
    api.post<{ gradeRule: GradeRule }>('/grade-rules', data).then((r) => r.data.gradeRule),
  update: (id: number, data: Partial<GradeRule>) =>
    api.put<{ gradeRule: GradeRule }>(`/grade-rules/${id}`, data).then((r) => r.data.gradeRule),
  remove: (id: number) => api.delete(`/grade-rules/${id}`).then((r) => r.data),
}

export const transcriptService = {
  list: (params?: { studentId?: number; launchId?: number }, page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'transcripts', Transcript>>('/transcripts', {
        params: { ...params, page, limit },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ transcript: Transcript }>(`/transcripts/${id}`).then((r) => r.data.transcript),
  studentTranscripts: (studentId: number) =>
    api.get<{ transcripts: Transcript[] }>(`/students/${studentId}/transcripts`).then((r) => r.data),
  finalize: (launchId: number) =>
    api.post<{ message: string; transcripts: number; students: number; avgGpa: number }>(
      `/launches/${launchId}/finalize`,
    ).then((r) => r.data),
  report: (launchId: number) =>
    api.get<{ report: ClassReport[] }>(`/launches/${launchId}/report`).then((r) => r.data),
  summary: () =>
    api.get<{ summary: TranscriptSummary }>('/transcripts/summary').then((r) => r.data),
}

export const feeStructureService = {
  list: (page = 1, limit = 20, launchId?: number) =>
    api
      .get<PaginatedResponse<'feeStructures', FeeStructure>>('/fee-structures', {
        params: { page, limit, launchId },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ feeStructure: FeeStructure }>(`/fee-structures/${id}`).then((r) => r.data.feeStructure),
  create: (data: Partial<FeeStructure>) =>
    api.post<{ feeStructure: FeeStructure }>('/fee-structures', data).then((r) => r.data.feeStructure),
  update: (id: number, data: Partial<FeeStructure>) =>
    api.put<{ feeStructure: FeeStructure }>(`/fee-structures/${id}`, data).then((r) => r.data.feeStructure),
  remove: (id: number) => api.delete(`/fee-structures/${id}`).then((r) => r.data),
}

export const invoiceService = {
  list: (params?: { studentId?: number; launchId?: number; status?: string }, page = 1, limit = 20) =>
    api
      .get<PaginatedResponse<'invoices', Invoice>>('/invoices', {
        params: { ...params, page, limit },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<{ invoice: Invoice }>(`/invoices/${id}`).then((r) => r.data.invoice),
  studentInvoices: (studentId: number) =>
    api.get<{ invoices: Invoice[] }>(`/students/${studentId}/invoices`).then((r) => r.data),
  generate: (launchId: number) =>
    api.post<{ message: string; created: number; skipped: number; total: number }>(
      `/launches/${launchId}/generate-invoices`,
    ).then((r) => r.data),
  pay: (id: number, data: { amount: number; paymentMethod?: string; referenceNo?: string; note?: string; paidAt?: string }) =>
    api.post<{ invoice: Invoice; payment: Payment }>(`/invoices/${id}/pay`, data).then((r) => r.data),
  payments: (id: number) =>
    api.get<{ payments: Payment[] }>(`/invoices/${id}/payments`).then((r) => r.data),
}

export const financeService = {
  summary: () =>
    api.get<{ summary: FinanceSummary }>('/finance/summary').then((r) => r.data),
  launchSummary: (launchId: number) =>
    api.get<{ summary: FinanceSummary }>(`/launches/${launchId}/finance`).then((r) => r.data),
}

export const classService = {
  list: (
    params?: { launchId?: number; courseId?: number; teacherId?: number },
    page = 1,
    limit = 20,
  ) =>
    api
      .get<PaginatedResponse<'classes', Class>>('/classes', { params: { ...params, page, limit } })
      .then((r) => r.data),
  get: (id: number) =>
    api
      .get<{ class: Class; enrolledCount: number }>(`/classes/${id}`)
      .then((r) => r.data),
  create: (data: Partial<Class>) =>
    api.post<{ class: Class }>('/classes', data).then((r) => r.data.class),
  update: (id: number, data: Partial<Class>) =>
    api.put<{ class: Class }>(`/classes/${id}`, data).then((r) => r.data.class),
  remove: (id: number) => api.delete(`/classes/${id}`).then((r) => r.data),
  enroll: (id: number, studentId: number) =>
    api.post(`/classes/${id}/enroll`, { studentId }).then((r) => r.data),
  enrollments: (id: number, page = 1, limit = 50) =>
    api
      .get<PaginatedResponse<'enrollments', Enrollment>>(`/classes/${id}/enrollments`, {
        params: { page, limit },
      })
      .then((r) => r.data),
  updateEnrollment: (eid: number, data: { score: number }) =>
    api
      .put<{ enrollment: Enrollment }>(`/enrollments/${eid}`, data)
      .then((r) => r.data.enrollment),
  dropEnrollment: (eid: number) => api.delete(`/enrollments/${eid}`).then((r) => r.data),
}
