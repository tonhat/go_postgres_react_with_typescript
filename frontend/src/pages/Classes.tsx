import { FormEvent, useEffect, useState } from 'react'
import { classService, courseService, launchService, teacherService } from '../services'
import type { Class, Course, Enrollment, Launch, Teacher } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  name: '',
  code: '',
  courseId: 0,
  teacherId: 0,
  launchId: 0,
  room: '',
  maxStudent: 40,
  schedule: '',
  status: 'open' as string,
}

export default function Classes() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<Class[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [dropConfirm, setDropConfirm] = useState<number | null>(null)
  const [scoreEdit, setScoreEdit] = useState<{ eid: number; score: string } | null>(null)

  const isAdmin = currentUser?.role === 'admin'
  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'teacher'

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await classService.list({}, p)
      setItems(data.classes)
      setTotal(data.total)
      setPage(data.page)
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
  }, [page])

  const onCreate = () => {
    if (!isAdmin) return
    setEditing(null)
    setForm({ ...empty, courseId: courses[0]?.id || 0, launchId: launches[0]?.id || 0 })
    setError('')
    setOpen(true)
  }

  const onEdit = (c: Class) => {
    if (!isAdmin) return
    setEditing(c)
    setForm({
      name: c.name, code: c.code,
      courseId: c.courseId, teacherId: c.teacherId, launchId: c.launchId,
      room: c.room || '', maxStudent: c.maxStudent, schedule: c.schedule || '', status: c.status,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('')
    try {
      const payload = { ...form, maxStudent: Number(form.maxStudent) }
      if (editing) { await classService.update(editing.id, payload) }
      else { await classService.create(payload) }
      setOpen(false); load(page)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed')
    }
  }

  const onDelete = async () => {
    if (!confirmId || !isAdmin) return
    try { await classService.remove(confirmId); setConfirmId(null); load(page); if (selectedClass?.id === confirmId) setSelectedClass(null) }
    catch { setConfirmId(null) }
  }

  const openEnrollments = async (cl: Class) => {
    setSelectedClass(cl)
    setEnrollLoading(true)
    try {
      const data = await classService.enrollments(cl.id)
      setEnrollments(data.enrollments)
    } catch { setEnrollments([]) }
    setEnrollLoading(false)
  }

  const doDrop = async () => {
    if (!dropConfirm) return
    try {
      await classService.dropEnrollment(dropConfirm)
      setDropConfirm(null)
      if (selectedClass) openEnrollments(selectedClass)
    } catch { setDropConfirm(null) }
  }

  const saveScore = async () => {
    if (!scoreEdit) return
    try {
      await classService.updateEnrollment(scoreEdit.eid, { score: Number(scoreEdit.score) })
      setScoreEdit(null)
      if (selectedClass) openEnrollments(selectedClass)
    } catch { setScoreEdit(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Classes</h1>
        {isAdmin && <button className="btn btn-primary" onClick={onCreate}>+ Add Class</button>}
      </div>

      <div className="card overflow-x-auto mb-4">
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
              <tr><td colSpan={9} className="text-center text-gray-500 py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="text-center text-gray-500 py-6">No classes found</td></tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className={selectedClass?.id === c.id ? 'bg-indigo-50' : ''}>
                  <td className="font-mono text-xs">{c.code}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.course?.name || '-'}</td>
                  <td>{c.teacher?.user?.fullName || '-'}</td>
                  <td>{c.launch?.name || '-'}</td>
                  <td>{c.room || '-'}</td>
                  <td>{c.enrolledCount || 0} / {c.maxStudent}</td>
                  <td>
                    <span className={`badge ${c.status === 'open' ? 'badge-green' : c.status === 'closed' ? 'badge-red' : 'badge-yellow'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => openEnrollments(c)}>
                        Enrollments
                      </button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary text-xs" onClick={() => onEdit(c)}>Edit</button>
                          <button className="btn btn-danger text-xs" onClick={() => setConfirmId(c.id)}>Delete</button>
                        </>
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

      {selectedClass && (
        <div className="card">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Enrollments — {selectedClass.code}: {selectedClass.name}
            </h2>
            <button className="btn btn-secondary text-xs" onClick={() => setSelectedClass(null)}>Close</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Code</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Status</th>
                  {(canManage) && <th></th>}
                </tr>
              </thead>
              <tbody>
                {enrollLoading ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-6">Loading...</td></tr>
                ) : enrollments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-6">No enrollments</td></tr>
                ) : (
                  enrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="font-medium">{e.student?.user?.fullName}</td>
                      <td className="font-mono text-xs">{e.student?.studentCode}</td>
                      <td>
                        {scoreEdit?.eid === e.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              className="input w-24 text-sm"
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={scoreEdit.score}
                              onChange={(v) => setScoreEdit({ ...scoreEdit, score: v.target.value })}
                            />
                            <button className="btn btn-primary text-xs" onClick={saveScore}>Save</button>
                            <button className="btn btn-secondary text-xs" onClick={() => setScoreEdit(null)}>Cancel</button>
                          </div>
                        ) : (
                          <span className="cursor-pointer"
                            onClick={() => canManage && setScoreEdit({ eid: e.id, score: String(e.score || 0) })}>
                            {e.score || '-'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${!e.grade || e.grade === 'F' ? 'badge-red' : e.grade === 'A' || e.grade === 'B' ? 'badge-green' : 'badge-yellow'}`}>
                          {e.grade || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'enrolled' ? 'badge-blue' : e.status === 'passed' ? 'badge-green' : 'badge-red'}`}>
                          {e.status}
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <button className="btn btn-danger text-xs" onClick={() => setDropConfirm(e.id)}>
                            Drop
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FormModal open={open} title={editing ? 'Edit Class' : 'Add Class'} onClose={() => setOpen(false)} onSubmit={onSubmit}>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Course</label>
            <select className="input" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: Number(e.target.value) })} required>
              <option value={0}>Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </select>
          </div>
          <div><label className="label">Teacher</label>
            <select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: Number(e.target.value) })}>
              <option value={0}>--</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.teacherCode} - {t.user?.fullName}</option>)}
            </select>
          </div>
          <div><label className="label">Launch</label>
            <select className="input" value={form.launchId} onChange={(e) => setForm({ ...form, launchId: Number(e.target.value) })} required>
              <option value={0}>Select launch</option>
              {launches.map((l) => <option key={l.id} value={l.id}>{l.code} - {l.name}</option>)}
            </select>
          </div>
          <div><label className="label">Room</label><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></div>
          <div><label className="label">Max students</label><input type="number" className="input" value={form.maxStudent} onChange={(e) => setForm({ ...form, maxStudent: Number(e.target.value) })} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="col-span-2"><label className="label">Schedule</label><input className="input" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="e.g. Mon/Wed 9:00-10:30" /></div>
        </div>
      </FormModal>

      <ConfirmDialog open={confirmId !== null} title="Delete class" message="Are you sure you want to delete this class? All enrollments will be removed." onClose={() => setConfirmId(null)} onConfirm={onDelete} />
      <ConfirmDialog open={dropConfirm !== null} title="Drop enrollment" message="Remove this student from the class?" onClose={() => setDropConfirm(null)} onConfirm={doDrop} />
    </div>
  )
}
