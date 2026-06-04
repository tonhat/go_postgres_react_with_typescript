import { FormEvent, useEffect, useState } from 'react'
import { gradeRuleService, launchService } from '../services'
import type { GradeRule, Launch } from '../types'
import { useAuth } from '../context/AuthContext'
import FormModal from '../components/FormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import Pagination from '../components/Pagination'

const empty = {
  letterGrade: '',
  minScore: 0,
  maxScore: 100,
  gpaPoints: 0,
  launchId: null as number | null,
}

export default function GradeRules() {
  const { user: currentUser } = useAuth()
  const [items, setItems] = useState<GradeRule[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<GradeRule | null>(null)
  const [form, setForm] = useState(empty)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const isAdmin = currentUser?.role === 'admin'

  const load = async (p = page) => {
    setLoading(true)
    try {
      const data = await gradeRuleService.list(p)
      setItems(data.gradeRules)
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

  useEffect(() => {
    if (isAdmin) {
      launchService.list(1, 100).then((d) => setLaunches(d.launches)).catch(() => {})
    }
  }, [isAdmin])

  const onCreate = () => {
    if (!isAdmin) return
    setEditing(null)
    setForm(empty)
    setError('')
    setOpen(true)
  }

  const onEdit = (rule: GradeRule) => {
    if (!isAdmin) return
    setEditing(rule)
    setForm({
      letterGrade: rule.letterGrade,
      minScore: rule.minScore,
      maxScore: rule.maxScore,
      gpaPoints: rule.gpaPoints,
      launchId: rule.launchId ?? null,
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
        launchId: form.launchId || null,
      }
      if (editing) {
        await gradeRuleService.update(editing.id, payload)
      } else {
        await gradeRuleService.create(payload)
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
      await gradeRuleService.remove(confirmId)
      setConfirmId(null)
      load(page)
    } catch {
      setConfirmId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Grade Rules</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={onCreate}>
            + Add Rule
          </button>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Grade</th>
              <th>Min Score</th>
              <th>Max Score</th>
              <th>GPA Points</th>
              <th>Launch</th>
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
                  No grade rules found
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.id}>
                  <td className="font-bold text-lg">{r.letterGrade}</td>
                  <td>{r.minScore}</td>
                  <td>{r.maxScore}</td>
                  <td>{r.gpaPoints.toFixed(2)}</td>
                  <td>{r.launch?.name || <span className="text-gray-400 text-sm">Global</span>}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-secondary text-xs" onClick={() => onEdit(r)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger text-xs"
                          onClick={() => setConfirmId(r.id)}
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
        title={editing ? 'Edit Grade Rule' : 'Add Grade Rule'}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Letter Grade</label>
            <input
              className="input"
              value={form.letterGrade}
              onChange={(e) => setForm({ ...form, letterGrade: e.target.value })}
              required
              placeholder="e.g. A, B+, C-"
            />
          </div>
          <div>
            <label className="label">GPA Points</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.gpaPoints}
              onChange={(e) => setForm({ ...form, gpaPoints: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <label className="label">Min Score</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.minScore}
              onChange={(e) => setForm({ ...form, minScore: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div>
            <label className="label">Max Score</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={form.maxScore}
              onChange={(e) => setForm({ ...form, maxScore: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>
          <div className="col-span-2">
            <label className="label">Launch (optional — leave empty for global rule)</label>
            <select
              className="input"
              value={form.launchId ?? ''}
              onChange={(e) => setForm({ ...form, launchId: e.target.value ? parseInt(e.target.value) : null })}
            >
              <option value="">— Global —</option>
              {launches.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={confirmId !== null}
        title="Delete grade rule"
        message="Are you sure you want to delete this grade rule?"
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
      />
    </div>
  )
}
