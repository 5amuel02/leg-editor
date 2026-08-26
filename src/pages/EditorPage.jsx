import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { EditorProvider, useEditor } from '../context/EditorContext'
import { getProject, saveProject } from '../lib/db'
import { normalizeImportedProject } from '../lib/project'
import {
  downloadProjectJSON,
  exportAllPagesPNG,
  exportPagePNG,
  exportProjectPDF,
  readProjectFile,
} from '../lib/exporters'
import { useToast } from '../components/ui/Toast'
import useShortcuts from '../hooks/useShortcuts'
import useClipboardPaste from '../hooks/useClipboardPaste'
import TopBar from '../components/editor/TopBar'
import LeftSidebar from '../components/editor/LeftSidebar'
import CanvasStage from '../components/editor/CanvasStage'
import PropertiesPanel from '../components/editor/PropertiesPanel'
import PageNavigator from '../components/editor/PageNavigator'
import CropModal from '../components/editor/CropModal'
import Button from '../components/ui/Button'

/**
 * Pembungkus halaman editor: memuat project dari IndexedDB lebih dulu,
 * baru kemudian memasang <EditorProvider> dengan data yang sudah siap.
 * Ini penting karena ukuran kanvas harus diketahui sebelum Fabric dibuat.
 */
export default function EditorPage({ projectId, onBack }) {
  const toast = useToast()
  const [project, setProject] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const found = await getProject(projectId)
        if (!alive) return
        if (!found) setError('Project tidak ditemukan di penyimpanan browser.')
        else setProject(found)
      } catch {
        if (alive) setError('Gagal membuka penyimpanan lokal.')
      }
    })()
    return () => {
      alive = false
    }
  }, [projectId])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-ink-600">{error}</p>
        <Button onClick={onBack}>Kembali ke dashboard</Button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-ink-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Membuka project…</span>
      </div>
    )
  }

  return (
    <EditorProvider initialProject={project}>
      <EditorShell onBack={onBack} toast={toast} />
    </EditorProvider>
  )
}

/** Isi editor sesungguhnya — sudah punya akses ke context. */
function EditorShell({ onBack, toast }) {
  const {
    project,
    persist,
    collectActivePage,
    updateSelected,
    activeIndex,
    loadPageIntoCanvas,
    setProject,
    pushHistory,
  } = useEditor()

  const [busy, setBusy] = useState(false)
  const [crop, setCrop] = useState({ open: false, target: null })
  const fileRef = useRef(null)

  /* ---------------------------------------------------------------- */
  /* Simpan                                                            */
  /* ---------------------------------------------------------------- */
  const handleSave = useCallback(async () => {
    try {
      await persist({ silent: false })
      toast.success('Project tersimpan di browser.')
    } catch {
      toast.error('Gagal menyimpan. Penyimpanan browser mungkin penuh.')
    }
  }, [persist, toast])

  useShortcuts({ onSave: handleSave })

  /* Ctrl/Cmd+V: tempel gambar dari clipboard sistem langsung ke kanvas. */
  const notify = useCallback(
    (message, type) => (type === 'error' ? toast.error(message) : toast.success(message)),
    [toast],
  )
  useClipboardPaste({ onNotify: notify })

  /* Simpan sekali lagi saat editor ditutup agar tidak ada perubahan hilang. */
  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        saveProject(collectActivePage())
      } catch {
        /* diabaikan saat halaman ditutup */
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      onBeforeUnload()
    }
  }, [collectActivePage])

  const handleBack = async () => {
    await persist({ silent: true }).catch(() => {})
    onBack()
  }

  /* ---------------------------------------------------------------- */
  /* Ekspor                                                            */
  /* ---------------------------------------------------------------- */
  const withBusy = async (label, fn) => {
    setBusy(true)
    try {
      const fresh = collectActivePage()
      await fn(fresh)
      toast.success(`${label} selesai.`)
    } catch (err) {
      toast.error(err.message || `${label} gagal.`)
    } finally {
      setBusy(false)
    }
  }

  const handleExportPNG = (multiplier) =>
    withBusy('Ekspor PNG', (p) => exportPagePNG(p, activeIndex, multiplier))

  const handleExportAllPNG = (multiplier) =>
    withBusy('Ekspor semua halaman', (p) => exportAllPagesPNG(p, multiplier))

  const handleExportPDF = (multiplier = 2) =>
    withBusy('Ekspor PDF', (p) => exportProjectPDF(p, { multiplier }))

  /* ---------------------------------------------------------------- */
  /* Simpan / muat berkas .json                                        */
  /* ---------------------------------------------------------------- */
  const handleSaveFile = async () => {
    const fresh = await persist({ silent: true })
    downloadProjectJSON(fresh)
    toast.success('Berkas project diunduh.')
  }

  const handleLoadFile = () => fileRef.current?.click()

  const handleFileChosen = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const raw = await readProjectFile(file)
      const imported = normalizeImportedProject(raw)

      if (
        imported.size.width !== project.size.width ||
        imported.size.height !== project.size.height
      ) {
        toast.error(
          `Ukuran kanvas berkas (${imported.size.width}×${imported.size.height}) berbeda dengan project ini. Muat lewat dashboard supaya ukurannya ikut terbawa.`,
        )
        return
      }

      // Ukuran sama: isi project saat ini diganti dengan isi berkas.
      const next = { ...imported, id: project.id }
      setProject(next)
      await saveProject(next)
      await loadPageIntoCanvas(0)
      toast.success(`Project "${imported.name}" dimuat.`)
    } catch (err) {
      toast.error(err.message || 'Gagal memuat berkas project.')
    }
  }

  /* ---------------------------------------------------------------- */
  /* Crop gambar                                                       */
  /* ---------------------------------------------------------------- */
  const handleApplyCrop = (values) => {
    const target = crop.target
    if (!target) return
    // Pusat objek dipertahankan agar gambar tidak "melompat" setelah crop.
    target.set(values)
    target.setCoords()
    target.canvas?.requestRenderAll()
    updateSelected({}, { record: true })
    pushHistory()
    setCrop({ open: false, target: null })
    toast.success('Crop diterapkan.')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-ink-100">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChosen}
      />

      <TopBar
        onBack={handleBack}
        onExportPNG={handleExportPNG}
        onExportAllPNG={handleExportAllPNG}
        onExportPDF={handleExportPDF}
        onSaveFile={handleSaveFile}
        onLoadFile={handleLoadFile}
        onSave={handleSave}
        busy={busy}
      />

      <div className="flex min-h-0 flex-1">
        <LeftSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <CanvasStage onRequestCrop={(target) => setCrop({ open: true, target })} />
          <PageNavigator />
        </div>

        <PropertiesPanel onRequestCrop={(target) => setCrop({ open: true, target })} />
      </div>

      <CropModal
        open={crop.open}
        target={crop.target}
        onClose={() => setCrop({ open: false, target: null })}
        onApply={handleApplyCrop}
      />
    </div>
  )
}
