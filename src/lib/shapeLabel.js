/**
 * Teks di dalam shape (label).
 *
 * Dobel-klik sebuah bentuk atau balon chat akan membuat kotak teks yang
 * "menempel" pada bentuk itu: selalu di tengahnya, ikut bergerak, ikut
 * berputar, dan ikut menyesuaikan lebar saat bentuknya diresize.
 *
 * Label disimpan sebagai objek Fabric TERSENDIRI, bukan sebagai anak sebuah
 * Group. Alasannya: Textbox hanya bisa diedit langsung di kanvas kalau ia
 * berada di kanvas — di dalam Group, dobel-klik harus masuk ke grup dulu dan
 * pengeditannya jadi berlapis. Keterikatannya dijaga lewat sepasang id:
 * bentuk menyimpan `legLabelId`, label menyimpan `legLabelFor`.
 *
 * Label sengaja dibuat tidak bisa diklik (`selectable`/`evented` false) supaya
 * terasa menyatu dengan bentuknya — klik mengenai bentuk, bukan teksnya.
 * Ia hanya "dihidupkan" sementara saat sedang diedit.
 */
import * as fabric from 'fabric'
import { EXTRA_PROPS, getLegType, tagObject } from './fabricUtils'

/** Lebar label relatif terhadap lebar bentuk, menyisakan ruang di tepi. */
const WIDTH_RATIO = 0.82

/** Jenis elemen yang boleh diberi teks di dalamnya. */
const LABELABLE = ['shape', 'bubble']

export function isLabelable(obj) {
  return !!obj && LABELABLE.includes(getLegType(obj))
}

/** Apakah objek ini adalah label milik sebuah bentuk? */
export function isLabel(obj) {
  return !!obj?.legLabelFor
}

/** Mencari label milik sebuah bentuk di kanvas. */
export function findLabel(canvas, shape) {
  if (!canvas || !shape?.legLabelId) return null
  return canvas.getObjects().find((o) => o.id === shape.legLabelId) || null
}

/** Mencari bentuk pemilik sebuah label. */
export function findOwner(canvas, label) {
  if (!canvas || !label?.legLabelFor) return null
  return canvas.getObjects().find((o) => o.id === label.legLabelFor) || null
}

/**
 * Menyetel ulang posisi, sudut, dan lebar label mengikuti bentuknya.
 *
 * Ukuran font TIDAK ikut diskalakan saat bentuk diresize — yang berubah hanya
 * lebar kotaknya, sehingga teks membungkus ulang. Menskalakan font akan
 * membuat teks ikut gepeng saat bentuk diresize tidak proporsional.
 */
export function syncLabel(shape, label) {
  if (!shape || !label) return

  const width = Math.max(20, shape.getScaledWidth() * WIDTH_RATIO)
  label.set({ width, angle: shape.angle || 0, scaleX: 1, scaleY: 1 })
  label.initDimensions?.()

  // Dipusatkan lewat titik pusat, bukan left/top, supaya tetap benar pada
  // bentuk yang diputar maupun yang titik asalnya bukan kiri-atas.
  label.setPositionByOrigin(shape.getCenterPoint(), 'center', 'center')
  label.setCoords()
}

/**
 * Warna teks bawaan, dipilih dari kecerahan isian bentuknya.
 *
 * Satu warna tetap tidak bisa benar untuk semua bentuk: putih hilang di atas
 * bentuk kuning, hitam hilang di atas bentuk gelap. Kecerahan dihitung dengan
 * pembobotan luminansi relatif — mata jauh lebih peka pada hijau daripada biru,
 * jadi rata-rata RGB biasa akan salah menilai warna seperti kuning.
 *
 * Isian yang bukan warna solid (gradien, pola) tidak bisa dinilai; untuk itu
 * dipakai putih, yang lebih sering benar karena gradien di sini cenderung pekat.
 */
