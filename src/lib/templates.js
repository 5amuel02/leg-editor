/**
 * Template desain siap pakai.
 *
 * Template ditulis secara DEKLARATIF dengan koordinat ternormalisasi (0–1
 * terhadap lebar/tinggi kanvas), bukan sebagai JSON Fabric mentah. Dua
 * alasannya:
 *
 * 1. Satu template bisa dipakai di ukuran kanvas mana pun — poster A4 dan
 *    Instagram Post memakai definisi yang sama, tata letaknya ikut menskala.
 * 2. JSON Fabric mentah rapuh terhadap perubahan versi; membangun objek lewat
 *    Fabric sendiri memastikan hasilnya selalu valid.
 *
 * Objek dirakit di `StaticCanvas` sementara di luar layar lalu diserialisasi,
 * sehingga halaman yang dihasilkan identik bentuknya dengan halaman yang
 * dibuat pengguna secara manual.
 */
import * as fabric from 'fabric'
import { EXTRA_PROPS, tagObject } from './fabricUtils'
import { uid } from './project'

/**
 * Ukuran font ditulis sebagai pecahan dari sisi TERPENDEK kanvas.
 * Memakai lebar saja membuat judul pada kanvas story (1080×1920) terlihat
 * jauh lebih kecil dibanding pada poster, karena tinggi ikut memanjang.
 */
const fontPx = (frac, w, h) => Math.round(frac * Math.min(w, h))

export const TEMPLATES = [
  {
    id: 'promo-diskon',
    label: 'Promo Diskon',
    description: 'Latar gelap dengan angka diskon besar dan ajakan bertindak.',
    presetId: 'ig-post',
    background: '#0f172a',
    elements: [
      { kind: 'rect', x: 0.08, y: 0.1, w: 0.36, h: 0.09, fill: '#f59e0b', rx: 0.045 },
      { kind: 'text', x: 0.105, y: 0.129, w: 0.31, text: 'PENAWARAN TERBATAS', size: 0.023, weight: 'bold', fill: '#0f172a', align: 'center' },
      { kind: 'text', x: 0.08, y: 0.26, w: 0.84, text: 'DISKON\n50%', size: 0.17, weight: 'bold', fill: '#ffffff', lineHeight: 0.95 },
      { kind: 'text', x: 0.08, y: 0.63, w: 0.7, text: 'Untuk semua produk pilihan. Berlaku sampai akhir bulan.', size: 0.038, fill: '#cbd5e1' },
      { kind: 'rect', x: 0.08, y: 0.79, w: 0.42, h: 0.1, fill: '#f59e0b', rx: 0.05 },
      { kind: 'text', x: 0.08, y: 0.822, w: 0.42, text: 'Belanja Sekarang', size: 0.038, weight: 'bold', fill: '#0f172a', align: 'center' },
    ],
  },
  {
    id: 'kutipan',
    label: 'Kartu Kutipan',
    description: 'Kutipan besar di tengah dengan aksen garis.',
    presetId: 'ig-post',
    background: '#fef3c7',
    elements: [
      { kind: 'rect', x: 0.12, y: 0.2, w: 0.09, h: 0.011, fill: '#b45309' },
      { kind: 'text', x: 0.12, y: 0.28, w: 0.76, text: 'Desain bukan soal bagaimana tampilannya, tapi bagaimana ia bekerja.', size: 0.062, weight: 'bold', fill: '#78350f', lineHeight: 1.22 },
      { kind: 'text', x: 0.12, y: 0.72, w: 0.6, text: '— Steve Jobs', size: 0.034, fill: '#92400e' },
    ],
  },
  {
    id: 'sampul-presentasi',
    label: 'Sampul Presentasi',
    description: 'Halaman judul dengan blok warna di sisi kiri.',
    presetId: 'presentation',
    background: '#ffffff',
    elements: [
      { kind: 'rect', x: 0, y: 0, w: 0.36, h: 1, fill: '#4f46e5' },
      { kind: 'rect', x: 0.06, y: 0.42, w: 0.1, h: 0.014, fill: '#c7d2fe' },
      { kind: 'text', x: 0.06, y: 0.5, w: 0.26, text: 'Laporan\nKuartal', size: 0.075, weight: 'bold', fill: '#ffffff', lineHeight: 1.1 },
      { kind: 'text', x: 0.44, y: 0.36, w: 0.5, text: 'Judul Presentasi', size: 0.095, weight: 'bold', fill: '#1e1b4b', lineHeight: 1.1 },
      { kind: 'text', x: 0.44, y: 0.58, w: 0.48, text: 'Subjudul singkat yang menjelaskan isi presentasi dalam satu kalimat.', size: 0.036, fill: '#64748b' },
    ],
  },
  {
    id: 'thumbnail-yt',
    label: 'Thumbnail YouTube',
    description: 'Teks tebal berkontras tinggi dengan bilah aksen.',
    presetId: 'yt-thumb',
    background: '#111827',
    elements: [
      { kind: 'rect', x: 0, y: 0, w: 0.018, h: 1, fill: '#ef4444' },
      { kind: 'text', x: 0.07, y: 0.2, w: 0.72, text: 'CARA CEPAT\nBIKIN DESAIN', size: 0.13, weight: 'bold', fill: '#ffffff', lineHeight: 1.05 },
      { kind: 'rect', x: 0.07, y: 0.72, w: 0.26, h: 0.11, fill: '#ef4444', rx: 0.02 },
      { kind: 'text', x: 0.07, y: 0.755, w: 0.26, text: 'TANPA APLIKASI', size: 0.04, weight: 'bold', fill: '#ffffff', align: 'center' },
    ],
  },
  {
    id: 'story-pengumuman',
    label: 'Story Pengumuman',
    description: 'Format vertikal dengan judul tengah dan panel bawah.',
    presetId: 'ig-story',
    background: '#065f46',
    elements: [
      { kind: 'text', x: 0.1, y: 0.16, w: 0.8, text: 'PENGUMUMAN', size: 0.045, weight: 'bold', fill: '#6ee7b7', align: 'center' },
      { kind: 'text', x: 0.1, y: 0.26, w: 0.8, text: 'Kami Buka\nCabang Baru', size: 0.11, weight: 'bold', fill: '#ffffff', align: 'center', lineHeight: 1.1 },
      { kind: 'rect', x: 0.1, y: 0.62, w: 0.8, h: 0.22, fill: '#ffffff', rx: 0.04 },
      { kind: 'text', x: 0.15, y: 0.675, w: 0.7, text: 'Jl. Merdeka No. 12\nBuka setiap hari 09.00–21.00', size: 0.038, fill: '#065f46', align: 'center', lineHeight: 1.35 },
    ],
  },
  {
    id: 'surat-a4',
    label: 'Dokumen A4',
    description: 'Kop sederhana dengan judul dan paragraf isi.',
    presetId: 'a4',
    background: '#ffffff',
    elements: [
      { kind: 'rect', x: 0.1, y: 0.07, w: 0.8, h: 0.004, fill: '#1e293b' },
      { kind: 'text', x: 0.1, y: 0.085, w: 0.8, text: 'NAMA ORGANISASI', size: 0.03, weight: 'bold', fill: '#1e293b' },
      { kind: 'text', x: 0.1, y: 0.115, w: 0.8, text: 'Alamat lengkap · Telepon · Surel', size: 0.018, fill: '#64748b' },
      { kind: 'text', x: 0.1, y: 0.2, w: 0.8, text: 'Judul Dokumen', size: 0.048, weight: 'bold', fill: '#0f172a' },
      { kind: 'text', x: 0.1, y: 0.27, w: 0.8, text: 'Tulis isi dokumen di sini. Klik dua kali untuk mengetik, lalu atur font dan ukurannya di panel properti sebelah kanan.', size: 0.022, fill: '#334155', lineHeight: 1.5 },
    ],
  },
]

