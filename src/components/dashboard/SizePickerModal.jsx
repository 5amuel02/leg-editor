import { useEffect, useState } from 'react'
import { RectangleHorizontal, RectangleVertical, Square } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { CANVAS_PRESETS } from '../../lib/constants'
import { TEMPLATES } from '../../lib/templates'

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
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)

  // Reset form setiap kali modal dibuka supaya tidak membawa state lama.
  useEffect(() => {
    if (!open) return
    setMode('preset')
    setPresetId(initialPresetId || 'ig-post')
    setName('')
    setCustom({ width: 1080, height: 1080 })
    setTemplateId(TEMPLATES[0].id)
  }, [open, initialPresetId])

  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]

  // Template membawa ukuran bawaannya sendiri supaya tata letaknya proporsional.
  const effectivePresetId = mode === 'template' ? template.presetId : presetId
  const preset =
    CANVAS_PRESETS.find((p) => p.id === effectivePresetId) || CANVAS_PRESETS[0]

  const width = mode === 'custom' ? Number(custom.width) : preset.width
  const height = mode === 'custom' ? Number(custom.height) : preset.height

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
      presetId: mode === 'custom' ? 'custom' : preset.id,
      label: mode === 'custom' ? `Custom ${width}×${height}` : preset.label,
      name: name.trim() || (mode === 'template' ? template.label : undefined),
      templateId: mode === 'template' ? template.id : undefined,
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
          { id: 'template', label: 'Template' },
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

      {mode === 'preset' && (
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
      )}

      {mode === 'template' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const selected = t.id === templateId
            const tPreset = CANVAS_PRESETS.find((p) => p.id === t.presetId)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={`flex gap-3 rounded-xl border p-3 text-left transition ${
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >
                <TemplateThumb template={t} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-800">{t.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-ink-500">{t.description}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{tPreset?.sub}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {mode === 'custom' && (
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
        {mode === 'template' && (
          <>
            {' · template '}
            <span className="font-semibold text-ink-700">{template.label}</span>
          </>
        )}
      </div>
    </Modal>
  )
}

/**
 * Pratinjau template.
 *
 * Digambar ulang memakai div berposisi absolut dari deskriptor yang sama
 * dengan yang dipakai untuk membangun halaman sungguhan — jadi tidak ada
 * berkas gambar pratinjau yang harus ikut dibundel dan tidak ada risiko
 * pratinjau melenceng dari hasil aslinya.
 */
function TemplateThumb({ template }) {
  const preset = CANVAS_PRESETS.find((p) => p.id === template.presetId)
  const ratio = preset ? preset.width / preset.height : 1

  return (
    <div
      aria-hidden
      className="relative h-16 shrink-0 overflow-hidden rounded-md border border-ink-200"
      style={{ width: `${64 * ratio}px`, background: template.background }}
    >
      {template.elements.map((el, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${el.x * 100}%`,
            top: `${el.y * 100}%`,
            width: `${el.w * 100}%`,
            // Teks diwakili batang tipis: pada ukuran sekecil ini huruf
            // aslinya tidak akan terbaca, tapi ritme tata letaknya terbaca.
            height: el.kind === 'rect' ? `${el.h * 100}%` : `${Math.max(2, el.size * 90)}%`,
            background: el.fill,
            borderRadius: el.kind === 'rect' && el.rx ? '2px' : '1px',
            opacity: el.kind === 'rect' ? 1 : 0.85,
          }}
        />
      ))}
    </div>
  )
}
