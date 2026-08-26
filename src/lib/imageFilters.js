/**
 * Penyesuaian gambar (brightness, contrast, saturasi, dst).
 *
 * Semuanya memakai `fabric.filters.*` bawaan sehingga tidak ada dependensi
 * baru dan pemrosesannya tetap sepenuhnya di browser.
 *
 * Fabric ikut menyerialisasi array `filters` pada objek Image, jadi hasil
 * penyesuaian otomatis tersimpan bersama project tanpa properti kustom.
 * Filter bersifat non-destruktif: yang tersimpan hanya angkanya, piksel asli
 * gambar tidak pernah ditimpa — persis seperti crop di aplikasi ini.
 */
import * as fabric from 'fabric'

/**
 * Katalog penyesuaian. `neutral` adalah nilai "tidak ada efek" — dipakai
 * untuk menyembunyikan filter dari pipeline supaya render tetap murah.
 */
export const ADJUSTMENTS = [
  { id: 'brightness', label: 'Kecerahan', filter: 'Brightness', prop: 'brightness', min: -1, max: 1, step: 0.01, neutral: 0 },
  { id: 'contrast', label: 'Kontras', filter: 'Contrast', prop: 'contrast', min: -1, max: 1, step: 0.01, neutral: 0 },
  { id: 'saturation', label: 'Saturasi', filter: 'Saturation', prop: 'saturation', min: -1, max: 1, step: 0.01, neutral: 0 },
  { id: 'vibrance', label: 'Vibrance', filter: 'Vibrance', prop: 'vibrance', min: -1, max: 1, step: 0.01, neutral: 0 },
  { id: 'hue', label: 'Rona warna', filter: 'HueRotation', prop: 'rotation', min: -1, max: 1, step: 0.01, neutral: 0 },
  { id: 'blur', label: 'Blur', filter: 'Blur', prop: 'blur', min: 0, max: 1, step: 0.01, neutral: 0 },
  { id: 'noise', label: 'Noise', filter: 'Noise', prop: 'noise', min: 0, max: 200, step: 1, neutral: 0 },
  { id: 'pixelate', label: 'Pixelate', filter: 'Pixelate', prop: 'blocksize', min: 1, max: 40, step: 1, neutral: 1 },
]

/** Efek on/off tanpa parameter. */
export const TOGGLE_FILTERS = [
  { id: 'grayscale', label: 'Hitam putih', filter: 'Grayscale' },
  { id: 'sepia', label: 'Sepia', filter: 'Sepia' },
  { id: 'invert', label: 'Invert', filter: 'Invert' },
]

/** Semua nilai netral — dipakai tombol "Reset". */
export function neutralAdjustments() {
  const out = {}
  ADJUSTMENTS.forEach((a) => {
    out[a.id] = a.neutral
  })
  TOGGLE_FILTERS.forEach((t) => {
    out[t.id] = false
  })
  return out
}

/**
 * Membaca kembali nilai penyesuaian dari array `filters` sebuah gambar,
 * supaya slider di panel menampilkan posisi yang benar setelah project
 * dibuka ulang.
 */
export function readAdjustments(img) {
  const values = neutralAdjustments()
  const filters = Array.isArray(img?.filters) ? img.filters : []

  filters.forEach((f) => {
    if (!f) return
    const kind = f.type || f.constructor?.type || f.constructor?.name
    const adj = ADJUSTMENTS.find((a) => a.filter === kind)
    if (adj) {
      const v = f[adj.prop]
      if (Number.isFinite(v)) values[adj.id] = v
      return
    }
    const toggle = TOGGLE_FILTERS.find((t) => t.filter === kind)
    if (toggle) values[toggle.id] = true
  })

  return values
}

/** Apakah ada penyesuaian yang aktif (dipakai untuk menandai tombol Reset). */
export function hasAdjustments(values) {
  if (!values) return false
  return (
    ADJUSTMENTS.some((a) => Number(values[a.id]) !== a.neutral) ||
    TOGGLE_FILTERS.some((t) => !!values[t.id])
  )
}

/**
 * Menyusun ulang pipeline filter gambar dari nilai panel lalu me-render ulang.
 *
 * Filter bernilai netral sengaja tidak dimasukkan ke array: setiap filter
 * berarti satu lintasan WebGL/canvas tambahan, jadi membuang yang tidak
 * berpengaruh membuat penyesuaian tetap responsif pada gambar besar.
 */
export function applyAdjustments(img, values) {
  if (!img || typeof img.applyFilters !== 'function') return

  const next = []

  ADJUSTMENTS.forEach((a) => {
    const v = Number(values?.[a.id])
    if (!Number.isFinite(v) || v === a.neutral) return
    const Ctor = fabric.filters[a.filter]
    if (Ctor) next.push(new Ctor({ [a.prop]: v }))
  })

  TOGGLE_FILTERS.forEach((t) => {
    if (!values?.[t.id]) return
    const Ctor = fabric.filters[t.filter]
    if (Ctor) next.push(new Ctor())
  })

  img.filters = next
  img.applyFilters()
}
