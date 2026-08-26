import { useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { SHAPES, SWATCHES } from '../../../lib/constants'
import { createShape } from '../../../lib/fabricUtils'
import { CHAT_BUBBLES, bubblePath, createChatBubble } from '../../../lib/bubbles'
import { FRAME_CATEGORIES, createFrame, framePath, frameSize } from '../../../lib/frames'
import { SectionTitle } from '../../ui/Field'
import ColorPicker from '../../ui/ColorPicker'

/** Pratinjau SVG untuk setiap bentuk dasar agar tombolnya mudah dikenali. */
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
 * Tab "Elemen": bentuk dasar, balon percakapan, dan bingkai gambar.
 * Warna default elemen baru bisa dipilih lebih dulu di bagian atas panel.
 */
export default function ElementsPanel() {
  const { addObject, size, activePage } = useEditor()
  const [fill, setFill] = useState('#8b5cf6')
  const [frameTab, setFrameTab] = useState('basic')

  const locked = !!activePage?.locked
  // Ukuran dasar elemen baru menyesuaikan dimensi kanvas agar proporsional.
  const base = Math.round(Math.min(size.width, size.height) * 0.35)

  const handleAddShape = (shapeId) => {
    if (locked) return
    const isStroked = shapeId === 'line' || shapeId === 'arrow'
    addObject(
      createShape(shapeId, base, {
        fill,
        stroke: isStroked ? fill : null,
        strokeWidth: isStroked ? Math.max(4, base * 0.03) : 0,
      }),
    )
  }

  const handleAddBubble = (bubbleId) => {
    if (locked) return
    const w = base * 1.25
    const h = bubbleId === 'bubble-burst' ? w : w * 0.78
    addObject(createChatBubble(bubbleId, w, h, { fill: '#ffffff', stroke: fill }))
  }

  const handleAddFrame = (frameId) => {
    if (locked) return
    addObject(createFrame(frameId, base * 1.3))
  }

  const activeCategory = FRAME_CATEGORIES.find((c) => c.id === frameTab) || FRAME_CATEGORIES[0]

  return (
    <div className="space-y-6">
      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman ini terkunci. Buka kunci lewat panel halaman di bawah kanvas.
        </p>
      )}

      {/* ---------------- Warna ---------------- */}
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

      {/* ---------------- Bentuk dasar ---------------- */}
      <div>
        <SectionTitle>Bentuk</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={locked}
              onClick={() => handleAddShape(s.id)}
              title={`Tambahkan ${s.label}`}
              className="group flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-white transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
            >
              <svg viewBox="0 0 48 48" className="h-9 w-9 transition group-hover:scale-110">
                <ShapePreview id={s.id} color={fill} />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Balon percakapan ---------------- */}
      <div>
        <SectionTitle>Balon Chat</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {CHAT_BUBBLES.map((b) => (
            <button
              key={b.id}
              type="button"
              disabled={locked}
              onClick={() => handleAddBubble(b.id)}
              title={`Tambahkan balon ${b.label}`}
              className="group flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-white p-1.5 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
            >
              <svg viewBox="0 0 48 44" className="h-full w-full transition group-hover:scale-110">
                <path
                  d={bubblePath(b.id, b.id === 'bubble-burst' ? 44 : 44, b.id === 'bubble-burst' ? 42 : 40)}
                  transform="translate(2, 1)"
                  fill="#ffffff"
                  stroke={fill}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-400">
          Tambahkan kotak teks di atas balon untuk mengisi dialognya.
        </p>
      </div>

      {/* ---------------- Bingkai ---------------- */}
      <div>
        <SectionTitle>Bingkai</SectionTitle>

        <div className="mb-2 flex rounded-lg bg-ink-100 p-0.5">
          {FRAME_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFrameTab(c.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
                frameTab === c.id ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {activeCategory.frames.map((f) => {
            // Pratinjau digambar pada kotak 44×44 mengikuti rasio bingkai.
            const { width, height } = frameSize(f.id, 40)
            return (
              <button
                key={f.id}
                type="button"
                disabled={locked}
                onClick={() => handleAddFrame(f.id)}
                title={`Tambahkan bingkai ${f.label}`}
                className="group flex aspect-square items-center justify-center rounded-xl border border-ink-200 bg-white p-1.5 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
              >
                <svg viewBox="0 0 44 44" className="h-full w-full transition group-hover:scale-110">
                  <path
                    d={framePath(f.id, width, height)}
                    transform={`translate(${(44 - width) / 2}, ${(44 - height) / 2})`}
                    fill="#cbd5e1"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )
          })}
        </div>

        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
          <ImagePlus size={14} className="mt-px shrink-0" />
          <span>
            Pilih bingkai lalu klik gambar di tab Unggahan — atau seret gambar langsung ke atas
            bingkai — untuk mengisinya. Gambar otomatis dipotong mengikuti bentuk bingkai.
          </span>
        </p>
      </div>
    </div>
  )
}
