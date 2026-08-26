/**
 * Smart guides & snapping — garis bantu otomatis ala Canva/Figma.
 *
 * Cara kerja singkat:
 * 1. Saat elemen digeser, kita hitung 3 titik acuan horizontal (kiri, tengah,
 *    kanan) dan 3 vertikal (atas, tengah, bawah) dari kotak batasnya.
 * 2. Titik-titik itu dibandingkan dengan acuan milik kanvas (tepi & tengah)
 *    dan seluruh elemen lain yang terlihat.
 * 3. Bila selisihnya masih di dalam radius snap, posisi elemen digeser tipis
 *    supaya benar-benar sejajar, lalu garis bantunya dikembalikan untuk digambar.
 *
 * Garis digambar di `contextTop` (kanvas atas milik Fabric). Setelah menggambar
 * kita menyalakan `contextTopDirty` supaya Fabric membersihkannya sendiri pada
 * render berikutnya — dengan begitu garis otomatis hilang saat elemen dilepas.
 */

/** Radius snap dalam piksel layar (bukan piksel kanvas). */
export const SNAP_THRESHOLD = 7

/** Toleransi snap rotasi dalam derajat. */
export const ROTATE_SNAP_THRESHOLD = 5

/** Kelipatan sudut yang dijadikan tujuan snap rotasi: 0°, 45°, 90°, dst. */
export const ROTATE_SNAP_STEP = 45

/** Warna garis bantu — pink terang agar kontras di latar terang maupun gelap. */
export const GUIDE_COLOR = '#ff2d95'

/** Jarak "nafas" ujung garis bantu (px kanvas) supaya tidak mepet elemen. */
const GUIDE_PADDING = 12

/**
 * Apakah snap sedang ditahan/dinonaktifkan oleh user?
 * Menahan Ctrl (Windows/Linux) atau Cmd (macOS) mematikan snap sementara.
 */
export function isSnapSuppressed(domEvent) {
  return !!(domEvent && (domEvent.ctrlKey || domEvent.metaKey))
}

/** Kotak batas sebuah objek dalam koordinat kanvas, selalu dihitung ulang. */
function freshBounds(obj) {
  obj.setCoords()
  return obj.getBoundingRect()
}

/**
 * Mengumpulkan garis acuan dari kanvas dan elemen lain.
 * `exclude` berisi objek yang sedang digeser (termasuk anggota multi-seleksi).
 */
function collectTargets(canvas, exclude, sceneWidth, sceneHeight) {
  const vertical = [
    { pos: 0, kind: 'canvas' },
    { pos: sceneWidth / 2, kind: 'canvas-center' },
    { pos: sceneWidth, kind: 'canvas' },
  ]
  const horizontal = [
    { pos: 0, kind: 'canvas' },
    { pos: sceneHeight / 2, kind: 'canvas-center' },
    { pos: sceneHeight, kind: 'canvas' },
  ]

  canvas.getObjects().forEach((obj) => {
    if (exclude.has(obj) || obj.visible === false) return
    const b = freshBounds(obj)
    vertical.push(
      { pos: b.left, kind: 'object', box: b },
      { pos: b.left + b.width / 2, kind: 'object', box: b },
      { pos: b.left + b.width, kind: 'object', box: b },
    )
    horizontal.push(
      { pos: b.top, kind: 'object', box: b },
      { pos: b.top + b.height / 2, kind: 'object', box: b },
      { pos: b.top + b.height, kind: 'object', box: b },
    )
  })

  return { vertical, horizontal }
}

/** Mencari acuan terdekat untuk salah satu sumbu. */
function findBestMatch(anchors, candidates, tolerance) {
  let best = null
  anchors.forEach((anchor) => {
    candidates.forEach((candidate) => {
      const delta = candidate.pos - anchor
      const distance = Math.abs(delta)
      if (distance > tolerance) return
      // Acuan kanvas diprioritaskan tipis agar terasa "magnetis" ke tengah/tepi.
      const score = distance - (candidate.kind === 'canvas-center' ? 1.5 : 0)
      if (!best || score < best.score) {
        best = { score, delta, pos: candidate.pos, candidate }
      }
    })
  })
  return best
}

