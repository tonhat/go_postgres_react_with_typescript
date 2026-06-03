import { useEffect, useState } from 'react'
import { transcriptService, launchService } from '../services'
import type { Transcript, Launch, TranscriptSummary } from '../types'
import Pagination from '../components/Pagination'

export default function Transcripts() {
  const [items, setItems] = useState<Transcript[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [summary, setSummary] = useState<TranscriptSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [launchFilter, setLaunchFilter] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    try {
      const params: { launchId?: number } = {}
      if (launchFilter) params.launchId = parseInt(launchFilter)
      const data = await transcriptService.list(params, p)
      setItems(data.transcripts)
      setTotal(data.total)
      setPage(data.page)
    } catch {
      setItems([])
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [page, launchFilter])

  useEffect(() => {
    transcriptService.summary().then((d) => setSummary(d.summary)).catch(() => {})
    launchService.list(1, 100).then((d) => setLaunches(d.launches)).catch(() => {})
  }, [])

  const gpaColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-green-600'
    if (gpa >= 2.5) return 'text-blue-600'
    if (gpa >= 2.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Transcripts</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card text-center p-4">
            <div className="text-2xl font-bold text-indigo-600">{summary.launches}</div>
            <div className="text-sm text-gray-500">Launches Processed</div>
          </div>
          <div className="card text-center p-4">
            <div className="text-2xl font-bold text-indigo-600">{summary.transcripts}</div>
            <div className="text-sm text-gray-500">Transcripts Generated</div>
          </div>
          <div className="card text-center p-4">
            <div className={`text-2xl font-bold ${gpaColor(summary.overallGpa)}`}>
              {summary.overallGpa.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Overall Average GPA</div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="mb-4 flex gap-2 items-center">
          <label className="text-sm font-medium text-gray-600">Filter by launch:</label>
          <select
            className="input w-64"
            value={launchFilter}
            onChange={(e) => { setLaunchFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Launches</option>
            {launches.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Code</th>
              <th>Launch</th>
              <th>GPA</th>
              <th>Credits</th>
              <th>Courses</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-6">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-6">
                  No transcripts found. Finalize a launch to generate transcripts.
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.student?.user?.fullName || '-'}</td>
                  <td className="font-mono text-xs">{t.student?.studentCode}</td>
                  <td>{t.launch?.name}</td>
                  <td className={`font-bold ${gpaColor(t.gpa)}`}>{t.gpa.toFixed(2)}</td>
                  <td>{t.totalCredits}</td>
                  <td>{t.courseCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
      </div>
    </div>
  )
}
