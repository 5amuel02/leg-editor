import { useRef, useState } from 'react'
import { Loader2, Plus, Trash2, Type, Upload } from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { TEXT_PRESETS } from '../../../lib/constants'
import { createTextbox } from '../../../lib/fabricUtils'
import { ACCEPTED_FONT_EXT, addFontFile, removeFont } from '../../../lib/fonts'
import { useCustomFonts } from '../../../hooks/useCustomFonts'
import { useToast } from '../../ui/Toast'
import Button from '../../ui/Button'
import IconButton from '../../ui/IconButton'
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

      <CustomFontsSection />

      <p className="text-[11px] text-ink-400">
        Setelah ditambahkan, klik dua kali teks di kanvas untuk mengetik. Font, ukuran, warna,
        tebal/miring, dan perataan bisa diatur di panel properti sebelah kanan.
      </p>
    </div>
  )
}

/**
 * Pengelola font kustom.
 *
 * Berkas font dibaca dari komputer pengguna dan disimpan lokal — tidak ada
 * font yang diunduh dari internet, sesuai janji offline aplikasi ini.
 */
function CustomFontsSection() {
  const { fonts } = useCustomFonts()
  const toast = useToast()
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)

  const handleFiles = async (files) => {
    const list = Array.from(files || [])
    if (list.length === 0) return

    setBusy(true)
    let added = 0
    for (const file of list) {
      try {
        await addFontFile(file)
        added += 1
      } catch (err) {
        toast.error(err.message)
      }
    }
    setBusy(false)
    if (added > 0) toast.success(`${added} font ditambahkan. Pilih di panel properti teks.`)
  }

  const handleDelete = async (font) => {
    await removeFont(font.id)
    toast.success(`Font "${font.family}" dihapus dari daftar.`)
  }

  return (
    <div>
      <SectionTitle>Font kustom</SectionTitle>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FONT_EXT.join(',')}
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <Button
        variant="secondary"
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {busy ? 'Memuat font...' : 'Tambahkan berkas font'}
      </Button>

      {fonts.length > 0 && (
        <ul className="mt-2 space-y-1">
          {fonts.map((font) => (
            <li
              key={font.id}
              className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5"
            >
              <span
                className="min-w-0 flex-1 truncate text-sm text-ink-800"
                style={{ fontFamily: font.family }}
                title={font.name}
              >
                {font.family}
              </span>
              <IconButton size="sm" label={`Hapus ${font.family}`} danger onClick={() => handleDelete(font)}>
                <Trash2 size={13} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        Format {ACCEPTED_FONT_EXT.join(', ')}. Font tersimpan di browser ini saja — pastikan kamu
        punya hak pakai atas berkas fontnya.
      </p>
    </div>
  )
}
