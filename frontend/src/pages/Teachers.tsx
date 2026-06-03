import { FormEvent, useEffect, useState } from 'react'
import { teacherService } from '../services'
import type { Teacher } from '../types'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'

const empty = {
  email: '',
  password: '',
  fullName: '',
  phone: '',
  address: '',
  department: '',
  title: '',
  specialty: '',
  gender: 'male',
  salary: 0,
}

export default function Teachers() {
  const [items, setItems] = useState<Teacher[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const load = async (q = '') => {
    setLoading(true)
    try {
      const data = await teacherService.list(q)
      setItems(data.teachers)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const onCreate = () => {
    setEditing(null)
    setForm(empty)
    setError('')
    setOpen(true)
  }

  const onEdit = (t: Teacher) => {
    setEditing(t)
    setForm({
      email: t.user?.email || '',
      password: '',
      fullName: t.user?.fullName || '',
      phone: t.user?.phone || '',
      address: t.user?.address || '',
      department: t.department || '',
      title: t.title || '',
      specialty: t.specialty || '',
      gender: t.gender || 'male',
      salary: t.salary || 0,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editing) {
        await teacherService.update(editing.id, {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          department: form.department,
          title: form.title,
          specialty: form.specialty,
          gender: form.gender,
          salary: Number(form.salary),
        })
      } else {
        await teacherService.create({ ...form, salary: Number(form.salary) })
      }
      setOpen(false)
      load(search)
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
      await teacherService.remove(confirmId)
      setConfirmId(null)
      load(search)
    } catch {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
        <button className="btn btn-primary" onClick={onCreate}>
          + Add Teacher
        </button>
      </div>

      <div className="card p-4 mb-4">
        <input
          className="input max-w-md"
          placeholder="Search by name, email, or code..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            load(e.target.value)
          }}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Full name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Title</th>
              <th>Specialty</th>
              <th></th>
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
                  No teachers found
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono text-xs">{t.teacherCode}</td>
                  <td className="font-medium">{t.user?.fullName}</td>
                  <td>{t.user?.email}</td>
                  <td>{t.department || '-'}</td>
                  <td>{t.title || '-'}</td>
                  <td>{t.specialty || '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => onEdit(t)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-danger text-xs"
                        onClick={() => setConfirmId(t.id)}
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
        title={editing ? 'Edit Teacher' : 'Add Teacher'}
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
            <label className="label">Department</label>
            <input
              className="input"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Lecturer, Professor"
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
            <label className="label">Salary</label>
            <input
              type="number"
              className="input"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Specialty</label>
            <input
              className="input"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
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
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete teacher"
        message="Are you sure you want to delete this teacher?"
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
