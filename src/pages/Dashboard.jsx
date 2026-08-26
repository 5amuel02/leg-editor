import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FolderOpen, LayoutGrid, Plus, Search, Upload, X } from 'lucide-react'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useToast } from '../components/ui/Toast'
import ProjectCard from '../components/dashboard/ProjectCard'
import SizePickerModal from '../components/dashboard/SizePickerModal'
import { CANVAS_PRESETS, DESIGN_SHORTCUTS } from '../lib/constants'
import { createProject, normalizeImportedProject, uid } from '../lib/project'
import { buildTemplatePage, findTemplate } from '../lib/templates'
import { deleteProject, listProjects, saveProject } from '../lib/db'
import { readProjectFile } from '../lib/exporters'

/**
 * Halaman beranda: tombol buat desain baru, shortcut jenis desain,
 * pencarian, dan daftar project tersimpan (dari IndexedDB).
 */
export default function Dashboard({ onOpenProject }) {
  const toast = useToast()
  const fileRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sizePicker, setSizePicker] = useState({ open: false, presetId: null })
  const [renaming, setRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await listProjects())
    } catch (err) {
      // `openDB` memberi pesan spesifik untuk kasus yang bisa ditindaklanjuti
      // pengguna (mis. penyimpanan terkunci tab lain) — tampilkan apa adanya.
      toast.error(err?.message || 'Gagal membaca penyimpanan lokal (IndexedDB).')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Filter berdasarkan nama project & label ukuran. */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.size?.label || '').toLowerCase().includes(q) ||
        `${p.size?.width}x${p.size?.height}`.includes(q.replace(/\s|×/g, '')),
    )
  }, [projects, query])

  /** Membuat project baru lalu langsung membuka editor. */
  const handleCreate = async (config) => {
    const project = createProject(config)

    // Template mengganti halaman kosong bawaan dengan halaman berisi.
    const template = config.templateId ? findTemplate(config.templateId) : null
    if (template) {
      try {
        project.pages = [buildTemplatePage(template, project.size)]
      } catch {
        // Template gagal dirakit bukan alasan untuk membatalkan project —
        // pengguna tetap mendapat kanvas kosong yang bisa dipakai.
        toast.error('Template gagal dimuat, project dibuat kosong.')
      }
    }

    await saveProject(project)
    setSizePicker({ open: false, presetId: null })
    onOpenProject(project.id)
  }

  const handleDuplicate = async (project) => {
    const copy = {
      ...JSON.parse(JSON.stringify(project)),
      id: uid('proj'),
      name: `${project.name} (salinan)`,
      createdAt: Date.now(),
    }
    await saveProject(copy)
    await refresh()
    toast.success('Project diduplikasi.')
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteProject(confirmDelete.id)
    setConfirmDelete(null)
    await refresh()
    toast.success('Project dihapus.')
  }

  const handleRename = async () => {
    const name = renameValue.trim()
    if (!renaming || !name) return
    await saveProject({ ...renaming, name })
    setRenaming(null)
    await refresh()
  }

  /** Impor project dari berkas .json yang pernah diunduh. */
  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const raw = await readProjectFile(file)
      const project = normalizeImportedProject(raw)
      project.id = uid('proj')
      await saveProject(project)
      await refresh()
      toast.success(`Project "${project.name}" berhasil dimuat.`)
      onOpenProject(project.id)
    } catch (err) {
      toast.error(err.message || 'Gagal mengimpor project.')
    }
  }

  return (
    <div className="min-h-full bg-ink-50">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            {/* Tanda dipakai sendiri, terpisah dari wordmark di berkas logo:
                logo aslinya bersusun ke bawah, dan di header setinggi 36px
                wordmark bawaannya akan mengecil sampai tidak terbaca. */}
            <img src="/logo-mark.png" alt="" aria-hidden className="h-9 w-auto shrink-0" />
            <div className="leading-tight">
              <p className="brand-wordmark text-[19px] text-ink-900">Legza</p>
              <p className="text-[11px] text-ink-400">Editor desain lokal</p>
            </div>
          </div>

          {/* Search bar project tersimpan */}
          <div className="relative ml-auto w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari project tersimpan…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-white pl-9 pr-9 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="shrink-0">
            <Upload size={16} /> Buka File
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* ---------------- Hero + tombol utama ---------------- */}
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-700 px-6 py-8 text-white shadow-lg sm:px-10 sm:py-10">
          {/* Watermark tanda Legza. Logo aslinya merah, jadi tidak akan terlihat
              di atas latar merah — `brightness(0) invert(1)` memutihkannya
              sambil mempertahankan alpha, tanpa perlu berkas aset kedua. */}
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-8 h-56 w-auto select-none opacity-[0.14] [filter:brightness(0)_invert(1)] sm:-right-2 sm:h-64"
          />

          <h1 className="relative text-2xl font-bold sm:text-3xl">
            Apa yang mau kamu desain hari ini?
          </h1>
          <p className="relative mt-1.5 max-w-xl text-sm text-brand-100">
            Semua project tersimpan di browser komputermu — tanpa server, tanpa internet.
          </p>
          <Button
            size="lg"
            variant="light"
            onClick={() => setSizePicker({ open: true, presetId: null })}
            className="relative mt-5"
          >
            <Plus size={18} /> Buat Desain Baru
          </Button>
        </section>

        {/* ---------------- Shortcut jenis desain ---------------- */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-bold text-ink-700">Mulai dari ukuran populer</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {DESIGN_SHORTCUTS.map((s) => {
              const preset = CANVAS_PRESETS.find((p) => p.id === s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSizePicker({ open: true, presetId: s.id })}
                  className="group flex flex-col items-center gap-2"
                >
                  {/* Kotak berukuran tetap supaya semua kartu sejajar, sementara
                      bentuk di dalamnya tetap mengikuti rasio aslinya. */}
                  <div className="flex h-24 w-full items-center justify-center">
                    <div
                      className={`h-full ${s.ratio} max-w-full rounded-xl bg-gradient-to-br ${s.gradient} shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-ink-700">{s.label}</p>
                    <p className="text-[10px] text-ink-400">
                      {preset ? `${preset.width}×${preset.height}` : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ---------------- Daftar project ---------------- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink-700">
              <LayoutGrid size={16} />
              {query ? `Hasil pencarian (${filtered.length})` : 'Project terbaru'}
            </h2>
            {projects.length > 0 && (
              <span className="text-xs text-ink-400">{projects.length} project tersimpan</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-ink-200" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
              <FolderOpen size={36} className="text-ink-300" />
              <p className="mt-3 text-sm font-semibold text-ink-600">
                {query ? 'Tidak ada project yang cocok' : 'Belum ada project'}
              </p>
              <p className="mt-1 max-w-xs text-xs text-ink-400">
                {query
                  ? 'Coba kata kunci lain, atau buat desain baru.'
                  : 'Klik "Buat Desain Baru" untuk memulai desain pertamamu.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={onOpenProject}
                  onRename={(proj) => {
                    setRenaming(proj)
                    setRenameValue(proj.name)
                  }}
                  onDuplicate={handleDuplicate}
                  onDelete={setConfirmDelete}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------------- Modal-modal ---------------- */}
      <SizePickerModal
        open={sizePicker.open}
        initialPresetId={sizePicker.presetId}
        onClose={() => setSizePicker({ open: false, presetId: null })}
        onConfirm={handleCreate}
      />

      <Modal
        open={!!renaming}
        onClose={() => setRenaming(null)}
        title="Ganti nama project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenaming(null)}>
              Batal
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Simpan
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          className="h-10 w-full rounded-lg border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
        />
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Hapus project?"
        description={`"${confirmDelete?.name}" akan dihapus permanen dari penyimpanan browser.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          Tindakan ini tidak bisa dibatalkan. Kalau project masih dibutuhkan, buka dulu lalu ekspor
          sebagai berkas JSON.
        </p>
      </Modal>
    </div>
  )
}
