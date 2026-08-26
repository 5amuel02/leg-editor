/**
 * Model data project & halaman.
 *
 * Bentuk sebuah project:
 * {
 *   id, name, createdAt, updatedAt,
 *   size: { width, height, presetId, label },
 *   pages: [ Page ],
 *   thumbnail: dataURL | null      // sampul dashboard (halaman pertama)
 * }
 *
 * Bentuk sebuah halaman (Page):
 * {
 *   id, name,
 *   json: <hasil serialisasi Fabric canvas>,
 *   thumbnail: dataURL | null,
 *   hidden: boolean,   // disembunyikan -> tidak ikut diekspor
 *   locked: boolean,   // dikunci -> elemen tidak bisa diseleksi/diubah
 *   background: string // warna latar halaman
 * }
 */

export const PROJECT_FILE_VERSION = 1

/** ID unik yang aman dipakai offline. */
export function uid(prefix = 'id') {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}_${rand}`
}

/** Membuat halaman kosong baru. */
export function createEmptyPage(name = 'Halaman 1', background = '#ffffff') {
  return {
    id: uid('page'),
    name,
    json: { version: '7', objects: [], background },
    thumbnail: null,
    hidden: false,
    locked: false,
    background,
  }
}

/** Membuat project baru berisi satu halaman kosong. */
export function createProject({ width, height, presetId = 'custom', label = 'Custom', name }) {
  const now = Date.now()
  return {
    id: uid('proj'),
    name: name || `Desain ${new Date(now).toLocaleDateString('id-ID')}`,
    createdAt: now,
    updatedAt: now,
    size: { width: Math.round(width), height: Math.round(height), presetId, label },
    pages: [createEmptyPage('Halaman 1')],
    thumbnail: null,
  }
}

/** Duplikat halaman (id & nama baru, isi identik). */
export function duplicatePage(page, index) {
  return {
    ...page,
    id: uid('page'),
    name: `${page.name} (salinan)`,
    json: JSON.parse(JSON.stringify(page.json)),
    _insertAfter: index,
  }
}

/** Penomoran ulang nama halaman default supaya rapi (Halaman 1..n). */
export function renumberPages(pages) {
  return pages.map((p, i) =>
    /^Halaman \d+$/.test(p.name) ? { ...p, name: `Halaman ${i + 1}` } : p,
  )
}

/**
 * Validasi ringan file project hasil import JSON.
 * Mengembalikan project yang sudah dinormalisasi, atau melempar error.
 */
export function normalizeImportedProject(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('File bukan JSON project yang valid.')
  if (!raw.size || !Array.isArray(raw.pages) || raw.pages.length === 0) {
    throw new Error('Struktur file project tidak dikenali (size/pages hilang).')
  }
  const now = Date.now()
  return {
    id: raw.id || uid('proj'),
    name: raw.name || 'Project Impor',
    createdAt: raw.createdAt || now,
    updatedAt: now,
    size: {
      width: Number(raw.size.width) || 1080,
      height: Number(raw.size.height) || 1080,
      presetId: raw.size.presetId || 'custom',
      label: raw.size.label || 'Custom',
    },
    pages: raw.pages.map((p, i) => ({
      id: p.id || uid('page'),
      name: p.name || `Halaman ${i + 1}`,
      json: p.json || { version: '7', objects: [] },
      thumbnail: p.thumbnail || null,
      hidden: !!p.hidden,
      locked: !!p.locked,
      background: p.background || '#ffffff',
    })),
    thumbnail: raw.thumbnail || null,
  }
}
