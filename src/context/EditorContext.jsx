import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as fabric from 'fabric'
import {
  EXTRA_PROPS,
  applyLock,
  applyStyle,
  getLegType,
  pickStyle,
  serializeCanvas,
  snapshotCanvas,
  syncLockState,
  tagObject,
} from '../lib/fabricUtils'
import { MAX_ZOOM, MIN_ZOOM, THUMB_WIDTH } from '../lib/constants'
import { createEmptyPage, renumberPages, uid } from '../lib/project'
import { saveProject } from '../lib/db'

const EditorContext = createContext(null)

/** Hook utama untuk mengakses seluruh state & aksi editor. */
export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error('useEditor harus dipakai di dalam <EditorProvider>')
  return ctx
}

const HISTORY_LIMIT = 60
const AUTOSAVE_DELAY = 1500

/**
 * Provider yang memegang:
 * - instance Fabric canvas (lewat ref)
 * - data project & halaman aktif
 * - riwayat undo/redo per halaman
 * - status tool (select/draw/erase) beserta konfigurasi brush
 * - auto-save berkala ke IndexedDB
 */
export function EditorProvider({ initialProject, children, onProjectSaved }) {
  /* ------------------------------------------------------------------ */
  /* State inti                                                          */
  /* ------------------------------------------------------------------ */
  const canvasRef = useRef(null)
  const [canvasReady, setCanvasReady] = useState(false)

  const [project, setProject] = useState(initialProject)
  const [activeIndex, setActiveIndex] = useState(0)

  const [zoom, setZoomState] = useState(1)
  const [tool, setToolState] = useState('select')
  const [selection, setSelection] = useState([])
  const [objectsVersion, setObjectsVersion] = useState(0)
  const [propsVersion, setPropsVersion] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(initialProject?.updatedAt || null)

  const [brush, setBrush] = useState({ type: 'pen', color: '#1e293b', width: 6 })
  const [copiedStyle, setCopiedStyle] = useState(null)
  const [formatPainterOn, setFormatPainterOn] = useState(false)

  /* Ref-ref pembantu (tidak memicu render ulang) */
  const projectRef = useRef(project)
  const activeIndexRef = useRef(activeIndex)
  const suspendRef = useRef(false) // menahan pencatatan history saat load/undo
  const historyRef = useRef({ stack: [], index: -1 })
  const historyTimerRef = useRef(null)
  const autosaveTimerRef = useRef(null)
  const clipboardRef = useRef(null)
  const formatPainterRef = useRef(false)
  const copiedStyleRef = useRef(null)

  useEffect(() => {
    projectRef.current = project
  }, [project])
  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])
  useEffect(() => {
    formatPainterRef.current = formatPainterOn
  }, [formatPainterOn])
  useEffect(() => {
    copiedStyleRef.current = copiedStyle
  }, [copiedStyle])

  const size = project.size
  const activePage = project.pages[activeIndex] || project.pages[0]
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false })

  /* ------------------------------------------------------------------ */
  /* Riwayat undo/redo                                                   */
  /* ------------------------------------------------------------------ */

  const syncHistoryFlags = useCallback(() => {
    const h = historyRef.current
    setHistoryState({ canUndo: h.index > 0, canRedo: h.index < h.stack.length - 1 })
  }, [])

  /** Menyetel ulang riwayat dengan satu snapshot awal (dipakai saat ganti halaman). */
  const resetHistory = useCallback(
    (snapshot) => {
      historyRef.current = { stack: [snapshot], index: 0 }
      syncHistoryFlags()
    },
    [syncHistoryFlags],
  )

  /** Mencatat state kanvas saat ini ke riwayat (dengan debounce ringan). */
  const pushHistory = useCallback(() => {
    if (suspendRef.current) return
    clearTimeout(historyTimerRef.current)
    historyTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const snapshot = JSON.stringify(serializeCanvas(canvas))
      const h = historyRef.current
      if (h.stack[h.index] === snapshot) return

      h.stack = h.stack.slice(0, h.index + 1)
      h.stack.push(snapshot)
      if (h.stack.length > HISTORY_LIMIT) h.stack.shift()
      h.index = h.stack.length - 1
      syncHistoryFlags()
    }, 220)
  }, [syncHistoryFlags])

  /** Memuat sebuah snapshot riwayat ke kanvas tanpa mencatatnya lagi. */
  const restoreSnapshot = useCallback(
    async (snapshot) => {
      const canvas = canvasRef.current
      if (!canvas) return
      suspendRef.current = true
      try {
        await canvas.loadFromJSON(JSON.parse(snapshot))
        syncLockState(canvas, !!projectRef.current.pages[activeIndexRef.current]?.locked)
        canvas.requestRenderAll()
        setObjectsVersion((v) => v + 1)
        setSelection([])
      } finally {
        suspendRef.current = false
      }
    },
    [],
  )

  const undo = useCallback(async () => {
    const h = historyRef.current
    if (h.index <= 0) return
    h.index -= 1
    syncHistoryFlags()
    await restoreSnapshot(h.stack[h.index])
  }, [restoreSnapshot, syncHistoryFlags])

  const redo = useCallback(async () => {
    const h = historyRef.current
    if (h.index >= h.stack.length - 1) return
    h.index += 1
    syncHistoryFlags()
    await restoreSnapshot(h.stack[h.index])
  }, [restoreSnapshot, syncHistoryFlags])

  /* ------------------------------------------------------------------ */
  /* Menyimpan state halaman aktif ke object project                     */
  /* ------------------------------------------------------------------ */

  /**
   * Mengambil JSON + thumbnail halaman aktif dari kanvas, lalu mengembalikan
   * salinan project yang sudah diperbarui. Tidak menyentuh React state
   * supaya bisa dipakai di dalam operasi lain (ganti halaman, simpan, ekspor).
   */
  const collectActivePage = useCallback(() => {
    const canvas = canvasRef.current
    const proj = projectRef.current
    const idx = activeIndexRef.current
    if (!canvas || !proj.pages[idx]) return proj

    const json = serializeCanvas(canvas)
    let thumbnail = proj.pages[idx].thumbnail
    try {
      thumbnail = snapshotCanvas(canvas, proj.size.width, proj.size.height, THUMB_WIDTH)
    } catch {
      /* toDataURL bisa gagal bila kanvas "tainted"; abaikan thumbnail-nya */
    }

    const pages = proj.pages.map((p, i) =>
      i === idx ? { ...p, json, thumbnail, background: canvas.backgroundColor || p.background } : p,
    )
    const cover = pages.find((p) => !p.hidden)?.thumbnail || pages[0].thumbnail
    return { ...proj, pages, thumbnail: cover }
  }, [])

  /** Menyimpan project ke IndexedDB (dipakai auto-save & tombol simpan). */
  const persist = useCallback(
    async ({ silent = true } = {}) => {
      if (!silent) setSaving(true)
      try {
        const next = collectActivePage()
        const saved = await saveProject(next)
        projectRef.current = saved
        setProject(saved)
        setLastSavedAt(saved.updatedAt)
        onProjectSaved?.(saved)
        return saved
      } finally {
        if (!silent) setSaving(false)
      }
    },
    [collectActivePage, onProjectSaved],
  )

  /** Menjadwalkan auto-save setelah perubahan berhenti sejenak. */
  const scheduleAutosave = useCallback(() => {
    clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = setTimeout(() => {
      persist({ silent: true }).catch(() => {})
    }, AUTOSAVE_DELAY)
  }, [persist])

  /* ------------------------------------------------------------------ */
  /* Registrasi kanvas & event                                           */
  /* ------------------------------------------------------------------ */

  const refreshSelection = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setSelection(canvas.getActiveObjects())
    setPropsVersion((v) => v + 1)
  }, [])

  /** Dipanggil CanvasStage setelah instance Fabric dibuat. */
  const attachCanvas = useCallback(
    (canvas) => {
      canvasRef.current = canvas

      const onChanged = () => {
        setObjectsVersion((v) => v + 1)
        pushHistory()
        scheduleAutosave()
      }

      canvas.on('object:added', onChanged)
      canvas.on('object:removed', onChanged)
      canvas.on('object:modified', () => {
        onChanged()
        setPropsVersion((v) => v + 1)
      })
      canvas.on('text:changed', () => {
        pushHistory()
        scheduleAutosave()
      })
      canvas.on('selection:created', refreshSelection)
      canvas.on('selection:updated', refreshSelection)
      canvas.on('selection:cleared', () => setSelection([]))
      canvas.on('object:moving', () => setPropsVersion((v) => v + 1))
      canvas.on('object:scaling', () => setPropsVersion((v) => v + 1))
      canvas.on('object:rotating', () => setPropsVersion((v) => v + 1))

      // Path baru dari mode menggambar diberi identitas agar muncul di panel Layer.
      canvas.on('path:created', (e) => {
        if (e.path) tagObject(e.path, 'draw', 'Coretan')
      })

      // Format painter: klik objek berikutnya untuk menempelkan style.
      canvas.on('mouse:down', (e) => {
        if (!formatPainterRef.current || !e.target || !copiedStyleRef.current) return
        applyStyle(e.target, copiedStyleRef.current)
        canvas.requestRenderAll()
        setFormatPainterOn(false)
        pushHistory()
        scheduleAutosave()
      })

      setCanvasReady(true)
    },
    [pushHistory, refreshSelection, scheduleAutosave],
  )

  const detachCanvas = useCallback(() => {
    canvasRef.current = null
    setCanvasReady(false)
    setSelection([])
  }, [])

  /* ------------------------------------------------------------------ */
  /* Memuat halaman ke kanvas                                            */
  /* ------------------------------------------------------------------ */

  /** Memuat isi halaman index tertentu ke kanvas & mereset riwayat. */
  const loadPageIntoCanvas = useCallback(
    async (index) => {
      const canvas = canvasRef.current
      const proj = projectRef.current
      const page = proj.pages[index]
      if (!canvas || !page) return

      suspendRef.current = true
      try {
        canvas.discardActiveObject()
        await canvas.loadFromJSON(page.json)
        canvas.backgroundColor = page.background || '#ffffff'
        canvas.setDimensions({
          width: proj.size.width * canvas.getZoom(),
          height: proj.size.height * canvas.getZoom(),
        })
        syncLockState(canvas, !!page.locked)
        canvas.requestRenderAll()
        resetHistory(JSON.stringify(serializeCanvas(canvas)))
        setObjectsVersion((v) => v + 1)
        setSelection([])
      } finally {
        suspendRef.current = false
      }
    },
    [resetHistory],
  )

  /** Pindah ke halaman lain: simpan halaman sekarang lalu muat yang baru. */
  const goToPage = useCallback(
    async (index) => {
      if (index === activeIndexRef.current) return
      const proj = projectRef.current
      if (index < 0 || index >= proj.pages.length) return

      const next = collectActivePage()
      projectRef.current = next
      setProject(next)
      activeIndexRef.current = index
      setActiveIndex(index)
      await loadPageIntoCanvas(index)
      scheduleAutosave()
    },
    [collectActivePage, loadPageIntoCanvas, scheduleAutosave],
  )

  /* ------------------------------------------------------------------ */
  /* Operasi halaman                                                     */
  /* ------------------------------------------------------------------ */

  /** Menerapkan perubahan pada array pages lalu ikut menyimpan. */
  const mutatePages = useCallback(
    (updater, { nextIndex } = {}) => {
      const current = collectActivePage()
      const pages = updater(current.pages)
      const next = { ...current, pages }
      const cover = pages.find((p) => !p.hidden)?.thumbnail || pages[0]?.thumbnail || null
      next.thumbnail = cover
      projectRef.current = next
      setProject(next)
      if (typeof nextIndex === 'number') {
        activeIndexRef.current = nextIndex
        setActiveIndex(nextIndex)
      }
      scheduleAutosave()
      return next
    },
    [collectActivePage, scheduleAutosave],
  )

  const addPage = useCallback(
    async (afterIndex = null) => {
      const at = afterIndex === null ? projectRef.current.pages.length - 1 : afterIndex
      const page = createEmptyPage(`Halaman ${projectRef.current.pages.length + 1}`)
      mutatePages(
        (pages) => {
          const copy = [...pages]
          copy.splice(at + 1, 0, page)
          return renumberPages(copy)
        },
        { nextIndex: at + 1 },
      )
      await loadPageIntoCanvas(at + 1)
    },
    [mutatePages, loadPageIntoCanvas],
  )

  const duplicatePageAt = useCallback(
    async (index) => {
      const current = collectActivePage()
      const src = current.pages[index]
      if (!src) return
      const copy = {
        ...JSON.parse(JSON.stringify(src)),
        id: uid('page'),
        name: `${src.name} (salinan)`,
      }
      mutatePages(
        (pages) => {
          const list = [...pages]
          list.splice(index + 1, 0, copy)
          return list
        },
        { nextIndex: index + 1 },
      )
      await loadPageIntoCanvas(index + 1)
    },
    [collectActivePage, mutatePages, loadPageIntoCanvas],
  )

  const deletePageAt = useCallback(
    async (index) => {
      if (projectRef.current.pages.length <= 1) return
      const nextIndex = Math.max(0, index === 0 ? 0 : index - 1)
      mutatePages((pages) => renumberPages(pages.filter((_, i) => i !== index)), { nextIndex })
      await loadPageIntoCanvas(nextIndex)
    },
    [mutatePages, loadPageIntoCanvas],
  )

  /** Menggeser urutan halaman (naik/turun) sambil menjaga halaman aktif. */
  const movePage = useCallback(
    (index, direction) => {
      const target = index + direction
      const total = projectRef.current.pages.length
      if (target < 0 || target >= total) return
      const currentActive = activeIndexRef.current
      let nextActive = currentActive
      if (currentActive === index) nextActive = target
      else if (currentActive === target) nextActive = index

      mutatePages(
        (pages) => {
          const list = [...pages]
          const [moved] = list.splice(index, 1)
          list.splice(target, 0, moved)
          return renumberPages(list)
        },
        { nextIndex: nextActive },
      )
    },
    [mutatePages],
  )

  const updatePage = useCallback(
    (index, patch) => {
      mutatePages((pages) => pages.map((p, i) => (i === index ? { ...p, ...patch } : p)))
      // Bila halaman aktif dikunci/dibuka, seluruh objek harus ikut disinkronkan.
      if (index === activeIndexRef.current && 'locked' in patch && canvasRef.current) {
        syncLockState(canvasRef.current, patch.locked)
        canvasRef.current.discardActiveObject()
        canvasRef.current.requestRenderAll()
        setSelection([])
      }
    },
    [mutatePages],
  )

  /** Mengganti warna latar halaman aktif. */
  const setPageBackground = useCallback(
    (color) => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.backgroundColor = color
      canvas.requestRenderAll()
      pushHistory()
      mutatePages((pages) =>
        pages.map((p, i) => (i === activeIndexRef.current ? { ...p, background: color } : p)),
      )
    },
    [mutatePages, pushHistory],
  )

  /* ------------------------------------------------------------------ */
  /* Operasi objek                                                       */
  /* ------------------------------------------------------------------ */

  /** Menambahkan objek Fabric ke halaman aktif. */
  const addObject = useCallback((obj, opts) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    if (opts?.center !== false) {
      const w = canvas.getWidth() / canvas.getZoom()
      const h = canvas.getHeight() / canvas.getZoom()
      const b = obj.getBoundingRect()
      obj.set({
        left: (obj.left || 0) + (w - b.width) / 2 - b.left,
        top: (obj.top || 0) + (h - b.height) / 2 - b.top,
      })
      obj.setCoords()
    }
    canvas.add(obj)
    canvas.setActiveObject(obj)
    canvas.requestRenderAll()
    refreshSelection()
    return obj
  }, [refreshSelection])

  /** Menerapkan properti ke seluruh objek terpilih. */
  const updateSelected = useCallback(
    (patch, { record = true } = {}) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const targets = canvas.getActiveObjects()
      if (targets.length === 0) return
      targets.forEach((obj) => {
        obj.set(patch)
        obj.setCoords()
      })
      canvas.requestRenderAll()
      setPropsVersion((v) => v + 1)
      if (record) {
        pushHistory()
        scheduleAutosave()
      }
    },
    [pushHistory, scheduleAutosave],
  )

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const targets = canvas.getActiveObjects()
    if (targets.length === 0) return
    targets.forEach((obj) => canvas.remove(obj))
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    setSelection([])
  }, [])

  /** Menghapus objek tertentu (dipakai panel Layer). */
  const removeObject = useCallback((obj) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.remove(obj)
    canvas.discardActiveObject()
    canvas.requestRenderAll()
    setSelection([])
  }, [])

  /** Menggandakan objek (offset sedikit agar terlihat). */
  const duplicateObject = useCallback(
    async (source) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const targets = source ? [source] : canvas.getActiveObjects()
      if (targets.length === 0) return

      const clones = []
      for (const obj of targets) {
        const clone = await obj.clone(EXTRA_PROPS)
        clone.set({
          id: uid('obj'),
          left: (clone.left || 0) + 24,
          top: (clone.top || 0) + 24,
        })
        canvas.add(clone)
        clones.push(clone)
      }
      canvas.discardActiveObject()
      if (clones.length === 1) canvas.setActiveObject(clones[0])
      canvas.requestRenderAll()
      refreshSelection()
    },
    [refreshSelection],
  )

  /** Salin objek terpilih ke clipboard internal. */
  const copySelection = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return
    clipboardRef.current = await active.clone(EXTRA_PROPS)
  }, [])

  /** Tempel objek dari clipboard internal. */
  const pasteClipboard = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !clipboardRef.current) return
    const clone = await clipboardRef.current.clone(EXTRA_PROPS)
    clone.set({ id: uid('obj'), left: (clone.left || 0) + 30, top: (clone.top || 0) + 30 })
    if (clone.type === 'activeselection') {
      clone.canvas = canvas
      clone.forEachObject((o) => {
        o.set({ id: uid('obj') })
        canvas.add(o)
      })
      clone.setCoords()
    } else {
      canvas.add(clone)
    }
    canvas.setActiveObject(clone)
    canvas.requestRenderAll()
    refreshSelection()
  }, [refreshSelection])

  /** Ubah susunan tumpukan objek terpilih. */
  const orderSelected = useCallback(
    (action) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const targets = canvas.getActiveObjects()
      targets.forEach((obj) => {
        if (action === 'front') canvas.bringObjectToFront(obj)
        else if (action === 'back') canvas.sendObjectToBack(obj)
        else if (action === 'forward') canvas.bringObjectForward(obj)
        else if (action === 'backward') canvas.sendObjectBackwards(obj)
      })
      canvas.requestRenderAll()
      setObjectsVersion((v) => v + 1)
      pushHistory()
      scheduleAutosave()
    },
    [pushHistory, scheduleAutosave],
  )

  /**
   * Rata-kan objek terpilih terhadap kanvas.
   * Bila terpilih lebih dari satu objek, perataan dilakukan terhadap
   * kotak batas seleksi (mirip perilaku Canva).
   */
  const alignSelected = useCallback(
    (mode) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const active = canvas.getActiveObject()
      if (!active) return

      const W = canvas.getWidth() / canvas.getZoom()
      const H = canvas.getHeight() / canvas.getZoom()
      const targets = canvas.getActiveObjects()
      const multi = targets.length > 1

      const alignOne = (obj, boundsW, boundsH, offsetX = 0, offsetY = 0) => {
        const b = obj.getBoundingRect()
        const left = obj.left || 0
        const top = obj.top || 0
        const dx = left - b.left
        const dy = top - b.top
        switch (mode) {
          case 'left':
            obj.set({ left: offsetX + dx })
            break
          case 'center':
            obj.set({ left: offsetX + (boundsW - b.width) / 2 + dx })
            break
          case 'right':
            obj.set({ left: offsetX + boundsW - b.width + dx })
            break
          case 'top':
            obj.set({ top: offsetY + dy })
            break
          case 'middle':
            obj.set({ top: offsetY + (boundsH - b.height) / 2 + dy })
            break
          case 'bottom':
            obj.set({ top: offsetY + boundsH - b.height + dy })
            break
          default:
            break
        }
        obj.setCoords()
      }

      if (multi) {
        // Dalam ActiveSelection, koordinat anak relatif terhadap pusat seleksi.
        const selW = active.width * (active.scaleX || 1)
        const selH = active.height * (active.scaleY || 1)
        targets.forEach((obj) => {
          const ow = obj.getScaledWidth()
          const oh = obj.getScaledHeight()
          switch (mode) {
            case 'left':
              obj.set({ left: -selW / 2 })
              break
            case 'center':
              obj.set({ left: -ow / 2 })
              break
            case 'right':
              obj.set({ left: selW / 2 - ow })
              break
            case 'top':
              obj.set({ top: -selH / 2 })
              break
            case 'middle':
              obj.set({ top: -oh / 2 })
              break
            case 'bottom':
              obj.set({ top: selH / 2 - oh })
              break
            default:
              break
          }
          obj.setCoords()
        })
      } else {
        alignOne(active, W, H)
      }

      canvas.requestRenderAll()
      setPropsVersion((v) => v + 1)
      pushHistory()
      scheduleAutosave()
    },
    [pushHistory, scheduleAutosave],
  )

  /** Balik objek terpilih secara horizontal / vertikal. */
  const flipSelected = useCallback(
    (axis) => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.getActiveObjects().forEach((obj) => {
        if (axis === 'x') obj.set({ flipX: !obj.flipX })
        else obj.set({ flipY: !obj.flipY })
      })
      canvas.requestRenderAll()
      setPropsVersion((v) => v + 1)
      pushHistory()
      scheduleAutosave()
    },
    [pushHistory, scheduleAutosave],
  )

  /** Kunci / buka kunci objek tertentu (atau seluruh objek terpilih). */
  const toggleObjectLock = useCallback(
    (obj) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const targets = obj ? [obj] : canvas.getActiveObjects()
      targets.forEach((o) => applyLock(o, !o.legLocked))
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      setSelection([])
      setObjectsVersion((v) => v + 1)
      scheduleAutosave()
    },
    [scheduleAutosave],
  )

  /** Sembunyikan / tampilkan objek tertentu. */
  const toggleObjectVisibility = useCallback(
    (obj) => {
      const canvas = canvasRef.current
      if (!canvas) return
      obj.set({ visible: !obj.visible })
      if (!obj.visible) canvas.discardActiveObject()
      canvas.requestRenderAll()
      setObjectsVersion((v) => v + 1)
      pushHistory()
      scheduleAutosave()
    },
    [pushHistory, scheduleAutosave],
  )

  /** Pilih objek tertentu dari panel Layer. */
  const selectObject = useCallback(
    (obj) => {
      const canvas = canvasRef.current
      if (!canvas || obj.legLocked) return
      canvas.setActiveObject(obj)
      canvas.requestRenderAll()
      refreshSelection()
    },
    [refreshSelection],
  )

  /** Menyusun ulang layer lewat drag di panel Layer (index berbasis tampilan). */
  const moveObjectToIndex = useCallback(
    (obj, targetIndex) => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.moveObjectTo(obj, targetIndex)
      canvas.requestRenderAll()
      setObjectsVersion((v) => v + 1)
      pushHistory()
      scheduleAutosave()
    },
    [pushHistory, scheduleAutosave],
  )

  /* ------------------------------------------------------------------ */
  /* Format painter                                                      */
  /* ------------------------------------------------------------------ */

  const copyStyleFromSelection = useCallback(() => {
    const canvas = canvasRef.current
    const active = canvas?.getActiveObject()
    if (!active) return false
    setCopiedStyle(pickStyle(active))
    setFormatPainterOn(true)
    return true
  }, [])

  const cancelFormatPainter = useCallback(() => setFormatPainterOn(false), [])

  /* ------------------------------------------------------------------ */
  /* Zoom                                                                */
  /* ------------------------------------------------------------------ */

  const setZoom = useCallback(
    (value) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
      const canvas = canvasRef.current
      if (canvas) {
        canvas.setZoom(clamped)
        canvas.setDimensions({
          width: projectRef.current.size.width * clamped,
          height: projectRef.current.size.height * clamped,
        })
        canvas.requestRenderAll()
      }
      setZoomState(clamped)
    },
    [],
  )

  /* ------------------------------------------------------------------ */
  /* Mode tool & brush                                                   */
  /* ------------------------------------------------------------------ */

  const setTool = useCallback((next) => {
    setToolState(next)
    const canvas = canvasRef.current
    if (canvas && next !== 'select') canvas.discardActiveObject()
    canvas?.requestRenderAll()
  }, [])

  /* Menyusun brush Fabric setiap kali tool/konfigurasi brush berubah. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasReady) return

    const isDraw = tool === 'draw'
    canvas.isDrawingMode = isDraw
    canvas.selection = tool === 'select' && !activePage?.locked

    if (isDraw) {
      const pencil = new fabric.PencilBrush(canvas)
      pencil.color = brush.color
      pencil.width = brush.width
      pencil.strokeLineCap = brush.type === 'highlighter' ? 'butt' : 'round'
      pencil.strokeLineJoin = 'round'
      pencil.decimate = brush.type === 'highlighter' ? 6 : 4
      canvas.freeDrawingBrush = pencil
    }

    canvas.defaultCursor = tool === 'erase' ? 'crosshair' : 'default'
    canvas.requestRenderAll()
  }, [tool, brush, canvasReady, activePage?.locked])

  /* Tool penghapus: hapus coretan (path) yang tersentuh kursor. */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasReady || tool !== 'erase') return

    let erasing = false

    const eraseAt = (e) => {
      const point = canvas.getScenePoint(e.e)
      const victims = canvas
        .getObjects()
        .filter((o) => getLegType(o) === 'draw' && o.visible && !o.legLocked && o.containsPoint(point))
      if (victims.length) {
        victims.forEach((o) => canvas.remove(o))
        canvas.requestRenderAll()
      }
    }

    const onDown = (e) => {
      erasing = true
      eraseAt(e)
    }
    const onMove = (e) => erasing && eraseAt(e)
    const onUp = () => {
      erasing = false
    }

    canvas.on('mouse:down', onDown)
    canvas.on('mouse:move', onMove)
    canvas.on('mouse:up', onUp)
    return () => {
      canvas.off('mouse:down', onDown)
      canvas.off('mouse:move', onMove)
      canvas.off('mouse:up', onUp)
    }
  }, [tool, canvasReady])

  /* ------------------------------------------------------------------ */
  /* Membersihkan timer saat unmount                                     */
  /* ------------------------------------------------------------------ */
  useEffect(
    () => () => {
      clearTimeout(historyTimerRef.current)
      clearTimeout(autosaveTimerRef.current)
    },
    [],
  )

  /* ------------------------------------------------------------------ */
  /* Nilai context                                                       */
  /* ------------------------------------------------------------------ */
  const value = useMemo(
    () => ({
      // data
      project,
      setProject,
      size,
      pages: project.pages,
      activeIndex,
      activePage,
      canvasRef,
      canvasReady,
      selection,
      objectsVersion,
      propsVersion,
      zoom,
      tool,
      brush,
      setBrush,
      saving,
      lastSavedAt,
      copiedStyle,
      formatPainterOn,
      ...historyState,

      // kanvas
      attachCanvas,
      detachCanvas,
      loadPageIntoCanvas,
      refreshSelection,

      // halaman
      goToPage,
      addPage,
      duplicatePageAt,
      deletePageAt,
      movePage,
      updatePage,
      setPageBackground,

      // objek
      addObject,
      updateSelected,
      deleteSelected,
      removeObject,
      duplicateObject,
      copySelection,
      pasteClipboard,
      orderSelected,
      alignSelected,
      flipSelected,
      toggleObjectLock,
      toggleObjectVisibility,
      selectObject,
      moveObjectToIndex,

      // style
      copyStyleFromSelection,
      cancelFormatPainter,

      // lain-lain
      setZoom,
      setTool,
      undo,
      redo,
      persist,
      collectActivePage,
      scheduleAutosave,
      pushHistory,
    }),
    [
      project,
      size,
      activeIndex,
      activePage,
      canvasReady,
      selection,
      objectsVersion,
      propsVersion,
      zoom,
      tool,
      brush,
      saving,
      lastSavedAt,
      copiedStyle,
      formatPainterOn,
      historyState,
      attachCanvas,
      detachCanvas,
      loadPageIntoCanvas,
      refreshSelection,
      goToPage,
      addPage,
      duplicatePageAt,
      deletePageAt,
      movePage,
      updatePage,
      setPageBackground,
      addObject,
      updateSelected,
      deleteSelected,
      removeObject,
      duplicateObject,
      copySelection,
      pasteClipboard,
      orderSelected,
      alignSelected,
      flipSelected,
      toggleObjectLock,
      toggleObjectVisibility,
      selectObject,
      moveObjectToIndex,
      copyStyleFromSelection,
      cancelFormatPainter,
      setZoom,
      setTool,
      undo,
      redo,
      persist,
      collectActivePage,
      scheduleAutosave,
      pushHistory,
    ],
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
}
