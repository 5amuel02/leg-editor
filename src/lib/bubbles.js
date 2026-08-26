/**
 * Balon percakapan (chat bubble).
 *
 * Setiap varian dibangun sebagai satu `path` SVG utuh — bukan gabungan
 * beberapa objek — supaya warna isi, garis tepi, dan ketebalannya bisa diatur
 * lewat satu properti yang sama seperti bentuk lain.
 */
import * as fabric from 'fabric'
import { tagObject } from './fabricUtils'

/** Membulatkan angka agar string path tetap pendek dan rapi. */
const n = (v) => Math.round(v * 100) / 100

/**
 * Balon berbentuk kotak (sudut siku maupun membulat) dengan ekor di bawah.
 * `radius` 0 menghasilkan sudut siku.
 */
function boxBubble(w, h, tail, radius) {
  const bodyH = h * 0.78
  const r = Math.min(radius, bodyH / 2, w / 2)

  // Dua pangkal ekor + ujungnya. Ditulis berurutan mengikuti arah gambar
  // (tepi bawah ditelusuri dari kanan ke kiri).
  const t =
    tail === 'left'
      ? { base1: w * 0.38, tip: w * 0.12, base2: w * 0.22 }
      : { base1: w * 0.78, tip: w * 0.88, base2: w * 0.62 }

  const d = [`M ${n(r)} 0`, `H ${n(w - r)}`]
  if (r > 0) d.push(`A ${n(r)} ${n(r)} 0 0 1 ${n(w)} ${n(r)}`)
  d.push(`V ${n(bodyH - r)}`)
  if (r > 0) d.push(`A ${n(r)} ${n(r)} 0 0 1 ${n(w - r)} ${n(bodyH)}`)

  d.push(
    `H ${n(t.base1)}`,
    `L ${n(t.tip)} ${n(h)}`,
    `L ${n(t.base2)} ${n(bodyH)}`,
    `H ${n(r)}`,
  )

  if (r > 0) d.push(`A ${n(r)} ${n(r)} 0 0 1 0 ${n(bodyH - r)}`)
  d.push(`V ${n(r)}`)
  if (r > 0) d.push(`A ${n(r)} ${n(r)} 0 0 1 ${n(r)} 0`)
  d.push('Z')

  return d.join(' ')
}

/**
 * Balon oval dengan ekor.
 * Badan digambar sebagai satu busur besar (>180°) sehingga tersisa satu
 * "celah" pada elips yang kemudian ditutup oleh segitiga ekor.
 */
function ovalBubble(w, h, tail) {
  const bodyH = h * 0.8
  const rx = w / 2
  const ry = bodyH / 2
  const point = (deg) => {
    const a = (deg * Math.PI) / 180
    return [rx + rx * Math.cos(a), ry + ry * Math.sin(a)]
  }

  // Kiri: telusuri searah sudut positif (sweep 1). Kanan: arah sebaliknya.
  const [startDeg, endDeg, sweep] = tail === 'left' ? [150, 115, 1] : [30, 65, 0]
  const [sx, sy] = point(startDeg)
  const [ex, ey] = point(endDeg)
  const tipX = tail === 'left' ? w * 0.1 : w * 0.9

  return [
    `M ${n(sx)} ${n(sy)}`,
    `A ${n(rx)} ${n(ry)} 0 1 ${sweep} ${n(ex)} ${n(ey)}`,
    `L ${n(tipX)} ${n(h)}`,
    'Z',
  ].join(' ')
}

/** Satu lingkaran penuh sebagai sub-path (dipakai balon pikiran). */
function circleSubPath(cx, cy, r) {
  return [
    `M ${n(cx - r)} ${n(cy)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(cy)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(cx - r)} ${n(cy)}`,
    'Z',
  ].join(' ')
}

