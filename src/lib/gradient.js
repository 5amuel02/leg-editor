/**
 * Isian gradien linear untuk bentuk, bingkai, balon chat, dan grup.
 *
 * Fabric menyerialisasi objek `Gradient` secara bawaan, jadi tidak ada
 * properti kustom tambahan yang perlu didaftarkan ke `EXTRA_PROPS`.
 */
import * as fabric from 'fabric'

export const DEFAULT_GRADIENT = { from: '#8b5cf6', to: '#ec4899', angle: 90 }

/**
 * Ujung garis gradien untuk sebuah sudut, dalam satuan PERSENTASE (0–1)
 * terhadap kotak pembatas objek.
 *
 * Satuan persentase dipilih daripada piksel supaya satu objek `Gradient` yang
 * sama benar untuk objek berukuran apa pun. Itu penting saat gradien
 * diterapkan ke sebuah grup: patch yang sama diteruskan ke setiap anak, dan
 * dengan satuan piksel anak yang lebih kecil akan menerima garis gradien yang
 * jauh melampaui dirinya sehingga hanya tampak satu warna rata.
 */
export function gradientCoords(angle) {
  const rad = (angle * Math.PI) / 180
  const dx = Math.cos(rad) / 2
  const dy = Math.sin(rad) / 2
  return { x1: 0.5 - dx, y1: 0.5 - dy, x2: 0.5 + dx, y2: 0.5 + dy }
}

/** Apakah nilai `fill` sebuah objek berupa gradien (bukan warna solid). */
export function isGradientFill(fill) {
  return !!fill && typeof fill === 'object' && Array.isArray(fill.colorStops)
}

/**
 * Membaca gradien objek menjadi bentuk datar untuk panel.
 * Objek tanpa gradien mengembalikan nilai bawaan dengan `enabled: false`.
 */
export function readGradient(obj) {
  const fill = obj?.fill
  if (!isGradientFill(fill)) return { ...DEFAULT_GRADIENT, enabled: false }

  const stops = [...fill.colorStops].sort((a, b) => a.offset - b.offset)
  const coords = fill.coords || {}
  const dx = (coords.x2 ?? 1) - (coords.x1 ?? 0)
  const dy = (coords.y2 ?? 0) - (coords.y1 ?? 0)
  const angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI)

  return {
    enabled: true,
    from: stops[0]?.color || DEFAULT_GRADIENT.from,
    to: stops[stops.length - 1]?.color || DEFAULT_GRADIENT.to,
    // atan2 menghasilkan -180..180; panel memakai 0..360.
    angle: (angle + 360) % 360,
  }
}

/** Membangun patch `{ fill }` berisi gradien linear. */
export function gradientPatch(value) {
  return {
    fill: new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'percentage',
      coords: gradientCoords(value.angle),
      colorStops: [
        { offset: 0, color: value.from },
        { offset: 1, color: value.to },
      ],
    }),
  }
}
