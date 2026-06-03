import { FormEvent, useEffect, useState } from 'react'
import { classService, courseService, launchService, teacherService } from '../services'
import type { Class, Course, Launch, Teacher } from '../types'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'

const empty = {
  name: '',
  code: '',
  courseId: 0,
  teacherId: 0,
  launchId: 0,
  room: '',
  maxStudent: 40,
  schedule: '',
  status: 'open',
}

export default function Classes() {
  const [items, setItems] = useState<Class[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await classService.list()
      setItems(data.classes)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    courseService.list().then((d) => setCourses(d.courses)).catch(() => {})
    teacherService.list().then((d) => setTeachers(d.teachers)).catch(() => {})
    launchService.list().then((d) => setLaunches(d.launches)).catch(() => {})
  }, [])

  const onCreate = () => {
    setEditing(null)
    setForm({ ...empty, courseId: courses[0]?.id || 0, launchId: launches[0]?.id || 0 })
    setError('')
    setOpen(true)
  }

  const onEdit = (c: Class) => {
    setEditing(c)
    setForm({
      name: c.name,
      code: c.code,
      courseId: c.courseId,
      teacherId: c.teacherId,
      launchId: c.launchId,
      room: c.room || '',
      maxStudent: c.maxStudent,
      schedule: c.schedule || '',
      status: c.status,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, maxStudent: Number(form.maxStudent) }
      if (editing) {
        await classService.update(editing.id, payload)
      } else {
        await classService.create(payload)
      }
      setOpen(false)
      load()
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Operation failed',
      )
    }
  }

  const onDelete = async () => {
    if (!confirmId) return
    try {
      await classService.remove(confirmId)
      setConfirmId(null)
      load()
    } catch {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        <button className="btn btn-primary" onClick={onCreate}>
          + Add Class
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Course</th>
              <th>Teacher</th>
              <th>Launch</th>
              <th>Room</th>
              <th>Enrolled</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 py-6">
                  No classes found
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.code}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.course?.name || '-'}</td>
                  <td>{c.teacher?.user?.fullName || '-'}</td>
                  <td>{c.launch?.name || '-'}</td>
                  <td>{c.room || '-'}</td>
                  <td>
                    {c.enrolledCount || 0} / {c.maxStudent}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        c.status === 'open'
                          ? 'badge-green'
                          : c.status === 'closed'
                            ? 'badge-red'
                            : 'badge-yellow'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => onEdit(c)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger text-xs"
                        onClick={() => setConfirmId(c.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <FormModal
        open={open}
        title={editing ? 'Edit Class' : 'Add Class'}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Code</label>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Course</label>
            <select
              className="input"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })}
              required
            >
              <option value={0}>Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Teacher</label>
            <select
              className="input"
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })}
            >
              <option value={0}>--</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.teacherCode} - {t.user?.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Launch</label>
            <select
              className="input"
              value={form.launchId}
              onChange={(e) => setForm({ ...form, launchId: Number(e.target.value) })}
              required
            >
              <option value={0}>Select launch</option>
              {launches.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Room</label>
            <input
              className="input"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Max students</label>
            <input
              type="number"
              className="input"
              value={form.maxStudent}
              onChange={(e) => setForm({ ...form, maxStudent: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Schedule</label>
            <input
              className="input"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="e.g. Mon/Wed 9:00-10:30"
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete class"
        message="Are you sure you want to delete this class? All enrollments will be removed."
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
