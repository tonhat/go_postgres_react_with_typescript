import { FormEvent, useEffect, useState } from 'react'
import { launchService } from '../services'
import type { Launch } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  name: '',
  code: '',
  description: '',
  startDate: '',
  endDate: '',
  isActive: false,
}

export default function Launches() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<Launch[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Launch | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const isAdmin = currentUser?.role === 'admin'

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await launchService.list(p)
      setItems(data.launches)
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

  const onCreate = () => {
    if (!isAdmin) return
    setEditing(null)
    setForm(empty)
    setError('')
    setOpen(true)
  }

  const onEdit = (l: Launch) => {
    if (!isAdmin) return
    setEditing(l)
    setForm({
      name: l.name,
      code: l.code,
      description: l.description || '',
      startDate: l.startDate?.slice(0, 10) || '',
      endDate: l.endDate?.slice(0, 10) || '',
      isActive: l.isActive,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      }
      if (editing) {
        await launchService.update(editing.id, payload)
      } else {
        await launchService.create(payload)
      }
      setOpen(false)
      load(page)
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
      await launchService.remove(confirmId)
      setConfirmId(null)
      load(page)
    } catch {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Launches (Semesters)</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onCreate}>
            + Add Launch
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Start</th>
              <th>End</th>
              <th>Status</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center text-gray-500 py-6">
                  No launches found
                </td>
              </tr>
            ) : (
              items.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono text-xs">{l.code}</td>
                  <td className="font-medium">{l.name}</td>
                  <td>{l.startDate?.slice(0, 10)}</td>
                  <td>{l.endDate?.slice(0, 10)}</td>
                  <td>
                    {l.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-yellow">Inactive</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-xs" onClick={() => onEdit(l)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger text-xs"
                          onClick={() => setConfirmId(l.id)}
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
        title={editing ? 'Edit Launch' : 'Add Launch'}
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
              placeholder="e.g. FA24, SP25"
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
            <label className="label">Start date</label>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
          <div className="col-span-2 flex items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Set as active launch
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
        title="Delete launch"
        message="Are you sure you want to delete this launch?"
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
