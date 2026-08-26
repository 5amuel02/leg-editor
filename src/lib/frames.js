/**
 * Pustaka Bingkai (Frame).
 *
 * Sebuah bingkai adalah wadah gambar: saat kosong ia tampil sebagai siluet
 * abu-abu bergaris putus-putus, dan begitu diisi gambar, gambar tersebut
 * dipotong (clip) mengikuti bentuk bingkai.
 *
 * Semua bingkai dibangun sebagai satu string path SVG sehingga bentuk yang
 * sama bisa dipakai untuk tiga hal sekaligus: objek Fabric di kanvas,
 * `clipPath` gambar, dan pratinjau SVG di panel — tanpa duplikasi geometri.
 *
 * Catatan desain: bingkai berupa **siluet utuh**. Untuk bingkai perangkat
 * (laptop, monitor, jam) gambar mengisi seluruh siluet termasuk kaki/talinya,
 * bukan hanya area layar.
 */
import * as fabric from 'fabric'
import { tagObject } from './fabricUtils'

const n = (v) => Math.round(v * 100) / 100

/* ------------------------------------------------------------------ */
/* Helper geometri dasar                                               */
/* ------------------------------------------------------------------ */

function rectPath(w, h) {
  return `M 0 0 H ${n(w)} V ${n(h)} H 0 Z`
}

function roundedRectPath(w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  if (rr === 0) return rectPath(w, h)
  return [
    `M ${n(rr)} 0`,
    `H ${n(w - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(w)} ${n(rr)}`,
    `V ${n(h - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(w - rr)} ${n(h)}`,
    `H ${n(rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 0 ${n(h - rr)}`,
    `V ${n(rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(rr)} 0`,
    'Z',
  ].join(' ')
}

function ellipsePath(w, h) {
  const rx = w / 2
  const ry = h / 2
  return [
    `M 0 ${n(ry)}`,
    `A ${n(rx)} ${n(ry)} 0 0 1 ${n(w)} ${n(ry)}`,
    `A ${n(rx)} ${n(ry)} 0 0 1 0 ${n(ry)}`,
    'Z',
  ].join(' ')
}

