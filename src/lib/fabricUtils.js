/**
 * Kumpulan helper di sekitar Fabric.js:
 * - properti kustom yang ikut diserialisasi
 * - factory pembuat objek (bentuk, teks, gambar, tabel)
 * - util kunci/sembunyi, snapshot thumbnail, dan kategorisasi elemen
 */
import * as fabric from 'fabric'
import { uid } from './project'

/**
 * Properti kustom milik aplikasi yang harus ikut tersimpan ke JSON.
 * `legType` dipakai untuk menentukan ikon di panel Layer & tombol apa
 * yang muncul di toolbar mengambang.
 */
export const EXTRA_PROPS = ['id', 'legName', 'legType', 'legLocked']

/** Serialisasi kanvas (termasuk properti kustom). */
export function serializeCanvas(canvas) {
  return canvas.toObject(EXTRA_PROPS)
}

/** Memberi identitas pada objek baru sebelum dimasukkan ke kanvas. */
export function tagObject(obj, legType, legName) {
  obj.set({
    id: obj.id || uid('obj'),
    legType,
    legName: legName || defaultNameFor(legType),
    legLocked: obj.legLocked || false,
  })
  return obj
}

function defaultNameFor(legType) {
  const map = {
    text: 'Teks',
    shape: 'Bentuk',
    line: 'Garis',
    arrow: 'Panah',
    image: 'Gambar',
    draw: 'Coretan',
    table: 'Tabel',
  }
  return map[legType] || 'Elemen'
}

/** Kategori elemen berdasarkan tipe Fabric bila `legType` belum ada. */
export function getLegType(obj) {
  if (obj.legType) return obj.legType
  const t = obj.type?.toLowerCase()
  if (t === 'textbox' || t === 'i-text' || t === 'text') return 'text'
  if (t === 'image') return 'image'
  if (t === 'path') return 'draw'
  if (t === 'line') return 'line'
  if (t === 'group') return 'table'
  return 'shape'
}

/** Nama tampilan elemen untuk panel Layer. */
export function getLegName(obj) {
  if (obj.legName) return obj.legName
  if (getLegType(obj) === 'text') return (obj.text || 'Teks').slice(0, 24)
  return defaultNameFor(getLegType(obj))
}

/* ------------------------------------------------------------------ */
/* Kunci / sembunyi                                                    */
/* ------------------------------------------------------------------ */

/**
 * Menerapkan status kunci ke sebuah objek.
 * Objek terkunci tetap tampil tetapi tidak bisa dipilih/digeser.
 */
export function applyLock(obj, locked) {
  obj.set({
    legLocked: locked,
    selectable: !locked,
    evented: !locked,
    hasControls: !locked,
    lockMovementX: locked,
    lockMovementY: locked,
    lockRotation: locked,
    lockScalingX: locked,
    lockScalingY: locked,
  })
  return obj
}

/**
 * Menyinkronkan flag kunci seluruh objek setelah kanvas dimuat dari JSON.
 * Bila halaman dikunci, semua objek ikut terkunci tanpa mengubah flag miliknya.
 */
export function syncLockState(canvas, pageLocked = false) {
  canvas.getObjects().forEach((obj) => {
    const locked = pageLocked || !!obj.legLocked
    obj.set({
      selectable: !locked,
      evented: !locked,
      hasControls: !locked,
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
    })
  })
  canvas.selection = !pageLocked
}

/* ------------------------------------------------------------------ */
/* Penempatan                                                          */
/* ------------------------------------------------------------------ */

/** Menempatkan objek di tengah kanvas (koordinat scene, bukan layar). */
export function placeCenter(canvas, obj) {
  const w = canvas.getWidth() / canvas.getZoom()
  const h = canvas.getHeight() / canvas.getZoom()
  const bounds = obj.getBoundingRect()
  obj.set({
    left: (obj.left || 0) + (w - bounds.width) / 2 - bounds.left,
    top: (obj.top || 0) + (h - bounds.height) / 2 - bounds.top,
  })
  obj.setCoords()
  return obj
}

/** Menambahkan objek ke kanvas, menaruhnya di tengah, lalu menyeleksinya. */
export function addToCanvas(canvas, obj, { center = true, select = true } = {}) {
  if (center) placeCenter(canvas, obj)
  canvas.add(obj)
  if (select) canvas.setActiveObject(obj)
  canvas.requestRenderAll()
  return obj
}

/* ------------------------------------------------------------------ */
/* Factory bentuk                                                      */
/* ------------------------------------------------------------------ */

/** Titik-titik poligon bintang. */
function starPoints(outer = 100, inner = 45, spikes = 5) {
  const points = []
  const step = Math.PI / spikes
  let rot = -Math.PI / 2
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    points.push({ x: Math.cos(rot) * r + outer, y: Math.sin(rot) * r + outer })
    rot += step
  }
  return points
}