/** Balon pikiran: awan oval besar + dua gelembung kecil di bawahnya. */
function thoughtBubble(w, h, tail) {
  const bodyH = h * 0.72
  const rx = w / 2
  const ry = bodyH / 2

  const body = [
    `M 0 ${n(ry)}`,
    `A ${n(rx)} ${n(ry)} 0 0 1 ${n(w)} ${n(ry)}`,
    `A ${n(rx)} ${n(ry)} 0 0 1 0 ${n(ry)}`,
    'Z',
  ].join(' ')

  const dir = tail === 'left' ? -1 : 1
  const big = circleSubPath(rx + dir * rx * 0.45, bodyH + h * 0.11, h * 0.075)
  const small = circleSubPath(rx + dir * rx * 0.68, bodyH + h * 0.23, h * 0.045)

  return `${body} ${big} ${small}`
}

/** Balon teriakan: poligon berduri seperti ledakan komik. */
function burstBubble(w, h, spikes = 12) {
  const rx = w / 2
  const ry = h / 2
  const points = []
  for (let i = 0; i < spikes * 2; i++) {
    const factor = i % 2 === 0 ? 1 : 0.74
    const a = (Math.PI * i) / spikes - Math.PI / 2
    points.push(`${n(rx + Math.cos(a) * rx * factor)} ${n(ry + Math.sin(a) * ry * factor)}`)
  }
  return `M ${points.join(' L ')} Z`
}

/** Katalog balon percakapan yang tampil di tab Elemen. */
export const CHAT_BUBBLES = [
  { id: 'bubble-square-left', label: 'Kotak — ekor kiri' },
  { id: 'bubble-square-right', label: 'Kotak — ekor kanan' },
  { id: 'bubble-round-left', label: 'Kotak bulat — ekor kiri' },
  { id: 'bubble-round-right', label: 'Kotak bulat — ekor kanan' },
  { id: 'bubble-oval-left', label: 'Oval — ekor kiri' },
  { id: 'bubble-oval-right', label: 'Oval — ekor kanan' },
  { id: 'bubble-thought-left', label: 'Pikiran — kiri' },
  { id: 'bubble-thought-right', label: 'Pikiran — kanan' },
  { id: 'bubble-burst', label: 'Teriakan' },
]

/** Mengembalikan string path SVG untuk sebuah varian balon. */
export function bubblePath(id, w, h) {
  switch (id) {
    case 'bubble-square-left':
      return boxBubble(w, h, 'left', 0)
    case 'bubble-square-right':
      return boxBubble(w, h, 'right', 0)
    case 'bubble-round-left':
      return boxBubble(w, h, 'left', Math.min(w, h) * 0.16)
    case 'bubble-round-right':
      return boxBubble(w, h, 'right', Math.min(w, h) * 0.16)
    case 'bubble-oval-left':
      return ovalBubble(w, h, 'left')
    case 'bubble-oval-right':
      return ovalBubble(w, h, 'right')
    case 'bubble-thought-left':
      return thoughtBubble(w, h, 'left')
    case 'bubble-thought-right':
      return thoughtBubble(w, h, 'right')
    case 'bubble-burst':
      return burstBubble(w, h)
    default:
      return boxBubble(w, h, 'left', Math.min(w, h) * 0.16)
  }
}

/** Membuat objek Fabric untuk sebuah balon percakapan. */
export function createChatBubble(id, width, height, style = {}) {
  const path = new fabric.Path(bubblePath(id, width, height), {
    fill: style.fill ?? '#ffffff',
    stroke: style.stroke ?? '#1e293b',
    strokeWidth: style.strokeWidth ?? Math.max(2, Math.round(width * 0.012)),
    strokeUniform: true,
    strokeLineJoin: 'round',
    originX: 'left',
    originY: 'top',
  })
  const label = CHAT_BUBBLES.find((b) => b.id === id)?.label
  return tagObject(path, 'bubble', label ? `Balon: ${label}` : 'Balon Chat')
}
