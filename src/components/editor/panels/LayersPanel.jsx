import { useMemo } from 'react'
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Frame,
  Lock,
  MessageCircle,
  Minus,
  MoveRight,
  Signature,
  Shapes,
  Table,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react'
import { useEditor } from '../../../context/EditorContext'
import { getLegName, getLegType } from '../../../lib/fabricUtils'
import IconButton from '../../ui/IconButton'

const TYPE_ICONS = {
  text: Type,
  image: ImageIcon,
  shape: Shapes,
  line: Minus,
  arrow: MoveRight,
  draw: Signature,
  table: Table,
  bubble: MessageCircle,
  frame: Frame,
}

/**
 * Tab "Layer": daftar seluruh elemen pada halaman aktif.
 * Urutan tampil dibalik (paling atas = paling depan di kanvas),
 * sama seperti panel layer pada aplikasi desain umumnya.
 */
export default function LayersPanel() {
  const {
    canvasRef,
    objectsVersion,
    selection,
    selectObject,
    toggleObjectLock,
    toggleObjectVisibility,
    removeObject,
    duplicateObject,
    moveObjectToIndex,
    orderSelected,
    activePage,
  } = useEditor()

  const canvas = canvasRef.current

  /** Daftar layer: index asli disimpan agar operasi reorder tetap akurat. */
  const layers = useMemo(() => {
    if (!canvas) return []
    return canvas
      .getObjects()
      .map((obj, index) => ({ obj, index }))
      .reverse()
    // objectsVersion dipakai sebagai pemicu perhitungan ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, objectsVersion])

  const selectedIds = new Set(selection.map((o) => o.id))
  const total = layers.length
  const pageLocked = !!activePage?.locked

  if (total === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-300 py-12 text-center">
        <Layers size={28} className="text-ink-300" />
        <p className="mt-2 text-xs font-medium text-ink-500">Halaman masih kosong</p>
        <p className="mt-0.5 px-6 text-[11px] text-ink-400">
          Tambahkan bentuk, teks, atau gambar — semuanya akan tampil di sini.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {pageLocked && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Halaman terkunci — elemen tidak bisa dipilih atau diubah.
        </p>
      )}

      {/* Aksi cepat untuk elemen terpilih */}
      <div className="flex items-center gap-1 rounded-lg bg-ink-50 p-1">
        <IconButton
          size="sm"
          label="Bawa ke paling depan"
          disabled={selection.length === 0}
          onClick={() => orderSelected('front')}
        >
          <ArrowUpToLine size={15} />
        </IconButton>
        <IconButton
          size="sm"
          label="Kirim ke paling belakang"
          disabled={selection.length === 0}
          onClick={() => orderSelected('back')}
        >
          <ArrowDownToLine size={15} />
        </IconButton>
        <span className="ml-auto pr-2 text-[11px] text-ink-400">{total} elemen</span>
      </div>

      <ul className="space-y-1">
        {layers.map(({ obj, index }, displayIndex) => {
          const type = getLegType(obj)
          const Icon = TYPE_ICONS[type] || Shapes
          const selected = selectedIds.has(obj.id)
          const hidden = obj.visible === false
          const locked = !!obj.legLocked

          return (
            <li
              key={obj.id || index}
              className={`group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition ${
                selected
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-transparent hover:border-ink-200 hover:bg-ink-50'
              }`}
            >
              {/* Pratinjau + nama (klik untuk memilih) */}
              <button
                type="button"
                onClick={() => selectObject(obj)}
                disabled={locked || pageLocked || hidden}
                className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed"
                title={getLegName(obj)}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    selected ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  <Icon size={14} />
                </span>
                <span
                  className={`truncate text-xs ${
                    hidden ? 'text-ink-300 line-through' : selected ? 'font-semibold text-brand-800' : 'text-ink-700'
                  }`}
                >
                  {getLegName(obj)}
                </span>
              </button>

              {/* Aksi tambahan hanya muncul saat hover, sehingga nama elemen
                  tetap punya ruang lebar saat panel dalam keadaan diam. */}
              <div className="hidden group-hover:flex">
                <IconButton
                  size="sm"
                  label="Naikkan satu tingkat"
                  disabled={displayIndex === 0}
                  onClick={() => moveObjectToIndex(obj, Math.min(total - 1, index + 1))}
                >
                  <ChevronUp size={14} />
                </IconButton>
                <IconButton
                  size="sm"
                  label="Turunkan satu tingkat"
                  disabled={displayIndex === total - 1}
                  onClick={() => moveObjectToIndex(obj, Math.max(0, index - 1))}
                >
                  <ChevronDown size={14} />
                </IconButton>
                <IconButton size="sm" label="Duplikat" onClick={() => duplicateObject(obj)}>
                  <Copy size={13} />
                </IconButton>
                <IconButton size="sm" label="Hapus" danger onClick={() => removeObject(obj)}>
                  <Trash2 size={13} />
                </IconButton>
              </div>

              {/* Sembunyi & kunci selalu terlihat */}
              <IconButton
                size="sm"
                label={hidden ? 'Tampilkan' : 'Sembunyikan'}
                active={hidden}
                onClick={() => toggleObjectVisibility(obj)}
              >
                {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </IconButton>
              <IconButton
                size="sm"
                label={locked ? 'Buka kunci' : 'Kunci'}
                active={locked}
                onClick={() => toggleObjectLock(obj)}
              >
                {locked ? <Lock size={14} /> : <Unlock size={14} />}
              </IconButton>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
