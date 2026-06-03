import { useEffect, useState } from 'react'
import { financeService, launchService, invoiceService } from '../services'
import type { FinanceSummary, Launch } from '../types'

export default function Finance() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [launches, setLaunches] = useState<Launch[]>([])
  const [launchSummaries, setLaunchSummaries] = useState<Record<number, FinanceSummary>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      financeService.summary().then((d) => setSummary(d.summary)).catch(() => {}),
      launchService.list(1, 100).then((d) => setLaunches(d.launches)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (launches.length === 0) return
    Promise.all(
      launches.map((l) =>
        financeService.launchSummary(l.id).then((d) => ({ id: l.id, s: d.summary })).catch(() => null),
      ),
    ).then((results) => {
      const map: Record<number, FinanceSummary> = {}
      results.forEach((r) => { if (r) map[r.id] = r.s })
      setLaunchSummaries(map)
    })
  }, [launches])

  if (loading && !summary) return <div className="p-8 text-center text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Finance Dashboard</h1>

      {summary && (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-indigo-600">{summary.totalInvoices}</div>
              <div className="text-sm text-gray-500">Total Invoices</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-blue-600">${summary.totalAmount.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Billed</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-green-600">${summary.totalCollected.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Collected</div>
            </div>
            <div className="card text-center p-4">
              <div className="text-3xl font-bold text-red-600">${summary.totalOutstanding.toFixed(2)}</div>
              <div className="text-sm text-gray-500">Outstanding</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <div className="text-lg font-bold text-green-600">{summary.paidCount}</div>
                <div className="text-xs text-gray-500">Paid</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <div className="text-lg font-bold text-yellow-600">{summary.partialCount}</div>
                <div className="text-xs text-gray-500">Partial</div>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <div className="text-lg font-bold text-red-600">{summary.unpaidCount}</div>
                <div className="text-xs text-gray-500">Unpaid</div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Per Launch Breakdown</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Launch</th>
              <th>Invoices</th>
              <th>Billed</th>
              <th>Collected</th>
              <th>Outstanding</th>
              <th>Paid</th>
              <th>Unpaid</th>
            </tr>
          </thead>
          <tbody>
            {launches.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-6">No launches found</td></tr>
            ) : (
              launches.map((l) => {
                const s = launchSummaries[l.id]
                return (
                  <tr key={l.id}>
                    <td className="font-medium">{l.name}</td>
                    <td>{s?.totalInvoices ?? '-'}</td>
                    <td className="font-mono text-sm">{s ? `$${s.totalAmount.toFixed(2)}` : '-'}</td>
                    <td className="font-mono text-sm text-green-600">{s ? `$${s.totalCollected.toFixed(2)}` : '-'}</td>
                    <td className="font-mono text-sm text-red-600">{s ? `$${s.totalOutstanding.toFixed(2)}` : '-'}</td>
                    <td>{s?.paidCount ?? '-'}</td>
                    <td>{s?.unpaidCount ?? '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
