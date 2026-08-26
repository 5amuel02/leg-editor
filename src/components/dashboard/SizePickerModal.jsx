import { useEffect, useState } from 'react'
import { RectangleHorizontal, RectangleVertical, Square } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CANVAS_PRESETS } from '../../lib/constants'

const ICONS = {
  square: Square,
  landscape: RectangleHorizontal,
  portrait: RectangleVertical,
}

const MIN_SIDE = 32
const MAX_SIDE = 8000

/**
 * Layar "pilih ukuran/rasio kanvas" yang tampil setelah menekan
 * "Buat Desain Baru". Menyediakan preset umum + input custom.
 *
 * onConfirm({ width, height, presetId, label, name })
 */
export default function SizePickerModal({ open, onClose, onConfirm, initialPresetId }) {
  const [mode, setMode] = useState('preset')
  const [presetId, setPresetId] = useState(initialPresetId || 'ig-post')
  const [name, setName] = useState('')
  const [custom, setCustom] = useState({ width: 1080, height: 1080 })

  // Reset form setiap kali modal dibuka supaya tidak membawa state lama.
  useEffect(() => {
    if (!open) return
    setMode('preset')
    setPresetId(initialPresetId || 'ig-post')
    setName('')
    setCustom({ width: 1080, height: 1080 })
  }, [open, initialPresetId])

  const preset = CANVAS_PRESETS.find((p) => p.id === presetId) || CANVAS_PRESETS[0]

  const width = mode === 'preset' ? preset.width : Number(custom.width)
  const height = mode === 'preset' ? preset.height : Number(custom.height)

  const valid =
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width >= MIN_SIDE &&
    height >= MIN_SIDE &&
    width <= MAX_SIDE &&
    height <= MAX_SIDE

  const submit = () => {
    if (!valid) return
    onConfirm({
      width,
      height,
      presetId: mode === 'preset' ? preset.id : 'custom',
      label: mode === 'preset' ? preset.label : `Custom ${width}×${height}`,
      name: name.trim() || undefined,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pilih ukuran kanvas"
      description="Semua halaman dalam project akan memakai ukuran ini."
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} disabled={!valid}>
            Buat Desain
          </Button>
        </>
      }
    >
      {/* Tab preset vs custom */}
      <div className="mb-4 inline-flex rounded-xl bg-ink-100 p-1">
        {[
          { id: 'preset', label: 'Preset' },
          { id: 'custom', label: 'Ukuran Custom' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`h-8 rounded-lg px-4 text-sm font-medium transition ${
              mode === t.id ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === 'preset' ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CANVAS_PRESETS.map((p) => {
            const Icon = ICONS[p.icon] || Square
            const selected = p.id === presetId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition ${
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <Icon size={26} className={selected ? 'text-brand-600' : 'text-ink-400'} />
                <div>
                  <p className="text-sm font-semibold text-ink-800">{p.label}</p>
                  <p className="text-xs text-ink-500">{p.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {['width', 'height'].map((key) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-medium text-ink-500">
                  {key === 'width' ? 'Lebar (px)' : 'Tinggi (px)'}
                </span>
                <input
                  type="number"
                  min={MIN_SIDE}
                  max={MAX_SIDE}
                  value={custom[key]}
                  onChange={(e) => setCustom((c) => ({ ...c, [key]: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-400">
            Rentang yang didukung: {MIN_SIDE}–{MAX_SIDE} px per sisi.
          </p>
        </div>
      )}

      <label className="mt-5 block">
        <span className="mb-1 block text-xs font-medium text-ink-500">Nama project (opsional)</span>
        <input
          type="text"
          value={name}
          placeholder="mis. Poster Promo Agustus"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </label>

      <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
        Ukuran terpilih:{' '}
        <span className="font-semibold text-ink-700">
          {valid ? `${width} × ${height} px` : 'tidak valid'}
        </span>
      </div>
    </Modal>
  )
}
