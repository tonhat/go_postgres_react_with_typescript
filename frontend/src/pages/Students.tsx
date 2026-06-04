import { FormEvent, useEffect, useState } from 'react'
import { classService, studentService } from '../services'
import type { Class, Student } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  address: '',
  major: '',
  year: 1,
  gender: 'male' as string,
  guardianName: '',
  guardianPhone: '',
}

export default function Students() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [enrollOpen, setEnrollOpen] = useState(false)
  const [enrollStudentId, setEnrollStudentId] = useState<number | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState(0)
  const [enrolling, setEnrolling] = useState(false)

  const isAdmin = currentUser?.role === 'admin'
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'teacher'

  const load = async (q = search, p = page) => {
    setLoading(true)
    try {
      const data = await studentService.list(q, p)
      setItems(data.students)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (canManage) {
      classService.list().then((d) => setClasses(d.classes)).catch(() => {})
    }
  }, [page])

  const onSearch = (q: string) => {
    setSearch(q)
    setPage(1)
    load(q, 1)
  }

  const onCreate = () => {
    if (!isAdmin) return
    setEditing(null)
    setForm(empty)
    setError('')
    setOpen(true)
  }

  const onEdit = (s: Student) => {
    if (!isAdmin) return
    setEditing(s)
    setForm({
      email: s.user?.email || '',
      password: '',
      fullName: s.user?.fullName || '',
      phone: s.user?.phone || '',
      address: s.user?.address || '',
      major: s.major || '',
      year: s.year || 1,
      gender: s.gender || 'male',
      guardianName: s.guardianName || '',
      guardianPhone: s.guardianPhone || '',
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await studentService.update(editing.id, {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          major: form.major,
          year: Number(form.year),
          gender: form.gender,
          guardianName: form.guardianName,
          guardianPhone: form.guardianPhone,
        })
      } else {
        await studentService.create({ ...form, year: Number(form.year) })
      }
      setOpen(false)
      load(search, page)
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Operation failed',
      )
    }
  }

  const onDelete = async () => {
    if (!confirmId || !isAdmin) return
    try {
      await studentService.remove(confirmId)
      setConfirmId(null)
      load(search, page)
    } catch {
      setConfirmId(null)
    }
  }

  const openEnroll = (studentId: number) => {
    if (!canManage) return
    setEnrollStudentId(studentId)
    setSelectedClassId(0)
    setEnrollOpen(true)
  }

  const doEnroll = async () => {
    if (!enrollStudentId || !selectedClassId) return
    setEnrolling(true)
    try {
      await classService.enroll(selectedClassId, enrollStudentId)
      setEnrollOpen(false)
      setEnrolling(false)
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Enrollment failed'
      alert(msg)
      setEnrolling(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Students</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onCreate}>
            + Add Student
          </button>
        )}
      </div>

      <div className="card p-3 md:p-4 mb-4">
        <input
          className="input w-full md:max-w-md"
          placeholder="Search by name, email, or code..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Full name</th>
              <th>Email</th>
              <th>Major</th>
              <th>Year</th>
              <th>GPA</th>
              {(isAdmin || canManage) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-6">
                  No students found
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.studentCode}</td>
                  <td className="font-medium">{s.user?.fullName}</td>
                  <td>{s.user?.email}</td>
                  <td>{s.major || '-'}</td>
                  <td>{s.year || '-'}</td>
                  <td>{s.gpa?.toFixed(2) || '0.00'}</td>
                  <td>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <>
                          <button
                            className="btn btn-secondary text-xs"
                            onClick={() => onEdit(s)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger text-xs"
                            onClick={() => setConfirmId(s.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {canManage && (
                        <button
                          className="btn btn-secondary text-xs"
                          onClick={() => openEnroll(s.id)}
                        >
                          Enroll
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
      </div>

      <FormModal
        open={open}
        title={editing ? 'Edit Student' : 'Add Student'}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              disabled={!!editing}
            />
          </div>
          {!editing && (
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          )}
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              className="input"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Major</label>
            <input
              className="input"
              value={form.major}
              onChange={(e) => setForm({ ...form, major: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Year</label>
            <input
              type="number"
              className="input"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Guardian name</label>
            <input
              className="input"
              value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Guardian phone</label>
            <input
              className="input"
              value={form.guardianPhone}
              onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete student"
        message="Are you sure you want to delete this student? This will also remove their user account."
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />

      {canManage && (
        <FormModal
          open={enrollOpen}
          title="Enroll Student in Class"
          onClose={() => setEnrollOpen(false)}
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            doEnroll()
          }}
          submitLabel="Enroll"
          loading={enrolling}
        >
          <div>
            <label className="label">Select class</label>
            <select
              className="input"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              required
            >
              <option value={0}>-- Choose a class --</option>
              {classes
                .filter((c) => c.status === 'open')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.course?.name})
                  </option>
                ))}
            </select>
          </div>
        </FormModal>
      )}
    </div>
  )
}
