/**
 * Indikator ukuran & posisi real-time — badge angka yang muncul di dekat
 * elemen selama digeser, diresize, atau diputar (ala Canva/Figma).
 *
 * Digambar di `contextTop` milik Fabric, sama seperti garis bantu di
 * `snapping.js`. Alasannya sama pula: menggambar langsung ke kanvas tidak
 * memerlukan render ulang React pada tiap gerakan mouse, dan Fabric
 * membersihkan kanvas atas sendiri lewat `contextTopDirty` sehingga badge
 * otomatis hilang begitu interaksi selesai.
 */
import { GUIDE_COLOR } from './snapping'

/*
 * Latar badge memakai hitam netral, bukan merah merek: badge sering muncul
 * tepat di sebelah garis bantu pink dan di atas elemen yang bisa berwarna apa
 * saja — termasuk merah. Netral membuatnya selalu terbaca dan tidak bersaing.
 */
const BADGE_BG = '#0f172a'
const BADGE_FG = '#ffffff'
const FONT = '600 11px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif'

const PADDING_X = 7
const PADDING_Y = 4
const RADIUS = 5

/** Jarak badge dari tepi elemen, dalam piksel layar. */
const OFFSET = 10

/**
 * Teks yang ditampilkan untuk sebuah mode interaksi.
 *
 * - `size`     -> "320 × 180"  (lebar × tinggi kotak batas)
 * - `position` -> "X 120  Y 64" (posisi sudut kiri-atas kotak batas)
 * - `angle`    -> "45°"
 *
 * Semua angka dibulatkan: pecahan sub-piksel hanya menambah keriuhan dan
 * berubah tiap frame sehingga badge jadi sulit dibaca.
 */
export function measurementText(target, mode) {
  if (!target) return null

  if (mode === 'angle') return `${Math.round(((target.angle || 0) % 360 + 360) % 360)}°`

  const box = target.getBoundingRect()
  if (mode === 'size') return `${Math.round(box.width)} × ${Math.round(box.height)}`
  return `X ${Math.round(box.left)}   Y ${Math.round(box.top)}`
}

/* Label jarak memakai warna garis bantu supaya terbaca sebagai satu sistem. */
const DIST_FONT = '600 10px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif'
const DIST_PAD_X = 5
const DIST_PAD_Y = 3
const TICK = 3

/** Persegi panjang bersudut bulat, dengan cadangan untuk browser tanpa roundRect. */
function roundedRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    return
  }
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * Menggambar garis ukur jarak beserta angkanya (px) di sepanjang garis bantu.
 *
 * Setiap jarak digambar sebagai garis bergaris-silang di kedua ujung, dengan
 * angka di tengahnya. Angka diletakkan TEPAT di atas garis, bukan di sampingnya,
 * supaya jelas angka itu mengukur garis yang mana saat ada beberapa jarak
 * tampil sekaligus.
 */
export function drawDistances(canvas, distances) {
  if (!canvas || !distances || distances.length === 0) return
  const ctx = canvas.getSelectionContext()
  if (!ctx) return

  const vpt = canvas.viewportTransform
  const sx = (x) => x * vpt[0] + vpt[4]
  const sy = (y) => y * vpt[3] + vpt[5]

  ctx.save()
  ctx.font = DIST_FONT
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.strokeStyle = GUIDE_COLOR
  ctx.lineWidth = 1
  ctx.setLineDash([])

  distances.forEach((d) => {
    let x1, y1, x2, y2
    if (d.axis === 'v') {
      // +0.5 supaya garis jatuh tepat di tengah piksel dan tetap tajam.
      x1 = x2 = Math.round(sx(d.pos)) + 0.5
      y1 = sy(d.from)
      y2 = sy(d.to)
    } else {
      y1 = y2 = Math.round(sy(d.pos)) + 0.5
      x1 = sx(d.from)
      x2 = sx(d.to)
    }

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    if (d.axis === 'v') {
      ctx.moveTo(x1 - TICK, y1)
      ctx.lineTo(x1 + TICK, y1)
      ctx.moveTo(x2 - TICK, y2)
      ctx.lineTo(x2 + TICK, y2)
    } else {
      ctx.moveTo(x1, y1 - TICK)
      ctx.lineTo(x1, y1 + TICK)
      ctx.moveTo(x2, y2 - TICK)
      ctx.lineTo(x2, y2 + TICK)
    }
    ctx.stroke()

    const text = `${Math.round(d.value)}`
    const w = ctx.measureText(text).width + DIST_PAD_X * 2
    const h = 10 + DIST_PAD_Y * 2
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2

    ctx.fillStyle = GUIDE_COLOR
    roundedRect(ctx, mx - w / 2, my - h / 2, w, h, 3)
    ctx.fill()

    ctx.fillStyle = BADGE_FG
    ctx.fillText(text, mx, my)
  })

  ctx.restore()
  canvas.contextTopDirty = true
}

/**
 * Menggambar badge pengukuran di bawah elemen (atau di atasnya bila ruang di
 * bawah sudah habis), lalu menandai kanvas atas kotor agar dibersihkan Fabric.
 */
export function drawMeasurement(canvas, target, mode) {
  if (!canvas || !target) return
  const text = measurementText(target, mode)
  if (!text) return

  const ctx = canvas.getSelectionContext()
  if (!ctx) return

  const vpt = canvas.viewportTransform
  const box = target.getBoundingRect()
  const left = box.left * vpt[0] + vpt[4]
  const top = box.top * vpt[3] + vpt[5]
  const width = box.width * vpt[0]
  const height = box.height * vpt[3]

  ctx.save()
  ctx.font = FONT
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'

  const textWidth = ctx.measureText(text).width
  const boxW = textWidth + PADDING_X * 2
  const boxH = 11 + PADDING_Y * 2

  // Diposisikan di tengah elemen, di bawahnya. Bila sudah mepet dasar
  // viewport, dipindah ke atas elemen supaya tidak terpotong.
  let x = left + width / 2 - boxW / 2
  let y = top + height + OFFSET
  if (y + boxH > canvas.getHeight()) y = top - OFFSET - boxH

  // Jaga agar badge tetap berada di dalam viewport secara horizontal.
  x = Math.max(2, Math.min(x, canvas.getWidth() - boxW - 2))
  y = Math.max(2, y)

  ctx.fillStyle = BADGE_BG
  roundedRect(ctx, x, y, boxW, boxH, RADIUS)
  ctx.fill()

  ctx.fillStyle = BADGE_FG
  ctx.fillText(text, x + boxW / 2, y + boxH / 2)
  ctx.restore()

  canvas.contextTopDirty = true
}
