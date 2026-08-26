import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  Check,
  Cloud,
  Download,
  FileDown,
  FileJson,
  Loader2,
  Magnet,
  Maximize,
  Minus,
  Plus,
  Redo2,
  Save,
  Undo2,
  Upload,
} from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Popover from './Popover'
import { MAX_ZOOM, MIN_ZOOM } from '../../lib/constants'

/**
 * Toolbar atas: kembali ke dashboard, nama project, undo/redo,
 * kontrol zoom (slider persentase), ekspor PNG/PDF, dan simpan project.
 */
export default function TopBar({ onBack, onExportPNG, onExportAllPNG, onExportPDF, onSaveFile, onLoadFile, onSave, busy }) {
  const {
    project,
    setProject,
    zoom,
    setZoom,
    undo,
    redo,
    canUndo,
    canRedo,
    saving,
    lastSavedAt,
    pages,
    activeIndex,
    snapEnabled,
    setSnapEnabled,
  } = useEditor()

  const [name, setName] = useState(project.name)
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => setName(project.name), [project.name])

  // Kedipan indikator "tersimpan" setiap kali auto-save selesai.
  useEffect(() => {
    if (!lastSavedAt) return
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 1800)
    return () => clearTimeout(t)
  }, [lastSavedAt])

  const commitName = () => {
    const next = name.trim() || 'Tanpa Judul'
    setName(next)
    if (next !== project.name) setProject((p) => ({ ...p, name: next }))
  }

  const percent = Math.round(zoom * 100)

  return (
    <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-ink-200 bg-white px-3 shadow-sm">
      <IconButton label="Kembali ke dashboard" onClick={onBack}>
        <ChevronLeft size={20} />
      </IconButton>

      {/* Nama project (bisa diedit langsung) */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-9 w-48 rounded-lg border border-transparent px-2 text-sm font-semibold text-ink-800 outline-none transition hover:border-ink-200 focus:border-brand-400 focus:bg-white"
      />

      <span className="hidden text-[11px] text-ink-400 sm:inline">
        {project.size.width} × {project.size.height} px
      </span>

      <span className="mx-1 h-6 w-px bg-ink-200" />

      <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
        <Undo2 size={18} />
      </IconButton>
      <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
        <Redo2 size={18} />
      </IconButton>

      {/* ---------------- Zoom ---------------- */}
      <div className="ml-2 flex items-center gap-1.5 rounded-lg bg-ink-50 px-2 py-1">
        <IconButton label="Perkecil" size="sm" onClick={() => setZoom(zoom / 1.15)}>
          <Minus size={15} />
        </IconButton>
        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          value={percent}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="h-1.5 w-24 cursor-pointer appearance-none rounded-full bg-ink-200"
          aria-label="Level zoom"
        />
        <IconButton label="Perbesar" size="sm" onClick={() => setZoom(zoom * 1.15)}>
          <Plus size={15} />
        </IconButton>
        <span className="w-11 text-center font-mono text-[11px] text-ink-500">{percent}%</span>
        <IconButton
          label="Sesuaikan layar (Ctrl+0)"
          size="sm"
          onClick={() => window.dispatchEvent(new CustomEvent('leg:fit-zoom'))}
        >
          <Maximize size={14} />
        </IconButton>
      </div>

      {/* Saklar smart guides; tahan Ctrl/Cmd untuk mematikannya sesaat */}
      <IconButton
        label={
          snapEnabled
            ? 'Smart guides aktif — tahan Ctrl/Cmd saat menggeser untuk mematikan sementara'
            : 'Smart guides nonaktif'
        }
        active={snapEnabled}
        onClick={() => setSnapEnabled((v) => !v)}
      >
        <Magnet size={17} />
      </IconButton>

      {/* ---------------- Status simpan ---------------- */}
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-[11px] text-ink-400 md:flex">
          {saving ? (
            <>
              <Loader2 size={13} className="animate-spin" /> Menyimpan…
            </>
          ) : savedFlash ? (
            <>
              <Check size={13} className="text-emerald-500" /> Tersimpan
            </>
          ) : (
            <>
              <Cloud size={13} /> Auto-save aktif
            </>
          )}
        </span>

        {/* ---------------- Ekspor ---------------- */}
        <Popover
          align="right"
          width="w-72"
          trigger={(toggle, open) => (
            <Button variant="secondary" size="sm" onClick={toggle} active={open} disabled={busy}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Ekspor
            </Button>
          )}
        >
          {(close) => (
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
                  PNG — halaman ini ({activeIndex + 1}/{pages.length})
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        close()
                        onExportPNG(m)
                      }}
                      className="rounded-lg border border-ink-200 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
                    >
                      {m}x
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-ink-400">
                  2x/3x menghasilkan resolusi tinggi ({project.size.width * 2}×{project.size.height * 2} px pada 2x).
                </p>
              </div>

              <div className="h-px bg-ink-100" />

              <button
                type="button"
                onClick={() => {
                  close()
                  onExportAllPNG(2)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-ink-50"
              >
                <FileDown size={15} /> Semua halaman sebagai PNG (2x)
              </button>

              <button
                type="button"
                onClick={() => {
                  close()
                  onExportPDF()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-ink-50"
              >
                <FileDown size={15} /> PDF multi-halaman ({pages.filter((p) => !p.hidden).length} halaman)
              </button>
            </div>
          )}
        </Popover>

        {/* ---------------- Simpan / muat project ---------------- */}
        <Popover
          align="right"
          width="w-64"
          trigger={(toggle, open) => (
            <Button size="sm" onClick={toggle} active={open}>
              <Save size={15} /> Simpan
            </Button>
          )}
        >
          {(close) => (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  close()
                  onSave()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-ink-50"
              >
                <Cloud size={15} /> Simpan ke browser (Ctrl+S)
              </button>
              <button
                type="button"
                onClick={() => {
                  close()
                  onSaveFile()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-ink-50"
              >
                <FileJson size={15} /> Unduh sebagai berkas .json
              </button>
              <button
                type="button"
                onClick={() => {
                  close()
                  onLoadFile()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-ink-50"
              >
                <Upload size={15} /> Muat project dari berkas
              </button>
            </div>
          )}
        </Popover>
      </div>
    </header>
  )
}
