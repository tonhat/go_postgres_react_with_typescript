import { FormEvent, useEffect, useState } from 'react'
import { courseService } from '../services'
import type { Course } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  name: '',
  code: '',
  description: '',
  credit: 3,
  hours: 45,
  department: '',
  isActive: true,
}

export default function Courses() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const isAdmin = currentUser?.role === 'admin'

  const load = async (q = search, p = page) => {
    setLoading(true)
    try {
      const data = await courseService.list(q, undefined, p)
      setItems(data.courses)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
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

  const onEdit = (c: Course) => {
    if (!isAdmin) return
    setEditing(c)
    setForm({
      name: c.name,
      code: c.code,
      description: c.description || '',
      credit: c.credit,
      hours: c.hours,
      department: c.department || '',
      isActive: c.isActive,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, credit: Number(form.credit), hours: Number(form.hours) }
      if (editing) {
        await courseService.update(editing.id, payload)
      } else {
        await courseService.create(payload)
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
      await courseService.remove(confirmId)
      setConfirmId(null)
      load(search, page)
    } catch {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Courses</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onCreate}>
            + Add Course
          </button>
        )}
      </div>

      <div className="card p-3 md:p-4 mb-4">
        <input
          className="input w-full md:max-w-md"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Credit</th>
              <th>Hours</th>
              <th>Status</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-500 py-6">
                  No courses found
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.code}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.department || '-'}</td>
                  <td>{c.credit}</td>
                  <td>{c.hours}</td>
                  <td>
                    {c.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-red">Inactive</span>
                    )}
                  </td>
                  {isAdmin && (
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
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
      </div>

      <FormModal
        open={open}
        title={editing ? 'Edit Course' : 'Add Course'}
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
            <label className="label">Department</label>
            <input
              className="input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Credit</label>
            <input
              type="number"
              className="input"
              value={form.credit}
              onChange={(e) => setForm({ ...form, credit: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Hours</label>
            <input
              type="number"
              className="input"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active
            </label>
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete course"
        message="Are you sure you want to delete this course?"
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