/** Poligon beraturan bersisi `sides`, menyentuh kotak w×h. */
function polygonPath(w, h, sides, rotation = -Math.PI / 2) {
  const rx = w / 2
  const ry = h / 2
  const pts = []
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides + rotation
    pts.push(`${n(rx + Math.cos(a) * rx)} ${n(ry + Math.sin(a) * ry)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

function starPath(w, h, spikes = 5, innerRatio = 0.45) {
  const rx = w / 2
  const ry = h / 2
  const pts = []
  for (let i = 0; i < spikes * 2; i++) {
    const f = i % 2 === 0 ? 1 : innerRatio
    const a = (Math.PI * i) / spikes - Math.PI / 2
    pts.push(`${n(rx + Math.cos(a) * rx * f)} ${n(ry + Math.sin(a) * ry * f)}`)
  }
  return `M ${pts.join(' L ')} Z`
}

/* ------------------------------------------------------------------ */
/* Bentuk dasar                                                        */
/* ------------------------------------------------------------------ */

function heartPath(w, h) {
  return [
    `M ${n(w / 2)} ${n(h)}`,
    `C ${n(-w * 0.12)} ${n(h * 0.62)} ${n(w * 0.02)} ${n(h * 0.05)} ${n(w / 2)} ${n(h * 0.26)}`,
    `C ${n(w * 0.98)} ${n(h * 0.05)} ${n(w * 1.12)} ${n(h * 0.62)} ${n(w / 2)} ${n(h)}`,
    'Z',
  ].join(' ')
}

/** Lengkung: bagian bawah persegi, bagian atas setengah lingkaran. */
function archPath(w, h) {
  const r = w / 2
  return [
    `M 0 ${n(h)}`,
    `V ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w)} ${n(r)}`,
    `V ${n(h)}`,
    'Z',
  ].join(' ')
}

/** Bentuk organik/blob memakai kurva bezier. */
function blobPath(w, h) {
  return [
    `M ${n(w * 0.5)} ${n(h * 0.02)}`,
    `C ${n(w * 0.82)} ${n(h * 0.02)} ${n(w * 1.02)} ${n(h * 0.28)} ${n(w * 0.96)} ${n(h * 0.55)}`,
    `C ${n(w * 0.9)} ${n(h * 0.84)} ${n(w * 0.66)} ${n(h * 1.02)} ${n(w * 0.42)} ${n(h * 0.97)}`,
    `C ${n(w * 0.16)} ${n(h * 0.92)} ${n(-w * 0.03)} ${n(h * 0.68)} ${n(w * 0.03)} ${n(h * 0.4)}`,
    `C ${n(w * 0.09)} ${n(h * 0.14)} ${n(w * 0.25)} ${n(h * 0.02)} ${n(w * 0.5)} ${n(h * 0.02)}`,
    'Z',
  ].join(' ')
}

/* ------------------------------------------------------------------ */
/* Perangkat                                                           */
/* ------------------------------------------------------------------ */

function laptopPath(w, h) {
  return [
    `M ${n(w * 0.08)} 0`,
    `H ${n(w * 0.92)}`,
    `V ${n(h * 0.8)}`,
    `H ${n(w)}`,
    `L ${n(w * 0.94)} ${n(h)}`,
    `H ${n(w * 0.06)}`,
    `L 0 ${n(h * 0.8)}`,
    `H ${n(w * 0.08)}`,
    'Z',
  ].join(' ')
}

function monitorPath(w, h) {
  return [
    'M 0 0',
    `H ${n(w)}`,
    `V ${n(h * 0.72)}`,
    `H ${n(w * 0.56)}`,
    `V ${n(h * 0.88)}`,
    `H ${n(w * 0.76)}`,
    `V ${n(h)}`,
    `H ${n(w * 0.24)}`,
    `V ${n(h * 0.88)}`,
    `H ${n(w * 0.44)}`,
    `V ${n(h * 0.72)}`,
    'H 0',
    'Z',
  ].join(' ')
}

function watchPath(w, h) {
  const r = w * 0.16
  return [
    `M ${n(w * 0.3)} 0`,
    `H ${n(w * 0.7)}`,
    `V ${n(h * 0.16)}`,
    `H ${n(w * 0.94 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w * 0.94)} ${n(h * 0.16 + r)}`,
    `V ${n(h * 0.84 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w * 0.94 - r)} ${n(h * 0.84)}`,
    `H ${n(w * 0.7)}`,
    `V ${n(h)}`,
    `H ${n(w * 0.3)}`,
    `V ${n(h * 0.84)}`,
    `H ${n(w * 0.06 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w * 0.06)} ${n(h * 0.84 - r)}`,
    `V ${n(h * 0.16 + r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w * 0.06 + r)} ${n(h * 0.16)}`,
    `H ${n(w * 0.3)}`,
    'Z',
  ].join(' ')
}

function tvPath(w, h) {
  const r = w * 0.06
  return [
    `M ${n(r)} 0`,
    `H ${n(w - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w)} ${n(r)}`,
    `V ${n(h * 0.82 - r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(w - r)} ${n(h * 0.82)}`,
    `H ${n(w * 0.74)}`,
    `L ${n(w * 0.82)} ${n(h)}`,
    `H ${n(w * 0.68)}`,
    `L ${n(w * 0.6)} ${n(h * 0.82)}`,
    `H ${n(w * 0.4)}`,
    `L ${n(w * 0.32)} ${n(h)}`,
    `H ${n(w * 0.18)}`,
    `L ${n(w * 0.26)} ${n(h * 0.82)}`,
    `H ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 0 ${n(h * 0.82 - r)}`,
    `V ${n(r)}`,
    `A ${n(r)} ${n(r)} 0 0 1 ${n(r)} 0`,
    'Z',
  ].join(' ')
}

/* ------------------------------------------------------------------ */
/* Kertas                                                              */
/* ------------------------------------------------------------------ */

/** Kertas dengan tepi bawah sobek bergerigi. */
function tornPaperPath(w, h) {
  const teeth = 9
  const step = w / teeth
  const parts = ['M 0 0', `H ${n(w)}`, `V ${n(h * 0.84)}`]
  for (let i = 0; i < teeth; i++) {
    const x = w - step * (i + 1)
    const y = i % 2 === 0 ? h : h * 0.84
    parts.push(`L ${n(x + step / 2)} ${n(y)}`, `L ${n(x)} ${n(i % 2 === 0 ? h * 0.84 : h)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/** Tiket dengan takik setengah lingkaran di kiri & kanan. */
function ticketPath(w, h) {
  const nr = Math.min(h * 0.12, w * 0.08)
  const cy = h / 2
  return [
    'M 0 0',
    `H ${n(w)}`,
    `V ${n(cy - nr)}`,
    `A ${n(nr)} ${n(nr)} 0 0 0 ${n(w)} ${n(cy + nr)}`,
    `V ${n(h)}`,
    'H 0',
    `V ${n(cy + nr)}`,
    `A ${n(nr)} ${n(nr)} 0 0 0 0 ${n(cy - nr)}`,
    'Z',
  ].join(' ')
}

/** Catatan tempel dengan sudut kanan bawah terlipat. */
function stickyNotePath(w, h) {
  return [
    'M 0 0',
    `H ${n(w)}`,
    `V ${n(h * 0.74)}`,
    `L ${n(w * 0.74)} ${n(h)}`,
    'H 0',
    'Z',
  ].join(' ')
}

/** Pita/banner dengan tepi atas & bawah bergelombang. */
function bannerPath(w, h) {
  return [
    `M 0 ${n(h * 0.08)}`,
    `Q ${n(w * 0.25)} ${n(-h * 0.06)} ${n(w * 0.5)} ${n(h * 0.08)}`,
    `Q ${n(w * 0.75)} ${n(h * 0.22)} ${n(w)} ${n(h * 0.08)}`,
    `V ${n(h * 0.92)}`,
    `Q ${n(w * 0.75)} ${n(h * 1.06)} ${n(w * 0.5)} ${n(h * 0.92)}`,
    `Q ${n(w * 0.25)} ${n(h * 0.78)} 0 ${n(h * 0.92)}`,
    'Z',
  ].join(' ')
}

/** Label/tag dengan ujung runcing di sisi kiri. */
function tagPath(w, h) {
  return [
    `M ${n(w * 0.2)} 0`,
    `H ${n(w)}`,
    `V ${n(h)}`,
    `H ${n(w * 0.2)}`,
    `L 0 ${n(h * 0.5)}`,
    'Z',
  ].join(' ')
}

/** Amplop: tepi atas berbentuk V. */
function envelopePath(w, h) {
  return [
    'M 0 0',
    `L ${n(w * 0.5)} ${n(h * 0.24)}`,
    `L ${n(w)} 0`,
    `V ${n(h)}`,
    'H 0',
    'Z',
  ].join(' ')
}

/* ------------------------------------------------------------------ */
/* Katalog                                                             */
/* ------------------------------------------------------------------ */

/**
 * Daftar bingkai per kategori.
 * `ratio` = lebar : tinggi bawaan, dipakai saat bingkai ditambahkan ke kanvas
 * dan saat menggambar pratinjau di panel.
 */
export const FRAME_CATEGORIES = [
  {
    id: 'basic',
    label: 'Bentuk Dasar',
    frames: [
      { id: 'frame-rect', label: 'Persegi Panjang', ratio: 4 / 3 },
      { id: 'frame-rounded', label: 'Sudut Bulat', ratio: 4 / 3 },
      { id: 'frame-square', label: 'Persegi', ratio: 1 },
      { id: 'frame-circle', label: 'Lingkaran', ratio: 1 },
      { id: 'frame-oval', label: 'Oval', ratio: 3 / 4 },
      { id: 'frame-pill', label: 'Kapsul', ratio: 5 / 3 },
      { id: 'frame-arch', label: 'Lengkung', ratio: 3 / 4 },
      { id: 'frame-triangle', label: 'Segitiga', ratio: 1 },
      { id: 'frame-diamond', label: 'Belah Ketupat', ratio: 1 },
      { id: 'frame-pentagon', label: 'Segi Lima', ratio: 1 },
      { id: 'frame-hexagon', label: 'Segi Enam', ratio: 1 },
      { id: 'frame-octagon', label: 'Segi Delapan', ratio: 1 },
      { id: 'frame-star', label: 'Bintang', ratio: 1 },
      { id: 'frame-heart', label: 'Hati', ratio: 1 },
      { id: 'frame-blob', label: 'Blob', ratio: 1 },
    ],
  },
  {
    id: 'device',
    label: 'Perangkat',
    frames: [
      { id: 'frame-phone', label: 'Ponsel', ratio: 9 / 19 },
      { id: 'frame-phone-land', label: 'Ponsel Mendatar', ratio: 19 / 9 },
      { id: 'frame-tablet', label: 'Tablet', ratio: 3 / 4 },
      { id: 'frame-laptop', label: 'Laptop', ratio: 4 / 3 },
      { id: 'frame-monitor', label: 'Monitor', ratio: 4 / 3 },
      { id: 'frame-watch', label: 'Jam Tangan', ratio: 3 / 4 },
      { id: 'frame-tv', label: 'TV', ratio: 4 / 3 },
    ],
  },
  {
    id: 'paper',
    label: 'Kertas',
    frames: [
      { id: 'frame-a4-portrait', label: 'A4 Potret', ratio: 1 / 1.414 },
      { id: 'frame-a4-landscape', label: 'A4 Lanskap', ratio: 1.414 },
      { id: 'frame-torn', label: 'Kertas Sobek', ratio: 1 },
      { id: 'frame-ticket', label: 'Tiket', ratio: 16 / 9 },
      { id: 'frame-sticky', label: 'Catatan Tempel', ratio: 1 },
      { id: 'frame-banner', label: 'Pita', ratio: 16 / 9 },
      { id: 'frame-tag', label: 'Label', ratio: 16 / 9 },
      { id: 'frame-envelope', label: 'Amplop', ratio: 3 / 2 },
    ],
  },
]

/** Semua bingkai dalam satu array datar. */
export const ALL_FRAMES = FRAME_CATEGORIES.flatMap((c) =>
  c.frames.map((f) => ({ ...f, category: c.id })),
)

/** Bingkai yang ditawarkan sebagai "potong ke bentuk" pada gambar biasa. */
export const MASK_SHAPES = [
  { id: 'none', label: 'Tanpa Mask' },
  ...ALL_FRAMES.filter((f) =>
    [
      'frame-circle',
      'frame-oval',
      'frame-rounded',
      'frame-pill',
      'frame-arch',
      'frame-triangle',
      'frame-diamond',
      'frame-hexagon',
      'frame-star',
      'frame-heart',
      'frame-blob',
    ].includes(f.id),
  ),
]

/** String path SVG untuk sebuah bingkai berukuran w×h. */
export function framePath(id, w, h) {
  switch (id) {
    case 'frame-rect':
    case 'frame-square':
    case 'frame-a4-portrait':
    case 'frame-a4-landscape':
      return rectPath(w, h)
    case 'frame-rounded':
    case 'frame-tablet':
      return roundedRectPath(w, h, Math.min(w, h) * 0.08)
    case 'frame-phone':
    case 'frame-phone-land':
      return roundedRectPath(w, h, Math.min(w, h) * 0.14)
    case 'frame-pill':
      return roundedRectPath(w, h, Math.min(w, h) / 2)
    case 'frame-circle':
    case 'frame-oval':
      return ellipsePath(w, h)
    case 'frame-arch':
      return archPath(w, h)
    case 'frame-triangle':
      return polygonPath(w, h, 3)
    case 'frame-diamond':
      return polygonPath(w, h, 4)
    case 'frame-pentagon':
      return polygonPath(w, h, 5)
    case 'frame-hexagon':
      return polygonPath(w, h, 6)
    case 'frame-octagon':
      return polygonPath(w, h, 8, -Math.PI / 8 - Math.PI / 2)
    case 'frame-star':
      return starPath(w, h)
    case 'frame-heart':
      return heartPath(w, h)
    case 'frame-blob':
      return blobPath(w, h)
    case 'frame-laptop':
      return laptopPath(w, h)
    case 'frame-monitor':
      return monitorPath(w, h)
    case 'frame-watch':
      return watchPath(w, h)
    case 'frame-tv':
      return tvPath(w, h)
    case 'frame-torn':
      return tornPaperPath(w, h)
    case 'frame-ticket':
      return ticketPath(w, h)
    case 'frame-sticky':
      return stickyNotePath(w, h)
    case 'frame-banner':
      return bannerPath(w, h)
    case 'frame-tag':
      return tagPath(w, h)
    case 'frame-envelope':
      return envelopePath(w, h)
    default:
      return rectPath(w, h)
  }
}

/** Ukuran bawaan sebuah bingkai agar proporsinya benar. */
export function frameSize(id, base) {
  const ratio = ALL_FRAMES.find((f) => f.id === id)?.ratio || 1
  return ratio >= 1
    ? { width: base, height: base / ratio }
    : { width: base * ratio, height: base }
}

/**
 * Membuat objek bingkai kosong (placeholder) untuk ditaruh di kanvas.
 * Tampil sebagai siluet abu-abu bergaris putus-putus.
 */
export function createFrame(id, base = 400) {
  const { width, height } = frameSize(id, base)
  const path = new fabric.Path(framePath(id, width, height), {
    fill: '#e2e8f0',
    stroke: '#94a3b8',
    strokeWidth: Math.max(2, Math.round(base * 0.006)),
    strokeDashArray: [Math.max(8, base * 0.03), Math.max(6, base * 0.02)],
    strokeUniform: true,
    strokeLineJoin: 'round',
    originX: 'left',
    originY: 'top',
  })
  path.set({ legFrameId: id })
  const label = ALL_FRAMES.find((f) => f.id === id)?.label || 'Bingkai'
  return tagObject(path, 'frame', `Bingkai: ${label}`)
}

/**
 * Membuat bentuk siap pakai sebagai `clipPath` sebuah objek.
 * Dibuat dengan origin di tengah karena clipPath relatif diposisikan
 * terhadap titik tengah objek induknya.
 */
export function createClipShape(id, width, height) {
  return new fabric.Path(framePath(id, width, height), {
    originX: 'center',
    originY: 'center',
    left: 0,
    top: 0,
  })
}

/**
 * Mengisi sebuah bingkai dengan gambar.
 *
 * Gambar dipotong "cover" mengikuti rasio bingkai (memakai cropX/cropY agar
 * tidak merusak berkas asli), diskalakan tepat sebesar bingkai, lalu di-clip
 * mengikuti bentuk bingkai. Objek bingkai kemudian digantikan oleh gambar
 * pada posisi tumpukan yang sama.
 */
export async function fillFrameWithImage(canvas, frame, dataUrl, name = 'Gambar') {
  const frameId = frame.legFrameId || 'frame-rect'
  const targetW = frame.getScaledWidth()
  const targetH = frame.getScaledHeight()

  const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
  const sourceW = img.width
  const sourceH = img.height
  const targetAspect = targetW / targetH

  // Potong bagian tengah gambar supaya rasionya sama dengan bingkai.
  let cropW = sourceW
  let cropH = sourceH
  if (sourceW / sourceH > targetAspect) cropW = sourceH * targetAspect
  else cropH = sourceW / targetAspect

  img.set({
    cropX: (sourceW - cropW) / 2,
    cropY: (sourceH - cropH) / 2,
    width: cropW,
    height: cropH,
    scaleX: targetW / cropW,
    scaleY: targetH / cropH,
    left: frame.left,
    top: frame.top,
    angle: frame.angle,
    flipX: frame.flipX,
    flipY: frame.flipY,
    originX: 'left',
    originY: 'top',
    clipPath: createClipShape(frameId, cropW, cropH),
  })
  img.set({ legFrameId: frameId })
  tagObject(img, 'image', name)

  const index = canvas.getObjects().indexOf(frame)
  canvas.remove(frame)
  canvas.add(img)
  if (index >= 0) canvas.moveObjectTo(img, index)
  canvas.setActiveObject(img)
  canvas.requestRenderAll()
  return img
}

/** Mencari bingkai kosong yang berada tepat di bawah sebuah titik kanvas. */
export function findFrameAt(canvas, point) {
  return (
    canvas
      .getObjects()
      .filter((o) => o.legType === 'frame' && o.visible !== false && !o.legLocked)
      .reverse()
      .find((o) => o.containsPoint(point)) || null
  )
}
