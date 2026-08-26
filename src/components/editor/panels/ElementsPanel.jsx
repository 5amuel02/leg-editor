import { useState } from 'react'
import { useEditor } from '../../../context/EditorContext'
import { SHAPES, SWATCHES } from '../../../lib/constants'
import { createShape } from '../../../lib/fabricUtils'
import { SectionTitle } from '../../ui/Field'
import ColorPicker from '../../ui/ColorPicker'

/** Pratinjau SVG untuk setiap bentuk agar tombolnya mudah dikenali. */
function ShapePreview({ id, color }) {
  const common = { fill: color, stroke: 'none' }
  switch (id) {
    case 'rect':
      return <rect x="6" y="12" width="36" height="24" {...common} />
    case 'rounded':
      return <rect x="6" y="12" width="36" height="24" rx="6" {...common} />
    case 'circle':
      return <circle cx="24" cy="24" r="16" {...common} />
    case 'ellipse':
      return <ellipse cx="24" cy="24" rx="18" ry="11" {...common} />
    case 'triangle':
      return <polygon points="24,7 42,40 6,40" {...common} />
    case 'diamond':
      return <polygon points="24,6 42,24 24,42 6,24" {...common} />
    case 'star':
      return (
        <polygon
          points="24,5 29,18 43,18 32,27 36,41 24,33 12,41 16,27 5,18 19,18"
          {...common}
        />
      )
    case 'hexagon':
      return <polygon points="24,5 40,14 40,34 24,43 8,34 8,14" {...common} />
    case 'line':
      return <line x1="7" y1="24" x2="41" y2="24" stroke={color} strokeWidth="4" strokeLinecap="round" />
    case 'arrow':
      return (
        <g stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <line x1="7" y1="24" x2="40" y2="24" />
          <polyline points="31,15 40,24 31,33" />
        </g>
      )
    default:
      return null
  }
}

/**
 * Tab "Elemen": daftar bentuk dasar yang bisa diklik untuk ditambahkan.
 * Warna default bentuk baru bisa dipilih lebih dulu di bagian atas panel.
 */
export default function ElementsPanel() {
  const { addObject, size, activePage } = useEditor()
  const [fill, setFill] = useState('#8b5cf6')

  const locked = !!activePage?.locked

  const handleAdd = (shapeId) => {
    if (locked) return
    // Ukuran bentuk baru menyesuaikan dimensi kanvas agar proporsional.
    const base = Math.round(Math.min(size.width, size.height) * 0.35)
    const shape = createShape(shapeId, base, {
      fill,
      stroke: shapeId === 'line' || shapeId === 'arrow' ? fill : null,
      strokeWidth: shapeId === 'line' || shapeId === 'arrow' ? Math.max(4, base * 0.03) : 0,
    })
    addObject(shape)
  }

  return (
    <div className="space-y-5">
      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman ini terkunci. Buka kunci lewat panel halaman di bawah kanvas.
        </p>
      )}

      <div>
        <SectionTitle>Warna elemen baru</SectionTitle>
        <div className="flex items-center gap-2">
          <ColorPicker value={fill} onChange={setFill} label="Warna" />
          <div className="flex flex-wrap gap-1.5">
            {SWATCHES.slice(6, 18).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFill(c)}
                title={c}
                className={`h-5 w-5 rounded-md border transition hover:scale-110 ${
                  fill === c ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-200'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Bentuk</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={locked}
              onClick={() => handleAdd(s.id)}
              title={`Tambahkan ${s.label}`}
              className="group flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-white transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
            >
              <svg viewBox="0 0 48 48" className="h-9 w-9 transition group-hover:scale-110">
                <ShapePreview id={s.id} color={fill} />
              </svg>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">
          Klik bentuk untuk menambahkannya ke tengah kanvas. Atur warna isi, garis, dan
          ketebalannya lewat toolbar yang muncul di atas elemen.
        </p>
      </div>
    </div>
  )
}