export function contrastingTextColor(fill) {
  if (typeof fill !== 'string') return '#ffffff'

  let r, g, b
  const cocokHex = fill.replace('#', '')
  const rgb = fill.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)

  if (rgb) {
    ;[r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  } else if (/^[0-9a-f]{3}$/i.test(cocokHex)) {
    ;[r, g, b] = cocokHex.split('').map((c) => parseInt(c + c, 16))
  } else if (/^[0-9a-f]{6}$/i.test(cocokHex)) {
    r = parseInt(cocokHex.slice(0, 2), 16)
    g = parseInt(cocokHex.slice(2, 4), 16)
    b = parseInt(cocokHex.slice(4, 6), 16)
  } else {
    return '#ffffff'
  }

  const luminansi = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminansi > 0.6 ? '#0f172a' : '#ffffff'
}

/** Membuat label baru untuk sebuah bentuk (belum ditautkan). */
export function createLabel(shape, { fontSize } = {}) {
  const size = fontSize || Math.max(12, Math.round(shape.getScaledHeight() * 0.16))

  const label = new fabric.Textbox('', {
    fontSize: size,
    fontFamily: 'Inter, sans-serif',
    fill: contrastingTextColor(shape.fill),
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    lineHeight: 1.16,
    editable: true,
    // Tidak bisa dipilih lewat klik: label adalah bagian dari bentuknya.
    selectable: false,
    evented: false,
  })

  tagObject(label, 'text', 'Teks dalam bentuk')
  return label
}

/**
 * Melengkapi daftar objek dengan label yang harus ikut terhapus bersamanya,
 * sekaligus melepas tautan bila yang dihapus justru labelnya.
 */
export function withLabels(canvas, objects) {
  const out = new Set(objects)
  objects.forEach((obj) => {
    const label = findLabel(canvas, obj)
    if (label) out.add(label)
    if (isLabel(obj)) unlink(findOwner(canvas, obj))
  })
  return [...out]
}

/**
 * Menggandakan label sebuah bentuk untuk salinan bentuk itu.
 *
 * Tanpa ini, salinan akan membawa `legLabelId` milik aslinya dan dua bentuk
 * akan berebut satu kotak teks yang sama.
 */
export async function cloneLabelOnto(canvas, sourceLabel, targetShape, nextId) {
  if (!sourceLabel) {
    unlink(targetShape)
    return null
  }
  const clone = await sourceLabel.clone(EXTRA_PROPS)
  clone.set({ id: nextId, selectable: false, evented: false })
  link(targetShape, clone)
  canvas.add(clone)
  canvas.bringObjectToFront(clone)
  syncLabel(targetShape, clone)
  return clone
}

/** Menautkan label ke bentuk (dua arah). */
export function link(shape, label) {
  shape.set({ legLabelId: label.id })
  label.set({ legLabelFor: shape.id })
}

/** Melepas tautan dari sisi bentuk. */
export function unlink(shape) {
  shape?.set({ legLabelId: null })
}

/**
 * Menghidupkan label sementara agar bisa diedit.
 * Dikembalikan ke keadaan "bagian dari bentuk" oleh `endEditing`.
 */
export function beginEditing(canvas, label) {
  label.set({ selectable: true, evented: true })
  canvas.setActiveObject(label)
  label.enterEditing()
  label.selectAll?.()
  canvas.requestRenderAll()
}

/**
 * Mengembalikan label ke keadaan tidak bisa diklik setelah selesai diedit.
 * Label yang ditinggalkan kosong dihapus — kalau tidak, bentuk akan menyimpan
 * kotak teks tak terlihat yang membingungkan saat muncul di panel Layer.
 *
 * @returns {boolean} true bila label dihapus karena kosong
 */
export function endEditing(canvas, label) {
  const kosong = !String(label.text || '').trim()
  if (kosong) {
    const owner = findOwner(canvas, label)
    unlink(owner)
    canvas.remove(label)
    return true
  }
  label.set({ selectable: false, evented: false })
  return false
}
