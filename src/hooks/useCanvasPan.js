import { useEffect, useState } from 'react'

/** Menghindari pan aktif saat user sedang mengetik di form. */
function isTypingTarget(el) {
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

/**
 * Menggeser (pan) area kerja kanvas.
 *
 * Kanvas berada di dalam kotak `overflow-auto`, jadi "menggeser" pada dasarnya
 * adalah menggerakkan `scrollLeft`/`scrollTop` kotak itu. Tiga cara disediakan:
 *
 * - **Scroll dua jari** ke segala arah. Roda mouse/touchpad ditangani sendiri
 *   (bukan dibiarkan native) karena dua alasan: `deltaX` horizontal pada
 *   banyak browser dipakai sebagai gestur "kembali ke halaman sebelumnya",
 *   dan menanganinya sendiri membuat arah tegak maupun mendatar berperilaku
 *   sama persis.
 * - **Spasi + seret**, alternatif untuk mouse biasa.
 * - **Klik kanan + seret**, tanpa perlu menahan tombol apa pun. Aplikasi ini
 *   tidak punya menu konteks sendiri, jadi tombol kanan bebas dipakai untuk
 *   navigasi; menu konteks bawaan browser ditekan agar tidak memutus seretan.
 *
 * Kedua cara seret itu menangkap `mousedown` pada fase capture lalu
 * menghentikannya, supaya Fabric tidak ikut memulai seleksi kotak di bawahnya.
 *
 * Zoom (Ctrl + scroll) sengaja dilewati di sini dan tetap ditangani terpisah.
 */
export default function useCanvasPan(scrollRef, canvasRef) {
  const [panReady, setPanReady] = useState(false) // spasi sedang ditahan
  const [panning, setPanning] = useState(false) // sedang menyeret

  /* ---------------- Scroll dua jari ---------------- */
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return

    const onWheel = (e) => {
      if (e.ctrlKey || e.metaKey) return // zoom, bukan pan

      // deltaMode: 0 = piksel (touchpad), 1 = baris, 2 = halaman.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? box.clientHeight : 1

      // Shift + roda satu arah adalah konvensi umum untuk menggeser mendatar
      // pada mouse yang tidak punya sumbu X.
      const mendatarPakaiShift = e.shiftKey && e.deltaX === 0
      const dx = (mendatarPakaiShift ? e.deltaY : e.deltaX) * unit
      const dy = (mendatarPakaiShift ? 0 : e.deltaY) * unit
      if (!dx && !dy) return

      e.preventDefault()
      box.scrollLeft += dx
      box.scrollTop += dy
    }

    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [scrollRef])

  /* ---------------- Spasi ditahan ---------------- */
  useEffect(() => {
    const sedangMengetik = () => !!canvasRef?.current?.getActiveObject()?.isEditing

    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      if (isTypingTarget(e.target) || sedangMengetik()) return
      // Tanpa ini, spasi menggulung halaman seperti perilaku bawaan browser.
      e.preventDefault()
      setPanReady(true)
    }

    const onKeyUp = (e) => {
      if (e.code !== 'Space') return
      setPanReady(false)
      setPanning(false)
    }

    // Kehilangan fokus jendela membuat keyup tidak pernah sampai; tanpa reset
    // ini, kursor akan tersangkut di mode geser setelah pindah aplikasi.
    const onBlur = () => {
      setPanReady(false)
      setPanning(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [canvasRef])

  /* ---------------- Spasi + seret, dan klik kanan + seret ---------------- */
  useEffect(() => {
    const box = scrollRef.current
    if (!box) return

    /**
     * Memulai satu sesi seret. Dipakai bersama oleh dua pemicu: tombol kiri
     * saat spasi ditahan, dan tombol kanan kapan saja.
     *
     * Event dihentikan pada fase capture supaya Fabric tidak melihatnya —
     * kalau tidak, ia akan memulai seleksi kotak sambil kita menggeser.
     */
    const mulaiSeret = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setPanning(true)

      const mulaiX = e.clientX
      const mulaiY = e.clientY
      const mulaiKiri = box.scrollLeft
      const mulaiAtas = box.scrollTop

      const onMove = (ev) => {
        box.scrollLeft = mulaiKiri - (ev.clientX - mulaiX)
        box.scrollTop = mulaiAtas - (ev.clientY - mulaiY)
      }
      const onUp = () => {
        setPanning(false)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    const onDown = (e) => {
      // Tombol kanan: selalu menggeser. Aplikasi ini tidak punya menu konteks
      // sendiri, jadi tombol kanan bebas dipakai untuk navigasi.
      if (e.button === 2) {
        mulaiSeret(e)
        return
      }
      // Tombol kiri: hanya saat spasi sedang ditahan.
      if (e.button === 0 && panReady) mulaiSeret(e)
    }

    // Menu konteks browser harus ditekan, kalau tidak ia muncul di tengah
    // seretan dan sesi geser terputus.
    const onContextMenu = (e) => e.preventDefault()

    box.addEventListener('mousedown', onDown, true)
    box.addEventListener('contextmenu', onContextMenu)
    return () => {
      box.removeEventListener('mousedown', onDown, true)
      box.removeEventListener('contextmenu', onContextMenu)
    }
  }, [scrollRef, panReady])

  return { panReady, panning }
}