/**
 * Menghitung koreksi posisi + garis bantu untuk objek yang sedang digeser.
 *
 * @returns {{ dx:number, dy:number, guides:Array }}
 */
export function computeSnap({ canvas, target, sceneWidth, sceneHeight, zoom }) {
  const empty = { dx: 0, dy: 0, guides: [] }
  if (!canvas || !target) return empty

  // Objek yang sedang digeser tidak boleh dijadikan acuan bagi dirinya sendiri.
  const exclude = new Set([target])
  target.forEachObject?.((child) => exclude.add(child))

  const box = freshBounds(target)
  const tolerance = SNAP_THRESHOLD / (zoom || 1)

  const { vertical, horizontal } = collectTargets(canvas, exclude, sceneWidth, sceneHeight)

  const xAnchors = [box.left, box.left + box.width / 2, box.left + box.width]
  const yAnchors = [box.top, box.top + box.height / 2, box.top + box.height]

  const bestX = findBestMatch(xAnchors, vertical, tolerance)
  const bestY = findBestMatch(yAnchors, horizontal, tolerance)

  const guides = []
  const dx = bestX ? bestX.delta : 0
  const dy = bestY ? bestY.delta : 0

  // Kotak batas setelah dikoreksi, dipakai untuk menentukan panjang garis bantu.
  const snapped = {
    left: box.left + dx,
    top: box.top + dy,
    width: box.width,
    height: box.height,
  }

  if (bestX) {
    const other = bestX.candidate.box
    const top = other
      ? Math.min(snapped.top, other.top) - GUIDE_PADDING
      : 0
    const bottom = other
      ? Math.max(snapped.top + snapped.height, other.top + other.height) + GUIDE_PADDING
      : sceneHeight
    guides.push({ axis: 'v', pos: bestX.pos, from: top, to: bottom })
  }

  if (bestY) {
    const other = bestY.candidate.box
    const left = other ? Math.min(snapped.left, other.left) - GUIDE_PADDING : 0
    const right = other
      ? Math.max(snapped.left + snapped.width, other.left + other.width) + GUIDE_PADDING
      : sceneWidth
    guides.push({ axis: 'h', pos: bestY.pos, from: left, to: right })
  }

  return { dx, dy, guides }
}

/* ------------------------------------------------------------------ */
/* Snapping saat resize                                                */
/* ------------------------------------------------------------------ */

/**
 * Tepi kotak batas yang ikut bergerak untuk tiap handle.
 * Handle sisi menggerakkan satu tepi, handle sudut menggerakkan dua.
 */
const HANDLE_EDGES = {
  ml: ['left'],
  mr: ['right'],
  mt: ['top'],
  mb: ['bottom'],
  tl: ['left', 'top'],
  tr: ['right', 'top'],
  bl: ['left', 'bottom'],
  br: ['right', 'bottom'],
}

/**
 * Apakah transformasi yang sedang berjalan mengunci rasio aspek?
 *
 * Ditentukan secara empiris dengan membandingkan rasio skala terhadap nilai
 * awal transformasi, bukan dari `canvas.uniformScaling` dan tombol Shift.
 * Membaca konfigurasi berarti menebak ulang aturan internal Fabric; mengukur
 * hasilnya selalu benar apa pun aturannya.
 */
export function isUniformScaling(target, transform) {
  if (!transform || transform.action !== 'scale') return false
  const original = transform.original
  if (!original?.scaleX || !original?.scaleY) return false
  const rx = (target.scaleX || 1) / original.scaleX
  const ry = (target.scaleY || 1) / original.scaleY
  return Math.abs(rx - ry) < 1e-6
}

