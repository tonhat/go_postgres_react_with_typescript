import { useEffect, useState } from 'react'
import { invoiceService, launchService, financeService } from '../services'
import type { Invoice, Launch, FinanceSummary } from '../types'
import { useAuth } from '../context/AuthContext'
import Pagination from '../components/Pagination'

const statusBadge: Record<string, string> = {
  paid: 'badge-green',
  unpaid: 'badge-red',
  partial: 'badge-yellow',
  cancelled: 'badge-gray',
}

export default function Invoices() {
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.role === 'admin'
  const [items, setItems] = useState<Invoice[]>([])
  const [launches, setLaunches] = useState<Launch[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [launchFilter, setLaunchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Invoice | null>(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('cash')
  const [payRef, setPayRef] = useState('')
  const [payNote, setPayNote] = useState('')
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)

  const load = async (p = page) => {
    setLoading(true)
    try {
      const params: { launchId?: number; status?: string } = {}
      if (launchFilter) params.launchId = parseInt(launchFilter)
      if (statusFilter) params.status = statusFilter
      const data = await invoiceService.list(params, p)
      setItems(data.invoices)
      setTotal(data.total)
      setPage(data.page)
    } catch { setItems([]) }
    setLoading(false)
  }

  useEffect(() => { load() }, [page, launchFilter, statusFilter])

  useEffect(() => {
    financeService.summary().then((d) => setSummary(d.summary)).catch(() => {})
    launchService.list(1, 100).then((d) => setLaunches(d.launches)).catch(() => {})
  }, [])

  const openDetail = async (inv: Invoice) => {
    try {
      const full = await invoiceService.get(inv.id)
      setSelected(full)
      setPayAmount(0)
      setPayMethod('cash')
      setPayRef('')
      setPayNote('')
      setPayError('')
    } catch { setSelected(inv) }
  }

  const recordPayment = async () => {
    if (!selected || payAmount <= 0) return
    setPaying(true)
    setPayError('')
    try {
      const res = await invoiceService.pay(selected.id, { amount: payAmount, paymentMethod: payMethod, referenceNo: payRef, note: payNote })
      setSelected(res.invoice)
      setPayAmount(0)
      load(page)
      financeService.summary().then((d) => setSummary(d.summary)).catch(() => {})
    } catch (err: unknown) {
      setPayError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment failed')
    }
    setPaying(false)
  }

  const remaining = selected ? selected.totalAmount - selected.paidAmount : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="card text-center p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold text-indigo-600">{summary.totalInvoices}</div>
            <div className="text-xs text-gray-500">Total Invoices</div>
          </div>
          <div className="card text-center p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold text-blue-600">${summary.totalAmount.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Total Billed</div>
          </div>
          <div className="card text-center p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold text-green-600">${summary.totalCollected.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Collected</div>
          </div>
          <div className="card text-center p-3 md:p-4">
            <div className="text-xl md:text-2xl font-bold text-red-600">${summary.totalOutstanding.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Outstanding</div>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="mb-4 flex gap-2 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-600">Launch:</label>
          <select className="input w-full sm:w-48" value={launchFilter} onChange={(e) => { setLaunchFilter(e.target.value); setPage(1) }}>
            <option value="">All</option>
            {launches.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <label className="text-sm font-medium text-gray-600">Status:</label>
          <select className="input w-full sm:w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Student</th>
              <th>Launch</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-6">Loading...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-gray-500 py-6">No invoices yet. Generate invoices from a launch.</td></tr>
            ) : (
              items.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono text-xs">{inv.invoiceNo}</td>
                  <td className="font-medium text-sm">{inv.student?.user?.fullName || '-'}</td>
                  <td className="text-sm">{inv.launch?.name}</td>
                  <td className="font-mono text-sm">${inv.totalAmount.toFixed(2)}</td>
                  <td className="font-mono text-sm">${inv.paidAmount.toFixed(2)}</td>
                  <td><span className={`badge ${statusBadge[inv.status] || 'badge-gray'}`}>{inv.status}</span></td>
                  <td>
                    <button className="btn btn-secondary text-xs" onClick={() => openDetail(inv)}>
                      {isAdmin && inv.status !== 'paid' ? 'Pay' : 'View'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination page={page} limit={20} total={total} onPageChange={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{selected.invoiceNo}</h2>
                <p className="text-sm text-gray-500">
                  {selected.student?.user?.fullName} — {selected.launch?.name}
                </p>
              </div>
              <button className="btn btn-secondary text-xs" onClick={() => setSelected(null)}>Close</button>
            </div>

            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="table">
                <thead>
                  <tr><th>Item</th><th className="text-right">Amount</th></tr>
                </thead>
                <tbody>
                  {selected.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{item.feeStructure?.name || 'Fee'}</td>
                      <td className="text-right font-mono">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td>Total</td>
                    <td className="text-right font-mono">${selected.totalAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Paid</td>
                    <td className="text-right font-mono text-green-600">${selected.paidAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold">
                    <td>Remaining</td>
                    <td className={`text-right font-mono ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${remaining.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className={`badge ${statusBadge[selected.status] || 'badge-gray'} mb-4`}>{selected.status}</div>

            {isAdmin && selected.status !== 'paid' && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Record Payment</h3>
                {payError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mb-2">{payError}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="label text-xs">Amount</label>
                    <input type="number" step="0.01" className="input" max={remaining} value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="label text-xs">Method</label>
                    <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="credit_card">Credit Card</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Reference</label>
                    <input className="input" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="optional" />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="label text-xs">Note</label>
                  <input className="input" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="optional" />
                </div>
                <button className="btn btn-primary" onClick={recordPayment} disabled={paying || payAmount <= 0}>
                  {paying ? 'Recording...' : `Pay $${payAmount.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
