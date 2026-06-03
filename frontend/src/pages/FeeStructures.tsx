import { FormEvent, useEffect, useState } from 'react'
import { feeStructureService, courseService, launchService } from '../services'
import type { FeeStructure, Course, Launch } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  name: '',
  description: '',
  amount: 0,
  launchId: null as number | null,
  courseId: null as number | null,
  isMandatory: true,
}

export default function FeeStructures() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<FeeStructure[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<FeeStructure | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const isAdmin = currentUser?.role === 'admin'

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await feeStructureService.list(p)
      setItems(data.feeStructures)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [page])

  useEffect(() => {
    if (isAdmin) {
      launchService.list(1, 100).then((d) => setLaunches(d.launches)).catch(() => {})
      courseService.list().then((d) => setCourses(d.courses)).catch(() => {})
    }
  }, [isAdmin])

  const onCreate = () => { if (!isAdmin) return; setEditing(null); setForm(empty); setError(''); setOpen(true) }

  const onEdit = (item: FeeStructure) => {
    if (!isAdmin) return
    setEditing(item)
    setForm({
      name: item.name,
      description: item.description || '',
      amount: item.amount,
      launchId: item.launchId ?? null,
      courseId: item.courseId ?? null,
      isMandatory: item.isMandatory,
    })
    setError('')
    setOpen(true)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, launchId: form.launchId || null, courseId: form.courseId || null }
      if (editing) {
        await feeStructureService.update(editing.id, payload)
      } else {
        await feeStructureService.create(payload)
      }
      setOpen(false)
      load(page)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Operation failed')
    }
  }

  const onDelete = async () => {
    if (!confirmId || !isAdmin) return
    try { await feeStructureService.remove(confirmId); setConfirmId(null); load(page) }
    catch { setConfirmId(null) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Fee Structures</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onCreate}>+ Add Fee</button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Amount</th>
              <th>Mandatory</th>
              <th>Launch</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="text-center text-gray-500 py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="text-center text-gray-500 py-6">No fee structures defined</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.name}</td>
                  <td className="font-mono">${item.amount.toFixed(2)}</td>
                  <td>{item.isMandatory ? <span className="badge badge-green">Yes</span> : <span className="badge badge-yellow">No</span>}</td>
                  <td>{item.launch?.name || <span className="text-gray-400 text-sm">Global</span>}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-xs" onClick={() => onEdit(item)}>Edit</button>
                        <button className="btn btn-danger text-xs" onClick={() => setConfirmId(item.id)}>Delete</button>
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

      <FormModal open={open} title={editing ? 'Edit Fee' : 'Add Fee'} onClose={() => setOpen(false)} onSubmit={onSubmit}>
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-3">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Tuition, Lab Fee" />
          </div>
          <div className="col-span-2">
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Amount ($)</label>
            <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isMandatory} onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })} />
              Mandatory (auto-include in invoices)
            </label>
          </div>
          <div>
            <label className="label">Launch (optional)</label>
            <select className="input" value={form.launchId ?? ''} onChange={(e) => setForm({ ...form, launchId: e.target.value ? parseInt(e.target.value) : null })}>
              <option value="">— Global —</option>
              {launches.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.code})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Course (optional)</label>
            <select className="input" value={form.courseId ?? ''} onChange={(e) => setForm({ ...form, courseId: e.target.value ? parseInt(e.target.value) : null })}>
              <option value="">— All Courses —</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={confirmId !== null} title="Delete fee" message="Are you sure?" onClose={() => setConfirmId(null)} onConfirm={onDelete} />
    </div>
  )
}
