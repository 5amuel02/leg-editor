import { Plus, Type } from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { TEXT_PRESETS } from '../../../lib/constants'
import { createTextbox } from '../../../lib/fabricUtils'
import Button from '../../ui/Button'
import { SectionTitle } from '../../ui/Field'

/**
 * Tab "Teks": tombol kotak teks polos + preset judul/subjudul/isi.
 * Ukuran font preset diskalakan terhadap lebar kanvas supaya tetap
 * proporsional pada kanvas kecil maupun besar (mis. A4 300dpi).
 */
export default function TextPanel() {
  const { addObject, size, activePage } = useEditor()
  const locked = !!activePage?.locked

  // Faktor skala berbasis lebar kanvas 1080 px sebagai acuan.
  const scale = Math.max(0.4, size.width / 1080)

  const addText = (style) => {
    if (locked) return
    const box = createTextbox(
      { ...style, fontSize: Math.round((style.fontSize || 48) * scale) },
      size.width,
    )
    addObject(box)
  }

  return (
    <div className="space-y-5">
      {locked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman ini terkunci, teks tidak bisa ditambahkan.
        </p>
      )}

      <Button
        className="w-full"
        disabled={locked}
        onClick={() => addText({ text: 'Ketik teks di sini', fontSize: 48 })}
      >
        <Plus size={16} /> Tambahkan kotak teks
      </Button>

      <div>
        <SectionTitle>Preset siap pakai</SectionTitle>
        <div className="space-y-2">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              disabled={locked}
              onClick={() => addText(preset.style)}
              className="flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white px-3 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-40"
            >
              <Type size={16} className="shrink-0 text-ink-400" />
              <div className="min-w-0">
                <p className={`truncate text-ink-800 ${preset.previewClass}`}>{preset.preview}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{preset.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-ink-400">
        Setelah ditambahkan, klik dua kali teks di kanvas untuk mengetik. Font, ukuran, warna,
        tebal/miring, dan perataan bisa diatur di panel properti sebelah kanan.
      </p>
    </div>
  )
}
