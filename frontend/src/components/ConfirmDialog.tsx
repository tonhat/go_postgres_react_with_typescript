import { FormEvent, ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
  children?: ReactNode
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  onConfirm,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-4 text-sm text-gray-600">{message}</div>
        <div className="p-4 flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function handleForm(e: FormEvent) {
  e.preventDefault()
}