export function findTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null
}

/** Membangun satu objek Fabric dari deskriptor template. */
function buildElement(el, w, h) {
  if (el.kind === 'rect') {
    const radius = el.rx ? el.rx * Math.min(w, h) : 0
    const rect = new fabric.Rect({
      left: el.x * w,
      top: el.y * h,
      width: el.w * w,
      height: el.h * h,
      fill: el.fill,
      rx: radius,
      ry: radius,
      strokeWidth: 0,
      strokeUniform: true,
      originX: 'left',
      originY: 'top',
    })
    return tagObject(rect, 'shape', 'Bentuk')
  }

  const box = new fabric.Textbox(el.text, {
    left: el.x * w,
    top: el.y * h,
    width: el.w * w,
    fontSize: fontPx(el.size, w, h),
    fontWeight: el.weight || 'normal',
    fontFamily: 'Inter, sans-serif',
    fill: el.fill,
    textAlign: el.align || 'left',
    lineHeight: el.lineHeight || 1.16,
    originX: 'left',
    originY: 'top',
    editable: true,
  })
  return tagObject(box, 'text', el.text.slice(0, 24))
}

/**
 * Merakit template menjadi satu halaman siap pakai.
 *
 * Memakai `StaticCanvas` di luar layar: elemen teks butuh pengukuran yang
 * hanya tersedia lewat DOM, dan hasil serialisasinya dijamin sama persis
 * dengan halaman buatan pengguna.
 */
export function buildTemplatePage(template, size) {
  const { width: w, height: h } = size
  const canvas = new fabric.StaticCanvas(undefined, {
    width: w,
    height: h,
    backgroundColor: template.background,
    renderOnAddRemove: false,
  })

  try {
    template.elements.forEach((el) => canvas.add(buildElement(el, w, h)))
    return {
      id: uid('page'),
      name: 'Halaman 1',
      json: canvas.toObject(EXTRA_PROPS),
      thumbnail: null,
      hidden: false,
      locked: false,
      background: template.background,
    }
  } finally {
    // Kanvas sementara harus dibuang, kalau tidak elemen <canvas>-nya bocor.
    canvas.dispose()
  }
}