/**
 * Menghitung kotak batas tujuan untuk elemen yang sedang diresize.
 *
 * Hanya tepi yang benar-benar digerakkan handle yang dijadikan acuan — tepi
 * seberangnya adalah jangkar dan harus tetap di tempatnya, persis seperti
 * perilaku resize biasa.
 *
 * Elemen yang diputar dilewati: pada objek berotasi, `scaleX`/`scaleY` bekerja
 * di sumbu lokal elemen sehingga tidak lagi bersesuaian satu-satu dengan tepi
 * kotak batas yang sejajar layar, dan snapping akan terasa meleset.
 *
 * @returns {{ desired: {left,top,width,height}|null, guides: Array }}
 */
export function computeResizeSnap({
  canvas,
  target,
  handle,
  uniform,
  sceneWidth,
  sceneHeight,
  zoom,
}) {
  const empty = { desired: null, guides: [] }
  const edges = HANDLE_EDGES[handle]
  if (!canvas || !target || !edges) return empty
  if (Math.abs(((target.angle || 0) % 360 + 360) % 360) > 0.01) return empty

  const exclude = new Set([target])
  target.forEachObject?.((child) => exclude.add(child))

  const box = freshBounds(target)
  const tolerance = SNAP_THRESHOLD / (zoom || 1)
  const { vertical, horizontal } = collectTargets(canvas, exclude, sceneWidth, sceneHeight)

  const L = box.left
  const R = box.left + box.width
  const T = box.top
  const B = box.top + box.height

  const found = {}
  if (edges.includes('left')) found.left = findBestMatch([L], vertical, tolerance)
  if (edges.includes('right')) found.right = findBestMatch([R], vertical, tolerance)
  if (edges.includes('top')) found.top = findBestMatch([T], horizontal, tolerance)
  if (edges.includes('bottom')) found.bottom = findBestMatch([B], horizontal, tolerance)

  const guides = []
  const guideFor = (edge, match) => {
    const other = match.candidate.box
    if (edge === 'left' || edge === 'right') {
      const from = other ? Math.min(T, other.top) - GUIDE_PADDING : 0
      const to = other ? Math.max(B, other.top + other.height) + GUIDE_PADDING : sceneHeight
      guides.push({ axis: 'v', pos: match.pos, from, to })
    } else {
      const from = other ? Math.min(L, other.left) - GUIDE_PADDING : 0
      const to = other ? Math.max(R, other.left + other.width) + GUIDE_PADDING : sceneWidth
      guides.push({ axis: 'h', pos: match.pos, from, to })
    }
  }

  // Ukuran "inti" objek (tanpa tebal garis) dipakai untuk menghitung skala,
  // karena tebal garis menambah lebar kotak batas secara konstan dan tidak
  // ikut menskala bersama isi objek.
  const coreW = (target.width || 0) * (target.scaleX || 1)
  const coreH = (target.height || 0) * (target.scaleY || 1)
  const strokeX = box.width - coreW
  const strokeY = box.height - coreH

  if (uniform) {
    // Rasio terkunci: hanya satu tepi yang boleh menentukan faktor skala,
    // yaitu yang paling dekat dengan acuannya.
    let pick = null
    Object.entries(found).forEach(([edge, match]) => {
      if (!match) return
      if (!pick || Math.abs(match.delta) < Math.abs(pick.match.delta)) pick = { edge, match }
    })
    if (!pick) return empty

    const d = pick.match.delta
    let scale
    if (pick.edge === 'right') scale = (coreW + d) / coreW
    else if (pick.edge === 'left') scale = (coreW - d) / coreW
    else if (pick.edge === 'bottom') scale = (coreH + d) / coreH
    else scale = (coreH - d) / coreH

    if (!Number.isFinite(scale) || scale <= 0) return empty

    const width = coreW * scale + strokeX
    const height = coreH * scale + strokeY
    guideFor(pick.edge, pick.match)

    return {
      desired: {
        left: edges.includes('left') ? R - width : L,
        top: edges.includes('top') ? B - height : T,
        width,
        height,
      },
      guides,
    }
  }

  // Rasio bebas: tiap sumbu di-snap sendiri-sendiri.
  let left = L
  let width = box.width
  if (found.right) {
    width = box.width + found.right.delta
    guideFor('right', found.right)
  } else if (found.left) {
    left = L + found.left.delta
    width = box.width - found.left.delta
    guideFor('left', found.left)
  }

  let top = T
  let height = box.height
  if (found.bottom) {
    height = box.height + found.bottom.delta
    guideFor('bottom', found.bottom)
  } else if (found.top) {
    top = T + found.top.delta
    height = box.height - found.top.delta
    guideFor('top', found.top)
  }

  if (guides.length === 0) return empty
  return { desired: { left, top, width, height }, guides }
}

