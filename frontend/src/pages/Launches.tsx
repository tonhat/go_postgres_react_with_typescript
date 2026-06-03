import { FormEvent, useEffect, useState } from 'react'
import { launchService, transcriptService } from '../services'
import type { Launch, ClassReport } from '../types'
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
  const [finalizing, setFinalizing] = useState<number | null>(null)
  const [finalizeResult, setFinalizeResult] = useState<{ message: string; transcripts: number; avgGpa: number } | null>(null)
  const [report, setReport] = useState<ClassReport[] | null>(null)
  const [reportLaunch, setReportLaunch] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)
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

  const onFinalize = async (id: number) => {
    if (!isAdmin) return
    setFinalizing(id)
    setFinalizeResult(null)
    try {
      const res = await transcriptService.finalize(id)
      setFinalizeResult(res)
      load(page)
    } catch (err: unknown) {
      setFinalizeResult({
        message:
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Finalization failed',
        transcripts: 0,
        avgGpa: 0,
      })
    } finally {
      setFinalizing(null)
    }
  }

  const onViewReport = async (id: number, name: string) => {
    try {
      const res = await transcriptService.report(id)
      setReport(res.report)
      setReportLaunch(name)
      setShowReport(true)
    } catch {
      setReport([])
      setReportLaunch(name)
      setShowReport(true)
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-6">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-6">
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
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => onViewReport(l.id, l.name)}>
                        Report
                      </button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary text-xs" onClick={() => onEdit(l)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-primary text-xs"
                            onClick={() => onFinalize(l.id)}
                            disabled={finalizing === l.id}
                          >
                            {finalizing === l.id ? '...' : 'Finalize'}
                          </button>
                          <button
                            className="btn btn-danger text-xs"
                            onClick={() => setConfirmId(l.id)}
                          >
                            Delete
                          </button>
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

      {finalizeResult && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`rounded-lg shadow-lg p-4 text-sm max-w-sm ${finalizeResult.transcripts > 0 ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            <p className="font-medium">{finalizeResult.transcripts > 0 ? 'Launch finalized!' : 'Error'}</p>
            <p>{finalizeResult.message}</p>
            {finalizeResult.transcripts > 0 && (
              <p className="mt-1">
                {finalizeResult.transcripts} transcript(s) generated. Avg GPA: {finalizeResult.avgGpa.toFixed(2)}
              </p>
            )}
            <button className="text-xs underline mt-1" onClick={() => setFinalizeResult(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowReport(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Report — {reportLaunch}</h2>
              <button className="btn btn-secondary text-xs" onClick={() => setShowReport(false)}>Close</button>
            </div>
            {!report || report.length === 0 ? (
              <p className="text-gray-500 text-center py-6">No class data available for this launch.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Avg Score</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((r) => (
                    <tr key={r.classId}>
                      <td className="font-medium text-sm">{r.className}</td>
                      <td>{r.avgScore.toFixed(1)}</td>
                      <td>{r.minScore.toFixed(1)}</td>
                      <td>{r.maxScore.toFixed(1)}</td>
                      <td className="text-green-600 font-medium">{r.passCount}</td>
                      <td className="text-red-600 font-medium">{r.failCount}</td>
                      <td>
                        <span className={`badge ${r.passRate >= 70 ? 'badge-green' : r.passRate >= 50 ? 'badge-yellow' : 'badge-red'}`}>
                          {r.passRate.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

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
