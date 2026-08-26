import { useState } from 'react'
import { Eraser, Highlighter, MousePointer2, Pen, PenLine, Table } from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { BRUSHES, BRUSH_SWATCHES } from '../../../lib/constants'
import { createTable } from '../../../lib/fabricUtils'
import Button from '../../ui/Button'
import ColorPicker from '../../ui/ColorPicker'
import { SectionTitle, SliderInput } from '../../ui/Field'

const BRUSH_ICONS = { pen: Pen, highlighter: Highlighter, marker: PenLine }

/** Mengubah HEX menjadi rgba agar brush stabilo bisa transparan. */
function withAlpha(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
  if (!m) return hex
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(m[i], 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const MAX_GRID = 8

/**
 * Tab "Alat": mode menggambar bebas (3 jenis brush), penghapus coretan,
 * dan pembuat tabel sederhana dengan jumlah baris/kolom custom.
 */
export default function ToolsPanel() {
  const { tool, setTool, brush, setBrush, addObject, size, activePage } = useEditor()
  const locked = !!activePage?.locked

  const [baseColor, setBaseColor] = useState('#1e293b')
  const [table, setTable] = useState({ rows: 3, cols: 3, header: true })
  const [hover, setHover] = useState({ r: 0, c: 0 })

  /** Menyalakan mode gambar dengan konfigurasi brush tertentu. */
  const activateBrush = (brushDef) => {
    if (locked) return
    setBrush({
      type: brushDef.id,
      color: withAlpha(baseColor, brushDef.opacity),
      width: brushDef.defaultWidth,
    })
    setTool('draw')
  }

  /** Mengubah warna dasar; brush aktif ikut menyesuaikan opasitasnya. */
  const changeColor = (color) => {
    setBaseColor(color)
    const def = BRUSHES.find((b) => b.id === brush.type) || BRUSHES[0]
    setBrush((b) => ({ ...b, color: withAlpha(color, def.opacity) }))
  }

  const changeWidth = (width) => setBrush((b) => ({ ...b, width }))

  const insertTable = () => {
    if (locked) return
    // Lebar tabel dibuat ±80% lebar kanvas agar langsung enak dilihat.
    const cellWidth = Math.round((size.width * 0.8) / table.cols)
    const cellHeight = Math.round(cellWidth * 0.42)
    const obj = createTable({
      rows: table.rows,
      cols: table.cols,
      cellWidth,
      cellHeight,
      withHeader: table.header,
      fontSize: Math.max(14, Math.round(cellHeight * 0.3)),
      strokeWidth: Math.max(1, Math.round(size.width / 700)),
    })
    addObject(obj)
    setTool('select')
  }

  return (
    <div className="space-y-6">
      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman terkunci — alat gambar dinonaktifkan.
        </p>
      )}

      {/* ---------------- Mode ---------------- */}
      <div>
        <SectionTitle>Mode</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTool('select')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition ${
              tool === 'select'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            <MousePointer2 size={14} /> Pilih
          </button>
          <button
            type="button"
            disabled={locked}
            onClick={() => setTool(tool === 'erase' ? 'select' : 'erase')}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition disabled:opacity-40 ${
              tool === 'erase'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            <Eraser size={14} /> Penghapus
          </button>
        </div>
        {tool === 'erase' && (
          <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
            Usap di atas coretan untuk menghapusnya. Elemen lain (teks/bentuk/gambar) tidak ikut
            terhapus — gunakan tombol Hapus atau tombol Delete untuk itu.
          </p>
        )}
      </div>

      {/* ---------------- Brush ---------------- */}
      <div>
        <SectionTitle>Jenis brush</SectionTitle>
        <div className="space-y-2">
          {BRUSHES.map((b) => {
            const Icon = BRUSH_ICONS[b.id] || Pen
            const active = tool === 'draw' && brush.type === b.id
            return (
              <button
                key={b.id}
                type="button"
                disabled={locked}
                onClick={() => activateBrush(b)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-40 ${
                  active
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-200 hover:border-brand-300 hover:bg-ink-50'
                }`}
              >
                <Icon size={18} className={active ? 'text-brand-600' : 'text-ink-400'} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink-800">{b.label}</p>
                  <p className="text-[11px] text-ink-400">{b.desc}</p>
                </div>
                <span
                  className="h-6 w-6 shrink-0 rounded-full"
                  style={{
                    background: withAlpha(baseColor, b.opacity),
                    border: '1px solid rgba(15,23,42,0.1)',
                  }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ---------------- Warna & ketebalan ---------------- */}
      <div className="space-y-3">
        <SectionTitle>Warna & ketebalan</SectionTitle>
        <div className="flex items-center gap-2">
          <ColorPicker value={baseColor} onChange={changeColor} label="Warna brush" />
          <div className="flex flex-wrap gap-1.5">
            {BRUSH_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeColor(c)}
                title={c}
                className={`h-5 w-5 rounded-md border transition hover:scale-110 ${
                  baseColor === c ? 'border-brand-500 ring-2 ring-brand-200' : 'border-ink-200'
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-ink-500">Ketebalan garis</p>
          <SliderInput min={1} max={80} step={1} value={brush.width} onChange={changeWidth} suffix="px" />
        </div>

        {/* Pratinjau goresan — separuh terang, separuh gelap supaya warna
            terang seperti putih tetap terlihat jelas. */}
        <div className="flex h-14 items-center justify-center overflow-hidden rounded-xl border border-ink-200">
          <svg viewBox="0 0 200 40" className="h-full w-full">
            <rect x="0" y="0" width="100" height="40" fill="#ffffff" />
            <rect x="100" y="0" width="100" height="40" fill="#334155" />
            <path
              d="M10 30 C 50 4, 80 36, 110 20 S 170 8, 190 22"
              fill="none"
              stroke={brush.color}
              strokeWidth={Math.min(brush.width, 34)}
              strokeLinecap={brush.type === 'highlighter' ? 'butt' : 'round'}
            />
          </svg>
        </div>
      </div>

      {/* ---------------- Tabel ---------------- */}
      <div>
        <SectionTitle>Tabel</SectionTitle>

        {/* Pemilih ukuran grid ala spreadsheet */}
        <div
          className="inline-block rounded-lg border border-ink-200 bg-white p-2"
          onMouseLeave={() => setHover({ r: 0, c: 0 })}
        >
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: MAX_GRID * MAX_GRID }).map((_, i) => {
              const r = Math.floor(i / MAX_GRID) + 1
              const c = (i % MAX_GRID) + 1
              const within = r <= hover.r && c <= hover.c
              const selected = r <= table.rows && c <= table.cols
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover({ r, c })}
                  onClick={() => setTable((t) => ({ ...t, rows: r, cols: c }))}
                  className={`h-4 w-4 rounded-[3px] border transition ${
                    within
                      ? 'border-brand-500 bg-brand-400'
                      : selected
                        ? 'border-brand-300 bg-brand-100'
                        : 'border-ink-200 bg-ink-50'
                  }`}
                />
              )
            })}
          </div>
          <p className="mt-2 text-center text-[11px] font-medium text-ink-500">
            {(hover.r || table.rows)} baris × {(hover.c || table.cols)} kolom
          </p>
        </div>

        <label className="mt-3 flex items-center gap-2 text-xs text-ink-600">
          <input
            type="checkbox"
            checked={table.header}
            onChange={(e) => setTable((t) => ({ ...t, header: e.target.checked }))}
            className="h-3.5 w-3.5 accent-violet-600"
          />
          Baris pertama sebagai judul
        </label>

        <Button className="mt-3 w-full" variant="secondary" disabled={locked} onClick={insertTable}>
          <Table size={16} /> Sisipkan tabel {table.rows}×{table.cols}
        </Button>
        <p className="mt-2 text-[11px] text-ink-400">
          Klik dua kali sel di kanvas untuk mengetik isinya.
        </p>
      </div>
    </div>
  )
}
