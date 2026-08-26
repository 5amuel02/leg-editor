import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CROP_RATIOS } from '../../lib/constants'

const VIEW_MAX = 520

/** Membatasi nilai agar berada di rentang tertentu. */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * Dialog crop gambar.
 *
 * Area crop dikelola sebagai kotak (dalam piksel asli gambar) yang bisa
 * digeser dan diubah ukurannya lewat 4 handle sudut. Saat diterapkan,
 * nilai `cropX`/`cropY`/`width`/`height` milik objek Fabric diperbarui —
 * ini crop non-destruktif, gambar aslinya tetap utuh sehingga crop
 * bisa diatur ulang kapan saja.
 */
export default function CropModal({ open, target, onClose, onApply }) {
  const [natural, setNatural] = useState({ w: 0, h: 0 })
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState('free')
  const dragRef = useRef(null)
  const areaRef = useRef(null)

  const src = target?.getSrc?.() || ''

  /** Skala tampilan: gambar dikecilkan agar muat di dalam modal. */
  const view = useMemo(() => {
    if (!natural.w || !natural.h) return { scale: 1, w: 0, h: 0 }
    const scale = Math.min(VIEW_MAX / natural.w, (VIEW_MAX * 0.8) / natural.h, 1)
    return { scale, w: natural.w * scale, h: natural.h * scale }
  }, [natural])

  /** Saat modal dibuka, mulai dari area crop yang sedang berlaku. */
  useEffect(() => {
    if (!open || !target) return
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      setNatural({ w, h })
      setRect({
        x: target.cropX || 0,
        y: target.cropY || 0,
        w: target.width || w,
        h: target.height || h,
      })
      setRatio('free')
    }
    img.src = target.getSrc()
  }, [open, target])

  /** Menjaga kotak crop tetap di dalam gambar. */
  const normalize = useCallback(
    (next) => {
      const w = clamp(next.w, 16, natural.w)
      const h = clamp(next.h, 16, natural.h)
      return {
        w,
        h,
        x: clamp(next.x, 0, natural.w - w),
        y: clamp(next.y, 0, natural.h - h),
      }
    },
    [natural],
  )

  /** Menerapkan rasio terkunci, berpusat pada kotak saat ini. */
  const applyRatio = (id) => {
    setRatio(id)
    const def = CROP_RATIOS.find((r) => r.id === id)
    if (!def?.value) return
    const cx = rect.x + rect.w / 2
    const cy = rect.y + rect.h / 2
    let w = rect.w
    let h = w / def.value
    if (h > natural.h) {
      h = natural.h
      w = h * def.value
    }
    if (w > natural.w) {
      w = natural.w
      h = w / def.value
    }
    setRect(normalize({ x: cx - w / 2, y: cy - h / 2, w, h }))
  }

  /* ---------------------------------------------------------------- */
  /* Interaksi geser & resize                                          */
  /* ---------------------------------------------------------------- */
  const startDrag = (mode) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { ...rect },
    }
  }

  useEffect(() => {
    if (!open) return

    const onMove = (e) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = (e.clientX - drag.startX) / view.scale
      const dy = (e.clientY - drag.startY) / view.scale
      const o = drag.origin
      const lock = CROP_RATIOS.find((r) => r.id === ratio)?.value || null

      if (drag.mode === 'move') {
        setRect(normalize({ ...o, x: o.x + dx, y: o.y + dy }))
        return
      }

      let { x, y, w, h } = o
      if (drag.mode.includes('e')) w = o.w + dx
      if (drag.mode.includes('s')) h = o.h + dy
      if (drag.mode.includes('w')) {
        w = o.w - dx
        x = o.x + dx
      }
      if (drag.mode.includes('n')) {
        h = o.h - dy
        y = o.y + dy
      }

      // Saat rasio dikunci, tinggi mengikuti lebar.
      if (lock) {
        h = w / lock
        if (drag.mode.includes('n')) y = o.y + (o.h - h)
      }

      setRect(normalize({ x, y, w, h }))
    }

    const onUp = () => {
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [open, view.scale, ratio, normalize])

  const reset = () => {
    setRatio('free')
    setRect({ x: 0, y: 0, w: natural.w, h: natural.h })
  }

  const handleApply = () => {
    onApply({
      cropX: Math.round(rect.x),
      cropY: Math.round(rect.y),
      width: Math.round(rect.w),
      height: Math.round(rect.h),
    })
  }

  if (!open || !target) return null

  const box = {
    left: rect.x * view.scale,
    top: rect.y * view.scale,
    width: rect.w * view.scale,
    height: rect.h * view.scale,
  }

  // Posisi handle dihitung inline dari kotak crop; class hanya mengatur kursor.
  const handles = [
    { id: 'nw', className: 'cursor-nwse-resize' },
    { id: 'ne', className: 'cursor-nesw-resize' },
    { id: 'sw', className: 'cursor-nesw-resize' },
    { id: 'se', className: 'cursor-nwse-resize' },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crop gambar"
      description="Geser kotak untuk memilih bagian yang ditampilkan. Gambar asli tidak diubah."
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw size={15} /> Reset
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleApply}>Terapkan Crop</Button>
        </>
      }
    >
      {/* Pilihan rasio */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CROP_RATIOS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => applyRatio(r.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
              ratio === r.id
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Area pratinjau + kotak crop */}
      <div className="flex justify-center">
        <div
          ref={areaRef}
          className="relative select-none overflow-hidden rounded-lg bg-ink-900"
          style={{ width: view.w, height: view.h }}
        >
          <img
            src={src}
            alt="Pratinjau crop"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            draggable={false}
          />

          {/* Bagian yang terpilih ditampilkan penuh */}
          <div
            className="absolute overflow-hidden border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
            style={box}
            onMouseDown={startDrag('move')}
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none"
              style={{
                width: view.w,
                height: view.h,
                left: -box.left,
                top: -box.top,
              }}
            />
            {/* Garis bantu rule-of-thirds */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/3 top-0 h-full w-px bg-white/40" />
              <div className="absolute left-2/3 top-0 h-full w-px bg-white/40" />
              <div className="absolute left-0 top-1/3 h-px w-full bg-white/40" />
              <div className="absolute left-0 top-2/3 h-px w-full bg-white/40" />
            </div>
          </div>

          {/* Handle sudut */}
          {handles.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-label={`Ubah ukuran ${h.id}`}
              onMouseDown={startDrag(h.id)}
              className={`absolute h-3 w-3 rounded-full border-2 border-brand-500 bg-white ${h.className}`}
              style={{
                left: h.id.includes('w') ? box.left - 6 : box.left + box.width - 6,
                top: h.id.includes('n') ? box.top - 6 : box.top + box.height - 6,
              }}
            />
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-ink-400">
        Area terpilih: {Math.round(rect.w)} × {Math.round(rect.h)} px dari {natural.w} × {natural.h} px
      </p>
    </Modal>
  )
}
