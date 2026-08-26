/**
 * Ekspor & unduh.
 *
 * Semua proses render dilakukan di offscreen `fabric.StaticCanvas` pada
 * skala 100%, sehingga hasil ekspor tidak terpengaruh zoom/pan yang sedang
 * aktif di editor, dan halaman non-aktif pun bisa diekspor tanpa dibuka.
 */
import * as fabric from 'fabric'
import { jsPDF } from 'jspdf'

/** Memicu unduhan sebuah data URL / blob URL sebagai file. */
export function downloadURL(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Membersihkan string agar aman dipakai sebagai nama file. */
export function safeFileName(name) {
  return (name || 'desain').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
}

/**
 * Merender satu halaman ke offscreen canvas dan mengembalikan data URL.
 * `multiplier` 2 / 3 dipakai untuk ekspor resolusi tinggi.
 */
export async function renderPageToDataURL(page, size, { multiplier = 1, format = 'png' } = {}) {
  const el = document.createElement('canvas')
  el.width = size.width
  el.height = size.height

  const staticCanvas = new fabric.StaticCanvas(el, {
    width: size.width,
    height: size.height,
    backgroundColor: page.background || '#ffffff',
    enableRetinaScaling: false,
  })

  try {
    await staticCanvas.loadFromJSON(page.json)
    // loadFromJSON tidak mengubah dimensi kanvas, jadi kita pastikan lagi.
    staticCanvas.setDimensions({ width: size.width, height: size.height })
    if (!staticCanvas.backgroundColor) {
      staticCanvas.backgroundColor = page.background || '#ffffff'
    }
    staticCanvas.renderAll()

    return staticCanvas.toDataURL({
      format,
      quality: 1,
      multiplier,
      enableRetinaScaling: false,
    })
  } finally {
    staticCanvas.dispose()
  }
}

/** Ekspor satu halaman menjadi berkas PNG. */
export async function exportPagePNG(project, pageIndex, multiplier = 2) {
  const page = project.pages[pageIndex]
  const url = await renderPageToDataURL(page, project.size, { multiplier, format: 'png' })
  downloadURL(url, `${safeFileName(project.name)} - ${safeFileName(page.name)} @${multiplier}x.png`)
}

/**
 * Ekspor seluruh halaman (yang tidak disembunyikan) sebagai PNG berurutan.
 * Diberi jeda kecil supaya browser tidak memblokir unduhan beruntun.
 */
export async function exportAllPagesPNG(project, multiplier = 2, onProgress) {
  const pages = project.pages.map((p, i) => ({ p, i })).filter(({ p }) => !p.hidden)
  for (let n = 0; n < pages.length; n++) {
    const { i } = pages[n]
    await exportPagePNG(project, i, multiplier)
    onProgress?.(n + 1, pages.length)
    await new Promise((r) => setTimeout(r, 350))
  }
}

/**
 * Ekspor seluruh halaman menjadi satu berkas PDF multi-halaman.
 * Ukuran PDF mengikuti dimensi kanvas (satuan px) agar rasio tetap presisi.
 */
export async function exportProjectPDF(project, { multiplier = 2, onProgress } = {}) {
  const pages = project.pages.filter((p) => !p.hidden)
  if (pages.length === 0) throw new Error('Tidak ada halaman yang bisa diekspor (semua disembunyikan).')

  const { width, height } = project.size
  const orientation = width >= height ? 'landscape' : 'portrait'

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
    compress: true,
  })

  for (let i = 0; i < pages.length; i++) {
    const dataUrl = await renderPageToDataURL(pages[i], project.size, {
      multiplier,
      format: 'jpeg',
    })
    if (i > 0) pdf.addPage([width, height], orientation)
    pdf.addImage(dataUrl, 'JPEG', 0, 0, width, height, undefined, 'FAST')
    onProgress?.(i + 1, pages.length)
  }

  pdf.save(`${safeFileName(project.name)}.pdf`)
}

/* ------------------------------------------------------------------ */
/* Simpan / muat project sebagai JSON                                  */
/* ------------------------------------------------------------------ */

/** Mengunduh seluruh project (semua halaman) sebagai satu berkas .json. */
export function downloadProjectJSON(project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  downloadURL(url, `${safeFileName(project.name)}.leg.json`)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Membaca berkas project .json yang dipilih user dari device. */
export function readProjectFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error('Berkas bukan JSON yang valid.'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'))
    reader.readAsText(file)
  })
}

/** Membaca berkas gambar menjadi data URL (base64) untuk disimpan lokal. */
export function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca gambar.'))
    reader.readAsDataURL(file)
  })
}

/** Mengambil dimensi asli sebuah gambar dari data URL. */
export function getImageSize(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = dataUrl
  })
}