/** Titik-titik poligon segi-n beraturan. */
function polygonPoints(sides, radius = 100) {
  const points = []
  for (let i = 0; i < sides; i++) {
    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
    points.push({ x: Math.cos(angle) * radius + radius, y: Math.sin(angle) * radius + radius })
  }
  return points
}

/**
 * Membuat objek bentuk berdasarkan id dari `SHAPES`.
 * `size` adalah ukuran dasar (px) yang menyesuaikan dimensi kanvas.
 */
export function createShape(shapeId, size = 240, style = {}) {
  const base = {
    fill: style.fill ?? '#8b5cf6',
    stroke: style.stroke ?? null,
    strokeWidth: style.strokeWidth ?? 0,
    strokeUniform: true,
    originX: 'left',
    originY: 'top',
  }

  let obj
  let legType = 'shape'

  switch (shapeId) {
    case 'rect':
      obj = new fabric.Rect({ ...base, width: size, height: size * 0.66 })
      break
    case 'rounded':
      obj = new fabric.Rect({
        ...base,
        width: size,
        height: size * 0.66,
        rx: size * 0.08,
        ry: size * 0.08,
      })
      break
    case 'circle':
      obj = new fabric.Circle({ ...base, radius: size / 2 })
      break
    case 'ellipse':
      obj = new fabric.Ellipse({ ...base, rx: size / 2, ry: size / 3 })
      break
    case 'triangle':
      obj = new fabric.Triangle({ ...base, width: size, height: size })
      break
    case 'diamond':
      obj = new fabric.Polygon(polygonPoints(4, size / 2), base)
      break
    case 'star':
      obj = new fabric.Polygon(starPoints(size / 2, size / 4.4), base)
      break
    case 'hexagon':
      obj = new fabric.Polygon(polygonPoints(6, size / 2), base)
      break
    case 'line':
      legType = 'line'
      obj = new fabric.Line([0, 0, size, 0], {
        stroke: style.stroke ?? '#1e293b',
        strokeWidth: style.strokeWidth ?? 6,
        strokeUniform: true,
        strokeLineCap: 'round',
        originX: 'left',
        originY: 'top',
      })
      break
    case 'arrow': {
      legType = 'arrow'
      // Panah digambar sebagai satu Path ber-stroke supaya warna & ketebalan
      // garis cukup diatur lewat satu properti (stroke / strokeWidth).
      const head = size * 0.14
      const d = [
        `M 0 0 L ${size} 0`,
        `M ${size} 0 L ${size - head} ${-head * 0.7}`,
        `M ${size} 0 L ${size - head} ${head * 0.7}`,
      ].join(' ')
      obj = new fabric.Path(d, {
        fill: null,
        stroke: style.stroke ?? '#1e293b',
        strokeWidth: style.strokeWidth ?? 6,
        strokeUniform: true,
        strokeLineCap: 'round',
        strokeLineJoin: 'round',
        originX: 'left',
        originY: 'top',
      })
      break
    }
    default:
      obj = new fabric.Rect({ ...base, width: size, height: size })
  }

  return tagObject(obj, legType)
}

/* ------------------------------------------------------------------ */
/* Factory teks                                                        */
/* ------------------------------------------------------------------ */

/** Membuat kotak teks (Textbox) dengan style tertentu. */
export function createTextbox(style = {}, canvasWidth = 1080) {
  const {
    text = 'Ketik teks di sini',
    fontSize = 48,
    fontWeight = 'normal',
    fontFamily = 'Inter, sans-serif',
    fill = '#1e293b',
    textAlign = 'left',
    fontStyle = 'normal',
  } = style

  const box = new fabric.Textbox(text, {
    width: Math.min(canvasWidth * 0.8, Math.max(320, text.length * fontSize * 0.62)),
    fontSize,
    fontWeight,
    fontFamily,
    fill,
    textAlign,
    fontStyle,
    originX: 'left',
    originY: 'top',
    lineHeight: 1.16,
    editable: true,
  })
  return tagObject(box, 'text', text.slice(0, 24))
}

/* ------------------------------------------------------------------ */
/* Factory gambar                                                      */
/* ------------------------------------------------------------------ */

/**
 * Memuat gambar dari data URL menjadi objek Fabric,
 * otomatis diskalakan agar muat di dalam kanvas.
 */
export async function createImage(dataUrl, canvasWidth, canvasHeight, name = 'Gambar') {
  const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' })
  const scale = Math.min((canvasWidth * 0.7) / img.width, (canvasHeight * 0.7) / img.height, 1)
  img.set({ scaleX: scale, scaleY: scale, originX: 'left', originY: 'top' })
  return tagObject(img, 'image', name)
}

