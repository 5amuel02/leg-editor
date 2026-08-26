import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

const ToastContext = createContext(null)

/** Hook untuk memunculkan notifikasi singkat dari mana saja. */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>')
  return ctx
}

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
}

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-ink-200 bg-white text-ink-800',
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setItems((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = ++idRef.current
      setItems((list) => [...list, { id, message, type }])
      if (duration > 0) setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({
      push,
      dismiss,
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d ?? 5000),
      info: (m, d) => push(m, 'info', d),
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4">
        {items.map((t) => {
          const Icon = ICONS[t.type] || Info
          return (
            <div
              key={t.id}
              className={`leg-pop pointer-events-auto flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-lg ${TONES[t.type]}`}
            >
              <Icon size={17} className="mt-0.5 shrink-0" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-50 transition hover:opacity-100"
                aria-label="Tutup notifikasi"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
