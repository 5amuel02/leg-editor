import { useEffect, useRef, useState } from 'react'

/**
 * Popover ringan untuk tombol-tombol toolbar.
 * Menutup otomatis saat klik di luar atau menekan Escape.
 */
export default function Popover({ trigger, children, align = 'center', width = 'w-56' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const alignClass =
    align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'

  return (
    <div className="relative" ref={ref}>
      {trigger(() => setOpen((o) => !o), open)}
      {open && (
        <div
          className={`leg-pop absolute top-full z-50 mt-2 ${alignClass} ${width} rounded-xl border border-ink-200 bg-white p-3 shadow-xl`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}
