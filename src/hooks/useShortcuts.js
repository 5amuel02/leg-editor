import { useEffect } from 'react'
import { useEditor } from '../context/EditorContext'

/** Menghindari shortcut aktif saat user sedang mengetik di form. */
function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * Pintasan keyboard editor (mirip aplikasi desain pada umumnya):
 * Ctrl+Z / Ctrl+Shift+Z, Ctrl+C / Ctrl+V, Ctrl+D, Ctrl+S,
 * Delete, Esc, Ctrl +/- , dan panah untuk menggeser elemen.
 */
export default function useShortcuts({ onSave } = {}) {
  const {
    canvasRef,
    undo,
    redo,
    deleteSelected,
    duplicateObject,
    copySelection,
    setTool,
    tool,
    zoom,
    setZoom,
    selection,
    updateSelected,
    cancelFormatPainter,
    formatPainterOn,
    groupSelection,
    ungroupSelection,
  } = useEditor()

  useEffect(() => {
    const onKeyDown = (e) => {
      const canvas = canvasRef.current
      const editingText = canvas?.getActiveObject()?.isEditing
      if (isTypingTarget(e.target) || editingText) {
        if (e.key === 'Escape' && editingText) canvas.getActiveObject().exitEditing()
        return
      }

      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        copySelection()
        return
      }
      // Ctrl+V sengaja TIDAK ditangani di sini: preventDefault pada keydown
      // akan membatalkan event `paste`, padahal hanya event itu yang membawa
      // isi clipboard sistem (mis. gambar hasil screenshot). Penempelan
      // ditangani sepenuhnya oleh useClipboardPaste.
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateObject()
        return
      }
      if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (e.shiftKey) ungroupSelection()
        else groupSelection()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave?.()
        return
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setZoom(zoom * 1.15)
        return
      }
      if (mod && e.key === '-') {
        e.preventDefault()
        setZoom(zoom / 1.15)
        return
      }
      if (mod && e.key === '0') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('leg:fit-zoom'))
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection.length > 0) {
          e.preventDefault()
          deleteSelected()
        }
        return
      }

      if (e.key === 'Escape') {
        if (formatPainterOn) cancelFormatPainter()
        else if (tool !== 'select') setTool('select')
        else {
          canvas?.discardActiveObject()
          canvas?.requestRenderAll()
        }
        return
      }

      // Geser elemen dengan tombol panah (Shift = 10px)
      const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]
      if (nudge && selection.length > 0) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const active = canvas.getActiveObject()
        active.set({
          left: (active.left || 0) + nudge[0] * step,
          top: (active.top || 0) + nudge[1] * step,
        })
        active.setCoords()
        canvas.requestRenderAll()
        updateSelected({}, { record: true })
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    canvasRef,
    undo,
    redo,
    deleteSelected,
    duplicateObject,
    copySelection,
    setTool,
    tool,
    zoom,
    setZoom,
    selection,
    updateSelected,
    onSave,
    cancelFormatPainter,
    formatPainterOn,
    groupSelection,
    ungroupSelection,
  ])
}
