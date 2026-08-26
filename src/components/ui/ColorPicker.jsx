import { useEffect, useRef, useState } from 'react'
import { Ban } from 'lucide-react'
import { SWATCHES } from '../../lib/constants'

/**
 * Pemilih warna: kotak pratinjau yang membuka popover berisi
 * palet cepat + input <input type="color"> + input HEX manual.
 *
 * `allowNone` menambahkan opsi "tanpa warna" (null) untuk fill/stroke.
 */
export default function ColorPicker({
  value,
  onChange,
  label,
  allowNone = false,
  size = 'md',
  align = 'left',
  variant = 'fill', // 'fill' = kotak terisi warna, 'ring' = cincin (untuk garis)
}) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value || '#000000')
  const ref = useRef(null)

  useEffect(() => setHex(typeof value === 'string' ? value : '#000000'), [value])

  // Tutup popover saat klik di luar komponen.
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const isNone = !value || value === 'transparent'
  const box = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'

  const commitHex = (raw) => {
    const v = raw.startsWith('#') ? raw : `#${raw}`
    setHex(v)
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) onChange(v)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className={`${box} relative overflow-hidden rounded-lg border border-ink-200 shadow-sm transition hover:border-ink-300`}
        style={
          // Varian "ring" menampilkan warna sebagai cincin tebal dengan bagian
          // tengah kosong, sehingga sekilas terbaca sebagai warna garis/outline.
          variant === 'ring'
            ? {
                background: '#ffffff',
                boxShadow: isNone ? undefined : `inset 0 0 0 ${size === 'sm' ? 4 : 5}px ${value}`,
              }
            : {
                background: isNone
                  ? 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px'
                  : value,
              }
        }
      >
        {isNone && (
          <span className="absolute inset-0 flex items-center justify-center text-ink-400">
            <Ban size={14} />
          </span>
        )}
      </button>

      {open && (
        <div
          className={`leg-pop absolute z-40 mt-2 w-56 rounded-xl border border-ink-200 bg-white p-3 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {label && <p className="mb-2 text-xs font-semibold text-ink-500">{label}</p>}

          <div className="grid grid-cols-6 gap-1.5">
            {allowNone && (
              <button
                type="button"
                title="Tanpa warna"
                onClick={() => {
                  onChange(null)
                  setOpen(false)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 text-ink-400 hover:border-ink-400"
              >
                <Ban size={13} />
              </button>
            )}
            {SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
                className={`h-7 w-7 rounded-md border transition hover:scale-110 ${
                  value === c ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-200'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : '#000000'}
              onChange={(e) => {
                setHex(e.target.value)
                onChange(e.target.value)
              }}
              className="h-8 w-9 rounded-md"
            />
            <input
              type="text"
              value={hex}
              onChange={(e) => commitHex(e.target.value)}
              className="h-8 w-full rounded-md border border-ink-200 px-2 font-mono text-xs uppercase outline-none focus:border-brand-400"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  )
}
