import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Lock,
  MoveLeft,
  MoveRight,
  Plus,
  Trash2,
  Unlock,
} from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import IconButton from '../ui/IconButton'
import Button from '../ui/Button'

/**
 * Panel navigasi halaman di bawah kanvas (mirip Canva):
 * thumbnail tiap halaman, indikator "Halaman 2/4", tombol pindah
 * halaman, serta aksi tambah / duplikat / hapus / sembunyi / kunci
 * dan pengurutan (geser kiri-kanan).
 */
export default function PageNavigator() {
  const {
    pages,
    activeIndex,
    goToPage,
    addPage,
    duplicatePageAt,
    deletePageAt,
    movePage,
    updatePage,
    size,
  } = useEditor()

  const [expanded, setExpanded] = useState(true)
  const total = pages.length
  const ratio = size.width / size.height

  return (
    <div className="z-20 shrink-0 border-t border-ink-200 bg-white">
      {/* Baris kontrol */}
      <div className="flex h-11 items-center gap-2 px-3">
        <IconButton
          label="Halaman sebelumnya"
          size="sm"
          disabled={activeIndex === 0}
          onClick={() => goToPage(activeIndex - 1)}
        >
          <ChevronLeft size={17} />
        </IconButton>

        <span className="min-w-24 text-center text-xs font-semibold text-ink-700">
          Halaman {activeIndex + 1}/{total}
        </span>

        <IconButton
          label="Halaman berikutnya"
          size="sm"
          disabled={activeIndex >= total - 1}
          onClick={() => goToPage(activeIndex + 1)}
        >
          <ChevronRight size={17} />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-ink-200" />

        {/* Aksi untuk halaman aktif */}
        <IconButton
          label="Geser halaman ke kiri"
          size="sm"
          disabled={activeIndex === 0}
          onClick={() => movePage(activeIndex, -1)}
        >
          <MoveLeft size={16} />
        </IconButton>
        <IconButton
          label="Geser halaman ke kanan"
          size="sm"
          disabled={activeIndex >= total - 1}
          onClick={() => movePage(activeIndex, 1)}
        >
          <MoveRight size={16} />
        </IconButton>
        <IconButton label="Duplikat halaman" size="sm" onClick={() => duplicatePageAt(activeIndex)}>
          <Copy size={15} />
        </IconButton>
        <IconButton
          label={pages[activeIndex]?.hidden ? 'Tampilkan halaman' : 'Sembunyikan halaman'}
          size="sm"
          active={pages[activeIndex]?.hidden}
          onClick={() => updatePage(activeIndex, { hidden: !pages[activeIndex].hidden })}
        >
          {pages[activeIndex]?.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </IconButton>
        <IconButton
          label={pages[activeIndex]?.locked ? 'Buka kunci halaman' : 'Kunci halaman'}
          size="sm"
          active={pages[activeIndex]?.locked}
          onClick={() => updatePage(activeIndex, { locked: !pages[activeIndex].locked })}
        >
          {pages[activeIndex]?.locked ? <Lock size={15} /> : <Unlock size={15} />}
        </IconButton>
        <IconButton
          label="Hapus halaman"
          size="sm"
          danger
          disabled={total <= 1}
          onClick={() => deletePageAt(activeIndex)}
        >
          <Trash2 size={15} />
        </IconButton>

        <Button size="sm" variant="secondary" className="ml-2" onClick={() => addPage(activeIndex)}>
          <Plus size={15} /> Halaman baru
        </Button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto text-[11px] font-medium text-ink-400 hover:text-ink-600"
        >
          {expanded ? 'Sembunyikan thumbnail' : 'Tampilkan thumbnail'}
        </button>
      </div>

      {/* Strip thumbnail */}
      {expanded && (
        <div className="flex items-center gap-2 overflow-x-auto border-t border-ink-100 bg-ink-50/60 px-3 py-2.5">
          {pages.map((page, i) => {
            const active = i === activeIndex
            return (
              <div key={page.id} className="group relative shrink-0">
                <button
                  type="button"
                  onClick={() => goToPage(i)}
                  title={page.name}
                  className={`relative block overflow-hidden rounded-lg border-2 bg-white transition ${
                    active
                      ? 'border-brand-500 shadow-md'
                      : 'border-ink-200 hover:border-ink-300 hover:shadow'
                  } ${page.hidden ? 'opacity-45' : ''}`}
                  style={{
                    width: ratio >= 1 ? 92 : 92 * ratio,
                    height: ratio >= 1 ? 92 / ratio : 92,
                  }}
                >
                  {page.thumbnail ? (
                    <img
                      src={page.thumbnail}
                      alt={page.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span
                      className="block h-full w-full"
                      style={{ background: page.background || '#ffffff' }}
                    />
                  )}

                  {/* Badge status halaman */}
                  <span className="absolute left-1 top-1 flex gap-0.5">
                    {page.hidden && (
                      <span className="rounded bg-ink-700/85 p-0.5 text-white">
                        <EyeOff size={10} />
                      </span>
                    )}
                    {page.locked && (
                      <span className="rounded bg-amber-500/90 p-0.5 text-white">
                        <Lock size={10} />
                      </span>
                    )}
                  </span>
                </button>

                <p
                  className={`mt-1 max-w-[92px] truncate text-center text-[10px] ${
                    active ? 'font-semibold text-brand-700' : 'text-ink-500'
                  }`}
                >
                  {i + 1}. {page.name}
                </p>

                {/* Tombol reorder cepat saat hover */}
                <div className="absolute -top-1 right-0 hidden gap-0.5 rounded-md bg-white/95 p-0.5 shadow ring-1 ring-ink-200 group-hover:flex">
                  <button
                    type="button"
                    aria-label="Geser ke kiri"
                    disabled={i === 0}
                    onClick={() => movePage(i, -1)}
                    className="rounded p-0.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="Geser ke kanan"
                    disabled={i === total - 1}
                    onClick={() => movePage(i, 1)}
                    className="rounded p-0.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                  >
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Tombol tambah halaman di ujung strip */}
          <button
            type="button"
            onClick={() => addPage(null)}
            title="Tambah halaman di akhir"
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-ink-300 bg-white text-ink-400 transition hover:border-brand-400 hover:text-brand-600"
            style={{ width: ratio >= 1 ? 92 : 92 * ratio, height: ratio >= 1 ? 92 / ratio : 92 }}
          >
            <Plus size={18} />
            <span className="text-[10px] font-medium">Tambah</span>
          </button>
        </div>
      )}
    </div>
  )
}
