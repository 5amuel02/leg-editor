/**
 * Lapisan penyimpanan lokal.
 *
 * - IndexedDB dipakai untuk data berat: project (beserta seluruh halaman)
 *   dan gambar hasil unggahan (base64 data URL).
 * - localStorage dipakai untuk metadata ringan: id project terakhir dibuka,
 *   preferensi UI, dan penanda auto-save.
 *
 * Tidak ada request jaringan sama sekali di file ini — semuanya lokal.
 */

/*
 * Nama produk adalah "Legza", tapi kunci penyimpanan di bawah sengaja tetap
 * memakai awalan `leg-editor`. Kunci ini adalah ALAMAT DATA, bukan merek:
 * menggantinya berarti seluruh project, gambar unggahan, dan font milik
 * pengguna lama tidak lagi bisa ditemukan browser — data hilang tanpa jejak.
 */
const DB_NAME = 'leg-editor'
const DB_VERSION = 1
export const STORE_PROJECTS = 'projects'
export const STORE_UPLOADS = 'uploads'

/**
 * Font kustom sengaja ditaruh di DATABASE TERPISAH, bukan sebagai store baru
 * di dalam `leg-editor`.
 *
 * Menambah store berarti menaikkan versi database, dan upgrade hanya bisa
 * berjalan kalau tidak ada koneksi lama yang terbuka. Untuk fitur tambahan
 * seperti font, itu risiko yang tidak sepadan: satu upgrade yang tersendat
 * membuat SELURUH project pengguna tidak bisa dibaca. Database baru bersifat
 * aditif — pengguna lama sama sekali tidak tersentuh.
 */
const FONT_DB_NAME = 'leg-editor-fonts'
const FONT_DB_VERSION = 1
export const STORE_FONTS = 'fonts'

let dbPromise = null
let fontDbPromise = null

/**
 * Membuka (dan membuat bila perlu) database IndexedDB.
 *
 * Menaikkan `DB_VERSION` memerlukan upgrade, dan upgrade tidak bisa berjalan
 * selama masih ada tab lain yang memegang koneksi versi lama. Tanpa penanganan
 * `onblocked`, promise ini tidak akan pernah selesai dan seluruh aplikasi
 * menggantung di layar kosong tanpa pesan apa pun — jadi kondisi itu ditangkap
 * dan diubah menjadi error yang bisa ditampilkan.
 *
 * `onversionchange` menutup koneksi ini begitu tab LAIN memulai upgrade,
 * supaya tab inilah yang mengalah dan tab baru tidak ikut tersendat.
 */
function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const s = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' })
        s.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(STORE_UPLOADS)) {
        const s = db.createObjectStore(STORE_UPLOADS, { keyPath: 'id' })
        s.createIndex('createdAt', 'createdAt')
      }
    }

    req.onblocked = () => {
      dbPromise = null
      reject(
        new Error(
          'Penyimpanan sedang dipakai tab lain. Tutup tab Legza yang lain lalu muat ulang halaman ini.',
        ),
      )
    }

    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }

    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

/**
 * Membuka database font. Struktur dan penanganan errornya sama seperti
 * `openDB`, hanya databasenya yang berbeda.
 */
function openFontDB() {
  if (fontDbPromise) return fontDbPromise
  fontDbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(FONT_DB_NAME, FONT_DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_FONTS)) {
        const s = db.createObjectStore(STORE_FONTS, { keyPath: 'id' })
        s.createIndex('createdAt', 'createdAt')
      }
    }

    req.onblocked = () => {
      fontDbPromise = null
      reject(new Error('Penyimpanan font sedang dipakai tab lain.'))
    }

    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => {
        db.close()
        fontDbPromise = null
      }
      resolve(db)
    }

    req.onerror = () => {
      fontDbPromise = null
      reject(req.error)
    }
  })
  return fontDbPromise
}

/** Helper generik untuk menjalankan satu transaksi. */
async function tx(storeName, mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    let result
    try {
      result = fn(store)
    } catch (err) {
      reject(err)
      return
    }
    transaction.oncomplete = () => resolve(result?.result ?? result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function dbGetAll(storeName) {
  const req = await tx(storeName, 'readonly', (store) => store.getAll())
  return req || []
}

export async function dbGet(storeName, id) {
  return tx(storeName, 'readonly', (store) => store.get(id))
}

export async function dbPut(storeName, value) {
  await tx(storeName, 'readwrite', (store) => store.put(value))
  return value
}

export async function dbDelete(storeName, id) {
  await tx(storeName, 'readwrite', (store) => store.delete(id))
}

export async function dbClear(storeName) {
  await tx(storeName, 'readwrite', (store) => store.clear())
}

/* ------------------------------------------------------------------ */
/* API tingkat aplikasi                                                */
/* ------------------------------------------------------------------ */

/** Ambil semua project, terbaru di depan. */
export async function listProjects() {
  const all = await dbGetAll(STORE_PROJECTS)
  return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export async function getProject(id) {
  return dbGet(STORE_PROJECTS, id)
}

export async function saveProject(project) {
  const payload = { ...project, updatedAt: Date.now() }
  await dbPut(STORE_PROJECTS, payload)
  return payload
}

export async function deleteProject(id) {
  await dbDelete(STORE_PROJECTS, id)
}

/** Ambil semua gambar unggahan, terbaru di depan. */
export async function listUploads() {
  const all = await dbGetAll(STORE_UPLOADS)
  return all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function saveUpload(upload) {
  await dbPut(STORE_UPLOADS, upload)
  return upload
}

export async function deleteUpload(id) {
  await dbDelete(STORE_UPLOADS, id)
}

/** Transaksi pada database font (terpisah dari database project). */
async function fontTx(mode, fn) {
  const db = await openFontDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_FONTS, mode)
    const store = transaction.objectStore(STORE_FONTS)
    let result
    try {
      result = fn(store)
    } catch (err) {
      reject(err)
      return
    }
    transaction.oncomplete = () => resolve(result?.result ?? result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

/** Ambil semua font kustom, terlama di depan (urutan unggah). */
export async function listFonts() {
  const all = (await fontTx('readonly', (store) => store.getAll())) || []
  return all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function saveFont(font) {
  await fontTx('readwrite', (store) => store.put(font))
  return font
}

export async function deleteFont(id) {
  await fontTx('readwrite', (store) => store.delete(id))
}

/* ------------------------------------------------------------------ */
/* localStorage helper (metadata ringan)                               */
/* ------------------------------------------------------------------ */

const LS_PREFIX = 'leg-editor:'

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage penuh / mode private — abaikan, bukan error fatal */
  }
}

export function lsRemove(key) {
  try {
    localStorage.removeItem(LS_PREFIX + key)
  } catch {
    /* abaikan */
  }
}
