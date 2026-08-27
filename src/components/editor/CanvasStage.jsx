import { useCallback, useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Lock } from 'lucide-react'
import { useEditor } from '../../context/EditorContext'
import { createImage } from '../../lib/fabricUtils'
import { fillFrameWithImage, findFrameAt } from '../../lib/frames'
import useCanvasPan from '../../hooks/useCanvasPan'
import FloatingToolbar from './FloatingToolbar'

/**
 * Area kerja kanvas.
 *
 * Elemen <canvas> dibuat secara imperatif (bukan lewat JSX) supaya React
 * tidak berebut kepemilikan DOM dengan Fabric — Fabric membungkus elemen
 * canvas ke dalam div `.canvas-container` miliknya sendiri.
 */
export default function CanvasStage({ onRequestCrop }) {
  const {
    size,
    zoom,
    setZoom,
    attachCanvas,
    detachCanvas,
    canvasReady,
    canvasRef,
    activeIndex,
    activePage,
    loadPageIntoCanvas,
    addObject,
    tool,
    formatPainterOn,
    refreshSelection,
  } = useEditor()

  const hostRef = useRef(null) // div tempat Fabric menaruh canvas
  const scrollRef = useRef(null) // area scroll di sekelilingnya
  const [dragOver, setDragOver] = useState(false)
  const didFitRef = useRef(false)

  const { panReady, panning } = useCanvasPan(scrollRef, canvasRef)

  /* ---------------------------------------------------------------- */
  /* Inisialisasi Fabric                                               */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const el = document.createElement('canvas')
    host.appendChild(el)

    const canvas = new fabric.Canvas(el, {
      width: size.width,
      height: size.height,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selectionColor: 'rgba(225, 22, 32, 0.10)',
      selectionBorderColor: '#e11620',
      selectionLineWidth: 1.5,
      stopContextMenu: true,
      fireRightClick: true,
      enableRetinaScaling: true,
    })

    // Gaya handle seleksi supaya mirip aplikasi desain modern.
    fabric.InteractiveFabricObject.ownDefaults = {
      ...fabric.InteractiveFabricObject.ownDefaults,
      cornerStyle: 'circle',
      cornerColor: '#ffffff',
      cornerStrokeColor: '#e11620',
      borderColor: '#e11620',
      cornerSize: 11,
      transparentCorners: false,
      borderScaleFactor: 1.6,
      padding: 2,
    }

    attachCanvas(canvas)

    return () => {
      detachCanvas()
      canvas.dispose()
      if (el.parentNode) el.parentNode.removeChild(el)
      // Fabric menyisakan wrapper .canvas-container; bersihkan agar tidak menumpuk.
      host.querySelectorAll('.canvas-container').forEach((n) => n.remove())
    }
    // Sengaja hanya sekali per mount editor: ukuran kanvas tidak berubah dalam satu project.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* Memuat halaman pertama begitu kanvas siap. */
  useEffect(() => {
    if (!canvasReady) return
    loadPageIntoCanvas(activeIndex)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasReady])

  /* ---------------------------------------------------------------- */
  /* Zoom otomatis "fit" saat pertama kali dibuka                       */
  /* ---------------------------------------------------------------- */
  const fitToScreen = useCallback(() => {
    const box = scrollRef.current
    if (!box) return
    const padding = 96
    const scale = Math.min(
      (box.clientWidth - padding) / size.width,
      (box.clientHeight - padding) / size.height,
    )
    setZoom(Math.max(0.05, Math.min(1, scale)))
  }, [size.width, size.height, setZoom])

  useEffect(() => {
    if (!canvasReady || didFitRef.current) return
    didFitRef.current = true
    fitToScreen()
  }, [canvasReady, fitToScreen])

  /* Menyediakan fungsi fit ke tombol di toolbar lewat event kustom. */
  useEffect(() => {
    const handler = () => fitToScreen()
    window.addEventListener('leg:fit-zoom', handler)
    return () => window.removeEventListener('leg:fit-zoom', handler)
  }, [fitToScreen])

  /* ---------------------------------------------------------------- */
  /* Zoom dengan Ctrl + scroll                                          */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return
    const onWheel = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      setZoom(zoom * (e.deltaY < 0 ? 1.1 : 0.9))
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [zoom, setZoom])

  /* ---------------------------------------------------------------- */
  /* Drop gambar langsung ke kanvas                                     */
  /* ---------------------------------------------------------------- */
  const handleDrop = async (e) => {
    e.preventDefault()
    setDragOver(false)
    if (activePage?.locked) return

    // Sumber 1: thumbnail dari tab "Unggahan" (data URL lewat dataTransfer).
    const payload = e.dataTransfer.getData('application/leg-image')
    if (payload) {
      try {
        const { dataUrl, name } = JSON.parse(payload)
        await dropImage(e, dataUrl, name)
        return
      } catch {
        /* lanjut ke sumber berikutnya */
      }
    }

    // Sumber 2: berkas gambar langsung dari file explorer.
    const file = Array.from(e.dataTransfer.files || []).find((f) => f.type.startsWith('image/'))
    if (file) {
      const dataUrl = await new Promise((res) => {
        const reader = new FileReader()
        reader.onload = () => res(String(reader.result))
        reader.readAsDataURL(file)
      })
      await dropImage(e, dataUrl, file.name)
    }
  }

  /**
   * Menjatuhkan gambar ke kanvas. Bila titik jatuhnya berada di atas sebuah
   * bingkai kosong, gambar dimasukkan ke bingkai itu; kalau tidak, gambar
   * ditaruh sebagai objek biasa tepat di posisi kursor.
   */
  const dropImage = async (e, dataUrl, name) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const scenePoint = toScenePoint(e)
    const frame = scenePoint ? findFrameAt(canvas, scenePoint) : null
    if (frame) {
      await fillFrameWithImage(canvas, frame, dataUrl, name)
      refreshSelection()
      return
    }

    const img = await createImage(dataUrl, size.width, size.height, name)
    placeAtPointer(e, img)
  }

  /** Mengubah koordinat layar sebuah event drop menjadi koordinat kanvas. */
  const toScenePoint = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.upperCanvasEl.getBoundingClientRect()
    const point = new fabric.Point((e.clientX - rect.left) / zoom, (e.clientY - rect.top) / zoom)
    const inside =
      point.x >= 0 && point.y >= 0 && point.x <= size.width && point.y <= size.height
    return inside ? point : null
  }

  /** Menaruh objek tepat di titik drop (dikonversi ke koordinat kanvas). */
  const placeAtPointer = (e, obj) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.upperCanvasEl.getBoundingClientRect()
    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom
    const inside = x >= 0 && y >= 0 && x <= size.width && y <= size.height
    if (inside) {
      obj.set({ left: x - obj.getScaledWidth() / 2, top: y - obj.getScaledHeight() / 2 })
      obj.setCoords()
      addObject(obj, { center: false })
    } else {
      addObject(obj)
    }
  }

  // Kursor geser menang atas kursor mode: saat spasi ditahan, yang sedang
  // dilakukan user adalah menggeser, bukan menggambar atau menghapus.
  const cursorClass = panning
    ? 'cursor-grabbing'
    : panReady
      ? 'cursor-grab'
      : tool === 'draw'
        ? 'cursor-crosshair'
        : tool === 'erase'
          ? 'cursor-cell'
          : formatPainterOn
            ? 'cursor-copy'
            : ''

  return (
    <div
      ref={scrollRef}
      className="leg-workspace relative flex-1 overflow-auto"
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/*
        Kanvas dipusatkan lewat `m-auto` pada anaknya, BUKAN `justify-center`
        pada pembungkusnya. Di dalam kotak yang bisa di-scroll, justify-center
        membuat luapan di sisi kiri/atas tidak bisa dijangkau sama sekali —
        itulah sebabnya area kerja terasa terkunci di tengah saat di-zoom.
        Margin auto memusatkan saat masih muat, dan melepas saat tidak.
      */}
      <div className="flex min-h-full min-w-full p-12">
        <div className={`relative m-auto ${cursorClass}`}>
          <div ref={hostRef} />

          {/* Overlay indikator halaman terkunci */}
          {activePage?.locked && (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
              <span className="flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
                <Lock size={12} /> Halaman terkunci
              </span>
            </div>
          )}

          {/* Toolbar mengambang di atas elemen terpilih */}
          <FloatingToolbar onRequestCrop={onRequestCrop} />
        </div>
      </div>

      {/* Penanda area drop */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-brand-500 bg-brand-500/5" />
      )}

      {/* Petunjuk mode aktif */}
      {(tool !== 'select' || formatPainterOn) && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink-900/85 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
          {formatPainterOn
            ? 'Format Painter aktif — klik elemen tujuan untuk menempelkan style'
            : tool === 'draw'
              ? 'Mode menggambar — tekan Esc untuk kembali'
              : 'Mode penghapus — usap coretan untuk menghapus'}
        </div>
      )}
    </div>
  )
}
