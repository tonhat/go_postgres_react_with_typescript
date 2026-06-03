import { FormEvent, ReactNode } from 'react'

interface FormModalProps {
  open: boolean
  title: string
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  children: ReactNode
  loading?: boolean
  submitLabel?: string
}

export default function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  children,
  loading,
  submitLabel = 'Save',
}: FormModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
