/**
 * Bayangan (drop shadow) untuk bentuk, gambar, bingkai, balon chat, dan tabel.
 *
 * Fabric menyerialisasi properti `shadow` secara bawaan, jadi tidak ada
 * properti kustom baru yang perlu didaftarkan ke `EXTRA_PROPS`.
 *
 * Teks sengaja tidak memakai panel ini: teks sudah punya 16 preset di
 * `textEffects.js` dan sebagian di antaranya (Bayangan Tebal, Neon, Glitch)
 * mengatur `shadow` sendiri — dua pengendali untuk satu properti hanya akan
 * saling menimpa.
 */
import * as fabric from 'fabric'

/** Nilai awal saat pengguna menyalakan bayangan. */
export const DEFAULT_SHADOW = {
  color: '#0f172a',
  opacity: 0.35,
  blur: 18,
  offsetX: 6,
  offsetY: 8,
}

/** `#1e293b` -> `rgba(30, 41, 59, 0.35)` */
export function hexToRgba(hex, opacity = 1) {
  let h = String(hex || '#000000').replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) h = '000000'
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const a = Math.min(1, Math.max(0, opacity))
  return `rgba(${r}, ${g}, ${b}, ${Math.round(a * 1000) / 1000})`
}

/** Kebalikan `hexToRgba` — dipakai agar panel bisa menampilkan nilai tersimpan. */
export function rgbaToHex(color) {
  const str = String(color || '')
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/i)
  if (!m) {
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(str) ? str : DEFAULT_SHADOW.color
    return { color: hex, opacity: 1 }
  }
  const toHex = (n) => Math.min(255, Math.max(0, Number(n))).toString(16).padStart(2, '0')
  return {
    color: `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`,
    opacity: m[4] === undefined ? 1 : Number(m[4]),
  }
}

/**
 * Membaca bayangan sebuah objek menjadi bentuk datar yang dipakai panel.
 * `enabled` false berarti objek belum punya bayangan sama sekali.
 */
export function readShadow(obj) {
  const s = obj?.shadow
  if (!s) return { ...DEFAULT_SHADOW, enabled: false }
  const { color, opacity } = rgbaToHex(s.color)
  return {
    enabled: true,
    color,
    opacity,
    blur: Number.isFinite(s.blur) ? s.blur : DEFAULT_SHADOW.blur,
    offsetX: Number.isFinite(s.offsetX) ? s.offsetX : DEFAULT_SHADOW.offsetX,
    offsetY: Number.isFinite(s.offsetY) ? s.offsetY : DEFAULT_SHADOW.offsetY,
  }
}

/**
 * Membangun patch `{ shadow }` yang siap diberikan ke `updateSelected`.
 * `enabled: false` menghasilkan `shadow: null` sehingga bayangan dilepas.
 */
export function shadowPatch(value) {
  if (!value?.enabled) return { shadow: null }
  return {
    shadow: new fabric.Shadow({
      color: hexToRgba(value.color, value.opacity),
      blur: value.blur,
      offsetX: value.offsetX,
      offsetY: value.offsetY,
      // Bayangan ikut membesar bersama objek supaya proporsinya tetap
      // terlihat sama saat elemen di-scale.
      nonScaling: false,
    }),
  }
}

/** Jenis elemen yang boleh diberi bayangan lewat panel properti. */
export const SHADOW_TYPES = ['shape', 'bubble', 'frame', 'image', 'table', 'arrow', 'draw', 'line']

export function supportsShadow(legType) {
  return SHADOW_TYPES.includes(legType)
}
