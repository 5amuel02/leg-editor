import { useEffect } from 'react'
import { X } from 'lucide-react'
import IconButton from './IconButton'

/**
 * Modal dasar: overlay gelap + kartu di tengah.
 * Menutup lewat tombol X, klik overlay, atau tombol Escape.
 */
export default function Modal({ open, onClose, title, description, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`leg-pop relative w-full ${width} overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          <IconButton label="Tutup" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