/* ------------------------------------------------------------------ */
/* Factory tabel                                                       */
/* ------------------------------------------------------------------ */

/**
 * Membuat tabel sederhana sebagai Group interaktif.
 * `interactive: true` + `subTargetCheck: true` membuat sel teks di dalam
 * grup bisa langsung diklik dan diedit (dobel klik) tanpa perlu ungroup.
 */
export function createTable({
  rows = 3,
  cols = 3,
  cellWidth = 200,
  cellHeight = 80,
  stroke = '#334155',
  strokeWidth = 2,
  fill = '#ffffff',
  headerFill = '#e2e8f0',
  fontSize = 24,
  textColor = '#0f172a',
  withHeader = true,
} = {}) {
  const items = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellWidth
      const y = r * cellHeight
      const isHeader = withHeader && r === 0

      items.push(
        new fabric.Rect({
          left: x,
          top: y,
          width: cellWidth,
          height: cellHeight,
          fill: isHeader ? headerFill : fill,
          stroke,
          strokeWidth,
          strokeUniform: true,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        }),
      )

      const cellText = new fabric.Textbox(isHeader ? `Judul ${c + 1}` : '', {
        left: x + 12,
        top: y + cellHeight / 2 - fontSize * 0.7,
        width: cellWidth - 24,
        fontSize,
        fontFamily: 'Inter, sans-serif',
        fontWeight: isHeader ? 'bold' : 'normal',
        fill: textColor,
        textAlign: isHeader ? 'center' : 'left',
        originX: 'left',
        originY: 'top',
        editable: true,
      })
      cellText.set({ id: uid('cell'), legType: 'text', legName: `Sel ${r + 1}-${c + 1}` })
      items.push(cellText)
    }
  }

  const group = new fabric.Group(items, {
    subTargetCheck: true,
    interactive: true,
    originX: 'left',
    originY: 'top',
  })

  return tagObject(group, 'table', `Tabel ${rows}x${cols}`)
}

/* ------------------------------------------------------------------ */
/* Snapshot / thumbnail                                                */
/* ------------------------------------------------------------------ */

/**
 * Mengambil gambar kanvas pada skala 100% (mengabaikan zoom & pan saat ini),
 * lalu mengembalikan state tampilan seperti semula.
 * Dipakai untuk membuat thumbnail halaman secara sinkron & cepat.
 */
export function snapshotCanvas(canvas, sceneWidth, sceneHeight, targetWidth = 240, format = 'jpeg') {
  const prevVpt = canvas.viewportTransform.slice()
  const prevW = canvas.getWidth()
  const prevH = canvas.getHeight()

  canvas.setViewportTransform([1, 0, 0, 1, 0, 0])
  canvas.setDimensions({ width: sceneWidth, height: sceneHeight })

  const url = canvas.toDataURL({
    format,
    quality: 0.72,
    multiplier: targetWidth / sceneWidth,
    enableRetinaScaling: false,
  })

  canvas.setDimensions({ width: prevW, height: prevH })
  canvas.setViewportTransform(prevVpt)
  canvas.requestRenderAll()

  return url
}

/* ------------------------------------------------------------------ */
/* Style copy (format painter)                                         */
/* ------------------------------------------------------------------ */

const STYLE_KEYS_COMMON = [
  'fill',
  'stroke',
  'strokeWidth',
  'strokeDashArray',
  'opacity',
  'rx',
  'ry',
]
const STYLE_KEYS_TEXT = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'underline',
  'linethrough',
  'textAlign',
  'lineHeight',
  'charSpacing',
]

/** Mengambil "style" dari sebuah objek untuk disalin ke objek lain. */
export function pickStyle(obj) {
  const style = {}
  STYLE_KEYS_COMMON.forEach((k) => {
    if (obj[k] !== undefined) style[k] = obj[k]
  })
  if (getLegType(obj) === 'text') {
    STYLE_KEYS_TEXT.forEach((k) => {
      if (obj[k] !== undefined) style[k] = obj[k]
    })
  }
  return style
}

/**
 * Menerapkan style hasil salinan ke objek target.
 * Properti teks hanya diterapkan bila target juga teks, dan `fill`
 * dilewati untuk gambar/coretan agar isinya tidak tertimpa warna.
 */
export function applyStyle(obj, style) {
  const type = getLegType(obj)
  const next = {}
  Object.entries(style).forEach(([k, v]) => {
    if (STYLE_KEYS_TEXT.includes(k) && type !== 'text') return
    if (k === 'fill' && (type === 'image' || type === 'draw')) return
    if ((k === 'rx' || k === 'ry') && obj.type !== 'rect') return
    next[k] = v
  })
  obj.set(next)
  obj.setCoords()
  return obj
}