/**
 * Menerapkan kotak batas tujuan hasil `computeResizeSnap` ke sebuah objek.
 *
 * Posisi diperbaiki lewat SELISIH kotak batas sebelum dan sesudah penskalaan,
 * bukan dengan menghitung `left`/`top` secara langsung. Dengan begitu rumusnya
 * tetap benar untuk objek apa pun tanpa perlu tahu `originX`/`originY`-nya —
 * ActiveSelection, misalnya, memakai titik asal di tengah.
 */
export function applyResizeSnap(target, desired, action) {
  if (!target || !desired) return false

  const box = target.getBoundingRect()
  const coreW = (target.width || 0) * (target.scaleX || 1)
  const coreH = (target.height || 0) * (target.scaleY || 1)
  const newCoreW = Math.max(1, desired.width - (box.width - coreW))
  const newCoreH = Math.max(1, desired.height - (box.height - coreH))

  if (action === 'resizing') {
    // Handle kiri/kanan Textbox mengubah `width`, bukan `scaleX`.
    if (target.scaleX) target.set({ width: newCoreW / target.scaleX })
  } else if (target.width) {
    target.set({ scaleX: newCoreW / target.width })
  }
  if (target.height) target.set({ scaleY: newCoreH / target.height })

  target.setCoords()
  const after = target.getBoundingRect()
  target.set({
    left: (target.left || 0) + (desired.left - after.left),
    top: (target.top || 0) + (desired.top - after.top),
  })
  target.setCoords()
  return true
}

/**
 * Menggambar garis bantu di kanvas atas.
 * Digambar dalam koordinat layar supaya ketebalannya tetap 1px pada zoom berapa pun.
 */
export function drawGuides(canvas, guides) {
  if (!canvas || guides.length === 0) return
  const ctx = canvas.getSelectionContext()
  if (!ctx) return

  const vpt = canvas.viewportTransform
  const toScreenX = (x) => x * vpt[0] + vpt[4]
  const toScreenY = (y) => y * vpt[3] + vpt[5]

  ctx.save()
  ctx.strokeStyle = GUIDE_COLOR
  ctx.lineWidth = 1
  ctx.setLineDash([])

  guides.forEach((guide) => {
    ctx.beginPath()
    if (guide.axis === 'v') {
      // +0.5 supaya garis jatuh tepat di tengah piksel dan tetap tajam.
      const x = Math.round(toScreenX(guide.pos)) + 0.5
      ctx.moveTo(x, toScreenY(guide.from))
      ctx.lineTo(x, toScreenY(guide.to))
    } else {
      const y = Math.round(toScreenY(guide.pos)) + 0.5
      ctx.moveTo(toScreenX(guide.from), y)
      ctx.lineTo(toScreenX(guide.to), y)
    }
    ctx.stroke()
  })

  ctx.restore()

  // Menandai kanvas atas "kotor" agar Fabric membersihkannya di render berikutnya.
  canvas.contextTopDirty = true
}

/**
 * Menghitung sudut hasil snap rotasi.
 * Mengembalikan `null` bila sudut saat ini masih jauh dari kelipatan 45°.
 */
export function snapAngle(angle) {
  const normalized = ((angle % 360) + 360) % 360
  const nearest = Math.round(normalized / ROTATE_SNAP_STEP) * ROTATE_SNAP_STEP
  if (Math.abs(normalized - nearest) > ROTATE_SNAP_THRESHOLD) return null
  return nearest % 360
}
