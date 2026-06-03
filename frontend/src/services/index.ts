import api from './api'
import type {
  AuthResponse,
  Class,
  Course,
  Enrollment,
  Launch,
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
  list: () => api.get<{ users: User[]; total: number }>('/users').then((r) => r.data),
  get: (id: number) => api.get<{ user: User }>(`/users/${id}`).then((r) => r.data.user),
  update: (id: number, data: Partial<User>) =>
    api.put<{ user: User }>(`/users/${id}`, data).then((r) => r.data.user),
  remove: (id: number) => api.delete(`/users/${id}`).then((r) => r.data),
}

export const studentService = {
  list: (search?: string) =>
    api
      .get<{ students: Student[]; total: number }>('/students', { params: { search } })
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
  list: (search?: string) =>
    api
      .get<{ teachers: Teacher[]; total: number }>('/teachers', { params: { search } })
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
  list: (search?: string, department?: string) =>
    api
      .get<{ courses: Course[]; total: number }>('/courses', { params: { search, department } })
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
  list: () =>
    api.get<{ launches: Launch[]; total: number }>('/launches').then((r) => r.data),
  get: (id: number) =>
    api.get<{ launch: Launch }>(`/launches/${id}`).then((r) => r.data.launch),
  create: (data: Partial<Launch>) =>
    api.post<{ launch: Launch }>('/launches', data).then((r) => r.data.launch),
  update: (id: number, data: Partial<Launch>) =>
    api.put<{ launch: Launch }>(`/launches/${id}`, data).then((r) => r.data.launch),
  remove: (id: number) => api.delete(`/launches/${id}`).then((r) => r.data),
}

export const classService = {
  list: (params?: { launchId?: number; courseId?: number; teacherId?: number }) =>
    api.get<{ classes: Class[]; total: number }>('/classes', { params }).then((r) => r.data),
  get: (id: number) =>
    api.get<{ class: Class; enrolledCount: number }>(`/classes/${id}`).then((r) => r.data),
  create: (data: Partial<Class>) =>
    api.post<{ class: Class }>('/classes', data).then((r) => r.data.class),
  update: (id: number, data: Partial<Class>) =>
    api.put<{ class: Class }>(`/classes/${id}`, data).then((r) => r.data.class),
  remove: (id: number) => api.delete(`/classes/${id}`).then((r) => r.data),
  enroll: (id: number, studentId: number) =>
    api.post(`/classes/${id}/enroll`, { studentId }).then((r) => r.data),
  enrollments: (id: number) =>
    api
      .get<{ enrollments: Enrollment[]; total: number }>(`/classes/${id}/enrollments`)
      .then((r) => r.data),
}
