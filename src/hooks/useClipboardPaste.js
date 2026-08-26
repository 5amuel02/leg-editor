import { useEffect } from 'react'
import { useEditor } from '../context/EditorContext'
import { createImage } from '../lib/fabricUtils'
import { fillFrameWithImage } from '../lib/frames'
import { getImageSize } from '../lib/exporters'
import { saveUpload } from '../lib/db'
import { uid } from '../lib/project'

/** Event kustom agar tab "Unggahan" ikut menyegarkan daftarnya. */
export const UPLOADS_CHANGED_EVENT = 'leg:uploads-changed'

/** Apakah fokus sedang berada di sebuah kolom isian? */
function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/** Membaca sebuah Blob/File menjadi data URL. */
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca gambar dari clipboard.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Menangani Ctrl/Cmd+V di area editor.
 *
 * - Bila clipboard sistem berisi gambar (hasil salin dari browser, screenshot,
 *   Windows Snipping Tool, dsb.), gambar langsung ditempel ke kanvas **dan**
 *   ikut disimpan ke pustaka Unggahan supaya bisa dipakai lagi nanti.
 * - Bila tidak ada gambar, perilakunya kembali seperti biasa: menempel objek
 *   yang sebelumnya disalin di dalam aplikasi (Ctrl+C).
 *
 * Penanganan dilakukan lewat event `paste` — bukan `keydown` — karena hanya
 * event itu yang membawa isi clipboard sistem. Itu sebabnya shortcut Ctrl+V
 * tidak lagi di-preventDefault di useShortcuts.
 */
export default function useClipboardPaste({ onNotify } = {}) {
  const { canvasRef, size, addObject, pasteClipboard, activePage, refreshSelection } = useEditor()

  useEffect(() => {
    const handlePaste = async (event) => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Sedang mengetik di kanvas atau di form: biarkan browser menempel teks.
      if (canvas.getActiveObject()?.isEditing) return
      if (isTypingTarget(event.target)) return

      const items = Array.from(event.clipboardData?.items || [])
      const imageItem = items.find((item) => item.type?.startsWith('image/'))

      // Tidak ada gambar -> tempel objek dari clipboard internal aplikasi.
      if (!imageItem) {
        event.preventDefault()
        pasteClipboard()
        return
      }

      event.preventDefault()

      if (activePage?.locked) {
        onNotify?.('Halaman terkunci — gambar tidak bisa ditempel.', 'error')
        return
      }

      const file = imageItem.getAsFile()
      if (!file) return

      try {
        const dataUrl = await readAsDataURL(file)
        const dimension = await getImageSize(dataUrl)
        const name = file.name || `Tempel ${new Date().toLocaleTimeString('id-ID')}.png`

        // 1. Catat ke pustaka Unggahan supaya bisa dipakai ulang.
        await saveUpload({
          id: uid('img'),
          name,
          dataUrl,
          width: dimension.width,
          height: dimension.height,
          createdAt: Date.now(),
        })
        window.dispatchEvent(new CustomEvent(UPLOADS_CHANGED_EVENT))

        // 2. Taruh di kanvas — masuk ke bingkai bila ada bingkai yang terpilih.
        const active = canvas.getActiveObject()
        if (active?.legType === 'frame') {
          await fillFrameWithImage(canvas, active, dataUrl, name)
          refreshSelection()
          onNotify?.('Gambar ditempel ke bingkai dan disimpan ke Unggahan.', 'success')
          return
        }

        const image = await createImage(dataUrl, size.width, size.height, name)
        addObject(image)
        onNotify?.('Gambar ditempel dan disimpan ke Unggahan.', 'success')
      } catch (error) {
        onNotify?.(error.message || 'Gagal menempel gambar.', 'error')
      }
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [
    canvasRef,
    size,
    addObject,
    pasteClipboard,
    activePage,
    refreshSelection,
    onNotify,
  ])
}
